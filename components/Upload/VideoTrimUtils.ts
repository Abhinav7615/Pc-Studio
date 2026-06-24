'use client';

const DEFAULT_TRIM_MIME_TYPES = [
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

export function getSupportedTrimMimeType(originalType: string): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return null;
  }

  if (originalType && MediaRecorder.isTypeSupported(originalType)) {
    return originalType;
  }

  for (const type of DEFAULT_TRIM_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return null;
}

export function formatSeconds(value: number): string {
  const rounded = Math.max(0, Math.round(value));
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export async function getVideoDuration(file: File): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    if (typeof document === 'undefined') {
      return reject(new Error('Client-side video duration check only'));
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    video.muted = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.src = '';
    };

    const onLoaded = () => {
      cleanup();
      resolve(video.duration || 0);
    };

    const onError = () => {
      cleanup();
      reject(new Error('Unable to read video duration'));
    };

    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.addEventListener('error', onError, { once: true });
  });
}

async function recordVideoSegment(
  video: HTMLVideoElement,
  mimeType: string,
  captureDurationSeconds: number
): Promise<Blob> {
  const captureStream = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();
  if (!captureStream) {
    throw new Error('Browser does not support captureStream for video trimming');
  }

  const stream = captureStream as MediaStream;
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks: BlobPart[] = [];

  return new Promise<Blob>((resolve, reject) => {
    const cleanup = () => {
      if (recorder.state !== 'inactive') {
        try {
          recorder.stop();
        } catch {
          // ignore
        }
      }
      video.pause();
      video.src = '';
      video.load();
    };

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      cleanup();
      reject(new Error(event.error?.message || 'Video recording failed'));
    };

    recorder.onstop = () => {
      try {
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0) {
          reject(new Error('Trimmed video is empty')); 
        } else {
          resolve(blob);
        }
      } catch (error) {
        reject(error);
      }
    };

    recorder.start(1000);

    const stopRecording = () => {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    };

    setTimeout(stopRecording, captureDurationSeconds * 1000);

    video.play().catch((playError) => {
      cleanup();
      reject(new Error(`Unable to play video for trimming: ${playError instanceof Error ? playError.message : String(playError)}`));
    });
  });
}

export async function trimVideoSegment(
  file: File,
  startTimeSeconds: number,
  durationSeconds: number
): Promise<File> {
  if (typeof document === 'undefined') {
    throw new Error('Client-side video trimming only');
  }

  const fileUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.src = fileUrl;
  video.muted = true;
  video.playsInline = true;

  const cleanupVideo = () => {
    URL.revokeObjectURL(fileUrl);
    video.src = '';
    video.load();
  };

  await new Promise<void>((resolve, reject) => {
    const onLoaded = () => {
      resolve();
    };
    const onError = () => {
      cleanupVideo();
      reject(new Error('Unable to load video for trimming'));
    };
    video.addEventListener('loadedmetadata', onLoaded, { once: true });
    video.addEventListener('error', onError, { once: true });
  });

  const startTime = Math.max(0, Math.min(startTimeSeconds, Math.max(0, video.duration - 0.01)));
  video.currentTime = startTime;

  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => resolve();
    const onError = () => reject(new Error('Unable to seek video for trimming'));
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError, { once: true });
  });

  const mimeType = getSupportedTrimMimeType(file.type) || 'video/webm';
  const trimmedBlob = await recordVideoSegment(video, mimeType, durationSeconds);
  cleanupVideo();

  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
  const trimmedFileName = `${fileNameWithoutExt}_trimmed.${extension}`;
  return new File([trimmedBlob], trimmedFileName, {
    type: mimeType,
    lastModified: Date.now(),
  });
}
