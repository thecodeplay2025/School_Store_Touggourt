import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  X,
  Sparkles,
  Info,
  Layers,
  RefreshCw,
  Sliders,
  Scissors,
  Palette,
  Square
} from 'lucide-react';
import { getCroppedImageData, detectImageBackgroundColor } from '../utils/imageCropper';
import { CompressionResult } from '../utils/imageCompressor';
import { convertGoogleDriveUrl } from '../utils/imageHelper';

export type CropPlacement = 'product' | 'category' | 'pack' | 'logo' | 'banner' | 'free';

interface AspectRatioOption {
  id: string;
  label: string;
  subLabel: string;
  ratio: number | null; // width / height or null for free
  iconName?: string;
}

const ASPECT_RATIOS: AspectRatioOption[] = [
  { id: '1:1', label: '1:1 مربع (DIV)', subLabel: 'المنتجات والشعار', ratio: 1 },
  { id: '4:3', label: '4:3 قياسي', subLabel: 'عرض البطاقات', ratio: 4 / 3 },
  { id: '16:9', label: '16:9 عريض', subLabel: 'البانرات والعروض', ratio: 16 / 9 },
  { id: '3:4', label: '3:4 طولي', subLabel: 'الكتب والدفاتر', ratio: 3 / 4 },
  { id: 'free', label: 'حر ⤢', subLabel: 'تحديد يدوي حر', ratio: null },
];

