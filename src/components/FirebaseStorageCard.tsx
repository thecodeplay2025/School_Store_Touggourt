import React, { useMemo, useState } from 'react';
import { Database, HardDrive, RefreshCw, AlertTriangle, ShieldCheck, Info, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface FirebaseStorageCardProps {
  products?: any[];
  categories?: any[];
  municipalities?: any[];
  orders?: any[];
  users?: any[];
  reviews?: any[];
  siteSettings?: any;
  visitorsCount?: number;
  packs?: any[];
  affiliates?: any[];
}

export const TOTAL_SPARK_BYTES = 1024 * 1024 * 1024; // 1 GiB (1,073,741,824 bytes)

/**
 * Format bytes into readable string (B, KB, MB, GB)
 */
export function formatStorageSize(bytes: number, forceUnit?: 'MB' | 'GB'): string {
  if (bytes <= 0) return '0 बाيت';
  
  if (forceUnit === 'GB') {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (forceUnit === 'MB') {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Estimate size of a document based on JSON byte length + doc ID overhead + field overheads (Firestore specification standard)
 */
function calculateDocSize(docObj: any, docId: string = ''): number {
  if (!docObj) return 0;
  try {
    const jsonStr = JSON.stringify(docObj);
    const textBytes = new TextEncoder().encode(jsonStr).length;
    const idBytes = new TextEncoder().encode(docId).length;
    const fieldCount = typeof docObj === 'object' && docObj !== null ? Object.keys(docObj).length : 1;
    // 32 bytes per field name/type overhead + 32 bytes document overhead per Firestore pricing spec
    const overhead = (fieldCount * 32) + 32;
    return textBytes + idBytes + overhead;
  } catch (err) {
    return 64;
  }
}

/**
 * Estimate size of a collection array
 */
function calculateCollectionSize(items: any[] = []): { count: number; bytes: number } {
  if (!Array.isArray(items)) return { count: 0, bytes: 0 };
  let bytes = 0;
  items.forEach((item) => {
    const id = item?.id || item?.name || '';
    bytes += calculateDocSize(item, String(id));
  });
  return { count: items.length, bytes };
}

export const FirebaseStorageCard: React.FC<FirebaseStorageCardProps> = ({
  products = [],
  categories = [],
  municipalities = [],
  orders = [],
  users = [],
  reviews = [],
  siteSettings,
  visitorsCount = 0,
  packs = [],
  affiliates = []
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute breakdown across all collections
  const breakdown = useMemo(() => {
    const prods = calculateCollectionSize(products);
    const cats = calculateCollectionSize(categories);
    const munis = calculateCollectionSize(municipalities);
    const ords = calculateCollectionSize(orders);
    const usrs = calculateCollectionSize(users);
    const revs = calculateCollectionSize(reviews);
    const pks = calculateCollectionSize(packs);
    const affs = calculateCollectionSize(affiliates);
    const setsBytes = calculateDocSize(siteSettings, 'siteSettings');
    const visitorsBytes = calculateDocSize({ count: visitorsCount }, 'stats');

    const totalDocCount =
      prods.count +
      cats.count +
      munis.count +
      ords.count +
      usrs.count +
      revs.count +
      pks.count +
      affs.count +
      2; // settings + visitors

    const usedBytes =
      prods.bytes +
      cats.bytes +
      munis.bytes +
      ords.bytes +
      usrs.bytes +
      revs.bytes +
      pks.bytes +
      affs.bytes +
      setsBytes +
      visitorsBytes;

    const remainingBytes = Math.max(0, TOTAL_SPARK_BYTES - usedBytes);
    const usagePercent = parseFloat(((usedBytes / TOTAL_SPARK_BYTES) * 100).toFixed(2));

    return {
      usedBytes,
      remainingBytes,
      usagePercent,
      totalDocCount,
      collections: [
        { name: 'المنتجات (products)', count: prods.count, bytes: prods.bytes, icon: '📦' },
        { name: 'الطلبات (orders)', count: ords.count, bytes: ords.bytes, icon: '🛒' },
        { name: 'باكات الدراسة (packs)', count: pks.count, bytes: pks.bytes, icon: '🎓' },
        { name: 'المسوقين (affiliates)', count: affs.count, bytes: affs.bytes, icon: '🤝' },
        { name: 'التصنيفات (categories)', count: cats.count, bytes: cats.bytes, icon: '🏷️' },
        { name: 'البلديات والشحن (municipalities)', count: munis.count, bytes: munis.bytes, icon: '🚚' },
        { name: 'المستخدمين (users)', count: usrs.count, bytes: usrs.bytes, icon: '👥' },
        { name: 'التقييمات (reviews)', count: revs.count, bytes: revs.bytes, icon: '⭐' },
        { name: 'إعدادات الموقع (settings)', count: 1, bytes: setsBytes, icon: '⚙️' },
        { name: 'إحصائيات الزوار (visitors)', count: 1, bytes: visitorsBytes, icon: '👁️' }
      ]
    };
  }, [products, categories, municipalities, orders, users, reviews, siteSettings, visitorsCount, packs, affiliates, lastRefreshed]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date());
      setIsRefreshing(false);
    }, 400);
  };

  // Status color evaluation
  let progressColorClass = 'bg-emerald-500 text-emerald-400 border-emerald-500/30';
  let badgeText = 'حالة ممتازة 🟢';
  let badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  if (breakdown.usagePercent > 95) {
    progressColorClass = 'bg-red-500 text-red-400 border-red-500/30';
    badgeText = 'حرج جداً (>95%) 🔴';
    badgeBg = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else if (breakdown.usagePercent > 80) {
    progressColorClass = 'bg-amber-500 text-amber-400 border-amber-500/30';
    badgeText = 'تحذير (>80%) 🟠';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl relative overflow-hidden transition-all hover:border-slate-750">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-48 h-48 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-2xl border border-brand-blue/20 shadow-sm shrink-0">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white">استهلاك قاعدة البيانات (Firestore)</h3>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                {badgeText}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
              <span>Firebase Spark Plan (الخطة المجانية 1 GiB)</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-[11px] text-slate-500">{breakdown.totalDocCount} مستند مسجل</span>
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          title="تحديث حساب مساحة قاعدة البيانات"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-brand-blue ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>تحديث فوري</span>
        </button>
      </div>

      {/* Critical / Warning Alert Banners */}
      {breakdown.usagePercent > 95 && (
        <div className="bg-red-950/40 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 text-red-300 animate-in fade-in duration-300">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-red-200">⚠️ تحذير حرج: تجاوز استهلاك البيانات 95%!</h4>
            <p className="leading-relaxed opacity-90">
              وصل استهلاك قاعدة البيانات إلى <span className="font-mono font-black dir-ltr inline-block">{breakdown.usagePercent}%</span> من سعة الخطة المجانية (1 GiB). يرجى مسح الطلبات المعالجة القديمة أو ترقية الخطة لمنع توقف الخدمة.
            </p>
          </div>
        </div>
      )}

      {breakdown.usagePercent > 80 && breakdown.usagePercent <= 95 && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-amber-300 animate-in fade-in duration-300">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-amber-200">⚡ تنبيه: اقتراب حد السعة التخزينية (تجاوز 80%)</h4>
            <p className="leading-relaxed opacity-90">
              لقد استهلكت <span className="font-mono font-black dir-ltr inline-block">{breakdown.usagePercent}%</span> من السعة التخزينية المتاحة.
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar & Percentage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <HardDrive className="h-4 w-4 text-brand-blue" />
            نسبة الاستهلاك الحالية:
          </span>
          <span className="font-mono font-black text-sm text-white bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl">
            {breakdown.usagePercent}%
          </span>
        </div>

        {/* Outer Bar */}
        <div className="w-full h-4 bg-slate-900 border border-slate-800 rounded-full p-0.5 overflow-hidden relative shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out shadow-lg ${
              breakdown.usagePercent > 95
                ? 'bg-gradient-to-r from-red-600 to-rose-500'
                : breakdown.usagePercent > 80
                ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                : 'bg-gradient-to-r from-emerald-600 to-teal-400'
            }`}
            style={{ width: `${Math.min(100, Math.max(0.5, breakdown.usagePercent))}%` }}
          />
        </div>
      </div>

      {/* Structured Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* Used */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block">المساحة المستخدمة (Used)</span>
          <span className="text-base sm:text-lg font-black font-mono text-brand-blue block dir-ltr text-right">
            {formatStorageSize(breakdown.usedBytes)}
          </span>
          <span className="text-[9px] text-slate-500 block font-mono">
            ({breakdown.usedBytes.toLocaleString()} bytes)
          </span>
        </div>

        {/* Remaining */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block">المساحة المتبقية (Remaining)</span>
          <span className="text-base sm:text-lg font-black font-mono text-emerald-400 block dir-ltr text-right">
            {formatStorageSize(breakdown.remainingBytes, 'MB')}
          </span>
          <span className="text-[9px] text-slate-500 block">
            متاحة للاستخدام
          </span>
        </div>

        {/* Total Capacity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block">السعة الكلية (Total)</span>
          <span className="text-base sm:text-lg font-black font-mono text-purple-400 block dir-ltr text-right">
            1 GiB
          </span>
          <span className="text-[9px] text-slate-500 block">
            (1,024 MB / Spark Plan)
          </span>
        </div>

        {/* Usage % */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block">نسبة الاستغلال (Usage)</span>
          <span className={`text-base sm:text-lg font-black font-mono block dir-ltr text-right ${
            breakdown.usagePercent > 95 ? 'text-red-400' : breakdown.usagePercent > 80 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {breakdown.usagePercent}%
          </span>
          <span className="text-[9px] text-slate-500 block">
            من إجمالي 100%
          </span>
        </div>
      </div>

      {/* Estimation Note Footer & Detailed Accordion Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>قيمة تقديرية مبنية على حساب أوزان المستندات في المجموعات (Collections).</span>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-brand-blue hover:text-blue-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Layers className="h-3.5 w-3.5" />
          <span>{showDetails ? 'إخفاء تفاصيل المجموعات' : 'عرض توزيع المجموعات'}</span>
          {showDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Detailed Collections Accordion Grid */}
      {showDetails && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-black text-white flex items-center gap-2 border-b border-slate-800 pb-2">
            <span>توزيع أحجام البيانات حسب المجموعات المسجلة:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {breakdown.collections.map((col, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 p-2.5 rounded-xl flex items-center justify-between gap-2 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{col.icon}</span>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-200 block truncate">{col.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{col.count} مستند</span>
                  </div>
                </div>

                <span className="font-mono font-bold text-slate-300 text-[11px] shrink-0 dir-ltr">
                  {formatStorageSize(col.bytes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
