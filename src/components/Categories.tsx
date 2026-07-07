import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, ShoppingBag, PenTool, Palette, Cpu, Sparkles } from 'lucide-react';
import { Category, Product } from '../types';
import { CATEGORIES } from '../data';

interface CategoriesProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  products: Product[];
}

// Map strings to Lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  ShoppingBag: ShoppingBag,
  BookOpen: BookOpen,
  PenTool: PenTool,
  Palette: Palette,
  Cpu: Cpu,
};

export default function Categories({ selectedCategory, onSelectCategory, products }: CategoriesProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" id="categories-section" dir="rtl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📂 تصفح حسب الفئة</span>
          </h3>
        </div>
        <button 
          type="button"
          onClick={() => onSelectCategory('all')}
          className="text-brand-blue hover:text-blue-700 font-extrabold text-xs flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>عرض جميع المعروضات</span>
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        </button>
      </div>

      {/* Horizontal Scrollable Row of Categories */}
      <div className="flex overflow-x-auto gap-3.5 pb-4 pt-1 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        
        {/* "All" Category Capsule */}
        <motion.div
          whileHover={{ y: -3 }}
          onClick={() => onSelectCategory('all')}
          className={`flex-none snap-start rounded-2xl border p-3.5 flex items-center gap-3 transition-all cursor-pointer min-w-[170px] sm:min-w-[190px] ${
            selectedCategory === 'all'
              ? 'border-brand-blue bg-blue-50/50 ring-2 ring-brand-blue/15 shadow-sm'
              : 'border-slate-200/60 bg-white hover:shadow-md hover:border-slate-300'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${selectedCategory === 'all' ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700'}`}>
            <Sparkles className="h-5 w-5 shrink-0" />
          </div>
          <div className="text-right">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">كل المعروضات</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{products.length} منتج متوفر</p>
          </div>
        </motion.div>

        {/* Dynamic Categories Capsules */}
        {CATEGORIES.map((category) => {
          const IconComponent = iconMap[category.iconName] || ShoppingBag;
          const isSelected = selectedCategory === category.id;
          const dynamicCount = products.filter(p => p.category === category.id).length;

          return (
            <motion.div
              key={category.id}
              whileHover={{ y: -3 }}
              onClick={() => onSelectCategory(category.id)}
              className={`flex-none snap-start rounded-2xl border p-3.5 flex items-center gap-3 transition-all cursor-pointer min-w-[190px] sm:min-w-[210px] ${
                isSelected 
                  ? 'border-brand-blue bg-blue-50/50 ring-2 ring-brand-blue/15 shadow-sm' 
                  : 'border-slate-200/60 bg-white hover:shadow-md hover:border-slate-300'
              }`}
            >
              {/* Icon Container */}
              <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-700'}`}>
                <IconComponent className="h-5 w-5 shrink-0" />
              </div>

              {/* Metadata */}
              <div className="text-right min-w-0 flex-1">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                  {category.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {dynamicCount} منتج متوفر
                </p>
              </div>
            </motion.div>
          );
        })}

      </div>
    </section>
  );
}
