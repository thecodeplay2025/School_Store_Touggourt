import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ShoppingCart, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Truck, 
  Coins, 
  Heart,
  Star,
  Users,
  AlertTriangle,
  ChevronDown,
  Gift,
  Check,
  Phone,
  User,
  MapPin,
  PartyPopper,
  Plus,
  Minus
} from 'lucide-react';
import { Product, PackItem, Municipality, Order } from '../types';
import { MUNICIPALITIES } from '../data';

interface PackLandingPageProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (p: Product) => void;
  onAddToWishlist: (p: Product) => void;
  isWishlisted: boolean;
  onDirectPurchase: (p: Product) => void;
}

// Custom function to determine realistic unit prices for pack items
const getItemUnitPrice = (name: string): number => {
  const lower = name.toLowerCase();
  if (lower.includes('حقيبة') || lower.includes('محفظة')) return 2200;
  if (lower.includes('مقلمة')) return 350;
  if (lower.includes('كراس') || lower.includes('دفتر')) {
    if (lower.includes('96')) return 120;
    if (lower.includes('120')) return 150;
    if (lower.includes('288')) return 350;
    return 100;
  }
  if (lower.includes('أقلام') || lower.includes('قلم') || lower.includes('سيالة')) return 50;
  if (lower.includes('ملونة') || lower.includes('تلوين')) return 150;
  if (lower.includes('غلاف') || lower.includes('أغلفة')) return 40;
  if (lower.includes('ادوات') || lower.includes('أدوات')) return 250;
  return 100; // default item price
};

