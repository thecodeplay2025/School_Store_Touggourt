import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Truck, Phone, User, MapPin, ClipboardList, PartyPopper } from 'lucide-react';
import { CartItem, Municipality, Order } from '../types';
import { MUNICIPALITIES } from '../data';
import { getCompatibleImageUrl } from '../utils/imageHelper';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onOrderSuccess: (order: Order) => void;
  onClearCart: () => void;
  isDirect?: boolean;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cart,
  onOrderSuccess,
  onClearCart,
  isDirect = false
}: CheckoutModalProps) {
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMuni, setSelectedMuni] = useState<Municipality>(MUNICIPALITIES[0]);
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset form and success states on open
      setName('');
      setPhone('');
      setSelectedMuni(MUNICIPALITIES[0]);
      setAddress('');
      setIsSubmitting(false);
      setSuccessOrder(null);
    } else {
      document.body.style.overflow = '';
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
  
  // Dynamic shipping fee based on total & selected municipality
  const shippingFee = subtotal >= freeShippingThreshold ? 0 : selectedMuni.shippingFee;
  const total = subtotal + shippingFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('يرجى إدخال الاسم واللقب الكامل.');
      return;
    }
    if (!phone.trim() || phone.length < 9) {
      alert('يرجى إدخال رقم هاتف صحيح (مثال: 06XXXXXXXX أو 07XXXXXXXX).');
      return;
    }
    if (!address.trim()) {
      alert('يرجى إدخال عنوان الإقامة لتسهيل عملية التوصيل.');
      return;
    }

    setIsSubmitting(true);

    // Simulate database insertion & loading
    setTimeout(() => {
      const storedRef = localStorage.getItem('school_store_referral_code') || undefined;
      console.log(`%c[REFERRAL TRACE - CHECKOUT] Initiating Order Creation...`, "color: #3b82f6; font-weight: bold;");
      console.log(`[REFERRAL TRACE - CHECKOUT] Stored referral code in localStorage: "${storedRef || 'None'}"`);
      console.log(`[REFERRAL TRACE - CHECKOUT] Cookie school_store_ref value: "${document.cookie.split('; ').find(row => row.startsWith('school_store_ref='))?.split('=')[1] || 'None'}"`);
      
      const generatedOrder: Order = {
        id: 'STS-' + Math.floor(100000 + Math.random() * 900000),
        customerName: name,
        phone: phone,
        municipality: selectedMuni.name,
        address: address,
        items: [...cart],
        total: total,
        status: 'pending',
        date: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }),
        referrer: storedRef
      };

      console.log(`%c[REFERRAL TRACE - CHECKOUT] Created Order payload with referrer: "${generatedOrder.referrer || 'None'}"`, "color: #10b981; font-weight: bold;");
      console.log("[REFERRAL TRACE - PAYLOAD]", JSON.stringify(generatedOrder, null, 2));

      setIsSubmitting(false);
      setSuccessOrder(generatedOrder);
      onOrderSuccess(generatedOrder);
      onClearCart();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !successOrder && onClose()}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            
            {/* Modal Container */}
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 text-brand-blue p-2 rounded-xl">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900">
                    {successOrder ? 'تم تأكيد طلبك!' : 'معلومات الشحن والتوصيل'}
                  </h3>
                </div>
                {!successOrder && (
                  <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                    id="close-checkout-modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Success Order View */}
              {successOrder ? (
                <div className="overflow-y-auto p-6 sm:p-8 text-center flex flex-col items-center">
                  
                  {/* Animation Success icon */}
                  <motion.div 
                    initial={{ scale: 0.8, rotate: -10 }}
                    animate={{ scale: [1, 1.1, 1], rotate: 0 }}
                    className="bg-emerald-100 text-emerald-600 p-5 rounded-full mb-4 shadow-inner"
                  >
                    <PartyPopper className="h-12 w-12 animate-bounce" />
                  </motion.div>

                  <h4 className="text-2xl font-black text-slate-950">شكراً لك! تم تسجيل طلبك بنجاح 🎉</h4>
                  <p className="text-xs text-slate-500 font-semibold mt-1.5">
                    رقم الطلب الخاص بك هو: <span className="text-brand-blue font-bold">{successOrder.id}</span>
                  </p>

                  <div className="bg-emerald-50 border border-emerald-100/60 p-4 rounded-2xl w-full max-w-md my-6 text-right">
                    <h5 className="font-bold text-sm text-emerald-800 mb-2 flex items-center gap-1.5">
                      <Truck className="h-4 w-4" />
                      <span>تفاصيل شحن الطلبية بولاية توقرت:</span>
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
                      <li>• <strong>المستلم:</strong> {successOrder.customerName}</li>
                      <li>• <strong>رقم الهاتف:</strong> {successOrder.phone}</li>
                      <li>• <strong>البلدية:</strong> {successOrder.municipality}</li>
                      <li>• <strong>العنوان:</strong> {successOrder.address}</li>
                      <li>• <strong>الوقت التقديري للتسليم:</strong> <span className="text-emerald-700 font-bold">{selectedMuni.deliveryTime}</span></li>
                      <li>• <strong>طريقة الدفع:</strong> نقداً عند الاستلام (COD)</li>
                    </ul>
                  </div>

                  {/* Purchased items list */}
                  <div className="w-full max-w-md text-right border border-slate-100 rounded-2xl p-4 mb-6">
                    <h5 className="font-extrabold text-slate-900 text-sm mb-3">ملخص المشتريات:</h5>
                    <div className="max-h-32 overflow-y-auto space-y-2 mb-3 pr-1">
                      {successOrder.items.map((item) => (
                        <div key={item.product.id} className="space-y-1 py-1 border-b border-slate-50 last:border-0">
                          <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                            <span>{item.product.name} (x{item.quantity})</span>
                            <span className="font-bold text-slate-800">{formatPrice(item.product.price * item.quantity)}</span>
                          </div>
                          {item.product.isPack && item.product.packItems && (
                            <div className="text-[10px] text-slate-400 mr-4 space-y-0.5" dir="rtl">
                              {item.product.packItems.map((pi, piIdx) => (
                                <div key={pi.id || piIdx}>- {pi.name} ({pi.quantity}x)</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-950">
                      <span>الإجمالي الكلي المدفوع:</span>
                      <span className="text-brand-blue text-base font-black">{formatPrice(successOrder.total)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 font-medium mb-6">
                    📞 سيتصل بك موظف التوصيل لتأكيد موعد التسليم والمكان بدقة خلال ساعات. يرجى إبقاء هاتفك مشتغلاً.
                  </p>

                  <button
                    onClick={onClose}
                    className="bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-sm py-3 px-8 rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer"
                    id="finish-order-button"
                  >
                    العودة للمتجر الرئيسي
                  </button>

                </div>
              ) : (
                /* Interactive Form View */
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-5 sm:p-6">
                    
                    {/* Form Fields Column */}
                    <div className="md:col-span-7 space-y-4">
                      
                      {/* Name input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">الاسم واللقب الكامل للزبون *</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="مثال: محمد توقرتي"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-right"
                            id="customer-name-input"
                          />
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Phone input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">رقم الهاتف للتواصل وتأكيد الشحنة *</label>
                        <div className="relative">
                          <input
                            type="tel"
                            required
                            placeholder="مثال: 0661223344"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-left"
                            dir="ltr"
                            id="customer-phone-input"
                          />
                          <Phone className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">تأكد من كتابة الرقم بدقة لنتمكن من الاتصال بك عند وصول السائق.</p>
                      </div>

                      {/* Municipality select */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">بلدية التوصيل (داخل ولاية توقرت) *</label>
                        <div className="relative">
                          <select
                            value={selectedMuni.name}
                            onChange={(e) => {
                              const found = MUNICIPALITIES.find(m => m.name === e.target.value);
                              if (found) setSelectedMuni(found);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all appearance-none cursor-pointer text-right"
                            id="municipality-select"
                          >
                            {MUNICIPALITIES.map((muni) => (
                              <option key={muni.name} value={muni.name}>
                                {muni.name} (التوصيل: {subtotal >= freeShippingThreshold ? 'مجاني' : muni.shippingFee + ' د.ج'})
                              </option>
                            ))}
                          </select>
                          <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Precise Address */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">العنوان الكامل ومكان الإقامة الدقيق *</label>
                        <div className="relative">
                          <textarea
                            required
                            placeholder="اسم الحي، رقم الشارع، بالقرب من (مسجد أو مدرسة شهيرة لتسهيل التوصيل)..."
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-11 pl-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-right resize-none"
                            id="customer-address-input"
                          />
                          <MapPin className="absolute right-4 top-4 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                    </div>

                    {/* Order summary Panel (Right column) */}
                    <div className="md:col-span-5 bg-slate-50/70 border border-slate-200/40 rounded-2xl p-4.5 flex flex-col justify-between h-fit space-y-4">
                      
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 border-b border-slate-200/50 pb-2.5 mb-3">ملخص طلبك</h4>
                        <div className="max-h-40 overflow-y-auto space-y-2.5 pr-1.5">
                          {cart.map((item) => (
                            <div key={item.product.id} className="flex gap-2.5 items-start">
                              <div className="h-10 w-10 bg-white border border-slate-100 rounded-lg p-1 shrink-0 flex items-center justify-center">
                                <img src={getCompatibleImageUrl(item.product.image)} alt="" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
                              </div>
                              <div className="text-right min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                                  {item.quantity} × {formatPrice(item.product.price)}
                                </p>
                                {item.product.isPack && item.product.packItems && (
                                  <div className="mt-1 bg-white border border-slate-100 rounded-lg p-1.5 space-y-0.5 text-[9px] text-slate-500 font-medium max-h-[80px] overflow-y-auto" dir="rtl">
                                    {item.product.packItems.map((pi, pIdx) => (
                                      <div key={pi.id || pIdx} className="flex items-center justify-between gap-1">
                                        <span className="truncate">• {pi.name}</span>
                                        <span className="font-bold text-slate-400 shrink-0">({pi.quantity}x)</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-slate-200/50 text-xs font-bold text-slate-600">
                        <div className="flex items-center justify-between">
                          <span>المجموع الفرعي:</span>
                          <span className="text-slate-900">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>قيمة التوصيل:</span>
                          <span className={shippingFee === 0 ? 'text-emerald-600' : 'text-slate-900'}>
                            {shippingFee === 0 ? 'مجاني' : formatPrice(shippingFee)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-extrabold text-slate-950 pt-2 border-t border-dashed border-slate-200">
                          <span>الإجمالي المستحق:</span>
                          <span className="text-brand-blue text-base">{formatPrice(total)}</span>
                        </div>
                      </div>

                      {/* Payment Method Badge */}
                      <div className="bg-blue-50/70 border border-blue-100 p-3 rounded-xl">
                        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-blue">
                          <Check className="h-4 w-4 bg-brand-blue text-white rounded-full p-0.5" />
                          <span>الدفع نقداً عند استلام الطلبية (COD)</span>
                        </span>
                        <p className="text-[10px] text-slate-500 font-semibold mt-1">الدفع الآمن والمفضل في الجزائر: تفقد أغراضك بكل أريحية ثم ادفع للسائق عند الباب.</p>
                      </div>

                    </div>

                  </div>

                  {/* Form Footer Action */}
                  <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-3 text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition-all"
                      id="cancel-checkout-button"
                    >
                      {isDirect ? 'العودة للمتجر' : 'تعديل السلة'}
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-brand-blue hover:bg-blue-700 disabled:bg-slate-300 text-white font-extrabold text-sm py-3 px-8 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                      id="submit-order-button"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>جاري تسجيل طلبك...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          <span>تأكيد وشراء الآن ({formatPrice(total)})</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}

            </motion.div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