const PLACEMENT_CONFIG: Record<CropPlacement, { title: string; defaultRatio: string; hint: string }> = {
  product: {
    title: 'قص وملاءمة صورة المنتج',
    defaultRatio: '1:1',
    hint: 'النسبة الموصى بها لصور المنتجات هي 1:1 (مربع) لتبدو متناسقة وجذابة في شبكة المتجر.'
  },
  category: {
    title: 'قص صورة التصنيف',
    defaultRatio: '1:1',
    hint: 'النسبة الموصى بها لبطاقات وأيقونات التصنيفات هي 1:1 (مربع).'
  },
  pack: {
    title: 'قص صورة الباك المدرسي',
    defaultRatio: '1:1',
    hint: 'النسبة الموصى بها لحزم وباكات الأدوات المدرسية هي 1:1 (مربع).'
  },
  logo: {
    title: 'قص شعار المتجر',
    defaultRatio: '1:1',
    hint: 'النسبة الموصى بها لشعار المتجر هي 1:1 (مربع أو دائري).'
  },
  banner: {
    title: 'قص بانر العروض والإعلانات',
    defaultRatio: '16:9',
    hint: 'النسبة الموصى بها للبانرات هي 16:9 أو 3:1 للحصول على مظهر عريض احترافي.'
  },
  free: {
    title: 'قص وتعديل الصورة',
    defaultRatio: '1:1',
    hint: 'حدد الجزء المطلوب من الصورة باستخدام إطار القص والتحكم بالنسبة المناسبة.'
  }
};

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  placement?: CropPlacement;
  onClose: () => void;
  onCropComplete: (result: CompressionResult) => void;
  onSkipCrop?: () => void;
  originalFileName?: string;
  originalFileSize?: number;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  placement = 'product',
  onClose,
  onCropComplete,
  onSkipCrop,
  originalFileName = 'image.jpg',
  originalFileSize = 0
}) => {
  const config = PLACEMENT_CONFIG[placement] || PLACEMENT_CONFIG.product;

  const [selectedRatioId, setSelectedRatioId] = useState<string>(config.defaultRatio);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Auto-pad vs Direct Crop mode
  const [fitMode, setFitMode] = useState<'pad_fit' | 'crop'>('pad_fit');
  const [detectedBgColor, setDetectedBgColor] = useState<string>('#ffffff');
  const [customBgColor, setCustomBgColor] = useState<string>('#ffffff');

  // Crop box state in percentages (0 to 100) relative to image container
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Interaction tracking refs
  const isDraggingRef = useRef<boolean>(false);
  const dragHandleRef = useRef<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startCropBox = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  // Update default ratio when placement changes
  useEffect(() => {
    if (isOpen) {
      const conf = PLACEMENT_CONFIG[placement] || PLACEMENT_CONFIG.product;
      setSelectedRatioId(conf.defaultRatio);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setZoom(1);
      setFitMode('pad_fit');
    }
  }, [isOpen, placement]);

  // Recalculate crop box whenever ratio or image loads
  const resetCropToRatio = useCallback((ratioId: string, imgEl?: HTMLImageElement | null) => {
    const el = imgEl || imageRef.current;
    if (!el) return;

    const opt = ASPECT_RATIOS.find(r => r.id === ratioId);
    const targetRatio = opt?.ratio;

    if (!targetRatio) {
      // Free form: 80% width and height centered
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
      return;
    }

    const normRot = ((rotation % 360) + 360) % 360;
    const isRot90 = normRot === 90 || normRot === 270;
    const displayedW = isRot90 ? el.naturalHeight : el.naturalWidth;
    const displayedH = isRot90 ? el.naturalWidth : el.naturalHeight;
    const imgRatio = displayedW / displayedH;

    let widthPercent = 80;
    let heightPercent = 80;

    if (targetRatio > imgRatio) {
      // Crop is wider than image
      widthPercent = 90;
      heightPercent = (widthPercent * imgRatio) / targetRatio;
    } else {
      // Crop is taller than image
      heightPercent = 90;
      widthPercent = (heightPercent * targetRatio) / imgRatio;
    }

    // Clamp to 90% max
    widthPercent = Math.min(90, Math.max(20, widthPercent));
    heightPercent = Math.min(90, Math.max(20, heightPercent));

    setCropBox({
      x: (100 - widthPercent) / 2,
      y: (100 - heightPercent) / 2,
      width: widthPercent,
      height: heightPercent
    });
  }, [rotation]);

  useEffect(() => {
    if (imageLoaded) {
      resetCropToRatio(selectedRatioId);
    }
  }, [selectedRatioId, imageLoaded, resetCropToRatio]);

  // Handle image load and background color sampling
  const handleImageLoad = () => {
    setImageLoaded(true);
    if (imageRef.current) {
      try {
        const detected = detectImageBackgroundColor(imageRef.current);
        setDetectedBgColor(detected);
        setCustomBgColor(detected);
      } catch (err) {
        console.warn('Could not auto-detect image background color:', err);
      }
      resetCropToRatio(selectedRatioId, imageRef.current);
    }
  };

  // Mouse / Touch handlers for Crop Box manipulation
  const handlePointerDown = (e: React.PointerEvent, handleType: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    isDraggingRef.current = true;
    dragHandleRef.current = handleType;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startCropBox.current = { ...cropBox };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaXPercent = ((e.clientX - dragStartPos.current.x) / rect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartPos.current.y) / rect.height) * 100;

    const handle = dragHandleRef.current;
    const initial = startCropBox.current;

    const currentOpt = ASPECT_RATIOS.find(r => r.id === selectedRatioId);
    const targetRatio = currentOpt?.ratio;

    if (handle === 'move') {
      let newX = initial.x + deltaXPercent;
      let newY = initial.y + deltaYPercent;

      // Bound within 0..100
      newX = Math.max(0, Math.min(newX, 100 - initial.width));
      newY = Math.max(0, Math.min(newY, 100 - initial.height));

      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    } else {
      // Resizing from handles
      let newX = initial.x;
      let newY = initial.y;
      let newW = initial.width;
      let newH = initial.height;

      const minSizePercent = 15;

      if (handle?.includes('e')) {
        newW = Math.max(minSizePercent, Math.min(100 - initial.x, initial.width + deltaXPercent));
      }
      if (handle?.includes('s')) {
        newH = Math.max(minSizePercent, Math.min(100 - initial.y, initial.height + deltaYPercent));
      }
      if (handle?.includes('w')) {
        const potentialW = initial.width - deltaXPercent;
        if (potentialW >= minSizePercent && initial.x + deltaXPercent >= 0) {
          newX = initial.x + deltaXPercent;
          newW = potentialW;
        }
      }
      if (handle?.includes('n')) {
        const potentialH = initial.height - deltaYPercent;
        if (potentialH >= minSizePercent && initial.y + deltaYPercent >= 0) {
          newY = initial.y + deltaYPercent;
          newH = potentialH;
        }
      }

      // Enforce aspect ratio if not free
      if (targetRatio && imageRef.current) {
        const el = imageRef.current;
        const normRot = ((rotation % 360) + 360) % 360;
        const isRot90 = normRot === 90 || normRot === 270;
        const displayedW = isRot90 ? el.naturalHeight : el.naturalWidth;
        const displayedH = isRot90 ? el.naturalWidth : el.naturalHeight;
        const imgRatio = displayedW / displayedH;

        if (handle?.includes('e') || handle?.includes('w')) {
          newH = (newW * imgRatio) / targetRatio;
          if (newY + newH > 100) {
            newH = 100 - newY;
            newW = (newH * targetRatio) / imgRatio;
          }
        } else {
          newW = (newH * targetRatio) / imgRatio;
          if (newX + newW > 100) {
            newW = 100 - newX;
            newH = (newW * imgRatio) / targetRatio;
          }
        }
      }

      setCropBox({
        x: Math.max(0, Math.min(newX, 100 - minSizePercent)),
        y: Math.max(0, Math.min(newY, 100 - minSizePercent)),
        width: Math.min(newW, 100 - newX),
        height: Math.min(newH, 100 - newY)
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    dragHandleRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore if not supported
    }
  };

  // Perform the actual crop operation
  const handleExecuteCrop = async () => {
    const img = imageRef.current;
    if (!img) return;

    try {
      setIsProcessing(true);

      const normRot = ((rotation % 360) + 360) % 360;
      const isRot90 = normRot === 90 || normRot === 270;
      const transW = isRot90 ? img.naturalHeight : img.naturalWidth;
      const transH = isRot90 ? img.naturalWidth : img.naturalHeight;

      // Calculate pixel coordinates from cropBox percentages
      const cropPixelX = (cropBox.x / 100) * transW;
      const cropPixelY = (cropBox.y / 100) * transH;
      const cropPixelW = (cropBox.width / 100) * transW;
      const cropPixelH = (cropBox.height / 100) * transH;

      const currentOpt = ASPECT_RATIOS.find(r => r.id === selectedRatioId);
      const targetRatio = currentOpt?.ratio || 1;

      const result = await getCroppedImageData(img, {
        crop: {
          x: cropPixelX,
          y: cropPixelY,
          width: cropPixelW,
          height: cropPixelH
        },
        rotation,
        flipHorizontal: flipH,
        flipVertical: flipV,
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        originalFileName,
        originalSize: originalFileSize,
        fitMode,
        targetAspectRatio: targetRatio,
        backgroundColor: customBgColor || detectedBgColor
      });

      onCropComplete(result);
    } catch (err: any) {
      console.error('فشل معالجة وقص الصورة:', err);
      alert(`حدث خطأ أثناء قص الصورة: ${err?.message || 'يرجى المحاولة مرة أخرى'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
      id="image-cropper-modal"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl w-full max-w-4xl h-[92vh] sm:h-auto sm:max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-right text-slate-100 my-auto">
        {/* Header - Always Visible / Sticky */}
        <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-brand-blue/15 text-brand-blue flex items-center justify-center border border-brand-blue/30 shadow-inner shrink-0">
              <Scissors className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">{config.title}</h3>
                <span className="bg-slate-800 text-slate-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-slate-700">
                  {ASPECT_RATIOS.find(r => r.id === selectedRatioId)?.label || 'نسبة مخصصة'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">{config.hint}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Apply Button on Header for Ultra Fast Access */}
            <button
              type="button"
              onClick={handleExecuteCrop}
              disabled={isProcessing || !imageLoaded}
              className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/40 cursor-pointer sm:hidden"
              title="ملاءمة واعتماد الصورة"
            >
              <Check className="h-3.5 w-3.5" />
              <span>اعتماد</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              title="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Middle Body (Modes + Crop Viewport + Controls) */}
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col divide-y divide-slate-800/80">
          {/* Mode Selector & Aspect Ratios */}
          <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-950/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
            {/* Fit vs Crop Mode Selection */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setFitMode('pad_fit')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  fitMode === 'pad_fit'
                    ? 'bg-brand-blue text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="ملاءمة الصورة للـ DIV وإكمال أي فراغ ناقص بنفس لون خلفية الصورة"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>ملاءمة DIV مع إكمال الفراغ 🎨</span>
              </button>

              <button
                type="button"
                onClick={() => setFitMode('crop')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  fitMode === 'crop'
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="قص مباشر ملء الإطار"
              >
                <Scissors className="h-3.5 w-3.5" />
                <span>قص ملء الإطار</span>
              </button>
            </div>

            {/* Aspect Ratios Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              {ASPECT_RATIOS.map(item => {
                const isSelected = selectedRatioId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedRatioId(item.id)}
                    className={`px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-700 text-white ring-1 ring-white/20'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Background Color Indicator & Sampler Bar */}
          {fitMode === 'pad_fit' && (
            <div className="px-3 sm:px-4 py-1.5 bg-slate-950/40 flex items-center justify-between text-xs font-medium text-slate-300 shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <Palette className="h-3.5 w-3.5 text-brand-blue" />
                  <span>لون إكمال حواف الصورة:</span>
                </span>
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 px-2 py-0.5 rounded-lg relative">
                  <span
                    className="w-3.5 h-3.5 rounded-md border border-slate-600 shadow-xs inline-block shrink-0"
                    style={{ backgroundColor: customBgColor || detectedBgColor }}
                  />
                  <span className="font-mono text-[10px] text-slate-300 uppercase">
                    {customBgColor || detectedBgColor}
                  </span>
                  <input
                    type="color"
                    value={customBgColor || detectedBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-full h-full opacity-0 absolute inset-0 cursor-pointer"
                    title="تغيير لون إكمال الخلفية يدوياً"
                  />
                </div>
                <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">
                  (تم التعرف التلقائي ✨)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setCustomBgColor(detectedBgColor)}
                className="text-[10px] text-brand-blue hover:text-blue-400 font-bold underline cursor-pointer"
              >
                استعادة التلقائي
              </button>
            </div>
          )}

          {/* Main Crop Viewport */}
          <div className="flex-1 min-h-[180px] sm:min-h-[240px] max-h-[38vh] bg-slate-950 p-2 sm:p-4 flex items-center justify-center relative overflow-hidden select-none">
            <div
              ref={containerRef}
              className="relative inline-block max-w-full max-h-full cursor-crosshair touch-none shadow-2xl rounded-lg overflow-hidden border border-slate-700"
              style={{ backgroundColor: customBgColor || detectedBgColor }}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Base Image */}
              <img
                ref={imageRef}
                src={convertGoogleDriveUrl(imageSrc)}
                alt="Crop target"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onLoad={handleImageLoad}
                style={{
                  transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${zoom})`,
                  transition: 'transform 0.15s ease-out',
                  maxHeight: '34vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
                className="pointer-events-none select-none"
              />

              {/* Dark Mask Around Crop Box */}
              {imageLoaded && (
                <>
                  {/* Top mask */}
                  <div
                    className="absolute left-0 right-0 top-0 bg-slate-950/75 backdrop-blur-[1px] pointer-events-none transition-all"
                    style={{ height: `${cropBox.y}%` }}
                  />
                  {/* Bottom mask */}
                  <div
                    className="absolute left-0 right-0 bottom-0 bg-slate-950/75 backdrop-blur-[1px] pointer-events-none transition-all"
                    style={{ height: `${100 - (cropBox.y + cropBox.height)}%` }}
                  />
                  {/* Left mask */}
                  <div
                    className="absolute top-0 bottom-0 left-0 bg-slate-950/75 backdrop-blur-[1px] pointer-events-none transition-all"
                    style={{
                      top: `${cropBox.y}%`,
                      height: `${cropBox.height}%`,
                      width: `${cropBox.x}%`
                    }}
                  />
                  {/* Right mask */}
                  <div
                    className="absolute top-0 bottom-0 right-0 bg-slate-950/75 backdrop-blur-[1px] pointer-events-none transition-all"
                    style={{
                      top: `${cropBox.y}%`,
                      height: `${cropBox.height}%`,
                      width: `${100 - (cropBox.x + cropBox.width)}%`
                    }}
                  />

                  {/* Active Interactive Crop Box */}
                  <div
                    className="absolute border-2 border-brand-blue shadow-[0_0_0_1px_rgba(255,255,255,0.7)] cursor-move touch-none"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.width}%`,
                      height: `${cropBox.height}%`
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'move')}
                  >
                    {/* Grid Lines (Rule of thirds) */}
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                      <div className="border-r border-b border-white/60" />
                      <div className="border-r border-b border-white/60" />
                      <div className="border-b border-white/60" />
                      <div className="border-r border-b border-white/60" />
                      <div className="border-r border-b border-white/60" />
                      <div className="border-b border-white/60" />
                      <div className="border-r border-b border-white/60" />
                      <div className="border-r border-b border-white/60" />
                      <div />
                    </div>

                    {/* Corner Resize Handles */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'nw')}
                      className="absolute -top-2 -left-2 w-4 h-4 bg-white border-2 border-brand-blue rounded-full shadow-md cursor-nwse-resize z-20"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'ne')}
                      className="absolute -top-2 -right-2 w-4 h-4 bg-white border-2 border-brand-blue rounded-full shadow-md cursor-nesw-resize z-20"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'sw')}
                      className="absolute -bottom-2 -left-2 w-4 h-4 bg-white border-2 border-brand-blue rounded-full shadow-md cursor-nesw-resize z-20"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'se')}
                      className="absolute -bottom-2 -right-2 w-4 h-4 bg-white border-2 border-brand-blue rounded-full shadow-md cursor-nwse-resize z-20"
                    />

                    {/* Edge Handles */}
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'n')}
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-white border border-brand-blue rounded-full shadow-xs cursor-ns-resize z-20"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 's')}
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 bg-white border border-brand-blue rounded-full shadow-xs cursor-ns-resize z-20"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'w')}
                      className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-6 bg-white border border-brand-blue rounded-full shadow-xs cursor-ew-resize z-20"
                    />
                    <div
                      onPointerDown={(e) => handlePointerDown(e, 'e')}
                      className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-6 bg-white border border-brand-blue rounded-full shadow-xs cursor-ew-resize z-20"
                    />

                    {/* Center Placement badge */}
                    <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black py-0.5 px-2 rounded-md pointer-events-none border border-white/20">
                      {ASPECT_RATIOS.find(r => r.id === selectedRatioId)?.label}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Toolbar Controls: Zoom, Rotate, Flip */}
          <div className="p-2.5 sm:p-3.5 bg-slate-950/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {/* Zoom Slider */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 py-1 px-2.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="تصغير المعاينة"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-16 sm:w-24 accent-brand-blue cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <button
                type="button"
                onClick={() => setZoom(prev => Math.min(2.5, prev + 0.1))}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="تكبير المعاينة"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 w-7 text-center">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Transformations: Rotate & Flip */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRotation(r => (r - 90) % 360)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 p-1.5 sm:p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="تدوير 90 درجة لليسار"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[10px]">يسار</span>
              </button>

              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 p-1.5 sm:p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="تدوير 90 درجة لليمين"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[10px]">يمين</span>
              </button>

              <button
                type="button"
                onClick={() => setFlipH(f => !f)}
                className={`border p-1.5 sm:p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  flipH ? 'bg-brand-blue/20 text-brand-blue border-brand-blue/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
                title="قلب أفقي (مرآة)"
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[10px]">أفقي</span>
              </button>

              <button
                type="button"
                onClick={() => setFlipV(f => !f)}
                className={`border p-1.5 sm:p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  flipV ? 'bg-brand-blue/20 text-brand-blue border-brand-blue/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
                title="قلب رأسي"
              >
                <FlipVertical className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[10px]">رأسي</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRotation(0);
                  setFlipH(false);
                  setFlipV(false);
                  setZoom(1);
                  setCustomBgColor(detectedBgColor);
                  resetCropToRatio(selectedRatioId);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 p-1.5 sm:p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="إعادة ضبط الوضع الافتراضي"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden md:inline text-[10px]">ضبط</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTAs - Pinned at the bottom, ALWAYS 100% VISIBLE! */}
        <div className="p-3 sm:p-4 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950 shrink-0 shadow-lg z-20">
          <div className="flex items-center gap-2">
            {onSkipCrop && (
              <button
                type="button"
                onClick={onSkipCrop}
                disabled={isProcessing}
                className="py-2.5 px-3 sm:px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                تخطي القص ⏩
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="py-2.5 px-3 sm:px-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
            >
              إلغاء ✕
            </button>
          </div>

          {/* Primary Action Button: ملاءمة واعتماد الصورة */}
          <button
            type="button"
            onClick={handleExecuteCrop}
            disabled={isProcessing || !imageLoaded}
            className="flex-1 sm:flex-initial py-2.5 sm:py-3 px-5 sm:px-7 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-900/40 active:scale-[0.98]"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>جاري ملاءمة وقص الصورة...</span>
              </>
            ) : (
              <>
                <Scissors className="h-4 w-4" />
                <span>ملاءمة واعتماد الصورة ✨</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
