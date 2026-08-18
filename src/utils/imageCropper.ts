import { formatFileSize, CompressionResult } from './imageCompressor';

export interface CropArea {
  x: number; // percentage (0 to 1) or pixels
  y: number;
  width: number;
  height: number;
}

export interface CropOptions {
  cropArea: CropArea;
  rotation?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
  originalFileName?: string;
  originalSize?: number;
  fitMode?: 'crop' | 'pad_fit';
  targetAspectRatio?: number | null;
  backgroundColor?: string;
}

/**
 * Automatically sample edge pixels to detect the image background color
 */
export function detectImageBackgroundColor(canvasOrImage: HTMLCanvasElement | HTMLImageElement): string {
  try {
    let sampleCanvas: HTMLCanvasElement;
    if (canvasOrImage instanceof HTMLImageElement) {
      sampleCanvas = document.createElement('canvas');
      sampleCanvas.width = canvasOrImage.naturalWidth || 100;
      sampleCanvas.height = canvasOrImage.naturalHeight || 100;
      const ctx = sampleCanvas.getContext('2d');
      if (!ctx) return '#ffffff';
      ctx.drawImage(canvasOrImage, 0, 0, sampleCanvas.width, sampleCanvas.height);
    } else {
      sampleCanvas = canvasOrImage;
    }

    const ctx = sampleCanvas.getContext('2d');
    if (!ctx) return '#ffffff';

    const w = sampleCanvas.width;
    const h = sampleCanvas.height;
    if (w <= 0 || h <= 0) return '#ffffff';

    // Sample 8 perimeter locations (corners and edge middles)
    const samplePoints = [
      { x: 2, y: 2 },
      { x: w - 3, y: 2 },
      { x: 2, y: h - 3 },
      { x: w - 3, y: h - 3 },
      { x: Math.floor(w / 2), y: 2 },
      { x: Math.floor(w / 2), y: h - 3 },
      { x: 2, y: Math.floor(h / 2) },
      { x: w - 3, y: Math.floor(h / 2) }
    ];

    const colors: { r: number; g: number; b: number }[] = [];

    for (const pt of samplePoints) {
      const clampedX = Math.max(0, Math.min(w - 1, pt.x));
      const clampedY = Math.max(0, Math.min(h - 1, pt.y));
      const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
      // If pixel is sufficiently opaque
      if (pixel[3] > 30) {
        colors.push({ r: pixel[0], g: pixel[1], b: pixel[2] });
      }
    }

    if (colors.length === 0) return '#ffffff';

    let totalR = 0, totalG = 0, totalB = 0;
    for (const c of colors) {
      totalR += c.r;
      totalG += c.g;
      totalB += c.b;
    }

    const avgR = Math.round(totalR / colors.length);
    const avgG = Math.round(totalG / colors.length);
    const avgB = Math.round(totalB / colors.length);

    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`;
  } catch {
    return '#ffffff';
  }
}

/**
 * Perform precise canvas cropping, auto-padding, and compression on an HTML Image Element or Image Source
 */
export async function getCroppedImageData(
  imageSource: HTMLImageElement | string,
  options: {
    crop: { x: number; y: number; width: number; height: number }; // In source image pixel coordinates
    rotation?: number;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    originalFileName?: string;
    originalSize?: number;
    fitMode?: 'crop' | 'pad_fit';
    targetAspectRatio?: number | null; // e.g. 1 for 1:1 square div
    backgroundColor?: string;
  }
): Promise<CompressionResult & { detectedBgColor: string }> {
  const {
    crop,
    rotation = 0,
    flipHorizontal = false,
    flipVertical = false,
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    originalFileName = 'cropped-image.jpg',
    originalSize = 0,
    fitMode = 'pad_fit',
    targetAspectRatio = 1,
    backgroundColor
  } = options;

  let img: HTMLImageElement;
  if (typeof imageSource === 'string') {
    img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('فشل تحميل الصورة'));
      i.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  // 1. Create intermediate canvas for transformations (rotation, flip)
  const normRotation = ((rotation % 360) + 360) % 360;
  const isRotated90or270 = normRotation === 90 || normRotation === 270;

  const transformedWidth = isRotated90or270 ? img.naturalHeight : img.naturalWidth;
  const transformedHeight = isRotated90or270 ? img.naturalWidth : img.naturalHeight;

  const transformCanvas = document.createElement('canvas');
  transformCanvas.width = transformedWidth;
  transformCanvas.height = transformedHeight;
  const tCtx = transformCanvas.getContext('2d');
  if (!tCtx) {
    throw new Error('فشل إنشاء سياق رسم الصورة (Canvas Context)');
  }

  // Detect image background color from edge pixels
  const detectedBg = backgroundColor || detectImageBackgroundColor(img);

  // Pre-fill transform canvas with the detected background color
  tCtx.fillStyle = detectedBg;
  tCtx.fillRect(0, 0, transformedWidth, transformedHeight);

  tCtx.translate(transformedWidth / 2, transformedHeight / 2);
  tCtx.rotate((normRotation * Math.PI) / 180);
  tCtx.scale(flipHorizontal ? -1 : 1, flipVertical ? -1 : 1);
  tCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  // 2. Extract cropped rectangle
  let cropX = Math.max(0, Math.min(crop.x, transformedWidth - 1));
  let cropY = Math.max(0, Math.min(crop.y, transformedHeight - 1));
  let cropW = Math.min(crop.width, transformedWidth - cropX);
  let cropH = Math.min(crop.height, transformedHeight - cropY);

  if (cropW <= 0) cropW = transformedWidth;
  if (cropH <= 0) cropH = transformedHeight;

  let outputWidth = Math.round(cropW);
  let outputHeight = Math.round(cropH);

  // Determine final canvas dimensions
  let canvasWidth = outputWidth;
  let canvasHeight = outputHeight;
  let drawX = 0;
  let drawY = 0;
  let drawW = outputWidth;
  let drawH = outputHeight;

  if (fitMode === 'pad_fit' && targetAspectRatio) {
    // We want the final image to exactly match targetAspectRatio (e.g. 1:1 square for product div)
    // Any remaining space/margins will be filled with detectedBg
    const sourceRatio = cropW / cropH;

    if (sourceRatio > targetAspectRatio) {
      // Source is wider than target div aspect ratio: width sets dimension, pad top/bottom
      canvasWidth = Math.min(maxWidth, Math.round(cropW));
      canvasHeight = Math.round(canvasWidth / targetAspectRatio);
      drawW = canvasWidth;
      drawH = Math.round(drawW / sourceRatio);
      drawX = 0;
      drawY = Math.round((canvasHeight - drawH) / 2);
    } else {
      // Source is taller than target div aspect ratio: height sets dimension, pad left/right
      canvasHeight = Math.min(maxHeight, Math.round(cropH));
      canvasWidth = Math.round(canvasHeight * targetAspectRatio);
      drawH = canvasHeight;
      drawW = Math.round(drawH * sourceRatio);
      drawY = 0;
      drawX = Math.round((canvasWidth - drawW) / 2);
    }

    // Bound to maxWidth / maxHeight
    if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
      const scale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
      canvasWidth = Math.round(canvasWidth * scale);
      canvasHeight = Math.round(canvasHeight * scale);
      drawW = Math.round(drawW * scale);
      drawH = Math.round(drawH * scale);
      drawX = Math.round(drawX * scale);
      drawY = Math.round(drawY * scale);
    }
  } else {
    // Normal crop without padding
    if (outputWidth > maxWidth || outputHeight > maxHeight) {
      if (outputWidth / outputHeight > maxWidth / maxHeight) {
        outputHeight = Math.round((outputHeight * maxWidth) / outputWidth);
        outputWidth = maxWidth;
      } else {
        outputWidth = Math.round((outputWidth * maxHeight) / outputHeight);
        outputHeight = maxHeight;
      }
    }
    canvasWidth = outputWidth;
    canvasHeight = outputHeight;
    drawW = outputWidth;
    drawH = outputHeight;
    drawX = 0;
    drawY = 0;
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = canvasWidth;
  outputCanvas.height = canvasHeight;
  const outCtx = outputCanvas.getContext('2d');
  if (!outCtx) {
    throw new Error('فشل إنشاء سياق استخراج القص');
  }

  // Pre-fill entire output canvas with background color to complete any missing area
  outCtx.fillStyle = detectedBg;
  outCtx.fillRect(0, 0, canvasWidth, canvasHeight);

  outCtx.imageSmoothingEnabled = true;
  outCtx.imageSmoothingQuality = 'high';

  outCtx.drawImage(
    transformCanvas,
    cropX,
    cropY,
    cropW,
    cropH,
    drawX,
    drawY,
    drawW,
    drawH
  );

  const dataUrl = outputCanvas.toDataURL('image/jpeg', quality);

  const base64Length = dataUrl.split(',')[1]?.length || 0;
  const compressedSize = Math.round((base64Length * 3) / 4);
  const origSize = originalSize || compressedSize * 1.5;

  const savingsRaw = origSize > compressedSize ? ((origSize - compressedSize) / origSize) * 100 : 0;
  const savingsPercent = parseFloat(savingsRaw.toFixed(1));

  return {
    dataUrl,
    detectedBgColor: detectedBg,
    originalSize: origSize,
    compressedSize,
    originalFormatted: formatFileSize(origSize),
    compressedFormatted: formatFileSize(compressedSize),
    savingsPercent,
    width: canvasWidth,
    height: canvasHeight,
    originalWidth: img.naturalWidth,
    originalHeight: img.naturalHeight,
    fileName: originalFileName
  };
}

