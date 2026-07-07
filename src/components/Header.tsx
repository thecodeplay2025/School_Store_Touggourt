import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingBag, 
  Bell, 
  Menu, 
  X, 
  GraduationCap, 
  Phone, 
  HelpCircle,
  Sparkles,
  Heart,
  Home
} from 'lucide-react';
import { CartItem, User } from '../types';

interface HeaderProps {
  cart: CartItem[];
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  currentUser?: User | null;
  onOpenAuth?: () => void;
  onNavigateView?: (view: 'home' | 'profile' | 'admin' | 'auth') => void;
}

export default function Header({
  cart,
  onOpenCart,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  wishlistCount,
  onOpenWishlist,
  currentUser,
  onOpenAuth,
  onNavigateView
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showPromo, setShowPromo] = useState(() => {
    const saved = localStorage.getItem('hide_school_store_promo_banner');
    return saved !== 'true';
  });

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      {/* Top Banner (Local Delivery / Promos) */}
      {showPromo && (
        <div className="bg-brand-blue text-white py-1.5 px-4 text-xs font-medium text-center flex items-center justify-center gap-2 relative">
          <Sparkles className="h-3.5 w-3.5 animate-pulse text-brand-yellow" />
          <span>توصيل مجاني في كافة بلديات توقرت للطلبات الأكثر من 4000 د.ج 🚚</span>
          <button 
            onClick={() => {
              setShowPromo(false);
              localStorage.setItem('hide_school_store_promo_banner', 'true');
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            title="إغلاق"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button 
              onClick={() => {
                onSelectCategory('all');
                onNavigateView?.('home');
                window.location.hash = '';
              }} 
              className="flex items-center gap-1.5 sm:gap-2 group text-right"
              id="logo-button"
            >
              <div className="bg-brand-blue text-white p-2 sm:p-2.5 rounded-xl shadow-md group-hover:bg-blue-700 transition-colors">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="text-right">
                <span className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight leading-none block font-sans">
                  School Store
                </span>
                <span className="text-[9px] sm:text-[11px] font-bold text-brand-blue tracking-wide uppercase hidden min-[370px]:block mt-0.5 sm:mt-1">
                  Touggourt • توقرت
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar - styled identically to Trendhub */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ابحث عن حقيبة، آلة حاسبة، كراريس..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pr-11 pl-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                id="desktop-search-input"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Quick Info & Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button 
              onClick={() => {
                onSelectCategory('all');
                onNavigateView?.('home');
                window.location.hash = '';
              }}
              className={`hover:text-brand-blue transition-colors ${selectedCategory === 'all' ? 'text-brand-blue font-bold' : ''}`}
            >
              الرئيسية
            </button>
            <a href="#help-section" className="hover:text-brand-blue transition-colors flex items-center gap-1">
              <HelpCircle className="h-4 w-4 text-slate-400" />
              المساعدة
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-4 shrink-0">
            
            {/* Home Button - Hidden on mobile, accessible in menu */}
            <button
              onClick={() => {
                onNavigateView?.('home');
                onSelectCategory('all');
                window.location.hash = '';
              }}
              className="p-2 text-slate-500 hover:text-brand-blue hover:bg-blue-50 rounded-xl transition-all relative hidden sm:block"
              title="الصفحة الرئيسية"
              id="home-nav-button"
            >
              <Home className="h-5.5 w-5.5" />
            </button>

            {/* Wishlist Button - Hidden on mobile, accessible in menu */}
            <button 
              onClick={onOpenWishlist}
              className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all relative hidden sm:block"
              title="المفضلة"
              id="wishlist-trigger-button"
            >
              <Heart className="h-5.5 w-5.5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -left-1 bg-rose-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center animate-bounce">
                  {wishlistCount}
                </span>
              )}
            </button>





            {/* Login / Profile button - fully dynamic (Admin only) */}
            {currentUser && currentUser.role === 'admin' && (
              <button 
                onClick={() => {
                  window.location.hash = '#admin';
                  onNavigateView?.('admin');
                }}
                className="hidden md:inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-2xl shadow-sm transition-all cursor-pointer"
                id="admin-dashboard-button"
              >
                <span>لوحة التحكم ⚙️</span>
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-brand-blue hover:bg-slate-50 rounded-xl md:hidden transition-colors relative"
              id="mobile-menu-trigger"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              {wishlistCount > 0 && !mobileMenuOpen && (
                <span className="absolute top-1.5 left-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu & Search - Sliding Panel and Backdrop Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden"
            />

            {/* Drawer Panel */}
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 h-screen w-72 sm:w-80 bg-white shadow-2xl z-50 flex flex-col md:hidden text-right overflow-hidden"
              dir="rtl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="bg-brand-blue text-white p-2 rounded-lg">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 leading-none">School Store</h2>
                    <span className="text-[9px] font-bold text-brand-blue">Touggourt • القائمة</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-6 flex-1 overflow-y-auto">
                {/* Search Bar inside Drawer */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-400 block pr-1">ابحث في المتجر</span>
                  <div className="relative w-full">
                    <input
                      type="text"
                      placeholder="ابحث عن حقيبة، آلة حاسبة، كراريس..."
                      value={searchQuery}
                      onChange={(e) => onSearchChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-11 pl-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                      id="mobile-search-input"
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>

                {/* Categories / Segments */}
                <div className="space-y-2.5">
                  <span className="text-xs font-black text-slate-400 block pr-1">أقسام ومستلزمات الدراسة</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => { 
                        onSelectCategory('all'); 
                        onNavigateView?.('home');
                        window.location.hash = '';
                        setMobileMenuOpen(false); 
                      }}
                      className={`p-3 text-center rounded-xl font-bold text-xs border transition-all ${selectedCategory === 'all' ? 'bg-blue-50 border-blue-200 text-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                    >
                      🏫 المعرض الكامل
                    </button>
                    <button 
                      onClick={() => { 
                        onSelectCategory('bags'); 
                        onNavigateView?.('home');
                        window.location.hash = '';
                        setMobileMenuOpen(false); 
                      }}
                      className={`p-3 text-center rounded-xl font-bold text-xs border transition-all ${selectedCategory === 'bags' ? 'bg-blue-50 border-blue-200 text-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                    >
                      🎒 حقائب مدرسية
                    </button>
                    <button 
                      onClick={() => { 
                        onSelectCategory('notebooks'); 
                        onNavigateView?.('home');
                        window.location.hash = '';
                        setMobileMenuOpen(false); 
                      }}
                      className={`p-3 text-center rounded-xl font-bold text-xs border transition-all ${selectedCategory === 'notebooks' ? 'bg-blue-50 border-blue-200 text-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                    >
                      📝 دفاتر وكراريس
                    </button>
                    <button 
                      onClick={() => { 
                        onSelectCategory('electronics'); 
                        onNavigateView?.('home');
                        window.location.hash = '';
                        setMobileMenuOpen(false); 
                      }}
                      className={`p-3 text-center rounded-xl font-bold text-xs border transition-all ${selectedCategory === 'electronics' ? 'bg-blue-50 border-blue-200 text-brand-blue' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                    >
                      🧮 آلات حاسبة
                    </button>
                  </div>
                </div>

                {/* Primary Nav Links */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-black text-slate-400 block pr-1">روابط سريعة</span>
                  
                  <button
                    onClick={() => {
                      onNavigateView?.('home');
                      onSelectCategory('all');
                      setMobileMenuOpen(false);
                      window.location.hash = '';
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-right text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <Home className="h-4 w-4 text-slate-400" />
                      <span>الرئيسية</span>
                    </div>
                  </button>


                </div>


              </div>

              {/* Drawer Footer */}
              {currentUser && currentUser.role === 'admin' ? (
                <div className="p-5 border-t border-slate-100 bg-slate-50">
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      window.location.hash = '#admin';
                      onNavigateView?.('admin');
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm py-3 px-4 rounded-xl text-center shadow-md transition-all cursor-pointer"
                  >
                    ⚙️ لوحة تحكم المسؤول
                  </button>
                </div>
              ) : (
                <div className="p-5 border-t border-slate-100 text-center text-[10px] text-slate-400 font-bold">
                  متجر أدوات مدرسية متكامل بولاية توقرت © {new Date().getFullYear()}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
