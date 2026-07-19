import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, 
  CheckCircle2, 
  Truck, 
  FileText, 
  ChevronDown, 
  MapPin, 
  HelpCircle, 
  Phone, 
  ShieldCheck, 
  Layers, 
  Award, 
  Clock,
  Search,
  Check,
  Building,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  ShoppingCart,
  Trash2
} from 'lucide-react';

import { Product, CartItem, Order, User, Review, SiteSettings, Category, Municipality, Affiliate } from './types';
import { PRODUCTS, CATEGORIES, MUNICIPALITIES } from './data';

// Components
import Header from './components/Header';
import Hero from './components/Hero';
import Categories from './components/Categories';
import ProductCard from './components/ProductCard';
import ProductQuickViewModal from './components/ProductQuickViewModal';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import CheckoutModal from './components/CheckoutModal';
import PackLandingPage from './components/PackLandingPage';
import SEO from './components/SEO';
import NotFoundView from './components/NotFoundView';
import InfoPagesView from './components/InfoPagesView';
import FAQView from './components/FAQView';
import AffiliatePortalModal from './components/AffiliatePortalModal';

import AuthView from './components/AuthView';
import UserProfileView from './components/UserProfileView';
import AdminDashboard from './components/AdminDashboard';
import { getCompatibleImageUrl } from './utils/imageHelper';
import { saveDoc, getDocData, subscribeDoc, saveDocument, updateOrderStatusAtomic, initializeCollectionsIfEmpty, incrementVisitors, subscribeCollection } from './lib/firebase';
import midadLogo from './assets/images/midad_logo.png';


