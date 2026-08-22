import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Download, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  PlusSquare, 
  Zap, 
  ShieldCheck,
  QrCode
} from 'lucide-react';
import midadLogo from '../assets/images/midad_logo.png';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  onInstallNative?: () => void;
}

export default function AppDownloadModal({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallNative
}: AppDownloadModalProps) {
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>('android');
  const [installSuccess, setInstallSuccess] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://midad-store.dz';

  const handleInstallClick = () => {
    if (deferredPrompt && onInstallNative) {
      onInstallNative();
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
    } else {
      // If no native prompt (already installed or unsupported), show instructions
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setActiveTab('ios');
      } else {
        setActiveTab('android');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.35 }}
          className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative z-10 text-right my-8"
          dir="rtl"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            id="close-app-download-modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-tr from-brand-blue to-blue-500 rounded-2xl p-0.5 shadow-md shadow-blue-500/20 shrink-0 flex items-center justify-center">
              <img 
                src={midadLogo} 
                alt="Midad App" 
                className="w-full h-full object-contain rounded-2xl bg-white p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full mb-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                تطبيق الويب السريع (PWA)
              </div>
              <h3 className="text-xl font-black text-slate-900">تطبيق متجر مداد</h3>
              <p className="text-xs text-slate-500 font-medium">تسوق بسرعة وسهولة من هاتفك بدون الحاجة لمساحة تخزين كبيرة</p>
            </div>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-3 gap-2 mb-6 text-center">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <Zap className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-700 block">فائق السرعة</span>
              <span className="text-[9px] text-slate-400">بدون انتظار</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-700 block">خفيف وآمن</span>
              <span className="text-[9px] text-slate-400">أقل من 2MB</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <Smartphone className="w-5 h-5 text-brand-blue mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-700 block">شاشة رئيسية</span>
              <span className="text-[9px] text-slate-400">وصول بلمسة</span>
            </div>
          </div>

          {/* Primary Direct Install Button */}
          <div className="mb-6">
            <button
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-brand-blue to-blue-700 hover:from-blue-700 hover:to-brand-blue text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 text-base transition-all active:scale-98 cursor-pointer"
              id="install-app-direct-btn"
            >
              <Download className="w-5 h-5" />
              <span>{deferredPrompt ? 'تثبيت التطبيق على جهازك الآن' : 'تثبيت التطبيق (إضافة للشاشة الرئيسية)'}</span>
            </button>
            {installSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-center text-xs font-bold text-emerald-600 bg-emerald-50 py-2 rounded-xl border border-emerald-100"
              >
                جاري تثبيت تطبيق مداد على جهازك بنجاح! 🎉
              </motion.div>
            )}
          </div>

          {/* OS Switcher Tabs */}
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 mb-4">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'android' 
                  ? 'bg-white text-brand-blue shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-android-guide"
            >
              📱 أجهزة أندرويد (Chrome)
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'ios' 
                  ? 'bg-white text-brand-blue shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-ios-guide"
            >
              🍏 أجهزة آيفون (Safari)
            </button>
          </div>

          {/* Instructions Content */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-600 space-y-3">
            {activeTab === 'android' ? (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p>افتح متجر مداد في متصفح <strong className="text-slate-900">Google Chrome</strong> على هاتفك.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p>اضغط على قائمة الخيارات الثلاث نقاط <strong className="text-slate-900">(⋮)</strong> في أعلى الزاوية.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p>اختر <strong className="text-brand-blue">"تثبيت التطبيق"</strong> أو <strong className="text-brand-blue">"إضافة إلى الشاشة الرئيسية"</strong>.</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <p>افتح متجر مداد في متصفح <strong className="text-slate-900">Safari</strong> على جهاز الآيفون.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <p className="flex items-center gap-1">
                    اضغط على زر المشاركة 
                    <Share2 className="w-3.5 h-3.5 text-blue-600 inline mx-0.5" /> 
                    في شريط المتصفح بالأسفل.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <p className="flex items-center gap-1">
                    اختر <strong className="text-brand-blue">"إضافة إلى الشاشة الرئيسية"</strong> 
                    <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline mx-0.5" /> 
                    ثم اضغط "إضافة".
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Quick Note */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1 text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>متوافق مع جميع الهواتف الذكية والأجهزة اللوحية</span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-900 font-bold hover:underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
