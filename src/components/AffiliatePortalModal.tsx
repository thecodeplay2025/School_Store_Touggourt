import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Coins, 
  ShoppingBag, 
  TrendingUp, 
  Copy, 
  Check, 
  ExternalLink,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Affiliate, Order } from '../types';

interface AffiliatePortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  affiliates: Affiliate[];
  orders: Order[];
  formatPrice: (price: number) => string;
}

export default function AffiliatePortalModal({
  isOpen,
  onClose,
  affiliates,
  orders,
  formatPrice
}: AffiliatePortalModalProps) {
  const [codeQuery, setCodeQuery] = useState('');
  const [activeAffiliate, setActiveAffiliate] = useState<Affiliate | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setActiveAffiliate(null);

    const cleanQuery = codeQuery.trim().toUpperCase();
    if (!cleanQuery) {
      setErrorMsg('يرجى إدخال رمز الإحالة الخاص بك.');
      return;
    }

    const found = affiliates.find(a => a.code.toUpperCase() === cleanQuery);
    if (found) {
      setActiveAffiliate(found);
    } else {
      setErrorMsg('عذراً، رمز الإحالة هذا غير مسجل لدينا في النظام. يرجى التواصل مع الإدارة للحصول على رمز معتمد.');
    }
  };

  const handleCopyLink = (code: string) => {
    const origin = window.location.origin.includes('netlify.app') 
      ? 'https://school-store-touggourt.netlify.app' 
      : window.location.origin;
    const url = `${origin}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get all orders associated with this affiliate
  const affiliateOrders = activeAffiliate 
    ? orders.filter(o => o.referrer && o.referrer.trim().toUpperCase() === activeAffiliate.code.toUpperCase())
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            className="bg-slate-900 border border-slate-800 text-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] relative z-10 text-right font-semibold"
            dir="rtl"
            id="affiliate-portal-modal"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-xl border border-emerald-500/20">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">بوابة الأرباح وتتبع المسوقين بالعمولة</h3>
                  <p className="text-[10px] text-slate-400 font-medium">تابع مبيعاتك، عمولاتك، وطلبات الإحالة الخاصة بك مباشرة وبكل سهولة</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
                title="إغلاق"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-6 max-h-[calc(90vh-140px)]">
              
              {/* Search Form (Always visible at top so they can switch accounts) */}
              <form onSubmit={handleSearch} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                <label className="block text-xs font-bold text-slate-300">أدخل كود المسوق التعريفي الخاص بك:</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      placeholder="مثال: MIDAD22"
                      value={codeQuery}
                      onChange={(e) => setCodeQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-3 pr-10 pl-4 text-xs font-mono font-black text-white focus:outline-none focus:border-emerald-500 text-right uppercase"
                    />
                    <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <span>استعلام 🔍</span>
                  </button>
                </div>

                {errorMsg && (
                  <div className="text-rose-400 text-[11px] font-bold flex items-center gap-1.5 mt-2 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </form>

              {activeAffiliate ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Marketer Welcome Bar */}
                  <div className="bg-gradient-to-l from-emerald-950/20 via-slate-900 to-slate-900 p-4.5 rounded-2xl border border-emerald-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold block">مرحباً بك مجدداً</span>
                      <h4 className="text-base font-black text-white">{activeAffiliate.name}</h4>
                    </div>
                    <div className="bg-slate-950/80 border border-slate-800 py-1.5 px-3.5 rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 block font-bold">الرمز الخاص بك:</span>
                      <span className="font-mono font-black text-sm text-emerald-400">{activeAffiliate.code}</span>
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Stat Card 1: Balance */}
                    <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl relative overflow-hidden group">
                      <div className="absolute top-3 left-3 bg-emerald-500/10 text-emerald-400 p-2 rounded-xl">
                        <Coins className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-bold">العمولة الحالية الجاهزة</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-400 block mt-1 font-mono">
                        {formatPrice(activeAffiliate.commissionBalance || 0)}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-1.5">تُدفع العمولات فور استلام طلبياتك من الزبائن</span>
                    </div>

                    {/* Stat Card 2: Sales */}
                    <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-3 left-3 bg-blue-500/10 text-brand-blue p-2 rounded-xl">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-bold">إجمالي مبيعاتك المحالة</span>
                      <span className="text-lg sm:text-xl font-black text-white block mt-1 font-mono">
                        {formatPrice(activeAffiliate.totalSales || 0)}
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-1.5">إجمالي قيمة السلع التي تم توصيلها بنجاح</span>
                    </div>

                    {/* Stat Card 3: Orders count */}
                    <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-3 left-3 bg-purple-500/10 text-purple-400 p-2 rounded-xl">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] text-slate-400 block font-bold">عدد الطلبيات المستلمة</span>
                      <span className="text-lg sm:text-xl font-black text-purple-400 block mt-1 font-mono">
                        {activeAffiliate.totalOrders || 0} طلبية
                      </span>
                      <span className="text-[9px] text-slate-500 block mt-1.5">عدد الطلبيات التي تسلمها أصحابها في توقرت</span>
                    </div>
                  </div>

                  {/* Unique Shareable Link */}
                  <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">رابط الإحالة المباشر الخاص بك:</span>
                      <span className="text-[10px] text-slate-500">انسخه وانشره في منصات التواصل لتبدأ في كسب العمولات</span>
                    </div>
                    <div className="flex bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden p-1.5 items-center gap-2">
                      <div className="flex-1 font-mono text-[11px] text-emerald-400 select-all pr-2 font-black truncate text-left" dir="ltr">
                        {`${window.location.origin.includes('netlify.app') ? 'https://school-store-touggourt.netlify.app' : window.location.origin}/?ref=${activeAffiliate.code}`}
                      </div>
                      <button
                        onClick={() => handleCopyLink(activeAffiliate.code)}
                        className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          copied 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>تم نسخ الرابط!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>نسخ الرابط</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Referred Orders List */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                      <ShoppingBag className="h-4 w-4 text-emerald-500" />
                      <span>قائمة الطلبات المحالة من خلالك ({affiliateOrders.length} طلب)</span>
                    </h5>

                    {affiliateOrders.length === 0 ? (
                      <div className="bg-slate-950/45 border border-slate-800/70 rounded-2xl p-8 text-center text-slate-500 text-xs font-bold">
                        لم يتم تسجيل أي طلبيات عبر رابطك بعد. شارك الرابط وابدأ الربح! 🚀
                      </div>
                    ) : (
                      <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden overflow-x-auto text-right text-xs">
                        <table className="w-full">
                          <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-850">
                            <tr>
                              <th className="p-3">رقم الطلبية</th>
                              <th className="p-3 text-center">التاريخ</th>
                              <th className="p-3 text-center">حالة الدفع والتوصيل</th>
                              <th className="p-3 text-left">قيمة الطلب</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/60 font-semibold text-slate-300">
                            {affiliateOrders.map((ord) => (
                              <tr key={ord.id} className="hover:bg-slate-900/30 transition-colors">
                                <td className="p-3 font-mono font-black text-brand-blue">{ord.id}</td>
                                <td className="p-3 text-center text-[10px] text-slate-400 font-mono">{ord.date}</td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                    ord.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    ord.status === 'confirmed' ? 'bg-blue-500/10 text-brand-blue border-blue-500/20' :
                                    ord.status === 'shipped' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  }`}>
                                    {ord.status === 'pending' ? 'قيد الانتظار' :
                                     ord.status === 'confirmed' ? 'تم التأكيد' :
                                     ord.status === 'shipped' ? 'مع المندوب' : 'تم الاستلام والدفع'}
                                  </span>
                                </td>
                                <td className="p-3 text-left font-black text-white font-mono">{formatPrice(ord.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                /* Static Welcome State before search */
                <div className="text-center py-10 space-y-4">
                  <div className="bg-emerald-500/5 text-emerald-500/40 p-5 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-emerald-500/10 animate-pulse">
                    <DollarSign className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">استعلم عن أرباحك وعمولاتك الحالية</h4>
                    <p className="text-[11px] text-slate-500 mt-1.5 max-w-sm mx-auto leading-normal font-bold">
                      أدخل رمز الإحالة الخاص بك والمعتمد من قبل الإدارة لمشاهدة إجمالي مبيعاتك، عمولاتك المحتسبة، وتتبع حالة جميع الطلبيات المحالة من خلالك.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 text-center text-[10px] text-slate-500 font-bold flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <span>* تطبق شروط التسويق بالعمولة الخاصة بمتجر مداد لولاية توقرت.</span>
              <span className="text-slate-400 font-black">الدعم الفني للمسوقين متوفر دائماً 📲</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
