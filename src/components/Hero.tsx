import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { SiteSettings } from '../types';
import { getCompatibleImageUrl } from '../utils/imageHelper';

interface HeroProps {
  onExploreClick: () => void;
  onSelectCategory: (category: string) => void;
  siteSettings?: SiteSettings;
}

export default function Hero({ onExploreClick, onSelectCategory, siteSettings }: HeroProps) {
  const badge = siteSettings?.heroBadge ?? 'عروض توقرت المعتمدة 🇩🇿';
  const title = siteSettings?.heroTitle ?? 'أبطال الدراسة';
  const subtitle = siteSettings?.heroSubtitle ?? 'أفضل عروض الأدوات المدرسية والآلات الحاسبة بتخفيضات تصل لـ 30% ✨';
  const bgColor = siteSettings?.heroBgColor || '#2d3d4c';
  
  // Custom images from admin dashboard
  const showImages = siteSettings?.heroShowImages !== false;
  const card1Image = siteSettings?.heroCard1Image;
  const card1Title = siteSettings?.heroCard1Title || 'عرض مميز';
  const card1Price = siteSettings?.heroCard1Price || '';

  const card2Image = siteSettings?.heroCard2Image;
  const card2Title = siteSettings?.heroCard2Title || 'عرض حصري';
  const card2Price = siteSettings?.heroCard2Price || '';

  const fullBannerImage = siteSettings?.heroBannerImage;

  const hasAnyImages = showImages && (Boolean(card1Image) || Boolean(card2Image) || Boolean(fullBannerImage));

  return (
    <div 
      className="w-full relative overflow-hidden select-none min-h-[130px] mb-8 transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
      dir="rtl"
    >
      {/* Subtle decorative grid/dot overlay for premium depth */}
      <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto h-full px-4 sm:px-8 md:px-12 lg:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Right side (RTL start): Title and promo tag */}
        <div className={`flex flex-col justify-center space-y-1.5 z-10 ${hasAnyImages ? 'w-full sm:w-1/2' : 'w-full text-center sm:text-right'}`}>
          {/* Badge */}
          {badge && (
            <div className={`inline-flex items-center gap-1 bg-white/10 border border-white/20 text-white px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black w-fit ${!hasAnyImages ? 'mx-auto sm:mx-0' : ''}`}>
              <Sparkles className="h-3 w-3 text-brand-yellow shrink-0 animate-pulse" />
              <span>{badge}</span>
            </div>
          )}
          
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
            {title}
          </h2>
          
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-slate-300 font-extrabold">
              {subtitle}
            </p>
          )}
        </div>

        {/* Left side (RTL end): Dynamic custom cropped visuals added from Admin Dashboard */}
        {hasAnyImages && (
          <div className="relative flex items-center justify-center sm:justify-end h-full w-full sm:w-1/2 max-w-[340px] sm:max-w-[400px] select-none z-10 min-h-[110px]">
            {/* If a full cropped banner image is provided */}
            {fullBannerImage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden shadow-xl border border-white/15 max-h-[110px] w-full flex items-center justify-center bg-black/20"
              >
                <img 
                  src={getCompatibleImageUrl(fullBannerImage)}
                  alt="Hero Banner"
                  className="w-full h-full object-contain max-h-[110px]"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ) : (
              /* If individual cropped promo cards are configured */
              <div className="relative flex items-center justify-end h-full w-full">
                {card1Image && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20, rotate: -10 }}
                    animate={{ opacity: 1, x: 0, rotate: card2Image ? -6 : 0 }}
                    className={`bg-white p-1 pb-2 rounded-lg shadow-lg border border-slate-100/50 w-20 sm:w-24 shrink-0 transition-transform hover:scale-105 ${
                      card2Image ? 'absolute left-[75px] sm:left-[110px]' : 'relative'
                    }`}
                  >
                    <div className="relative aspect-square rounded overflow-hidden bg-slate-50 border border-slate-100">
                      <img 
                        src={getCompatibleImageUrl(card1Image)} 
                        alt={card1Title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {card1Price && (
                        <div className="absolute bottom-0.5 right-0.5 bg-black/90 text-white text-[7px] font-black py-0.5 px-1 rounded shadow-xs">
                          <span className="text-brand-yellow">{card1Price}</span>
                        </div>
                      )}
                    </div>
                    {card1Title && (
                      <div className="mt-1 text-center">
                        <p className="text-[7px] font-black text-slate-800 truncate">{card1Title}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {card2Image && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10, rotate: 12 }}
                    animate={{ opacity: 1, x: 0, rotate: 8 }}
                    className="absolute left-[10px] sm:left-[20px] bg-white p-1 pb-2 rounded-lg shadow-lg border border-slate-100/50 w-20 sm:w-24 shrink-0 transition-transform hover:scale-105 z-20"
                  >
                    <div className="relative aspect-square rounded overflow-hidden bg-slate-50 border border-slate-100">
                      <img 
                        src={getCompatibleImageUrl(card2Image)} 
                        alt={card2Title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {card2Price && (
                        <div className="absolute bottom-0.5 right-0.5 bg-black/90 text-white text-[7px] font-black py-0.5 px-1 rounded shadow-xs">
                          <span className="text-rose-400">{card2Price}</span>
                        </div>
                      )}
                    </div>
                    {card2Title && (
                      <div className="mt-1 text-center">
                        <p className="text-[7px] font-black text-slate-800 truncate">{card2Title}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