export default function App() {
  // Database States loaded from localstorage or defaults
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('school_store_products');
    return saved ? JSON.parse(saved) : PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('school_store_categories');
    return saved ? JSON.parse(saved) : CATEGORIES;
  });

  const [municipalities, setMunicipalities] = useState<Municipality[]>(() => {
    const saved = localStorage.getItem('school_store_municipalities');
    return saved ? JSON.parse(saved) : MUNICIPALITIES;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('school_store_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('school_store_users');
    return saved ? JSON.parse(saved) : [];
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('school_store_reviews');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'rev-1',
        productId: 'bag-premium-blue',
        productName: 'حقيبة مدرسية مريحة ومقاومة للماء - أزرق ملكي',
        userName: 'كمال الطيبات',
        rating: 5,
        comment: 'حقيبة متينة ومريحة جداً لابني في الطور المتوسط. أنصح بها بشدة!',
        date: '2026-06-25',
        status: 'approved'
      },
      {
        id: 'rev-2',
        productId: 'calculator-casio-scientific',
        productName: 'آلة حاسبة علمية متطورة CASIO fx-991ARX - النسخة العربية',
        userName: 'خديجة جامعة توقرت',
        rating: 5,
        comment: 'أفضل حاسبة على الإطلاق لطلبة الجامعة والهندسة، واجهتها عربية مريحة للغاية.',
        date: '2026-06-26',
        status: 'approved'
      }
    ];
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('school_store_settings');
    if (saved) return JSON.parse(saved);
    return {
      storeName: 'midad | مداد',
      storeDescription: 'مداد (midad) - وجهتك الإلكترونية الأولى لشراء كافة اللوازم والمستلزمات المدرسية والأكاديمية بأفضل الأسعار.',
      contactPhone1: '0661000000',
      contactPhone2: '0771000000',
      warehouseAddress: 'حي المستقبل، وسط مدينة توقرت، الجزائر',
      freeShippingThreshold: 0,
      promoBannerText: 'توصيل مجاني بالكامل لكافة بلديات ولاية توقرت 🚚🎁'
    };
  });

  // Routing View State
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'admin' | 'auth' | '404' | 'privacy' | 'terms' | 'shipping' | 'faq'>('home');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [unauthorizedError, setUnauthorizedError] = useState(false);

  // Application State
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('school_store_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const saved = localStorage.getItem('school_store_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('school_store_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [affiliates, setAffiliates] = useState<Affiliate[]>(() => {
    const saved = localStorage.getItem('school_store_affiliates');
    return saved ? JSON.parse(saved) : [];
  });

  // Handle referral link parsing on mount
  useEffect(() => {
    console.log("[REFERRAL TRACE] [MOUNT] Checking URL parameters for referral code...");
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      const cleanRef = refCode.trim().toUpperCase();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      
      console.log(`[REFERRAL TRACE] [MOUNT] Found 'ref' parameter in URL: "${cleanRef}". Setting localStorage and cookie for 30 days.`);
      localStorage.setItem('school_store_referral_code', cleanRef);
      localStorage.setItem('school_store_referral_expiry', expiryDate.toISOString());
      
      // Set document cookie for 30 days
      document.cookie = `school_store_ref=${cleanRef}; max-age=${30 * 24 * 60 * 60}; path=/; SameSite=Lax`;
    } else {
      const storedRef = localStorage.getItem('school_store_referral_code');
      console.log(`[REFERRAL TRACE] [MOUNT] No 'ref' in URL parameters. Checking localStorage: "${storedRef || 'None'}"`);
      const expiryStr = localStorage.getItem('school_store_referral_expiry');
      if (expiryStr) {
        const expiry = new Date(expiryStr);
        if (expiry.getTime() < Date.now()) {
          console.log("[REFERRAL TRACE] [MOUNT] Referral code expired. Cleaning up localStorage and cookies.");
          localStorage.removeItem('school_store_referral_code');
          localStorage.removeItem('school_store_referral_expiry');
          document.cookie = "school_store_ref=; max-age=0; path=/";
        } else {
          console.log(`[REFERRAL TRACE] [MOUNT] Stored referral code "${storedRef}" is still valid until ${expiry.toLocaleString()}`);
        }
      }
    }
  }, []);

  const [packs, setPacks] = useState<Product[]>(() => {
    const saved = localStorage.getItem('school_store_packs');
    if (saved) return JSON.parse(saved);
    
    // Default high-quality packs
    const defaults: Product[] = [
      {
        id: 'pack-primary',
        name: 'الباك الذهبي للطور الابتدائي - كامل الأدوات',
        description: 'باك شامل ومتكامل يحتوي على كل ما يحتاجه تلميذ الطور الابتدائي من أدوات عالية الجودة وحقيبة مريحة لحماية ظهره.',
        price: 5900,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
        category: 'bags',
        rating: 4.9,
        isPopular: true,
        inStock: true,
        brand: 'SchoolStore',
        features: ['توفير أكثر من 1500 د.ج مقارنة بالشراء الفردي', 'حقيبة طبية مريحة ومناسبة لنمو الطفل', 'أدوات عالية الجودة من علامة Maped و Techno'],
        isPack: true,
        packItems: [
          { id: 'item-1', name: 'حقيبة مريحة للأطفال برسومات لطيفة', quantity: 1 },
          { id: 'item-2', name: 'مجموعة كراريس تكنو الفاخرة - 96 صفحة', quantity: 1 },
          { id: 'item-3', name: 'علبة أدوات الهندسة والقياس Maped', quantity: 1 },
          { id: 'item-4', name: 'مقلمة مدرسية مجهزة بأقلام جيل أساسية وممحاة', quantity: 1 },
          { id: 'item-5', name: 'علبة أقلام تلوين خشبية ممتازة 12 لونًا', quantity: 1 }
        ]
      },
      {
        id: 'pack-secondary',
        name: 'باك التميز للطور المتوسط والثانوي - علمي وأدبي',
        description: 'باك مخصص لطلبة الطور المتوسط والثانوي يجمع بين الأناقة والإنتاجية، مع آلة حاسبة علمية معتمدة ومحفظة متينة مقاومة للمطر.',
        price: 8800,
        image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600',
        category: 'electronics',
        rating: 4.8,
        isPopular: true,
        inStock: true,
        brand: 'SchoolStore',
        features: ['آلة حاسبة كاسيو الأصلية fx-991ARX بوجهة عربية', 'حقيبة ظهرPro تدعم الظهر ومقاومة للمياه', 'كراريس فاخرة بجودة تدوين مريحة'],
        isPack: true,
        packItems: [
          { id: 'item-1', name: 'حقيبة ظهر مدرسية مريحة ومقاومة للماء - أزرق ملكي', quantity: 1 },
          { id: 'item-2', name: 'آلة حاسبة علمية متطورة CASIO fx-991ARX - النسخة العربية', quantity: 1 },
          { id: 'item-3', name: 'مجموعة كراريس تكنو الفاخرة - 96 صفحة (6 قطع)', quantity: 2 },
          { id: 'item-4', name: 'حزمة أقلام جيل ملونة Stabilo (6 ألوان)', quantity: 1 },
          { id: 'item-5', name: 'أقلام فسفورية تظليل باستيل (4 ألوان)', quantity: 1 }
        ]
      },
      {
        id: 'pack-university',
        name: 'الباك الجامعي الذكي - لطلبة الكليات والهندسة',
        description: 'الحزمة المتكاملة لطلبة جامعة توقرت تحتوي على حقيبة ذكية منفذ شحن USB وأدوات التدوين والتخطيط الاحترافية.',
        price: 9500,
        image: 'https://images.unsplash.com/photo-1577733966973-d680bffd2e80?auto=format&fit=crop&q=80&w=600',
        category: 'bags',
        rating: 4.9,
        isPopular: false,
        inStock: true,
        brand: 'CampusPro',
        features: ['حقيبة ذكية بـ USB لشحن الهواتف مريحة جداً', 'دفاتر رسم وتدوين مقاس كبير لخرائط المفاهيم والمحاضرات', 'مثالي كهدية قيمة للناجحين في البكالوريا بتوقرت'],
        isPack: true,
        packItems: [
          { id: 'item-1', name: 'حقيبة ظهر كلاسيكية أنيقة للجامعيين - منفذ USB', quantity: 1 },
          { id: 'item-2', name: 'دفتر رسم احترافي مقاس A4 لطلبة الهندسة والرسم', quantity: 1 },
          { id: 'item-3', name: 'آلة حاسبة علمية متطورة CASIO fx-991ARX', quantity: 1 },
          { id: 'item-4', name: 'حزمة أقلام جيل ملونة فاخرة Stabilo', quantity: 1 },
          { id: 'item-5', name: 'أقلام تظليل فسفورية باستيل ملونة', quantity: 1 }
        ]
      }
    ];
    return defaults;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSegment, setSelectedSegment] = useState<string>('all'); // Target audience filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // UI States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);
  const [directPurchaseItem, setDirectPurchaseItem] = useState<CartItem | null>(null);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAffiliatePortalOpen, setIsAffiliatePortalOpen] = useState(false);
  
  // Track order form states
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState(false);

  // Accordion state for FAQs
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Visitors State (backed by server or direct Firestore Client SDK)
  const [visitorsCount, setVisitorsCount] = useState<number>(0);

  // Synchronizers and Server Synchronization
  const isInitialLoad = useRef(true);
  const [useDirectFirestore, setUseDirectFirestore] = useState(true);
  
  // Cache to track latest data received from Firestore/server to prevent write back loops
  const lastServerData = useRef<Record<string, string>>({});

  // Set of keys that have been successfully loaded from Firestore/server to prevent overwriting with local state on boot
  const loadedKeys = useRef<Set<string>>(new Set());

  // Helper to save specific state back to the shared database
  const saveToServer = (key: string, data: any) => {
    saveDoc(key, data)
      .catch(err => console.error(`Direct Firestore write failed for ${key}:`, err));
  };

  // 1. Database Seeding & Initialization on Startup (Direct Firestore Mode)
  useEffect(() => {
    console.log("[Firestore] Running initial DB verification and collections seeding if empty...");
    initializeCollectionsIfEmpty()
      .then(() => {
        console.log("[Firestore] Finished verifying/seeding default collection structures.");
      })
      .catch(err => {
        console.error("[Firestore] Failed to verify/seed default database structures:", err);
      });
  }, []);

  // 1.2. Direct Website Visitor Tracker (database backed, run once per browser session)
  useEffect(() => {
    const sessionVisited = sessionStorage.getItem('school_store_session_visited');
    if (!sessionVisited) {
      sessionStorage.setItem('school_store_session_visited', 'true');
      
      console.log("[Firestore] Registering new visitor session, incrementing count...");
      incrementVisitors()
        .then(newCount => {
          setVisitorsCount(newCount);
          loadedKeys.current.add('visitors');
          lastServerData.current['visitors'] = JSON.stringify({ count: newCount });
        })
        .catch(err => console.error('Failed to increment visitors directly:', err));
    }
  }, []);

  // Real-time Firestore subscriptions for separate collection/document architecture
  useEffect(() => {
    console.log("[Firestore] Setting up real-time direct collection and document subscriptions...");
    const unsubscribers: (() => void)[] = [];

    // Collections to subscribe to
    const collectionsToSubscribe = [
      { name: 'products', setter: setProducts },
      { name: 'categories', setter: setCategories },
      { name: 'municipalities', setter: setMunicipalities },
      { name: 'users', setter: setAllUsers },
      { name: 'reviews', setter: setReviews },
      { name: 'packs', setter: setPacks },
      { name: 'orders', setter: setRecentOrders },
      { name: 'affiliates', setter: setAffiliates }
    ];

    collectionsToSubscribe.forEach(({ name, setter }) => {
      const unsub = subscribeCollection(name, (data) => {
        loadedKeys.current.add(name);
        if (data) {
          lastServerData.current[name] = JSON.stringify(data);
          setter(data);
        }
      });
      unsubscribers.push(unsub);
    });

    // Special single documents to subscribe to
    const unsubSettings = subscribeDoc('settings', 'siteSettings', (data) => {
      loadedKeys.current.add('settings');
      loadedKeys.current.add('siteSettings');
      if (data) {
        lastServerData.current['settings'] = JSON.stringify(data);
        lastServerData.current['siteSettings'] = JSON.stringify(data);
        setSiteSettings(data);
      }
    });
    unsubscribers.push(unsubSettings);

    const unsubVisitors = subscribeDoc('visitors', 'stats', (data) => {
      loadedKeys.current.add('visitors');
      if (data && typeof data.count === 'number') {
        lastServerData.current['visitors'] = JSON.stringify(data);
        setVisitorsCount(data.count);
      }
    });
    unsubscribers.push(unsubVisitors);

    // Turn off loading gate after 500ms to allow subscriptions to seed local state
    const loadingTimeout = setTimeout(() => {
      isInitialLoad.current = false;
    }, 1500);

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // 1.5. URL and SEO-Friendly Router Synchronization
  const [isUrlRouterReady, setIsUrlRouterReady] = useState(false);

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setCurrentView('home');
        setActiveProductDetail(null);
      } else if (path === '/auth') {
        setCurrentView('auth');
        setActiveProductDetail(null);
      } else if (path === '/profile') {
        setCurrentView('profile');
        setActiveProductDetail(null);
      } else if (path === '/admin') {
        setCurrentView('admin');
        setActiveProductDetail(null);
      } else if (path === '/privacy') {
        setCurrentView('privacy');
        setActiveProductDetail(null);
      } else if (path === '/terms') {
        setCurrentView('terms');
        setActiveProductDetail(null);
      } else if (path === '/shipping') {
        setCurrentView('shipping');
        setActiveProductDetail(null);
      } else if (path === '/faq') {
        setCurrentView('faq');
        setActiveProductDetail(null);
      } else if (path.startsWith('/product/')) {
        const prodId = path.replace('/product/', '');
        const foundProduct = products.find(p => p.id === prodId) || packs.find(p => p.id === prodId);
        if (foundProduct) {
          setActiveProductDetail(foundProduct);
          setCurrentView('home');
        } else {
          setCurrentView('404');
          setActiveProductDetail(null);
        }
      } else if (path === '/404') {
        setCurrentView('404');
        setActiveProductDetail(null);
      } else {
        // Check to ensure we are not intercepting system / assets files
        if (!path.startsWith('/api/') && !path.startsWith('/@fs') && !path.startsWith('/src/')) {
          setCurrentView('404');
          setActiveProductDetail(null);
        }
      }
      setIsUrlRouterReady(true);
    };

    handleLocationChange();

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [products, packs]);

  // Sync state changes back to browser URL
  useEffect(() => {
    if (!isUrlRouterReady) return;

    let targetPath = '/';
    if (currentView === '404') {
      targetPath = '/404';
    } else if (activeProductDetail) {
      targetPath = `/product/${activeProductDetail.id}`;
    } else if (currentView === 'home') {
      targetPath = '/';
    } else if (currentView === 'profile') {
      targetPath = '/profile';
    } else if (currentView === 'auth') {
      targetPath = '/auth';
    } else if (currentView === 'admin') {
      targetPath = '/admin';
    } else if (currentView === 'privacy') {
      targetPath = '/privacy';
    } else if (currentView === 'terms') {
      targetPath = '/terms';
    } else if (currentView === 'shipping') {
      targetPath = '/shipping';
    } else if (currentView === 'faq') {
      targetPath = '/faq';
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  }, [currentView, activeProductDetail, isUrlRouterReady]);

  // 2. Periodic Polling to automatically synchronize changes/orders across devices (only used if not on direct real-time Firestore)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isInitialLoad.current && !useDirectFirestore) {
        fetch('/api/db')
          .then(res => res.json())
          .then(data => {
            if (data) {
              // Update state with fresh values from other devices
              Object.keys(data).forEach(key => {
                lastServerData.current[key] = JSON.stringify(data[key]);
              });
              if (data.orders) setRecentOrders(data.orders);
              if (data.products) setProducts(data.products);
              if (data.categories) setCategories(data.categories);
              if (data.packs) setPacks(data.packs);
              if (data.reviews) setReviews(data.reviews);
              if (data.users) setAllUsers(data.users);
              if (data.siteSettings) setSiteSettings(data.siteSettings);
              if (data.municipalities) setMunicipalities(data.municipalities);
              if (data.affiliates) setAffiliates(data.affiliates);
            }
          })
          .catch(err => console.error('Error polling database updates:', err));
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [useDirectFirestore]);


  // Sync to LocalStorage & Server on State Changes
  useEffect(() => {
    localStorage.setItem('school_store_products', JSON.stringify(products));
    if (!isInitialLoad.current && loadedKeys.current.has('products')) {
      const stringified = JSON.stringify(products);
      if (lastServerData.current['products'] !== stringified) {
        lastServerData.current['products'] = stringified;
        saveToServer('products', products);
      }
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem('school_store_categories', JSON.stringify(categories));
    if (!isInitialLoad.current && loadedKeys.current.has('categories')) {
      const stringified = JSON.stringify(categories);
      if (lastServerData.current['categories'] !== stringified) {
        lastServerData.current['categories'] = stringified;
        saveToServer('categories', categories);
      }
    }
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('school_store_municipalities', JSON.stringify(municipalities));
    if (!isInitialLoad.current && loadedKeys.current.has('municipalities')) {
      const stringified = JSON.stringify(municipalities);
      if (lastServerData.current['municipalities'] !== stringified) {
        lastServerData.current['municipalities'] = stringified;
        saveToServer('municipalities', municipalities);
      }
    }
  }, [municipalities]);

  useEffect(() => {
    localStorage.setItem('school_store_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('school_store_users', JSON.stringify(allUsers));
    if (!isInitialLoad.current && loadedKeys.current.has('users')) {
      const stringified = JSON.stringify(allUsers);
      if (lastServerData.current['users'] !== stringified) {
        lastServerData.current['users'] = stringified;
        saveToServer('users', allUsers);
      }
    }
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('school_store_affiliates', JSON.stringify(affiliates));
    if (!isInitialLoad.current && loadedKeys.current.has('affiliates')) {
      const stringified = JSON.stringify(affiliates);
      if (lastServerData.current['affiliates'] !== stringified) {
        lastServerData.current['affiliates'] = stringified;
        saveToServer('affiliates', affiliates);
      }
    }
  }, [affiliates]);

  useEffect(() => {
    localStorage.setItem('school_store_reviews', JSON.stringify(reviews));
    if (!isInitialLoad.current && loadedKeys.current.has('reviews')) {
      const stringified = JSON.stringify(reviews);
      if (lastServerData.current['reviews'] !== stringified) {
        lastServerData.current['reviews'] = stringified;
        saveToServer('reviews', reviews);
      }
    }
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('school_store_settings', JSON.stringify(siteSettings));
    if (!isInitialLoad.current && (loadedKeys.current.has('settings') || loadedKeys.current.has('siteSettings'))) {
      const stringified = JSON.stringify(siteSettings);
      if (lastServerData.current['settings'] !== stringified || lastServerData.current['siteSettings'] !== stringified) {
        saveToServer('settings', siteSettings);
        saveToServer('siteSettings', siteSettings);
        lastServerData.current['settings'] = stringified;
        lastServerData.current['siteSettings'] = stringified;
      }
    }
  }, [siteSettings]);

  useEffect(() => {
    localStorage.setItem('school_store_packs', JSON.stringify(packs));
    if (!isInitialLoad.current && loadedKeys.current.has('packs')) {
      const stringified = JSON.stringify(packs);
      if (lastServerData.current['packs'] !== stringified) {
        lastServerData.current['packs'] = stringified;
        saveToServer('packs', packs);
      }
    }
  }, [packs]);



  // Handle Hash/URL Interceptor to block unauthorized access
  useEffect(() => {
    const handleHashRoute = () => {
      const hash = window.location.hash;
      if (hash === '#admin' || hash === '#admin/dashboard') {
        if (!currentUser || currentUser.role !== 'admin') {
          // Block unauthorized client/customer
          setUnauthorizedError(true);
          setCurrentView('home');
          window.location.hash = '';
          setTimeout(() => setUnauthorizedError(false), 5000);
        } else {
          setCurrentView('admin');
        }
      } else if (hash === '#profile' || hash === '#account') {
        if (!currentUser) {
          setAuthInitialMode('login');
          setCurrentView('auth');
        } else if (currentUser.role === 'admin') {
          setCurrentView('admin');
        } else {
          setCurrentView('profile');
        }
      } else if (hash === '#auth/login') {
        setAuthInitialMode('login');
        setCurrentView('auth');
      } else if (hash === '#auth/register') {
        setAuthInitialMode('register');
        setCurrentView('auth');
      } else {
        // Default home
        if (currentView !== 'profile' && currentView !== 'admin' && currentView !== 'auth') {
          setCurrentView('home');
        }
      }
    };

    window.addEventListener('hashchange', handleHashRoute);
    handleHashRoute(); // Run initial check

    return () => {
      window.removeEventListener('hashchange', handleHashRoute);
    };
  }, [currentUser, currentView]);

  // Persist Cart & Wishlist
  useEffect(() => {
    localStorage.setItem('school_store_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('school_store_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('school_store_orders', JSON.stringify(recentOrders));
    if (loadedKeys.current.has('orders')) {
      console.warn(`[SYNC TRACE] recentOrders effect evaluated. isInitialLoad: ${isInitialLoad.current}, hasLoadedOrdersKey: ${loadedKeys.current.has('orders')}, current state length:`, recentOrders.length);
    }
    if (!isInitialLoad.current && loadedKeys.current.has('orders')) {
      const stringified = JSON.stringify(recentOrders);
      if (lastServerData.current['orders'] !== stringified) {
        console.warn(`[SYNC TRACE] MISMATCH DETECTED! lastServerData:`, lastServerData.current['orders'], `vs current state:`, stringified);
        lastServerData.current['orders'] = stringified;
        saveToServer('orders', recentOrders);
      }
    }
  }, [recentOrders]);

  // Show dynamic toast helper
  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add to Cart
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        showToast(`تم زيادة كمية ${product.name} في السلة!`, 'success');
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      showToast(`تم إضافة ${product.name} إلى السلة بنجاح!`, 'success');
      return [...prev, { product, quantity: 1 }];
    });
  };

  // Direct Purchase (Buy Now)
  const handleDirectPurchase = (product: Product) => {
    setDirectPurchaseItem({ product, quantity: 1 });
    setActiveProductDetail(null);
    setIsCheckoutOpen(true);
  };

  // Update Cart Quantity
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  // Remove from Cart
  const handleRemoveFromCart = (productId: string) => {
    const itemToRemove = cart.find(item => item.product.id === productId);
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    if (itemToRemove) {
      showToast(`تمت إزالة ${itemToRemove.product.name} من السلة`, 'info');
    }
  };

  // Toggle Wishlist
  const handleToggleWishlist = (product: Product) => {
    const isExist = wishlist.some((item) => item.id === product.id);
    if (isExist) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      showToast(`تمت إزالة ${product.name} من المفضلة`, 'info');
    } else {
      setWishlist((prev) => [...prev, product]);
      showToast(`تم حفظ ${product.name} في المفضلة ❤️`, 'success');
    }
  };

  const handleOrderSuccess = async (newOrder: Order) => {
    // Inject current user email if logged in (default to null instead of undefined)
    const orderWithUser = {
      ...newOrder,
      customerEmail: currentUser ? currentUser.email : null
    };

    console.log("[Order Success TRACE] orderWithUser structure is:", JSON.stringify(orderWithUser, null, 2));

    try {
      console.log("[Firestore Order Save] Saving new order directly to Firestore collection 'orders' with id:", orderWithUser.id);
      await saveDocument('orders', orderWithUser.id, orderWithUser);
      console.log("[Firestore Order Save] Order successfully saved to Firestore!");
      showToast(`تم تسجيل طلبيتك برقم ${newOrder.id} بنجاح!`, 'success');
    } catch (err) {
      console.error("[Firestore Order Save] CRITICAL EXCEPTION CAUGHT during direct Firestore write:", err);
      showToast(`عذرًا، حدث خطأ أثناء تسجيل طلبك. يرجى المحاولة مرة أخرى.`, 'info');
    }
  };


  const handleClearCart = () => {
    setCart([]);
  };

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    
    // Switch view to home first if we are not on the homepage
    if (currentView !== 'home') {
      setCurrentView('home');
      window.location.hash = '';
    }

    // Smooth scroll to the products explore section
    setTimeout(() => {
      const section = document.getElementById('products-explore-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Filter products by category, target segment, and search query
  const filteredProducts = useMemo(() => {
    const combined = products;
    const filtered = combined.filter((product) => {
      // Category Filter: Keep all products regardless of category, we sort them to the top below
      const matchesCategory = true;

      // Target Segment Filter (Pupils, University, Parents, Institutions)
      let matchesSegment = true;
      const isCustomProduct = product.id.startsWith('prod-');
      if (selectedSegment !== 'all' && !isCustomProduct) {
        if (selectedSegment === 'pupils') {
          // Elementary / Middle / High School target
          matchesSegment = product.id !== 'bag-university-dark' && product.id !== 'sketchbook-a4-professional';
        } else if (selectedSegment === 'university') {
          // University Student target
          matchesSegment = product.id === 'bag-university-dark' || 
                           product.id === 'calculator-casio-scientific' || 
                           product.id === 'sketchbook-a4-professional' || 
                           product.id === 'pens-stabilo-gel' ||
                           product.id === 'highlighters-pastel-pack';
        } else if (selectedSegment === 'parents') {
          // Ideal for parents (backpacks, sets, kits, educational tablets)
          matchesSegment = product.category === 'bags' || 
                           product.id === 'tablet-educational-draw' || 
                           product.id === 'geometry-maped-metal' || 
                           product.id === 'notebook-super-pack';
        } else if (selectedSegment === 'institutions') {
          // Ideal for bulk buying
          matchesSegment = product.id === 'notebook-super-pack' || 
                           product.id === 'pens-stabilo-gel' || 
                           product.id === 'color-pencils-professional';
        }
      }

      // Search Query Filter
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesSegment && matchesSearch;
    });

    // Sort products: selectedCategory's products first, then follow default category sequence
    return [...filtered].sort((a, b) => {
      if (selectedCategory !== 'all') {
        const isASelected = a.category === selectedCategory;
        const isBSelected = b.category === selectedCategory;
        if (isASelected && !isBSelected) return -1;
        if (!isASelected && isBSelected) return 1;
      }

      const idxA = categories.findIndex((c) => c.id === a.category);
      const idxB = categories.findIndex((c) => c.id === b.category);
      const valA = idxA === -1 ? 999 : idxA;
      const valB = idxB === -1 ? 999 : idxB;
      return valA - valB;
    });
  }, [selectedCategory, selectedSegment, searchQuery, products, categories]);

  // Sort packs by selected category (so they do not disappear and category-specific packs show first)
  const displayPacks = useMemo(() => {
    if (selectedCategory === 'all') return packs;
    return [...packs].sort((a, b) => {
      const isASelected = a.category === selectedCategory;
      const isBSelected = b.category === selectedCategory;
      if (isASelected && !isBSelected) return -1;
      if (!isASelected && isBSelected) return 1;
      return 0;
    });
  }, [packs, selectedCategory]);

  // Handle order tracking form
  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(false);
    setTrackedOrder(null);

    const found = recentOrders.find((o) => o.id.trim().toUpperCase() === trackOrderId.trim().toUpperCase());
    if (found) {
      setTrackedOrder(found);
    } else {
      setTrackError(true);
    }
  };

  const faqs = [
    {
      q: 'كيف تتم عملية الدفع والشراء في ولاية توقرت؟',
      a: 'الدفع لدينا هو الدفع نقداً عند الاستلام (COD) بنسبة 100%. تقوم بالطلب عبر الموقع مجاناً وبدون بطاقة بنكية، ونحن نقوم بتجهيز طلبيتك وإرسالها مع موظف التوصيل إلى باب منزلك. يمكنك معاينة الأدوات للتأكد من جودتها ثم تدفع نقداً للسائق.'
    },
    {
      q: 'ما هي بلديات ولاية توقرت التي تقومون بالتوصيل إليها؟',
      a: 'نوفر خدمة التوصيل السريع لجميع بلديات الولاية الـ 11: توقرت وسط المدينة، تماسين، النزلة، تبسبست، الطيبات، الهجيرة، العالية، المنقر، سيدي سليمان، بن ناصر، وبلدة عمر.'
    },
    {
      q: 'كم تبلغ تكلفة التوصيل؟ وهل هناك توصيل مجاني؟',
      a: 'التوصيل مجاني بالكامل 100% لكافة بلديات ولاية توقرت الـ 11 بدون أي تكاليف إضافية ومهما كانت قيمة طلبيتك!'
    },
    {
      q: 'هل الأدوات والآلات الحاسبة أصلية وتوافق متطلبات المدارس والأساتذة؟',
      a: 'نعم، جميع سلعنا أصلية من كبرى العلامات المعتمدة مثل CASIO، Maped، Stabilo، Techno و Faber-Castell. كما أننا نضمن تطابق الآلات الحاسبة والدفاتر مع المناهج والمقررات التربوية الرسمية لوزارة التربية الوطنية بالجزائر.'
    },
    {
      q: 'كيف يمكنني إلغاء الطلبية أو تعديلها؟',
      a: 'بعد تسجيل طلبك، سيتصل بك موظف خدمة العملاء هاتفياً لتأكيد العنوان وموعد التوصيل. يمكنك في تلك المكالمة تعديل الطلبية أو إلغاؤها بكل بساطة وبدون أي تكاليف إضافية.'
    }
  ];

  const formatPrice = (price: number) => {
    return price.toLocaleString('ar-DZ') + ' د.ج';
  };

  const totalCartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (currentUser && currentUser.role === 'admin' && currentView === 'admin') {
    return (
      <AdminDashboard
        products={products}
        categories={categories}
        orders={recentOrders}
        users={allUsers}
        municipalities={municipalities}
        reviews={reviews}
        siteSettings={siteSettings}
        packs={packs}
        visitorsCount={visitorsCount}
        onUpdateVisitorsCount={(newCount) => {
          setVisitorsCount(newCount);
          saveToServer('visitors', { count: newCount });
        }}
        onUpdatePacks={setPacks}
        onUpdateProducts={(updatedProducts) => {
          setProducts(updatedProducts);
          // If a new product was added (length increased), reset active filters
          if (updatedProducts.length > products.length) {
            setSelectedCategory('all');
            setSelectedSegment('all');
            setSearchQuery('');
          }
        }}
        onUpdateCategories={setCategories}
        onUpdateOrders={setRecentOrders}
        onUpdateUsers={setAllUsers}
        onUpdateMunicipalities={setMunicipalities}
        onUpdateReviews={setReviews}
        onUpdateSiteSettings={setSiteSettings}
        affiliates={affiliates}
        onUpdateAffiliates={setAffiliates}
        onLogout={() => {
          setCurrentUser(null);
          setCurrentView('home');
          window.location.hash = '';
          showToast('تم تسجيل الخروج من لوحة التحكم بنجاح', 'info');
        }}
        formatPrice={formatPrice}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between overflow-x-clip selection:bg-brand-blue selection:text-white">
      
      {/* Dynamic Top Cart Bar */}
      <AnimatePresence>
        {totalCartItemsCount > 0 && (
          <motion.div
            id="dynamic-top-cart-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-500 text-white font-bold border-b border-emerald-600/20 shadow-md sticky top-0 z-50 overflow-hidden min-h-[90px] sm:h-[90px] py-3 sm:py-0 flex items-center"
          >
            <div className="max-w-7xl mx-auto px-4 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-right" dir="rtl">
              <div className="flex items-center gap-2.5">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  سلتك تحتوي حالياً على <span className="underline decoration-2">{totalCartItemsCount === 1 ? 'أداة واحدة' : totalCartItemsCount === 2 ? 'أداتين' : `${totalCartItemsCount} أدوات`}</span> بقيمة إجمالية <span className="text-yellow-300 text-base sm:text-lg font-black mx-2">{formatPrice(totalCartPrice)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button 
                  id="top-cart-bar-checkout-btn"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs sm:text-sm px-4.5 py-2 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-orange-600/30"
                >
                  <span>اشتري الآن 🛍️</span>
                </button>
                <button 
                  id="top-cart-bar-view-btn"
                  onClick={() => setIsCartOpen(true)}
                  className="bg-white/15 hover:bg-white/25 active:scale-95 text-white font-black text-xs sm:text-sm px-4 py-2 rounded-xl border border-white/20 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>شاهد السلة 🛒</span>
                </button>
                <button 
                  id="top-cart-bar-clear-btn"
                  onClick={() => setIsClearCartModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs sm:text-sm px-3 py-2 rounded-xl border border-rose-600/30 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="إفراغ السلة"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">حذف السلة</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEO metadata management */}
      <SEO 
        title={
          currentView === '404' 
            ? 'الصفحة غير موجودة' 
            : activeProductDetail 
              ? activeProductDetail.name 
              : currentView === 'auth' 
                ? 'حسابي / تسجيل الدخول' 
                : currentView === 'profile' 
                  ? 'الملف الشخصي' 
                  : currentView === 'privacy'
                    ? 'سياسة الخصوصية وسرية المعلومات'
                    : currentView === 'terms'
                      ? 'شروط وأحكام الاستخدام والطلب'
                      : currentView === 'shipping'
                        ? 'سياسة الشحن والتوصيل والإرجاع'
                        : currentView === 'faq'
                          ? 'الأسئلة الشائعة والجواب الشافي'
                          : undefined
        }
        description={
          currentView === '404'
            ? 'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
            : activeProductDetail 
              ? activeProductDetail.description 
              : currentView === 'privacy'
                ? 'نلتزم بحماية خصوصية بياناتكم بشكل كامل. تعرف على كيفية جمع ومعالجة معلومات الطلبات والتوصيل لزبائننا الكرام بولاية توقرت.'
                : currentView === 'terms'
                  ? 'الشروط والأحكام المنظمة لعمليات تصفح متجر الأدوات المدرسية والباكات وشروط تأكيد ورفض الطلبات في ولاية توقرت.'
                  : currentView === 'shipping'
                    ? 'تفاصيل شحن الأدوات المدرسية والباكات لكافة بلديات ولاية توقرت، مدة التوصيل القياسية وسياسة استبدال المنتجات التالفة.'
                    : currentView === 'faq'
                      ? 'إليك كافة الأجوبة حول توصيل الأدوات المدرسية والباكات بولاية توقرت، طرق الدفع، جودة المنتجات، وإجراءات الطلب السريع.'
                      : undefined
        }
        image={activeProductDetail ? activeProductDetail.image : undefined}
        canonicalPath={
          currentView === '404'
            ? '/404'
            : activeProductDetail 
              ? `/product/${activeProductDetail.id}` 
              : currentView === 'auth' 
                ? '/auth' 
                : currentView === 'profile' 
                  ? '/profile' 
                  : currentView === 'privacy'
                    ? '/privacy'
                    : currentView === 'terms'
                      ? '/terms'
                      : currentView === 'shipping'
                        ? '/shipping'
                        : currentView === 'faq'
                          ? '/faq'
                          : '/'
        }
        product={activeProductDetail}
        isStore={currentView === 'home' && !activeProductDetail}
      />

      {/* Unauthorized access warning banner */}
      <AnimatePresence>
        {unauthorizedError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right"
            dir="rtl"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center text-white space-y-4 shadow-2xl">
              <div className="bg-rose-500/10 text-rose-500 p-4 rounded-full inline-flex border border-rose-500/25">
                <AlertTriangle className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="text-xl font-black text-white">🚫 غير مصرح بالوصول!</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                محاولة الدخول إلى لوحة التحكم الخاصة بالمسؤولين مرفوضة. يرجى تسجيل الدخول أولاً بحساب مسؤول معتمد.
              </p>
              <button
                onClick={() => setUnauthorizedError(false)}
                className="bg-brand-blue hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow transition-all cursor-pointer w-full"
              >
                العودة للصفحة الرئيسية للزبائن
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-24 left-1/2 -translate-x-1/2 px-6 py-4.5 rounded-2xl shadow-xl z-50 flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-blue-50 border-blue-100 text-brand-blue'
            }`}
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="font-extrabold text-xs sm:text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <Header
        siteSettings={siteSettings}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthInitialMode('login');
          setCurrentView('auth');
          window.location.hash = '#auth/login';
        }}
        onNavigateView={(view) => {
          setCurrentView(view);
          setActiveProductDetail(null);
          if (view === 'home') {
            window.location.hash = '';
          }
        }}
      />

      {/* Main Content Areas */}
      <main className="flex-1 pb-16">
        {currentView === '404' ? (
          <NotFoundView onGoHome={() => {
            setCurrentView('home');
            setActiveProductDetail(null);
          }} />
        ) : (activeProductDetail && activeProductDetail.isPack) ? (
          <PackLandingPage
            product={activeProductDetail}
            onClose={() => setActiveProductDetail(null)}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleToggleWishlist}
            isWishlisted={wishlist.some(item => item.id === activeProductDetail.id)}
            onDirectPurchase={handleDirectPurchase}
            products={products}
          />
        ) : (
          <>
            {currentView === 'home' && (
              <>
                {/* Hero Section styled like Trendhub */}
        <Hero 
          onExploreClick={() => {
            const section = document.getElementById('products-explore-section');
            section?.scrollIntoView({ behavior: 'smooth' });
          }}
          onSelectCategory={handleSelectCategory}
        />

        {/* Dedicated School Packs Section */}
        {!searchQuery && displayPacks.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-slate-100 bg-gradient-to-b from-slate-50/40 to-white" id="packs-explore-section">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 text-right" dir="rtl">
              <div className="w-full text-right">

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  🎁 الباكات المدرسية المتكاملة (School Packs)
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                  اختر حقيبة أدوات ابنك مجهزة ومكتملة بضغطة زر واحدة، ووفّر ما يصل إلى 2000 د.ج مقارنة بالشراء المنفرد!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" dir="rtl">
              {displayPacks.map((pack) => {
                const totalItems = pack.packItems ? pack.packItems.reduce((acc, curr) => acc + curr.quantity, 0) : 0;
                
                // Calculate the original price of individual tools inside this pack
                const originalPrice = pack.packItems ? pack.packItems.reduce((sum, item) => {
                  const prod = products.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
                  return sum + (prod ? prod.price * item.quantity : 0);
                }, 0) : 0;

                // Calculate discount percentage
                const discount = originalPrice > pack.price ? Math.round(((originalPrice - pack.price) / originalPrice) * 100) : 0;

                return (
                  <motion.div
                     key={pack.id}
                     whileHover={{ y: -6 }}
                     onClick={() => setActiveProductDetail(pack)}
                     className="relative bg-gradient-to-b from-amber-50/30 via-white to-white rounded-3xl border-2 border-amber-200 hover:border-amber-400 shadow-md hover:shadow-xl overflow-hidden flex flex-col justify-between group transition-all duration-300 text-right cursor-pointer"
                  >
                    <div>
                      {/* 1. صورة الباك (The Pack Image) */}
                      <div className="relative h-52 bg-gradient-to-b from-amber-50/50 to-slate-50/30 flex items-center justify-center p-5 border-b border-amber-100/70">
                        <img
                          src={getCompatibleImageUrl(pack.image)}
                          alt={pack.name}
                          className="max-h-full max-w-full object-contain rounded-2xl group-hover:scale-102 transition-transform duration-500 mix-blend-multiply"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[11px] py-1.5 px-3.5 rounded-full shadow-md z-10 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-yellow-200 animate-pulse shrink-0" />
                          <span>مميز ✨</span>
                        </div>

                        {discount > 0 && (
                          <div className="absolute top-4 left-4 bg-red-650 bg-rose-600 text-white font-black text-xs py-1.5 px-3 rounded-full shadow-md z-10 flex items-center gap-1 animate-pulse">
                            <span>خصم {discount}% 🔥</span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-4">
                        {/* 2. اسم الباك (The Pack Name) */}
                        <div>
                          <h4 className="text-base font-black text-slate-900 leading-snug group-hover:text-amber-600 transition-colors">
                            {pack.name}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Price and Action Section */}
                    <div className="p-5 border-t border-amber-100/50 bg-gradient-to-b from-amber-50/10 to-amber-50/30 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-black block">السعر الإجمالي للباك:</span>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-lg font-black text-emerald-600">{formatPrice(pack.price)}</span>
                            {originalPrice > pack.price && (
                              <span className="text-xs text-slate-400 line-through font-semibold">{formatPrice(originalPrice)}</span>
                            )}
                          </div>
                        </div>
                        {discount > 0 ? (
                          <div className="bg-rose-500/10 text-rose-600 font-black text-xs py-1.5 px-3 rounded-lg border border-rose-500/20">
                            وفر {discount}% 🎉
                          </div>
                        ) : (
                          <div className="bg-amber-100 text-amber-800 font-black text-[10px] py-1 px-3 rounded-lg border border-amber-200/60">
                            توفير مضمون 💎
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveProductDetail(pack);
                          }}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                        >
                          <span>تصفح محتويات الباك 🔍</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* Categories Bento Grid Section */}
        <Categories
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          products={products}
        />

        {/* Dynamic Products Display Header & Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="products-explore-section">
          
          {/* Section Heading & Filter Indicators */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>🎒 المنتجات المعروضة للبيع</span>
                {searchQuery && (
                  <span className="text-sm font-bold text-slate-400">
                    (نتائج البحث عن "{searchQuery}")
                  </span>
                )}
              </h3>
            </div>

            {/* Current Active Filters Badges */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" />
                <span>تصفية نشطة:</span>
              </span>

              {/* Category tag */}
              {selectedCategory !== 'all' && (
                <span className="bg-blue-50 text-brand-blue border border-blue-100 py-1 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <span>فئة: {selectedCategory === 'bags' ? 'حقائب' : selectedCategory === 'notebooks' ? 'دفاتر' : selectedCategory === 'writing' ? 'أقلام' : selectedCategory === 'geometry-art' ? 'هندسة ورسم' : 'إلكترونيات'}</span>
                  <button onClick={() => setSelectedCategory('all')} className="hover:text-red-500 font-bold">×</button>
                </span>
              )}

              {/* Segment tag */}
              {selectedSegment !== 'all' && (
                <span className="bg-purple-50 text-purple-700 border border-purple-100 py-1 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <span>مخصص لـ: {selectedSegment === 'pupils' ? 'التلاميذ' : selectedSegment === 'university' ? 'الجامعيين' : selectedSegment === 'parents' ? 'الأولياء' : 'المؤسسات'}</span>
                  <button onClick={() => setSelectedSegment('all')} className="hover:text-red-500 font-bold">×</button>
                </span>
              )}

              {/* Reset All */}
              {(selectedCategory !== 'all' || selectedSegment !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedSegment('all');
                    setSearchQuery('');
                    showToast('تم إعادة ضبط كافة الفلاتر والتصفيات', 'info');
                  }}
                  className="text-xs text-rose-500 hover:text-rose-700 hover:underline font-bold"
                >
                  إعادة ضبط الكل
                </button>
              )}
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 p-8 shadow-2xs">
              <div className="bg-slate-50 text-slate-300 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10" />
              </div>
              <h4 className="text-lg font-extrabold text-slate-900">عذراً! لا توجد نتائج مطابقة</h4>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto font-semibold leading-relaxed">
                لم نجد أي أدوات مدرسية تطابق معايير التصفية أو البحث الحالية. جرب البحث بكلمة عامة أخرى أو قم بإلغاء بعض التصنيفات المحددة.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSegment('all');
                  setSearchQuery('');
                }}
                className="mt-6 bg-brand-blue text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-sm hover:bg-blue-700 transition-all cursor-pointer"
              >
                إظهار جميع المعروضات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleToggleWishlist}
                  isWishlisted={wishlist.some((item) => item.id === product.id)}
                  onClick={(prod) => {
                    setQuickViewProduct(prod);
                    setIsQuickViewOpen(true);
                  }}
                />
              ))}
            </div>
          )}

        </section>



        {/* High-Fidelity Interactive Track Order & FAQ Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-slate-100" id="help-section">
          <div className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 shadow-sm">
            <h3 className="text-xl font-extrabold text-slate-950 mb-6 flex items-center gap-2">
              <HelpCircle className="text-brand-blue h-5 w-5" />
              <span>الأسئلة الشائعة حول خدماتنا بتوقرت</span>
            </h3>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index} 
                  className="border border-slate-100 rounded-2xl overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                    className="w-full text-right p-4 font-bold text-sm sm:text-base text-slate-800 hover:text-brand-blue flex items-center justify-between gap-4 focus:outline-none bg-slate-50/50"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${activeFaq === index ? 'rotate-180 text-brand-blue' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {activeFaq === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white border-t border-slate-100"
                      >
                        <p className="p-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
          </>
        )}

        {currentView === 'privacy' && (
          <InfoPagesView pageType="privacy" onGoHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        )}

        {currentView === 'terms' && (
          <InfoPagesView pageType="terms" onGoHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        )}

        {currentView === 'shipping' && (
          <InfoPagesView pageType="shipping" onGoHome={() => { setCurrentView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
        )}

        {currentView === 'faq' && (
          <FAQView />
        )}

        {currentView === 'profile' && currentUser && (
          <UserProfileView 
            user={currentUser} 
            allOrders={recentOrders} 
            wishlist={wishlist}
            onRemoveFromWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onLogout={() => {
              setCurrentUser(null);
              setCurrentView('home');
              window.location.hash = '';
              showToast('تم تسجيل الخروج بنجاح. رافقتكم السلامة!', 'info');
            }}
            onUpdateUser={(updatedUser) => {
              setCurrentUser(updatedUser);
              setAllUsers(prev => prev.map(u => u.email === updatedUser.email ? updatedUser : u));
              showToast('تم تحديث بيانات ملفك الشخصي بنجاح!', 'success');
            }}
            formatPrice={formatPrice}
          />
        )}

        {currentView === 'auth' && (
          <AuthView 
            initialMode={authInitialMode}
            onClose={() => {
              setCurrentView('home');
              window.location.hash = '';
            }}
            onAuthSuccess={(user) => {
              setCurrentUser(user);
              setAllUsers((prev) => {
                if (prev.some((u) => u.email === user.email)) {
                  return prev;
                }
                return [...prev, user];
              });
              
              showToast(`مرحباً بك مجدداً، ${user.name}! 👋`, 'success');
              if (user.role === 'admin') {
                setCurrentView('admin');
                window.location.hash = '#admin';
              } else {
                setCurrentView('profile');
                window.location.hash = '#profile';
              }
            }}
          />
        )}
          </>
        )}

      </main>

      {/* Footer Area */}
      <footer className="bg-slate-900 text-white border-t-4 border-brand-blue" id="about-section">
        {/* Upper footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-slate-800">
          
          {/* About Column */}
          <div className="md:col-span-7 space-y-4 text-right">
            <div className="flex items-center gap-2">
              <img 
                src={siteSettings?.logoUrl ? getCompatibleImageUrl(siteSettings.logoUrl) : midadLogo} 
                alt="midad logo" 
                className="w-10 h-10 object-contain shrink-0 rounded-xl" 
                referrerPolicy="no-referrer" 
              />
              <h2 className="text-xl font-black tracking-tight">midad | مداد</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
              متجرنا هو وجهتك الإلكترونية المحلية الأولى بولاية توقرت لشراء كافة اللوازم والمستلزمات المدرسية والأكاديمية بأفضل الأسعار. نسهل حياة التلاميذ والطلبة الجامعيين والأولياء من خلال توصيل السلع الأصلية المضمونة مباشرة لباب منازلكم والدفع عند المعاينة والاستلام.
            </p>
            <div className="flex gap-2 text-xs font-semibold text-slate-300">
              <span className="bg-white/10 px-3 py-1 rounded-md">🇩🇿 ولاية توقرت</span>
              <span className="bg-white/10 px-3 py-1 rounded-md">📦 الدفع عند الاستلام</span>
            </div>
          </div>

          {/* Contact details */}
          <div className="md:col-span-5 space-y-4 text-right">
            <h4 className="text-sm font-black uppercase text-brand-yellow tracking-wider">تواصل معنا هاتفياً أو محلياً</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              نحن سعداء بخدمتكم وتوفير الطلبات الخاصة للمدارس والمؤسسات التربوية والجمعيات الخيرية بتوقرت بأسعار حصرية ومخفضة.
            </p>
            <div className="space-y-2 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-blue" />
                <span>المستودع الرئيسي: حي المستقبل، وسط مدينة توقرت، الجزائر</span>
              </div>
            </div>
          </div>

        </div>

        {/* Lower footer copyright */}
        <div className="bg-slate-950 py-6 px-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <p>© {new Date().getFullYear()} midad | مداد. جميع الحقوق محفوظة لولاية توقرت بالجزائر.</p>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => { setCurrentView('terms'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:underline hover:text-white cursor-pointer">شروط الاستخدام</button>
              <span>•</span>
              <button onClick={() => { setCurrentView('privacy'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:underline hover:text-white cursor-pointer">سياسة الخصوصية</button>
              <span>•</span>
              <button onClick={() => { setCurrentView('shipping'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:underline hover:text-white cursor-pointer">الشحن والإرجاع</button>
              <span>•</span>
              <button onClick={() => { setCurrentView('faq'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:underline hover:text-white cursor-pointer">الأسئلة الشائعة</button>
              <span>•</span>
              <button 
                onClick={() => {
                  setAuthInitialMode('login');
                  setCurrentView('auth');
                  window.location.hash = '#auth/login';
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-extrabold text-slate-400"
              >
                <span>دخول الإدارة 🔑</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Drawers & Modals */}
      
      {/* Cart Drawer Panel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onClearCart={handleClearCart}
      />

      {/* Wishlist Drawer Panel */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout Form Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setDirectPurchaseItem(null);
        }}
        cart={directPurchaseItem ? [directPurchaseItem] : cart}
        onOrderSuccess={handleOrderSuccess}
        onClearCart={directPurchaseItem ? () => setDirectPurchaseItem(null) : handleClearCart}
        isDirect={!!directPurchaseItem}
        municipalities={municipalities}
      />

      {/* Product Quick View Modal */}
      <ProductQuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
        product={quickViewProduct}
        onDirectPurchase={handleDirectPurchase}
        onAddToCart={handleAddToCart}
      />

      {/* Affiliate Earnings & Portal Modal */}
      <AffiliatePortalModal
        isOpen={isAffiliatePortalOpen}
        onClose={() => setIsAffiliatePortalOpen(false)}
        affiliates={affiliates}
        orders={recentOrders}
        formatPrice={formatPrice}
      />

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {isClearCartModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClearCartModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100/50 relative z-10 text-right flex flex-col items-center"
              dir="rtl"
            >
              {/* Icon */}
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl mb-4.5 animate-pulse">
                <Trash2 className="h-7 w-7" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-black text-slate-900 mb-2">
                تفريغ عربة التسوق
              </h3>
              
              {/* Text */}
              <p className="text-slate-500 text-sm font-semibold text-center mb-6 leading-relaxed">
                هل أنت متأكد من حذف جميع المنتجات المتواجدة في سلتك؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={() => {
                    handleClearCart();
                    setIsClearCartModalOpen(false);
                    showToast('تم إفراغ السلة بنجاح 🗑️', 'success');
                  }}
                  className="bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black py-3 px-6 rounded-2xl w-full transition-all cursor-pointer shadow-md shadow-rose-600/10 text-center"
                  id="modal-clear-cart-confirm"
                >
                  نعم، احذف الكل
                </button>
                <button
                  onClick={() => setIsClearCartModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold py-3 px-6 rounded-2xl w-full transition-all cursor-pointer text-center"
                  id="modal-clear-cart-cancel"
                >
                  تراجع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
