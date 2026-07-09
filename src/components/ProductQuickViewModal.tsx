import React from 'react';
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
  if (!product) return null;

  // Format price helper
  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-DZ') + ' د.ج';
  };

  // Assign background gradients based on category
  const bgGradients: Record<string, string> = {
    bags: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    notebooks: 'bg-gradient-to-br from-emerald-50 to-teal-100',
    writing: 'bg-gradient-to-br from-amber-50 to-orange-100',
    'geometry-art': 'bg-gradient-to-br from-rose-50 to-pink-100',
    electronics: 'bg-gradient-to-br from-violet-50 to-purple-100'
  };

  const imageBg = product.isPack ? 'bg-gradient-to-br from-yellow-50 to-amber-100/50' : (bgGradients[product.category] || 'bg-slate-100');

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
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Modal Content Box */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: "spring", duration: 0.45 }}
            className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden relative z-10 text-right flex flex-col"
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
              {product.isPack && (
                <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-xs py-1 px-3.5 rounded-full shadow-md z-10 flex items-center gap-1">
                  <span>✨ باك متكامل</span>
                </div>
              )}

              <img
                src={getCompatibleImageUrl(product.image)}
                alt={product.name}
                className="max-h-[90%] max-w-[90%] object-contain rounded-2xl drop-shadow-md mix-blend-multiply"
                referrerPolicy="no-referrer"
              />

              {!product.inStock && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center rounded-t-[2rem]">
                  <span className="bg-red-500 text-white font-black text-sm py-2 px-6 rounded-xl shadow-lg">
                    نفذت الكمية 😔
                  </span>
                </div>
              )}
            </div>

            {/* Product details and order button */}
            <div className="p-6 sm:p-8 flex flex-col space-y-4">
              <div className="space-y-2">
                {/* Product Name */}
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {product.name}
                </h3>
              </div>

              {/* Price & Actions */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-slate-400 font-bold">سعر المنتج:</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-600">
                    {formatPrice(product.price)}
                  </span>
                </div>

                <div className="w-full">
                  {/* Order Button (زر الطلب المباشر) */}
                  <button
                    onClick={() => {
                      if (product.inStock) {
                        onDirectPurchase(product);
                        onClose();
                      }
                    }}
                    disabled={!product.inStock}
                    className={`w-full font-black text-xs sm:text-sm py-3.5 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all border border-orange-600/25 active:scale-95 cursor-pointer ${
                      product.inStock
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:shadow-xl'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed border-none'
                    }`}
                  >
                    <span>طلب سريع الآن 🛍️</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
