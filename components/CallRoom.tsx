'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

type CallRoomProps = {
  chatId: string;
  role: 'user' | 'admin';
};

type CallSessionState = {
  chatId: string;
  initiatorId: string;
  receiverId?: string | null;
  roomId: string;
  status: 'initiated' | 'ringing' | 'active' | 'ended';
  offer?: any;
  answer?: any;
  offerCandidates?: any[];
  answerCandidates?: any[];
};

const STUN_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

export default function CallRoom({ chatId, role }: CallRoomProps) {
  const { data: session, status } = useSession();
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'ended'>('idle');
  const [callSession, setCallSession] = useState<CallSessionState | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recordingMessage, setRecordingMessage] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const storedRemoteCandidatesRef = useRef<Record<string, boolean>>({});
  const storedOfferCandidatesRef = useRef<Record<string, boolean>>({});
  const storedAnswerCandidatesRef = useRef<Record<string, boolean>>({});

  const canJoin = useMemo(() => session?.user?.role === 'admin' || session?.user?.role === 'staff', [session?.user?.role]);
  
  const isAdminListening = role === 'admin';
  const isInitiator = useMemo(
    () => !!session?.user?.id && !!callSession?.initiatorId && session.user.id === callSession.initiatorId,
    [session?.user?.id, callSession?.initiatorId]
  );

  // For admin: listen-only mode, no mic required
  // For consumers: peer-to-peer call between the two

  useEffect(() => {
    if (status === 'authenticated' && chatId) {
      fetchSession();
    }
  }, [status, chatId]);

  useEffect(() => {
    if (audioRef.current && remoteStreamRef.current) {
      audioRef.current.srcObject = remoteStreamRef.current;
    }
  }, [remoteStreamRef.current]);

  useEffect(() => {
    let interval: number | undefined;
    if (callState !== 'ended' && session?.user && chatId) {
      interval = window.setInterval(() => fetchSession(), 3000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [callState, session?.user, chatId]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/call-sessions/${chatId}`);
      if (!res.ok) {
        setErrorMessage('Unable to fetch call status');
        return;
      }
      const data = await res.json();
      setCallSession(data.session || null);
      if (data.session?.status === 'active') {
        setCallState('connected');
      } else if (data.session?.status === 'ringing') {
        setCallState('ringing');
      } else if (data.session?.status === 'ended') {
        setCallState('ended');
      }
      if (pcRef.current && data.session) {
        await applyRemoteUpdates(data.session);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const applyRemoteUpdates = async (remoteSession: CallSessionState) => {
    try {
      const pc = pcRef.current;
      if (!pc || isAdminListening) return; // Admin doesn't update peer connection

      if (remoteSession.answer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(remoteSession.answer);
      }

      if (remoteSession.offer && !remoteSession.answer && !pc.currentRemoteDescription) {
        await pc.setRemoteDescription(remoteSession.offer);
      }

      const candidateList = isInitiator
        ? remoteSession.answerCandidates || []
        : remoteSession.offerCandidates || [];

      for (const candidate of candidateList) {
        const key = JSON.stringify(candidate);
        if (!storedAnswerCandidatesRef.current[key]) {
          storedAnswerCandidatesRef.current[key] = true;
          await pc.addIceCandidate(candidate);
        }
      }
    } catch (err) {
      console.error('Failed apply remote updates', err);
    }
  };

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    pcRef.current = pc;
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        await sendCandidate(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }
      remoteStreamRef.current.addTrack(event.track);
      if (audioRef.current) {
        audioRef.current.srcObject = remoteStreamRef.current;
      }
    };

    return pc;
  };

  const ensureLocalStream = async () => {
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
    }
    return localStreamRef.current;
  };

  const prepareCall = async () => {
    setErrorMessage('');
    setInfoMessage('Preparing call...');
    const localStream = await ensureLocalStream();
    const pc = await createPeerConnection();
    localStream.getAudioTracks().forEach((track) => pc.addTrack(track, localStream));
    return pc;
  };

  const startCall = async () => {
    if (isAdminListening) {
      setErrorMessage('Admin cannot start calls. Only consumers can initiate calls.');
      return;
    }
    if (!session?.user) {
      setErrorMessage('Login required to start a call');
      return;
    }
    try {
      const pc = await prepareCall();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const payload = {
        action: 'offer',
        role: 'offer',
        sdp: offer,
      };
      const res = await fetch(`/api/call-sessions/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to create offer');
      }
      const data = await res.json();
      setCallSession(data.session);
      setCallState('ringing');
      setInfoMessage('Calling other consumer... Waiting for them to join.');
    } catch (err) {
      console.error(err);
      setErrorMessage((err as Error).message || 'Failed to start call');
      setInfoMessage('');
    }
  };

  const joinCall = async () => {
    if (!session?.user) {
      setErrorMessage('Login required to join a call');
      return;
    }
    
    // For admin: use listen mode instead
    if (isAdminListening) {
      await listenToCall();
      return;
    }
    
    try {
      const pc = await prepareCall();
      const existing = await fetch(`/api/call-sessions/${chatId}`);
      const data = await existing.json();
      if (!data.session || !data.session.offer) {
        setErrorMessage('No active offer found to join');
        return;
      }
      await pc.setRemoteDescription(data.session.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      const payload = {
        action: 'answer',
        role: 'answer',
        sdp: answer,
      };
      const res = await fetch(`/api/call-sessions/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send answer');
      }
      const result = await res.json();
      setCallSession(result.session);
      setCallState('connected');
      setInfoMessage('Call connected. You can now speak.');
    } catch (err) {
      console.error(err);
      setErrorMessage((err as Error).message || 'Failed to join call');
      setInfoMessage('');
    }
  };

  const listenToCall = async () => {
    // Admin listen-only mode - don't need to create peer connection with mic
    // Just fetch the call session and monitor it
    try {
      setInfoMessage('Listening to call...');
      setCallState('connected');
      // Admin can now record without being a participant
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to listen to call');
      setInfoMessage('');
    }
  };

  const sendCandidate = async (candidate: RTCIceCandidateInit) => {
    try {
      const candidateRole = isAdminListening ? 'admin' : isInitiator ? 'offer' : 'answer';
      await fetch(`/api/call-sessions/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'candidate', role: candidateRole, candidate }),
      });
    } catch (err) {
      console.error('Failed to send ICE candidate', err);
    }
  };

  const endCall = async () => {
    try {
      await fetch(`/api/call-sessions/${chatId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      });
    } catch (err) {
      console.error(err);
    }
    if (pcRef.current) {
      pcRef.current.getSenders().forEach((sender) => sender.track?.stop());
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
    setCallState('ended');
    setInfoMessage('Call ended.');
  };

  const startRecording = async () => {
    if (!isAdminListening) {
      // Consumer recording is not allowed - only admin can record
      setErrorMessage('Only admin can record calls');
      return;
    }
    if (!remoteStreamRef.current) {
      setErrorMessage('No call audio to record. Wait for the call to connect.');
      return;
    }
    if (!window.MediaRecorder) {
      setErrorMessage('Recording is not supported in this browser');
      return;
    }

    setRecordingMessage('Preparing recording...');
    const recordStream = remoteStreamRef.current;

    try {
      const recorder = new MediaRecorder(recordStream);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `call-recording-${chatId}-${Date.now()}.webm`, { type: 'audio/webm' });
        await uploadRecording(file);
      };
      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
      setRecordingMessage('Recording consumer-to-consumer call...');
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to start recording');
      setRecordingMessage('');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
      setRecordingMessage('Uploading recording...');
    }
  };

  const uploadRecording = async (file: File) => {
    setUploadingRecording(true);
    setRecordingMessage('Uploading recording to admin panel...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('originalName', file.name);
    formData.append('folder', 'call-recordings');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      setRecordingUrl(data.url);
      setRecordingMessage('Recording uploaded. Admin can play it from the panel.');
    } catch (err) {
      console.error(err);
      setRecordingMessage('Upload failed.');
      setErrorMessage((err as Error).message || 'Recording upload failed');
    } finally {
      setUploadingRecording(false);
      recordedChunksRef.current = [];
    }
  };

  const getStatusBadge = () => {
    const label = callState === 'connected' ? 'Connected' : callState === 'ringing' ? 'Calling' : callState === 'ended' ? 'Ended' : 'Idle';
    const badgeClass =
      callState === 'connected'
        ? 'bg-emerald-100 text-emerald-700'
        : callState === 'ringing'
        ? 'bg-indigo-100 text-indigo-700'
        : callState === 'ended'
        ? 'bg-red-100 text-red-700'
        : 'bg-slate-100 text-slate-700';

    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>
        {label}
      </span>
    );
  };

  const renderControls = () => {
    if (callState === 'connected') {
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {isAdminListening && (
              <button onClick={endCall} className="rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">Stop listening</button>
            )}
            {!isAdminListening && (
              <button onClick={endCall} className="rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">End call</button>
            )}
            {isAdminListening && (
              <button onClick={isRecording ? stopRecording : startRecording} className={`rounded-3xl px-4 py-3 text-sm font-semibold text-white ${isRecording ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {isRecording ? 'Stop recording' : 'Record session'}
              </button>
            )}
          </div>
          {recordingMessage && <p className="text-sm text-slate-700">{recordingMessage}</p>}
          {recordingUrl && (
            <p className="text-sm text-slate-700">Saved recording: <a href={recordingUrl} className="font-semibold text-blue-600 hover:underline" target="_blank" rel="noreferrer">Play now</a></p>
          )}
        </div>
      );
    }

    if (callState === 'ringing') {
      return (
        <div className="space-y-3">
          {isAdminListening ? (
            <>
              <p className="text-sm text-slate-700">Call in progress. Waiting for the other side to join...</p>
              <button onClick={joinCall} className="rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Listen & Record</button>
            </>
          ) : isInitiator ? (
            <>
              <p className="text-sm text-slate-700">Call in progress. Waiting for the other consumer to accept.</p>
              <button onClick={endCall} className="rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">Cancel call</button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-700">Incoming call. Accept to join the conversation.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={joinCall} className="rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700">Accept call</button>
                <button onClick={endCall} className="rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700">Decline</button>
              </div>
            </>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-700">{isAdminListening ? 'No active call to listen to.' : 'No active voice call yet.'}</p>
        {isAdminListening ? (
          <button onClick={joinCall} disabled={!canJoin} className="rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">Listen & Record</button>
        ) : (
          <button onClick={startCall} className="rounded-3xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700">Start voice call</button>
        )}
      </div>
    );
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Voice call</h3>
          <p className="mt-1 text-sm text-slate-600">
            {isAdminListening 
              ? 'Listen to consumer-to-consumer calls and record audio.' 
              : 'Free browser call over WebRTC between consumers.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">{isAdminListening ? 'Admin Listener' : 'Consumer'}</span>
          {getStatusBadge()}
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {renderControls()}

        <div className="space-y-2 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
          <p><strong>Status:</strong> {callState === 'connected' ? 'Connected' : callState === 'ringing' ? 'Calling' : callState === 'ended' ? 'Ended' : 'Idle'}</p>
          {callSession?.status && <p><strong>Session:</strong> {callSession.status}</p>}
          {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
          {infoMessage && <p className="text-sm text-slate-700">{infoMessage}</p>}
        </div>

        <audio ref={audioRef} autoPlay controls className="w-full rounded-3xl border border-slate-200 bg-white" />
      </div>
    </div>
  );
}
