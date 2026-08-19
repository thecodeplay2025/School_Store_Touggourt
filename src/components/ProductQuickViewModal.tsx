import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Product } from '../types';
import { getCompatibleImageUrl } from '../utils/imageHelper';

interface ProductQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onDirectPurchase: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductQuickViewModal({
  isOpen,
  onClose,
  product,
  onDirectPurchase
}: ProductQuickViewModalProps) {
  // Cache active product so exit animation runs smoothly even if parent unsets product state
  const activeProductRef = useRef<Product | null>(product);
  if (product) {
    activeProductRef.current = product;
  }
  const currentProduct = product || activeProductRef.current;

  // Detect mobile viewport for ultra-optimized responsive animation
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 640;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format price helper
  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-DZ') + ' د.ج';
  };

  const imageBg = 'bg-white border-b border-slate-100';

  return (
    <AnimatePresence>
      {isOpen && currentProduct && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3.5 sm:p-4">
          {/* Backdrop with lightweight blur and smooth fast fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Content Box with smooth, crisp spring-free ease transition */}
          <motion.div
            initial={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, y: 8, scale: 0.98 }}
            transition={
              isMobile
                ? { duration: 0.2, ease: "easeOut" }
                : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }
            }
            className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative z-10 text-right flex flex-col transform-gpu will-change-[transform,opacity]"
            dir="rtl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white text-slate-700 hover:text-slate-950 p-2 rounded-full shadow-md hover:shadow-lg transition-all z-25 border border-slate-100/50 active:scale-95 cursor-pointer"
              title="إغلاق"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Product Image Container */}
            <div className={`w-full aspect-square ${imageBg} p-6 flex items-center justify-center relative`}>
              {currentProduct.isPack && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-xs py-1 px-3.5 rounded-full shadow-md z-10 flex items-center gap-1">
                  <span>✨ باك متكامل</span>
                </div>
              )}

              <img
                src={getCompatibleImageUrl(currentProduct.image)}
                alt={currentProduct.name}
                className="max-h-[90%] max-w-[90%] object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />

              {!currentProduct.inStock && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-t-[2rem]">
                  <span className="bg-red-500 text-white font-black text-sm py-2 px-6 rounded-xl shadow-lg">
                    نفذت الكمية 😔
                  </span>
                </div>
              )}
            </div>

            {/* Product details and order button with gentle content entrance */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.05 }}
              className="p-6 sm:p-8 flex flex-col space-y-4"
            >
              <div className="space-y-2">
                {/* Product Name */}
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {currentProduct.name}
                </h3>
              </div>

              {/* Price & Actions */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-400 font-bold">سعر المنتج:</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">
                    {formatPrice(currentProduct.price)}
                  </span>
                </div>

                <div className="w-full">
                  {/* Order Button (زر الطلب المباشر) */}
                  <button
                    onClick={() => {
                      if (currentProduct.inStock) {
                        onDirectPurchase(currentProduct);
                        onClose();
                      }
                    }}
                    disabled={!currentProduct.inStock}
                    className={`w-full font-black text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all border border-orange-600/25 active:scale-95 cursor-pointer ${
                      currentProduct.inStock
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:shadow-xl'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border-none'
                    }`}
                  >
                    <span>طلب سريع الآن 🛍️</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
