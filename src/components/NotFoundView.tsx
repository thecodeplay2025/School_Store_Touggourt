import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Home, AlertCircle, ArrowRight } from 'lucide-react';

interface NotFoundViewProps {
  onGoHome: () => void;
}

export default function NotFoundView({ onGoHome }: NotFoundViewProps) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 bg-slate-50 text-right" dir="rtl">
      <Helmet>
        <title>الصفحة غير موجودة | School Store Touggourt</title>
        <meta name="description" content="عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-[32px] border border-slate-150 shadow-sm">
        
        {/* Error icon/graphic */}
        <div className="mx-auto bg-rose-50 border border-rose-100 text-rose-500 h-20 w-20 rounded-full flex items-center justify-center shadow-2xs">
          <AlertCircle className="h-10 w-10 animate-pulse" />
        </div>

        {/* Dynamic single H1 for SEO correctness */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
            خطأ 404: الصفحة غير موجودة
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold leading-relaxed">
            عذراً، الصفحة التي تحاول الوصول إليها بولاية توقرت قد تم نقلها، أو أنها غير موجودة نهائياً في متجرنا.
          </p>
        </div>

        {/* Illustrated helper */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/60 text-xs text-slate-600 font-bold leading-relaxed">
          💡 يمكنك استخدام محرك البحث في الأعلى للبحث عن حقائب، أدوات، أو آلات حاسبة مباشرة، أو العودة للمتجر.
        </div>

        {/* Action Button */}
        <button
          onClick={onGoHome}
          className="w-full bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-sm py-3.5 px-6 rounded-2xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 group"
        >
          <Home className="h-4.5 w-4.5 shrink-0" />
          <span>العودة لصفحة المتجر الرئيسية</span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
