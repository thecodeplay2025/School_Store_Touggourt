import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { getCompatibleImageUrl } from '../utils/imageHelper';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: Product[];
  onRemoveFromWishlist: (p: Product) => void;
  onAddToCart: (p: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlist,
  onRemoveFromWishlist,
  onAddToCart
}: WishlistDrawerProps) {
  
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
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

          {/* Sliding Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col justify-between border-l border-slate-100"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-rose-50 text-rose-500 p-2 rounded-xl">
                  <Heart className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">المفضلة والمحفوظات</h3>
                  <p className="text-xs text-slate-400 font-semibold">{wishlist.length} منتجات محفوظة</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                title="إغلاق"
                id="close-wishlist-button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
                  <div className="bg-rose-50/50 text-rose-300 p-8 rounded-full mb-4">
                    <Heart className="h-16 w-16" />
                  </div>
                  <h4 className="font-extrabold text-lg text-slate-900">مفضلتك فارغة</h4>
                  <p className="text-xs text-slate-500 mt-2 max-w-xs leading-relaxed font-semibold">
                    احفظ المنتجات التي تود تصفحها أو شراءها لاحقاً هنا بالضغط على رمز القلب الموجود على بطاقة كل منتج.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {wishlist.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      className="flex items-center gap-4 bg-white border border-slate-100 p-3.5 rounded-2xl hover:border-slate-200 shadow-2xs transition-all relative group"
                    >
                      {/* Product Thumbnail */}
                      <div className="h-16 w-16 bg-slate-50 rounded-xl p-1.5 flex items-center justify-center shrink-0">
                        <img
                          src={getCompatibleImageUrl(product.image)}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 text-right min-w-0">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate hover:text-brand-blue transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-[11px] font-bold text-brand-blue mt-1">
                          {formatPrice(product.price)}
                        </p>
                        
                        {/* Quick add to cart */}
                        <button
                          onClick={() => {
                            onAddToCart(product);
                            onRemoveFromWishlist(product);
                          }}
                          className="mt-2 inline-flex items-center gap-1 bg-blue-50 hover:bg-brand-blue text-brand-blue hover:text-white py-1 px-3 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          id={`wishlist-add-to-cart-${product.id}`}
                        >
                          <ShoppingCart className="h-3 w-3" />
                          <span>نقل إلى السلة</span>
                        </button>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => onRemoveFromWishlist(product)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors self-center shrink-0"
                        title="حذف من المفضلة"
                        id={`wishlist-remove-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 text-center rounded-t-[28px]">
              <button
                onClick={onClose}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all cursor-pointer"
                id="wishlist-close-panel-button"
              >
                العودة للتسوق
              </button>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
