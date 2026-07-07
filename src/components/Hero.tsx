import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onSelectCategory: (category: string) => void;
}

export default function Hero({ onExploreClick, onSelectCategory }: HeroProps) {
  return (
    <div className="w-full relative overflow-hidden bg-[#2d3d4c] select-none h-[130px] mb-8" dir="rtl">
      
      {/* Subtle decorative grid/dot overlay for premium depth */}
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 md:px-12 lg:px-16 flex items-center justify-between gap-4">
        
        {/* Right side (RTL start): Title and promo tag */}
        <div className="flex flex-col justify-center space-y-1.5 z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-1 bg-white/10 border border-white/20 text-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black w-fit">
            <Sparkles className="h-3 w-3 text-brand-yellow shrink-0 animate-pulse" />
            <span>عروض توقرت المعتمدة 🇩🇿</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
            أبطال الدراسة
          </h2>
          
          <p className="text-[10px] sm:text-xs text-slate-300 font-extrabold">
            أفضل عروض الأدوات المدرسية والآلات الحاسبة بتخفيضات تصل لـ 30% ✨
          </p>
        </div>

        {/* Left side (RTL end): Elegant compact 3D product visual composition */}
        <div className="relative flex items-center justify-end h-full w-1/2 max-w-[280px] sm:max-w-[400px] select-none z-10">
          
          {/* Tilted Polaroid 1: Scientific Calculator */}
          <motion.div 
            initial={{ opacity: 0, x: 20, rotate: -10 }}
            animate={{ opacity: 1, x: 0, rotate: -6 }}
            className="absolute left-[75px] sm:left-[110px] bg-white p-1 pb-2 rounded-lg shadow-lg border border-slate-100/50 w-18 sm:w-22 shrink-0 transition-transform hover:scale-105"
          >
            <div className="relative aspect-square rounded overflow-hidden bg-slate-50 border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=250" 
                alt="Casio Calculator"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0.5 right-0.5 bg-black/90 text-white text-[7px] font-black py-0.5 px-1 rounded shadow-xs">
                <span className="text-brand-yellow">DA 1,950</span>
              </div>
            </div>
            <div className="mt-1 text-center">
              <p className="text-[7px] font-black text-slate-800 truncate">حاسبة كاسيو أصلية</p>
            </div>
          </motion.div>

          {/* Tilted Polaroid 2: Medical Bag */}
          <motion.div 
            initial={{ opacity: 0, x: -10, rotate: 12 }}
            animate={{ opacity: 1, x: 0, rotate: 8 }}
            className="absolute left-[10px] sm:left-[20px] bg-white p-1 pb-2 rounded-lg shadow-lg border border-slate-100/50 w-18 sm:w-22 shrink-0 transition-transform hover:scale-105 z-20"
          >
            <div className="relative aspect-square rounded overflow-hidden bg-slate-50 border border-slate-100">
              <img 
                src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=250" 
                alt="Medical Bag"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0.5 right-0.5 bg-black/90 text-white text-[7px] font-black py-0.5 px-1 rounded shadow-xs">
                <span className="text-rose-400">DA 4,350</span>
              </div>
            </div>
            <div className="mt-1 text-center">
              <p className="text-[7px] font-black text-slate-800 truncate">حقيبة طبية مريحة</p>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}

