import React, { useState, useRef } from 'react';
import { Upload, X, Zap, Scissors, CheckCircle2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { compressImageFile, CompressionResult } from '../utils/imageCompressor';
import { convertGoogleDriveUrl, getCompatibleImageUrl } from '../utils/imageHelper';
import { ImageCropperModal, CropPlacement } from './ImageCropperModal';

interface ImageUploaderWithCompressionProps {
  imageUrl: string;
  onImageChange: (newUrl: string, infoStr?: string) => void;
  label?: string;
  placeholder?: string;
  placement?: CropPlacement;
  required?: boolean;
  triggerNotification?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  className?: string;
}

export const ImageUploaderWithCompression: React.FC<ImageUploaderWithCompressionProps> = ({
  imageUrl,
  onImageChange,
  label = 'صورة المنتج (رابط أو رفع ملف من جهازك)',
  placeholder = 'أدخل رابط الصورة (URL) أو ارفع ملفاً بالأسفل...',
  placement = 'product',
  required = false,
  triggerNotification,
  className = ''
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);

  // Image Cropper Modal State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if desired
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setPendingFile(file);

    // Read file to open interactive crop modal
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        setCropImageSrc(src);
        setIsCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (result: CompressionResult) => {
    setIsCropperOpen(false);
    setCompressionInfo(result);
    onImageChange(result.dataUrl);

    const successMsg = `تم قص وضغط الصورة بنجاح! الحجم الجديد: ${result.compressedFormatted} (تم تقليل ${result.savingsPercent}% من المساحة).`;
    if (triggerNotification) {
      triggerNotification(successMsg, 'success');
    }
    setPendingFile(null);
  };

  const handleSkipCrop = async () => {
    setIsCropperOpen(false);
    if (!pendingFile) {
      setPendingFile(null);
      return;
    }

    try {
      setIsCompressing(true);
      setCompressionInfo(null);

      const result = await compressImageFile(pendingFile, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82
      });

      setCompressionInfo(result);
      onImageChange(result.dataUrl);

      const successMsg = `تم حفظ الصورة وضغطها بنجاح (${result.compressedFormatted})!`;
      if (triggerNotification) {
        triggerNotification(successMsg, 'success');
      }
    } catch (err: any) {
      console.error('فشل ضغط الصورة:', err);
      if (triggerNotification) {
        triggerNotification(`خطأ أثناء ضغط الصورة: ${err?.message || 'تعذر معالجة الملف'}`, 'error');
      }
    } finally {
      setIsCompressing(false);
      setPendingFile(null);
    }
  };

  const handleOpenCropperForExisting = () => {
    if (!imageUrl) return;
    setCropImageSrc(imageUrl);
    setIsCropperOpen(true);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            {label}
            {required && <span className="text-rose-500 mr-1 font-black">*</span>}
          </label>
          {required && !imageUrl && (
            <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
              إجباري
            </span>
          )}
          {imageUrl && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              تم إدراج الصورة
            </span>
          )}
        </div>
      )}

      <div className="space-y-2">
        {/* URL Input */}
        <input
          type="url"
          value={imageUrl && !imageUrl.startsWith('data:') ? imageUrl : ''}
          onChange={(e) => {
            setCompressionInfo(null);
            onImageChange(convertGoogleDriveUrl(e.target.value));
          }}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono focus:outline-none focus:border-brand-blue text-left text-slate-200 dir-ltr placeholder:text-right"
          placeholder={placeholder}
        />

        {/* Upload Button + Actions */}
        <div className="flex items-center gap-2">
          <label className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-brand-blue text-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold cursor-pointer text-center transition-all flex items-center justify-center gap-2 select-none active:scale-[0.98]">
            {isCompressing ? (
              <>
                <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-brand-blue font-bold">جاري ضغط الصورة ومعالجتها...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-brand-blue shrink-0 animate-pulse" />
                <span>رفع صورة وتحديد أبعاد القص ✂️</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isCompressing}
              onChange={handleFileChange}
            />
          </label>

          {imageUrl && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleOpenCropperForExisting}
                className="bg-slate-800 hover:bg-brand-blue hover:text-white border border-slate-700 text-slate-300 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="قص وتعديل إطار الصورة الحالية"
              >
                <Scissors className="h-3.5 w-3.5 text-brand-blue group-hover:text-white" />
                <span>قص ✂️</span>
              </button>

              <div className="relative shrink-0 h-10 w-10 border border-slate-800 rounded-xl overflow-hidden bg-slate-900 group">
                <img
                  src={getCompatibleImageUrl(imageUrl)}
                  alt="Preview"
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => {
                    onImageChange('');
                    setCompressionInfo(null);
                    if (triggerNotification) triggerNotification('تم إزالة الصورة');
                  }}
                  className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="إزالة الصورة"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Compression Detailed Report Card */}
        {compressionInfo && (
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 text-right space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>تقرير نتائج قص وضغط الصورة 📊</span>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                <Zap className="h-3 w-3" />
                تخفيض {compressionInfo.savingsPercent}% من الحجم
              </span>
            </div>

            {/* Sizes Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block">الحجم الأصلي قبل الضغط:</span>
                <span className="font-mono font-black text-red-400 text-sm block dir-ltr text-right">
                  {compressionInfo.originalFormatted}
                </span>
                <span className="text-[10px] text-slate-500 block dir-ltr text-right">
                  ({compressionInfo.originalWidth} × {compressionInfo.originalHeight} px)
                </span>
              </div>

              <div className="bg-slate-950/80 border border-emerald-900/40 p-2.5 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 block">الحجم بعد القص والضغط:</span>
                <span className="font-mono font-black text-emerald-400 text-sm block dir-ltr text-right">
                  {compressionInfo.compressedFormatted}
                </span>
                <span className="text-[10px] text-emerald-500/80 block dir-ltr text-right">
                  ({compressionInfo.width} × {compressionInfo.height} px)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Image Cropper Modal */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={cropImageSrc}
        placement={placement}
        onClose={() => {
          setIsCropperOpen(false);
          setPendingFile(null);
        }}
        onCropComplete={handleCropComplete}
        onSkipCrop={handleSkipCrop}
        originalFileName={pendingFile?.name || 'image.jpg'}
        originalFileSize={pendingFile?.size}
      />
    </div>
  );
};
