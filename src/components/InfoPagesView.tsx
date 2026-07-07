import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, FileText, Truck, ArrowRight, CheckCircle2 } from 'lucide-react';

interface InfoPagesViewProps {
  pageType: 'privacy' | 'terms' | 'shipping';
  onGoHome: () => void;
}

export default function InfoPagesView({ pageType, onGoHome }: InfoPagesViewProps) {
  
  const getPageConfig = () => {
    switch (pageType) {
      case 'privacy':
        return {
          title: 'سياسة الخصوصية وسرية المعلومات | School Store Touggourt',
          description: 'نلتزم بحماية خصوصية بياناتكم بشكل كامل. تعرف على كيفية جمع ومعالجة معلومات الطلبات والتوصيل لزبائننا الكرام بولاية توقرت.',
          canonical: '/privacy',
          icon: <Shield className="h-7 w-7 text-emerald-600" />,
          iconBg: 'bg-emerald-50 border-emerald-100',
          heading: 'سياسة الخصوصية وسرية المعلومات',
          content: (
            <div className="space-y-6 text-slate-700 font-medium leading-relaxed text-xs sm:text-sm">
              <p>
                مرحباً بكم في <strong>School Store Touggourt</strong>. نحن نولي سرية وأمان معلوماتكم الشخصية أهمية قصوى ونلتزم بحمايتها وفقاً لأعلى معايير الأمان الرقمي واللوجستي.
              </p>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-emerald-500 pr-3 mt-4">1. المعلومات التي نجمعها</h2>
              <p>
                من أجل إتمام وتوصيل طلباتكم بنجاح داخل ولاية توقرت، نقوم بجمع المعلومات الأساسية التالية فقط:
              </p>
              <ul className="list-disc list-inside pr-4 space-y-1">
                <li>الاسم الكامل للمستلم.</li>
                <li>رقم الهاتف النشط للتنسيق والاتصال قبل التوصيل.</li>
                <li>العنوان التفصيلي وموقع الاستلام (البلدية، الحي، أو المعالم القريبة).</li>
              </ul>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-emerald-500 pr-3 mt-4">2. كيف نستخدم معلوماتكم</h2>
              <p>
                تُستخدم البيانات التي تقدمونها حصرياً للأغراض التالية:
              </p>
              <ul className="list-disc list-inside pr-4 space-y-1">
                <li>تأكيد وتجهيز سلة المشتريات والباكات المدرسية الخاصة بكم.</li>
                <li>تسهيل مهمة مندوب التوصيل للوصول إليكم بأسرع وقت ممكن.</li>
                <li>التواصل معكم في حال وجود أي تحديثات أو استفسارات حول الطلب.</li>
              </ul>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-emerald-500 pr-3 mt-4">3. حماية البيانات ومشاركتها</h2>
              <p>
                نحن لا نقوم ببيع، تأجير، أو مشاركة بياناتكم الشخصية مع أي طرف ثالث خارج فريق التجهيز والتوصيل الخاص بنا مطلقاً. جميع معلوماتكم مخزنة بشكل آمن وسري تماماً في قواعد بيانات مشفرة.
              </p>

              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-slate-800 text-xs flex items-start gap-3 mt-6">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="font-bold">
                  باستخدامكم لمتجرنا وتأكيد الطلبات، فإنكم توافقون على جمع واستخدام المعلومات المذكورة أعلاه لغرض معالجة وتوصيل طلبياتكم الدراسية بكفاءة تامة.
                </p>
              </div>
            </div>
          ),
        };

      case 'terms':
        return {
          title: 'شروط وأحكام الاستخدام والطلب | School Store Touggourt',
          description: 'الشروط والأحكام المنظمة لعمليات تصفح متجر الأدوات المدرسية والباكات وشروط تأكيد ورفض الطلبات في ولاية توقرت.',
          canonical: '/terms',
          icon: <FileText className="h-7 w-7 text-blue-600" />,
          iconBg: 'bg-blue-50 border-blue-100',
          heading: 'شروط وأحكام الاستخدام والطلب',
          content: (
            <div className="space-y-6 text-slate-700 font-medium leading-relaxed text-xs sm:text-sm">
              <p>
                باستخدامكم لمتجر <strong>School Store Touggourt</strong> وتأكيد طلباتكم من خلاله، فإنكم توافقون بالكامل على الالتزام بالشروط والأحكام المنظمة للخدمة الموضحة أدناه.
              </p>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-blue-500 pr-3 mt-4">1. أهلية الطلب وتأكيده</h2>
              <p>
                يجب على العميل تقديم معلومات تواصل دقيقة ورقم هاتف فعال. ستقوم خدمة الزبائن بالاتصال بالرقم المقدم لتأكيد المشتريات قبل الشحن، وفي حال عدم الرد المتكرر خلال 24 ساعة، يحق للمتجر إلغاء الطلب تلقائياً.
              </p>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-blue-500 pr-3 mt-4">2. الأسعار وتوفر المنتجات</h2>
              <p>
                جميع الأسعار المعروضة على المتجر بالدينار الجزائري (DZD) وهي أسعار نهائية للأدوات والباكات. نبذل قصارى جهدنا لضمان دقة معلومات المخزون، وفي حال نفاد منتج معين بعد إتمام الطلب، سيتم إشعاركم فوراً لتقديم بديل مكافئ أو إزالته.
              </p>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-blue-500 pr-3 mt-4">3. التزامات العميل عند الاستلام</h2>
              <p>
                يلتزم العميل باستلام الطلبية المتفق عليها ودفع قيمتها نقداً لمندوب التوصيل. التراجع عن الطلب بعد تأكيده وشحنه يلحق خسائر مادية بالفريق، لذا يرجى التأكد التام قبل الضغط على تأكيد الطلب.
              </p>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-blue-500 pr-3 mt-4">4. التعديلات على البنود</h2>
              <p>
                يحتفظ المتجر بحق تحديث وتعديل هذه الشروط في أي وقت لتتماشى مع تحسين جودة الخدمة وسلامة المعاملات اللوجستية بولاية توقرت.
              </p>
            </div>
          ),
        };

      case 'shipping':
      default:
        return {
          title: 'سياسة الشحن والتوصيل والإرجاع | School Store Touggourt',
          description: 'تفاصيل شحن الأدوات المدرسية والباكات لكافة بلديات ولاية توقرت، مدة التوصيل القياسية وسياسة استبدال المنتجات التالفة.',
          canonical: '/shipping',
          icon: <Truck className="h-7 w-7 text-indigo-600" />,
          iconBg: 'bg-indigo-50 border-indigo-100',
          heading: 'سياسة الشحن، التوصيل والإرجاع',
          content: (
            <div className="space-y-6 text-slate-700 font-medium leading-relaxed text-xs sm:text-sm">
              <p>
                نسعى جاهدين لتقديم أفضل تجربة توصيل مريحة وسريعة لطلباتكم المدرسية والأكاديمية مباشرة حتى عتبة منزلكم في جميع بلديات ولاية توقرت.
              </p>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-indigo-500 pr-3 mt-4">1. التغطية والمناطق المتاحة</h2>
              <p>
                خدمة التوصيل نشطة وتغطي كافة بلديات ودوائر ولاية توقرت ومنها:
              </p>
              <ul className="list-disc list-inside pr-4 space-y-1">
                <li>بلدية توقرت (توقرت وسط، حي المستقبل، حي الأقواس، وغيرها)</li>
                <li>تيبسبست، نزلة، والزاوية العابدية</li>
                <li>تماسين وبلدة عمر</li>
                <li>المقارين والمنقر</li>
                <li>العالية والحجيرة والبرمة</li>
              </ul>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-indigo-500 pr-3 mt-4">2. مدة الشحن القياسية</h2>
              <p>
                يتم تسليم الطلبيات خلال <strong>24 إلى 48 ساعة</strong> من تاريخ التأكيد الهاتفي. يتصل بكم المندوب قبل الوصول لترتيب وقت ومكان الاستلام المناسبين لكم.
              </p>

              <h2 className="text-base sm:text-lg font-black text-slate-900 border-r-4 border-indigo-500 pr-3 mt-4">3. سياسة الإرجاع والاستبدال</h2>
              <p>
                نضمن سلامة وجودة كافة المعروضات بنسبة 100%. في حال تبين وجود أي عيب مصنعي أو تلف ناتج عن الشحن في أي أداة أو حقيبة، يرجى إبلاغنا خلال <strong>24 ساعة</strong> من الاستلام وسنقوم باستبدالها لكم مجاناً وبأسرع وقت.
              </p>

              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-slate-800 text-xs flex items-start gap-3 mt-6">
                <CheckCircle2 className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="font-bold">
                  فحص الطلبية متاح ومرحب به قبل الدفع للمندوب لضمان رضاكم التام واطمئنانكم لجودة مشترياتكم المدرسية.
                </p>
              </div>
            </div>
          ),
        };
    }
  };

  const config = getPageConfig();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-right" dir="rtl">
      <Helmet>
        <title>{config.title}</title>
        <meta name="description" content={config.description} />
        <link rel="canonical" href={`${window.location.origin}${config.canonical}`} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Header Info */}
      <div className="text-center space-y-4 mb-10">
        <div className={`inline-flex items-center justify-center p-3.5 rounded-2xl border shadow-3xs mb-1 ${config.iconBg}`}>
          {config.icon}
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {config.heading}
        </h1>
        <p className="text-slate-400 font-bold text-[10px] sm:text-xs tracking-wide">
          School Store Touggourt • متجر المستلزمات المدرسية بتوقرت
        </p>
      </div>

      {/* Document Body Wrapper */}
      <div className="bg-white border border-slate-150 rounded-[32px] p-6 sm:p-10 shadow-3xs">
        {config.content}
      </div>

      {/* Back Button */}
      <div className="mt-8 text-center">
        <button
          onClick={onGoHome}
          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-sm transition-all active:scale-98 cursor-pointer"
        >
          <span>العودة للتسوق بالمتجر</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