export default function PackLandingPage({
  product,
  onClose,
  onAddToCart,
  onAddToWishlist,
  isWishlisted,
  onDirectPurchase
}: PackLandingPageProps) {
  const [successMsg, setSuccessMsg] = useState(false);

  // Stateful pack items allowing modification of quantities
  const [customPackItems, setCustomPackItems] = useState<PackItem[]>(() => {
    return product.packItems ? product.packItems.map(item => ({ ...item })) : [];
  });

  // Keep original items list as reference
  const originalItems = product.packItems || [];

  // Helper to calculate custom price dynamically
  const getCustomPrice = () => {
    if (!product.packItems) return product.price;
    let priceDiff = 0;
    customPackItems.forEach((item) => {
      const original = originalItems.find(o => o.id === item.id);
      if (original) {
        const diff = item.quantity - original.quantity;
        priceDiff += diff * getItemUnitPrice(item.name);
      }
    });
    return Math.max(1500, product.price + priceDiff); // Ensure pack doesn't become too cheap
  };

  const currentPrice = getCustomPrice();
  const isCustomized = customPackItems.some((item, idx) => {
    const orig = originalItems[idx];
    return orig ? item.quantity !== orig.quantity : false;
  });

  // Construct customized product object to pass down
  const getCustomizedProduct = (): Product => {
    return {
      ...product,
      price: currentPrice,
      packItems: customPackItems,
      name: isCustomized ? `${product.name} (معدّل حسب اختيارك 🛠️)` : product.name
    };
  };

  const standardOriginalPrice = originalItems.reduce((sum, item) => sum + (item.quantity * getItemUnitPrice(item.name)), 0);
  const initialDiscount = standardOriginalPrice > product.price ? Math.round(((standardOriginalPrice - product.price) / standardOriginalPrice) * 100) : 0;

  const totalItemsCount = customPackItems.reduce((acc, curr) => acc + curr.quantity, 0);

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-DZ') + ' د.ج';
  };

  // Quantity Handlers
  const handleIncrement = (itemId: string) => {
    setCustomPackItems(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, quantity: item.quantity + 1 };
      }
      return item;
    }));
  };

  const handleDecrement = (itemId: string) => {
    setCustomPackItems(prev => prev.map(item => {
      if (item.id === itemId && item.quantity > 0) {
        return { ...item, quantity: item.quantity - 1 };
      }
      return item;
    }));
  };

  // Reusable Component Blocks
  const imageCard = (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-4 right-4 bg-amber-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-xs">
        باك مدرسي شامل 📦
      </div>
      
      <div className="h-72 sm:h-80 w-full flex items-center justify-center p-2">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain rounded-2xl hover:scale-[1.03] transition-transform duration-500 mix-blend-multiply"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Mini Pack visual benefits */}
      <div className="w-full mt-4 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center justify-around text-center gap-1">
        <div>
          <span className="block text-xs font-black text-slate-800">تعديل مرن 🛠️</span>
          <span className="text-[10px] text-slate-400 font-semibold">تخصيص كامل للأدوات</span>
        </div>
        <div className="border-l border-slate-200 h-8"></div>
        <div>
          <span className="block text-xs font-black text-slate-800">أدوات ممتازة</span>
          <span className="text-[10px] text-slate-400 font-semibold">ماركات أصلية</span>
        </div>
        <div className="border-l border-slate-200 h-8"></div>
        <div>
          <span className="block text-xs font-black text-slate-800">توصيل للدار</span>
          <span className="text-[10px] text-slate-400 font-semibold">الدفع عند الباب</span>
        </div>
      </div>
    </div>
  );

  const detailsCard = (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
      
      {/* Title & Description */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
          {product.name}
        </h1>
        {isCustomized && (
          <span className="inline-block bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-lg border border-emerald-100 mt-2">
            🛠️ قمت بتخصيص هذا الباك (تم تعديل الأدوات)
          </span>
        )}
        <p className="text-slate-500 text-sm mt-3 leading-relaxed font-semibold">
          {product.description || "حقيبة متكاملة تحتوي على جميع المستلزمات والأدوات المدرسية الضرورية والمختارة بعناية لتناسب الاحتياجات المدرسية لطلبتنا الأعزاء بجودة ممتازة وسعر مميز."}
        </p>
      </div>

      {/* Price block */}
      <div className="bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-transparent p-5 rounded-2xl border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 font-bold block mb-1">سعر الباك النهائي:</span>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-black text-emerald-600">{formatPrice(currentPrice)}</span>
            {!isCustomized && standardOriginalPrice > product.price && (
              <span className="text-sm font-bold text-slate-400 line-through">
                {formatPrice(standardOriginalPrice)}
              </span>
            )}
          </div>
        </div>
        {!isCustomized && initialDiscount > 0 && (
          <div className="bg-rose-500/10 text-rose-650 text-rose-600 font-black text-xs py-1.5 px-3 rounded-lg border border-rose-500/20 self-start sm:self-center">
            وفرت {initialDiscount}% من قيمة الأدوات! 🔥
          </div>
        )}
      </div>

      {/* Quick info buttons */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={() => onDirectPurchase(getCustomizedProduct())}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all transform hover:scale-[1.01] cursor-pointer text-sm"
        >
          <ShoppingCart className="h-5 w-5 text-emerald-100" />
          <span>اطلب الباك الآن فوراً (دفع عند الاستلام) ⚡</span>
        </button>
      </div>

      {/* Wishlist */}
      <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => onAddToWishlist(product)}
          className={`flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
            isWishlisted ? 'text-rose-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-600' : ''}`} />
          <span>{isWishlisted ? 'في المفضلة' : 'أضف للمفضلة'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 text-emerald-800 text-xs font-black p-4 rounded-xl border border-emerald-200 text-center"
        >
          🎉 تم إضافة الباك إلى سلتك بنجاح! يمكنك مواصلة التصفح أو إتمام الطلب بالضغط على السلة في الأعلى.
        </motion.div>
      )}

    </div>
  );

  const itemsListCard = (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <span className="text-[11px] text-amber-800 font-black bg-amber-100 px-3 py-1 rounded-full border border-amber-200/50">
          إجمالي الأدوات: {totalItemsCount} قطعة
        </span>
      </div>

      {customPackItems.length > 0 ? (
        <div className="space-y-3">
          {customPackItems.map((item: PackItem, index: number) => {
            const original = originalItems[index];
            const originalQty = original ? original.quantity : 0;
            const isExcluded = item.quantity === 0;
            const isAdded = item.quantity > originalQty;
            const isReduced = item.quantity < originalQty && item.quantity > 0;

            return (
              <div 
                key={item.id || index}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                  isExcluded 
                    ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                    : isAdded 
                      ? 'bg-emerald-50/20 border-emerald-200/50' 
                      : isReduced 
                        ? 'bg-amber-50/10 border-amber-200/50' 
                        : 'bg-slate-50/40 border-slate-100 hover:bg-slate-100/30'
                }`}
              >
                <div className="flex items-start gap-3.5 text-right">
                  <div className={`h-10 w-10 font-black rounded-xl flex items-center justify-center shrink-0 ${
                    isExcluded 
                      ? 'bg-slate-200 text-slate-400' 
                      : 'bg-amber-100 text-amber-900'
                  }`}>
                    {item.quantity}x
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">{item.name}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">
                        السعر المقدر: {getItemUnitPrice(item.name)} د.ج للقطعة
                      </span>
                      {isExcluded && (
                        <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          تم استبعاده ❌
                        </span>
                      )}
                      {isAdded && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          إضافي (+{item.quantity - originalQty}) ➕
                        </span>
                      )}
                      {isReduced && (
                        <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                          تم التقليل (الأصلي: {originalQty}) ⚙️
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Incrementor/Decrementor */}
                <div className="flex items-center justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDecrement(item.id)}
                    disabled={item.quantity === 0}
                    className="h-8 w-8 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 disabled:opacity-40 disabled:hover:bg-white disabled:hover:border-slate-200 disabled:hover:text-slate-600 rounded-full flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  
                  <span className="text-sm font-black text-slate-800 w-6 text-center">
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleIncrement(item.id)}
                    className="h-8 w-8 bg-slate-900 hover:bg-slate-800 border border-slate-900 text-white rounded-full flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-8 bg-slate-50 rounded-2xl text-slate-400 font-bold text-xs">
          لا تتوفر حالياً تفاصيل دقيقة للأدوات داخل هذا الباك.
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans" dir="rtl">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-bold text-sm bg-slate-100 hover:bg-slate-200 transition-all px-3.5 py-2 rounded-xl cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة للمتجر الرئيسي</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Dual Layout System for perfect responsive view */}
        
        {/* Mobile View (Linear sequence optimized for conversion) */}
        <div className="block lg:hidden space-y-8">
          {imageCard}
          {detailsCard}
          {itemsListCard}
        </div>

        {/* Desktop View (Perfect balanced two column layout) */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-start">
          
          {/* Right Column: Image (5 cols) */}
          <div className="col-span-5 space-y-8">
            {imageCard}
          </div>

          {/* Left Column: Details and customized tabs (7 cols) */}
          <div className="col-span-7 space-y-8">
            {detailsCard}
            {itemsListCard}
          </div>

        </div>

      </div>
    </div>
  );
}
