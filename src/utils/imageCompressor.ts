export interface CompressionResult {
  dataUrl: string;
  originalSize: number; // bytes
  compressedSize: number; // bytes
  originalFormatted: string;
  compressedFormatted: string;
  savingsPercent: number; // percentage saved
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  fileName: string;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت (KB)', 'ميغابايت (MB)', 'جيجابايت (GB)'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Compress an image file using HTML5 Canvas
 * @param file The input File object from file input
 * @param options Optional max dimension and quality
 */
export async function compressImageFile(
  file: File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<CompressionResult> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.82 } = options;
  const originalSize = file.size;
  const originalFormatted = formatFileSize(originalSize);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('فشل تحميل الصورة في المتصفح'));

      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;

        let width = originalWidth;
        let height = originalHeight;

        // Calculate aspect ratio scaling if dimensions exceed limits
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('فشل إنشاء سياق رسم الصورة (Canvas)'));
        }

        // Smooth image scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Pre-fill with clean white background so transparent PNGs/WebPs never turn pitch black in JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to Data URL (JPEG format for optimal web compression)
        const mimeType = file.type === 'image/png' && quality >= 0.9 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Estimate byte size from Data URL string length
        const base64Length = dataUrl.split(',')[1]?.length || 0;
        const compressedSize = Math.round((base64Length * 3) / 4);
        const compressedFormatted = formatFileSize(compressedSize);

        const savingsRaw = ((originalSize - compressedSize) / originalSize) * 100;
        const savingsPercent = savingsRaw > 0 ? parseFloat(savingsRaw.toFixed(1)) : 0;

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          originalFormatted,
          compressedFormatted,
          savingsPercent,
          width,
          height,
          originalWidth,
          originalHeight,
          fileName: file.name
        });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
