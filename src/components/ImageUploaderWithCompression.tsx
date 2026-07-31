import React, { useState } from 'react';
import { Upload, X, Zap, ArrowLeft, Sparkles, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { compressImageFile, CompressionResult } from '../utils/imageCompressor';
import { convertGoogleDriveUrl, getCompatibleImageUrl } from '../utils/imageHelper';

interface ImageUploaderWithCompressionProps {
  imageUrl: string;
  onImageChange: (newUrl: string, infoStr?: string) => void;
  label?: string;
  placeholder?: string;
  triggerNotification?: (msg: string, type?: 'success' | 'info' | 'error') => void;
  className?: string;
}

export const ImageUploaderWithCompression: React.FC<ImageUploaderWithCompressionProps> = ({
  imageUrl,
  onImageChange,
  label = 'صورة المنتج (رابط أو رفع ملف من جهازك)',
  placeholder = 'أدخل رابط الصورة (URL) أو ارفع ملفاً بالأسفل...',
  triggerNotification,
  className = ''
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setCompressionInfo(null);

      // Perform real canvas compression
      const result = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.82
      });

      setCompressionInfo(result);
      onImageChange(result.dataUrl);

      const successMsg = `تم ضغط الصورة بنجاح! تم تقليل الحجم من ${result.originalFormatted} إلى ${result.compressedFormatted} (توفير ${result.savingsPercent}% من المساحة).`;
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
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-xs font-bold text-slate-400">{label}</label>}

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
                <span className="text-brand-blue font-bold">جاري ضغط الصورة وتقليل حجمها...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-brand-blue shrink-0 animate-pulse" />
                <span>رفع صورة وضغطها تلقائياً 📁</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isCompressing}
              onChange={handleFileChange}
            />
          </label>

          {imageUrl && (
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
          )}
        </div>

        {/* Compression Detailed Report Card */}
        {compressionInfo && (
          <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 text-right space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                <CheckCircle2 className="h-4 w-4" />
                <span>تقرير نتائج ضغط الصورة 📊</span>
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
                <span className="text-[10px] font-bold text-emerald-400 block">الحجم الجديد بعد الضغط:</span>
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
    </div>
  );
};
