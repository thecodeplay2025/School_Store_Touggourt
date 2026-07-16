import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { HelpCircle, ChevronDown, ChevronUp, Clock, ShieldCheck, MapPin } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: 'delivery' | 'payment' | 'products' | 'support';
}

export default function FAQView() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const faqs: FAQItem[] = [
    {
      question: 'كيف يمكنني الطلب من المتجر؟',
      answer: 'الطلب سهل للغاية! تصفح المنتجات أو الباكات المدرسية، أضف ما تحتاجه إلى السلة، ثم اضغط على زر "تأكيد الطلب". املأ معلوماتك (الاسم، الهاتف، العنوان ببلدية توقرت) وسنتواصل معك فوراً لتأكيد طلبيتك وإرسالها.',
      category: 'delivery',
    },
    {
      question: 'ما هي كلفة ومدة التوصيل في ولاية توقرت؟',
      answer: 'نوفر خدمة توصيل سريعة وموثوقة لجميع بلديات ولاية توقرت (توقرت وسط، تيبسبست، الزاوية العابدية، نزلة، تماسين، بلدة عمر، المقارين، العالية، الحجيرة، البرمة). مدة التوصيل تتراوح بين 24 إلى 48 ساعة كأقصى حد، والأسعار رمزية تختلف حسب البلدية.',
      category: 'delivery',
    },
    {
      question: 'هل توجد عروض أو خصومات للباكات المدرسية؟',
      answer: 'نعم بالتأكيد! لقد صممنا باكات مدرسية متكاملة لجميع الأطوار التعليمية (الابتدائي، المتوسط، الثانوي، والجامعي) تحتوي على كل ما يحتاجه التلميذ بخصومات تصل إلى 20% مقارنة بشراء الأدوات بشكل منفرد.',
      category: 'products',
    },
    {
      question: 'ما هي طرق الدفع المتوفرة؟',
      answer: 'نعتمد حالياً نظام الدفع عند الاستلام (COD) لضمان أقصى درجات الأمان والراحة لزبائننا. تقوم بفحص طلبيتك والتأكد منها بنفسك قبل تسليم المبلغ لعامل التوصيل.',
      category: 'payment',
    },
    {
      question: 'كيف أضمن جودة الأدوات المكتبية والمدرسية؟',
      answer: 'نحن نتعامل مباشرة مع كبرى العلامات التجارية الموثوقة للأدوات المدرسية (مثل Maped, Milan, Stabilo, Casio) لضمان جودة أصلية ومتانة تدوم طوال السنة الدراسية.',
      category: 'products',
    },
    {
      question: 'هل يمكنني تعديل أو إلغاء طلبيتي؟',
      answer: 'نعم، يمكنك إلغاء أو تعديل الطلب خلال 3 ساعات من تأكيده عن طريق الاتصال بخدمة الزبائن مباشرة على الرقم المتوفر في الموقع أو عبر الواتساب.',
      category: 'support',
    },
  ];

  const filteredFaqs = activeCategory === 'all'
    ? faqs
    : faqs.filter(f => f.category === activeCategory);

  // FAQ Schema JSON-LD
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-right" dir="rtl">
      <Helmet>
        <title>الأسئلة الشائعة والجواب الشافي | midad - مداد</title>
        <meta name="description" content="إليك كافة الأجوبة حول توصيل الأدوات المدرسية والباكات بولاية توقرت، طرق الدفع، جودة المنتجات، وإجراءات الطلب السريع." />
        <link rel="canonical" href={`${window.location.origin.includes('run.app') ? 'https://school-store-touggourt.netlify.app' : window.location.origin}/faq`} />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      {/* Header Banner */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center justify-center p-3.5 bg-blue-50 border border-blue-100 text-brand-blue rounded-2xl shadow-3xs mb-1">
          <HelpCircle className="h-7 w-7" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          الأسئلة الشائعة والجواب الشافي
        </h1>
        <p className="text-slate-500 font-bold text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          كل ما تود معرفته عن خدمات الطلب، التوصيل السريع ببلديات ولاية توقرت، وطرق الدفع الآمنة عند الاستلام.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {[
          { id: 'all', name: 'الكل' },
          { id: 'delivery', name: 'الشحن والتوصيل' },
          { id: 'products', name: 'الأدوات والباكات' },
          { id: 'payment', name: 'الدفع والأسعار' },
          { id: 'support', name: 'الدعم والتعديل' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveCategory(tab.id);
              setOpenIndex(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all duration-200 cursor-pointer ${
              activeCategory === tab.id
                ? 'bg-brand-blue text-white shadow-sm scale-102'
                : 'bg-white border border-slate-150 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3.5">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-3xs transition-all duration-300 hover:border-slate-300"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-right font-black text-xs sm:text-base text-slate-800 transition-colors hover:bg-slate-50/50 cursor-pointer"
              >
                <span className="leading-tight">{faq.question}</span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-brand-blue shrink-0 mr-3" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mr-3" />
                )}
              </button>

              {isOpen && (
                <div className="p-4 sm:p-5 pt-0 border-t border-slate-50 text-slate-600 font-medium text-xs sm:text-sm leading-relaxed bg-slate-50/20">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Trust Badges Footer */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-150 flex items-center gap-3 shadow-3xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-800">دفع آمن 100%</h3>
            <p className="text-[10px] text-slate-500 font-bold">ادفع نقداً عند استلام طلبيتك</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150 flex items-center gap-3 shadow-3xs">
          <div className="p-2.5 bg-blue-50 text-brand-blue rounded-xl shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-800">توصيل قياسي وسريع</h3>
            <p className="text-[10px] text-slate-500 font-bold">خلال 24-48 ساعة لبيتك بتوقرت</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150 flex items-center gap-3 shadow-3xs">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs text-slate-800">ولاية توقرت بالكامل</h3>
            <p className="text-[10px] text-slate-500 font-bold">نغطي كافة البلديات والمناطق</p>
          </div>
        </div>
      </div>
    </div>
  );
}
