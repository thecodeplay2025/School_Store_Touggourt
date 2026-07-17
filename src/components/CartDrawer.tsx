import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, Plus, Minus, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import { CartItem } from '../types';
import { getCompatibleImageUrl } from '../utils/imageHelper';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: () => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClearCart
}: CartDrawerProps) {
  
  const [showConfirmClear, setShowConfirmClear] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setShowConfirmClear(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-DZ') + ' د.ج';
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const freeShippingThreshold = 6000;
  const progressPercent = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const leftForFreeShipping = freeShippingThreshold - subtotal;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50"
          ></motion.div>

          {/* Cart Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-slate-100"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-2">
                <div className="bg-blue-50 text-brand-blue p-2 rounded-xl">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">سلة المشتريات</h3>
                  <p className="text-xs text-slate-400 font-semibold">{cart.length} منتجات مضافة</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {cart.length > 0 && (
                  showConfirmClear ? (
                    <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-100/50 p-1 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                      <span className="text-[10px] text-rose-700 font-extrabold px-1">حذف الكل؟</span>
                      <button
                        onClick={() => {
                          onClearCart();
                          setShowConfirmClear(false);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black px-2 py-1 rounded-lg transition-all"
                        id="confirm-clear-cart-button"
                      >
                        نعم
                      </button>
                      <button
                        onClick={() => setShowConfirmClear(false)}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                        id="cancel-clear-cart-button"
                      >
                        لا
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirmClear(true)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="إفراغ السلة بالكامل"
                      id="clear-cart-trigger"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                  title="إغلاق السلة"
                  id="close-cart-button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Cart Items Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              


              {cart.length === 0 ? (
                /* Empty Cart State */
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="bg-slate-50 text-slate-300 p-8 rounded-full mb-4">
                    <ShoppingBag className="h-16 w-16" />
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-900">سلتك فارغة تماماً</h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed font-semibold">
                    يبدو أنك لم تختر أي مستلزمات بعد. تصفح تشكيلتنا المميزة من الحقائب والأدوات لبدء رحلتك الدراسية!
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 bg-brand-blue hover:bg-blue-700 text-white font-bold text-sm py-3 px-6 rounded-xl transition-all shadow-sm"
                    id="cart-continue-shopping-button"
                  >
                    ابدأ التسوق الآن
                  </button>
                </div>
              ) : (
                /* Cart Items List */
                <div className="space-y-3">
                  {cart.map((item) => (
                    <motion.div
                      key={item.product.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-4 bg-white border border-slate-100 p-3.5 rounded-2xl hover:border-slate-200 shadow-2xs transition-all relative group"
                    >
                      {/* Product Thumbnail */}
                      <div className="h-16 w-16 bg-slate-50 rounded-xl p-1.5 flex items-center justify-center shrink-0">
                        <img
                          src={getCompatibleImageUrl(item.product.image)}
                          alt={item.product.name}
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Product details */}
                      <div className="flex-1 text-right min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate hover:text-brand-blue transition-colors">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] font-bold text-brand-blue mt-1">
                          {formatPrice(item.product.price)}
                        </p>

                        {item.product.isPack && item.product.packItems && (
                          <div className="mt-1.5 bg-slate-50 border border-slate-100/50 rounded-lg p-1.5 space-y-1 text-[10px] text-slate-600 font-medium" dir="rtl">
                            <div className="font-bold text-slate-700 border-b border-slate-200/50 pb-0.5 mb-1">📋 محتويات الباك:</div>
                            {item.product.packItems.map((pi, pIdx) => (
                              <div key={pi.id || pIdx} className="flex items-center justify-between gap-2">
                                <span className="truncate">• {pi.name}</span>
                                <span className="font-extrabold text-slate-500 shrink-0">({pi.quantity}x)</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Quantity Counter */}
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 text-slate-500 hover:text-brand-blue bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                            id={`minus-qty-${item.product.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold text-slate-800 w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 text-slate-500 hover:text-brand-blue bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                            id={`plus-qty-${item.product.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Trash action button */}
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors self-center shrink-0"
                        title="إزالة من السلة"
                        id={`remove-item-${item.product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky bottom checkout info */}
            {cart.length > 0 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-t-[28px] space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-500">المجموع الفرعي:</span>
                    <span className="font-extrabold text-slate-800">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400">التوصيل:</span>
                    <span className="font-bold text-emerald-600">مجاني 🎁</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 text-base">الإجمالي:</span>
                    <span className="font-black text-brand-blue text-lg">{formatPrice(subtotal)}</span>
                  </div>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-base py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  id="checkout-trigger-button"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>تأكيد المشتريات وإتمام الطلب</span>
                </button>

                <p className="text-[10px] text-slate-400 text-center font-semibold leading-relaxed">
                  🔒 الدفع عند الاستلام (COD) متوفر لجميع بلديات ولاية توقرت. الدفع نقداً عند معاينة واستلام سلعك.
                </p>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
