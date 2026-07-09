import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShoppingCart, Star, Eye, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { getCompatibleImageUrl } from '../utils/imageHelper';

interface ProductCardProps {
  key?: string;
  product: Product;
  onAddToCart: (p: Product) => void;
  onAddToWishlist: (p: Product) => void;
  isWishlisted: boolean;
  onClick?: (p: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  isWishlisted,
  onClick
}: ProductCardProps) {
  
  // Format price helper
  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-DZ') + ' د.ج';
  };

  // Assign background gradients based on category to match Trendhub's colorful visual style
  const bgGradients: Record<string, string> = {
    bags: 'bg-gradient-to-br from-blue-50 to-indigo-100',
    notebooks: 'bg-gradient-to-br from-emerald-50 to-teal-100',
    writing: 'bg-gradient-to-br from-amber-50 to-orange-100',
    'geometry-art': 'bg-gradient-to-br from-rose-50 to-pink-100',
    electronics: 'bg-gradient-to-br from-violet-50 to-purple-100'
  };

  const imageBg = product.isPack ? 'bg-gradient-to-br from-yellow-50 to-amber-100/50' : (bgGradients[product.category] || 'bg-slate-100');

  return (
    <motion.div
      whileHover={{ y: -6 }}
      onClick={() => onClick && onClick(product)}
      className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg overflow-hidden flex flex-col justify-between h-full group transition-all duration-300 cursor-pointer"
    >
      
      {/* Top half: Product Image Container */}
      <div className={`relative aspect-square ${imageBg} overflow-hidden p-2 sm:p-4 flex items-center justify-center transition-all`}>
        {/* Pack Badge */}
        {product.isPack && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-[9px] sm:text-[10px] py-0.5 px-2 sm:py-1 sm:px-3 rounded-full shadow-sm z-10" dir="rtl">
            ✨ باك متكامل
          </div>
        )}

        {/* Main Image */}
        <img
          src={getCompatibleImageUrl(product.image)}
          alt={product.name}
          className="max-h-[90%] max-w-[90%] object-contain rounded-xl group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
        />

        {/* Quick Stock Indicator */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-red-500 text-white font-extrabold text-[10px] sm:text-xs py-1 px-2.5 sm:px-4 rounded-lg sm:rounded-xl">
              نفذت الكمية 😔
            </span>
          </div>
        )}
      </div>

      {/* Bottom half: Title and Price */}
      <div className="p-3 sm:p-4 md:p-5 flex flex-col justify-between flex-1">
        {/* Title */}
        <div className="text-right mb-2">
          <h4 className="text-xs sm:text-sm md:text-base font-extrabold text-slate-800 line-clamp-2 hover:text-emerald-600 transition-colors leading-tight min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-end">
            {product.name}
          </h4>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="mt-auto pt-2 border-t border-slate-100 flex flex-col gap-2" dir="rtl">
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400">السعر:</span>
            <span className="text-sm sm:text-base md:text-lg font-black text-emerald-600 whitespace-nowrap">
              {formatPrice(product.price)}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (product.inStock) {
                onAddToCart(product);
              }
            }}
            disabled={!product.inStock}
            className={`w-full font-extrabold text-[10px] sm:text-xs py-2 px-2.5 sm:px-3 rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-3xs cursor-pointer ${
              product.inStock
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
            <span>{product.inStock ? 'إضافة إلى السلة' : 'نفذت الكمية'}</span>
          </button>
        </div>
      </div>

    </motion.div>
  );
}
