// filepath: lib/cropImage.ts
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Set canvas size to the crop area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Return as a base64 data URL
  return canvas.toDataURL('image/jpeg', 0.9);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getRoundedCanvas(sourceCanvas: HTMLCanvasElement) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return sourceCanvas;
  }

  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;

  // Create a circular clipping path
  context.beginPath();
  context.arc(
    canvas.width / 2,
    canvas.height / 2,
    Math.min(canvas.width, canvas.height) / 2,
    0,
    Math.PI * 2,
    true
  );
  context.closePath();
  context.clip();

  // Draw the source image into the circular canvas
  context.drawImage(sourceCanvas, 0, 0);

  return canvas;
}