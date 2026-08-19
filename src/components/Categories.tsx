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

// Concise short labels for clean minimalism
const shortCategoryNames: Record<string, string> = {
  all: 'الكل',
  bags: 'حقائب',
  notebooks: 'كراريس',
  writing: 'أقلام',
  'geometry-art': 'رسم وهندسة',
  electronics: 'حاسبات',
};

export default function Categories({ selectedCategory, onSelectCategory, products }: CategoriesProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2.5 pb-1 sm:pt-3 sm:pb-1.5" id="categories-section" dir="rtl">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <span>الفئات</span>
          </h3>
        </div>
        <button 
          type="button"
          onClick={() => onSelectCategory('all')}
          className="text-brand-blue hover:text-blue-700 font-extrabold text-xs flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>عرض الكل</span>
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        </button>
      </div>

      {/* Horizontal Scrollable Row of Concise Category Pills */}
      <div className="flex items-center overflow-x-auto gap-2 sm:gap-2.5 pb-1 pt-0.5 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
        
        {/* "All" Category Pill */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => onSelectCategory('all')}
          className={`flex-none snap-start rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 transition-all cursor-pointer text-xs font-bold whitespace-nowrap border ${
            selectedCategory === 'all'
              ? 'bg-brand-blue text-white border-brand-blue shadow-xs ring-2 ring-brand-blue/20'
              : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
          }`}
        >
          <Sparkles className={`h-4 w-4 shrink-0 ${selectedCategory === 'all' ? 'text-brand-yellow' : 'text-slate-400'}`} />
          <span>الكل</span>
        </motion.button>

        {/* Dynamic Category Pills with Concise Words */}
        {CATEGORIES.map((category) => {
          const IconComponent = iconMap[category.iconName] || ShoppingBag;
          const isSelected = selectedCategory === category.id;
          const shortName = shortCategoryNames[category.id] || category.name;

          return (
            <motion.button
              key={category.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectCategory(category.id)}
              className={`flex-none snap-start rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 transition-all cursor-pointer text-xs font-bold whitespace-nowrap border ${
                isSelected
                  ? 'bg-brand-blue text-white border-brand-blue shadow-xs ring-2 ring-brand-blue/20'
                  : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <IconComponent className={`h-4 w-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
              <span>{shortName}</span>
            </motion.button>
          );
        })}

      </div>
    </section>
  );
}
