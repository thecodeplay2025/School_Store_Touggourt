import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Package, 
  FolderTree, 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Settings, 
  Plus, 
  Minus,
  Edit, 
  Trash2, 
  MapPin, 
  Check, 
  X, 
  Tag, 
  Star, 
  FileText, 
  LogOut, 
  Save, 
  Search,
  CheckCircle,
  Truck,
  Eye,
  AlertTriangle,
  Heart,
  DollarSign,
  Wallet,
  Smartphone,
  Sparkles,
  RefreshCw,
  Upload,
  BookOpen,
  PenTool,
  Palette,
  Cpu,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { Product, Category, Municipality, Order, User, Review, SiteSettings, Affiliate } from '../types';
import { convertGoogleDriveUrl, getCompatibleImageUrl } from '../utils/imageHelper';
import { getProductStock, getStockStatusInfo, isProductAvailable } from '../utils/stockHelper';
import { ImageUploaderWithCompression } from './ImageUploaderWithCompression';
import { FirebaseStorageCard } from './FirebaseStorageCard';
import { updateOrderStatusAtomic } from '../lib/firebase';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

interface AdminDashboardProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  users: User[];
  municipalities: Municipality[];
  reviews: Review[];
  siteSettings: SiteSettings;
  packs: Product[];
  visitorsCount: number;
  onUpdateVisitorsCount: (count: number) => void;
  onUpdatePacks: (packs: Product[]) => void;
  
  onUpdateProducts: (products: Product[]) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onUpdateUsers: (users: User[]) => void;
  onUpdateMunicipalities: (muni: Municipality[]) => void;
  onUpdateReviews: (reviews: Review[]) => void;
  onUpdateSiteSettings: (settings: SiteSettings) => void;
  onLogout: () => void;
  formatPrice: (price: number) => string;
  affiliates: Affiliate[];
  onUpdateAffiliates: (affiliates: Affiliate[]) => void;
  onGoBackToStore?: () => void;
}

const getPublicOrigin = () => {
  return 'https://school-store-touggourt.netlify.app';
};

const adminIconMap: Record<string, { icon: React.ComponentType<any>; label: string }> = {
  ShoppingBag: { icon: ShoppingBag, label: 'حقيبة مدرسية' },
  BookOpen: { icon: BookOpen, label: 'دفتر / كراريس' },
  PenTool: { icon: PenTool, label: 'أقلام وأدوات كتابة' },
  Palette: { icon: Palette, label: 'هندسة ورسم' },
  Cpu: { icon: Cpu, label: 'إلكترونيات وآلة حاسبة' },
  Sparkles: { icon: Sparkles, label: 'بريق ومميز' },
};

export default function AdminDashboard({
  products,
  categories,
  orders,
  users,
  municipalities,
  reviews,
  siteSettings,
  packs,
  visitorsCount,
  onUpdateVisitorsCount,
  onUpdatePacks,
  onUpdateProducts,
  onUpdateCategories,
  onUpdateOrders,
  onUpdateUsers,
  onUpdateMunicipalities,
  onUpdateReviews,
  onUpdateSiteSettings,
  onLogout,
  formatPrice,
  affiliates = [],
  onUpdateAffiliates,
  onGoBackToStore
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'customers' | 'shipping' | 'offers' | 'reviews' | 'settings' | 'packs' | 'sales_stats' | 'affiliates'>('overview');

  const handleAdminGoBack = () => {
    if (editingProduct || isAddingProduct) {
      clearProductForm();
      setIsAddingProduct(false);
      return;
    }
    if (editingPack || isAddingPack) {
      clearPackForm();
      setIsAddingPack(false);
      return;
    }
    if (editingCategory || isAddingCategory) {
      setEditingCategory(null);
      setIsAddingCategory(false);
      return;
    }
    if (editingAffiliate || isAddingAffiliate) {
      setEditingAffiliate(null);
      setIsAddingAffiliate(false);
      return;
    }
    if (editingMuni) {
      setEditingMuni(null);
      return;
    }
    if (activeTab !== 'overview') {
      setActiveTab('overview');
      return;
    }
    if (onGoBackToStore) {
      onGoBackToStore();
    }
  };
  
  // Selected Order for details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Custom Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: 'product' | 'order' | 'pack' | 'visitors_reset' | 'category' | 'affiliate' | 'all_orders';
    title: string;
    message: string;
  } | null>(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sales statistics search and sorting state
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [salesSortKey, setSalesSortKey] = useState<'name' | 'unitsSold' | 'buyers' | 'totalRevenue'>('unitsSold');
  const [salesSortOrder, setSalesSortOrder] = useState<'asc' | 'desc'>('desc');

  // Notifications
  const [noti, setNoti] = useState<{ msg: string; type: 'success' | 'info' } | null>(null);
  const triggerNoti = (msg: string, type: 'success' | 'info' = 'success') => {
    setNoti({ msg, type });
    setTimeout(() => setNoti(null), 3000);
  };

  // --- PRODUCT FORM STATES ---
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState<string>('1000');
  const [prodPurchasePrice, setProdPurchasePrice] = useState<string>('800');
  const [prodStockQuantity, setProdStockQuantity] = useState<number | string>(10);
  const [prodImage, setProdImage] = useState('');
  const [prodCategory, setProdCategory] = useState(categories[0]?.id || 'bags');
  const [prodBrand, setProdBrand] = useState('');
  const [prodFeatures, setProdFeatures] = useState('');
  const [prodInStock, setProdInStock] = useState(true);
  const [prodIsPopular, setProdIsPopular] = useState(false);

  // --- PACK FORM STATES ---
  const [isAddingPack, setIsAddingPack] = useState(false);
  const [editingPack, setEditingPack] = useState<Product | null>(null);
  const [packName, setPackName] = useState('');
  const [packDesc, setPackDesc] = useState('');
  const [packPrice, setPackPrice] = useState(3000);
  const [packImage, setPackImage] = useState('');
  const [packCategory, setPackCategory] = useState(categories[0]?.id || 'bags');
  const [packIsPopular, setPackIsPopular] = useState(false);
  const [packInStock, setPackInStock] = useState(true);
  const [packFeaturesText, setPackFeaturesText] = useState('');
  const [packItemsList, setPackItemsList] = useState<{ id: string; name: string; quantity: number }[]>([]);
  const [tempToolName, setTempToolName] = useState('');
  const [tempToolQty, setTempToolQty] = useState(1);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  const calculatedOriginalPrice = useMemo(() => {
    return packItemsList.reduce((sum, item) => {
      const prod = products.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);
  }, [packItemsList, products]);

  const discountPercentage = useMemo(() => {
    if (calculatedOriginalPrice <= 0) return 0;
    if (packPrice >= calculatedOriginalPrice) return 0;
    return Math.round(((calculatedOriginalPrice - packPrice) / calculatedOriginalPrice) * 100);
  }, [calculatedOriginalPrice, packPrice]);

  // --- CATEGORY FORM STATES ---
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catCount, setCatCount] = useState(0);
  const [catIcon, setCatIcon] = useState('ShoppingBag');

  // --- MUNICIPALITY FORM STATES ---
  const [editingMuni, setEditingMuni] = useState<Municipality | null>(null);
  const [muniName, setMuniName] = useState('');
  const [muniFee, setMuniFee] = useState(150);
  const [muniTime, setMuniTime] = useState('خلال 24 ساعة');
  const [muniAvailable, setMuniAvailable] = useState(true);

  // --- OFFER FORM STATES ---
  const [offerDiscount, setOfferDiscount] = useState(0); // 0-100%

  // --- SETTINGS FORM STATES ---
  const [setStoreName, setSetStoreName] = useState(siteSettings.storeName);
  const [setStoreDesc, setSetStoreDesc] = useState(siteSettings.storeDescription);
  const [setPhone1, setSetPhone1] = useState(siteSettings.contactPhone1);
  const [setPhone2, setSetPhone2] = useState(siteSettings.contactPhone2);
  const [setWarehouse, setSetWarehouse] = useState(siteSettings.warehouseAddress);
  const [setThreshold, setSetThreshold] = useState(siteSettings.freeShippingThreshold);
  const [setBannerText, setSetBannerText] = useState(siteSettings.promoBannerText);
  const [setLogoUrl, setSetLogoUrl] = useState(siteSettings.logoUrl || '');
  const [setCommissionRate, setSetCommissionRate] = useState(siteSettings.referralCommissionRate || 10);

  // Hero / Banner customization
  const [setHeroBadge, setSetHeroBadge] = useState(siteSettings.heroBadge ?? 'عروض توقرت المعتمدة 🇩🇿');
  const [setHeroTitle, setSetHeroTitle] = useState(siteSettings.heroTitle ?? 'أبطال الدراسة');
  const [setHeroSubtitle, setSetHeroSubtitle] = useState(siteSettings.heroSubtitle ?? 'أفضل عروض الأدوات المدرسية والآلات الحاسبة بتخفيضات تصل لـ 30% ✨');
  const [setHeroBgColor, setSetHeroBgColor] = useState(siteSettings.heroBgColor || '#2d3d4c');
  const [setHeroShowImages, setSetHeroShowImages] = useState(siteSettings.heroShowImages ?? true);
  const [setHeroCard1Image, setSetHeroCard1Image] = useState(siteSettings.heroCard1Image || '');
  const [setHeroCard1Title, setSetHeroCard1Title] = useState(siteSettings.heroCard1Title || 'حاسبة كاسيو أصلية');
  const [setHeroCard1Price, setSetHeroCard1Price] = useState(siteSettings.heroCard1Price || 'DA 1,950');
  const [setHeroCard2Image, setSetHeroCard2Image] = useState(siteSettings.heroCard2Image || '');
  const [setHeroCard2Title, setSetHeroCard2Title] = useState(siteSettings.heroCard2Title || 'حقيبة طبية مريحة');
  const [setHeroCard2Price, setSetHeroCard2Price] = useState(siteSettings.heroCard2Price || 'DA 4,350');
  const [setHeroBannerImage, setSetHeroBannerImage] = useState(siteSettings.heroBannerImage || '');

  // --- AFFILIATES FORM STATES ---
  const [isAddingAffiliate, setIsAddingAffiliate] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [affiliateName, setAffiliateName] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateCommissionRate, setAffiliateCommissionRate] = useState<string>('');
  const [affiliatesSearch, setAffiliatesSearch] = useState('');
  const [expandedAffiliateId, setExpandedAffiliateId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdfDirectly = async () => {
    setIsDownloadingPdf(true);
    try {
      const html2pdf = await new Promise<any>((resolve, reject) => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => resolve((window as any).html2pdf);
        script.onerror = (err) => reject(err);
        document.body.appendChild(script);
      });

      const element = document.getElementById('print-report-container');
      if (!element) {
        alert('حدث خطأ: لم يتم العثور على محتوى التقرير المعني بالتصدير.');
        setIsDownloadingPdf(false);
        return;
      }

      // Temporarily show the element off-screen so html2canvas can capture it properly
      const originalClassName = element.className;
      const originalStylePosition = element.style.position;
      const originalStyleLeft = element.style.left;
      const originalStyleTop = element.style.top;
      const originalStyleWidth = element.style.width;

      element.className = "bg-white text-slate-900 p-8 text-right text-xs space-y-6 leading-relaxed block";
      element.style.position = "absolute";
      element.style.left = "-9999px";
      element.style.top = "0";
      element.style.width = "850px";

      const opt = {
        margin:       [12, 12, 12, 12],
        filename:     `تقرير_نشاط_متجر_توقرت_${new Date().toISOString().slice(0, 10)}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();

      // Restore style attributes
      element.className = originalClassName;
      element.style.position = originalStylePosition;
      element.style.left = originalStyleLeft;
      element.style.top = originalStyleTop;
      element.style.width = originalStyleWidth;
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('حدث خطأ فني أثناء تحويل وتنزيل مستند PDF المباشر.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // --- SALES STATISTICS COMPUTATIONS ---
  const processedStats = useMemo(() => {
    const statsMap: Record<string, { 
      id: string;
      name: string; 
      image: string; 
      category: string;
      isPack: boolean;
      price: number;
      unitsSold: number; 
      buyers: Set<string>;
    }> = {};

    // Initialize with all existing products
    products.forEach(p => {
      statsMap[p.name] = {
        id: p.id,
        name: p.name,
        image: p.image,
        category: p.category,
        isPack: false,
        price: p.price,
        unitsSold: 0,
        buyers: new Set<string>()
      };
    });

    // Initialize with all existing packs
    packs.forEach(p => {
      statsMap[p.name] = {
        id: p.id,
        name: p.name,
        image: p.image,
        category: p.category,
        isPack: true,
        price: p.price,
        unitsSold: 0,
        buyers: new Set<string>()
      };
    });

    // Aggregate from all actual orders (only when delivered)
    orders.forEach(order => {
      if (order.status !== 'delivered') return;
      const customerId = order.phone.trim() || order.customerName.trim();
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!item || !item.product) return;
          const p = item.product;
          const qty = item.quantity || 0;
          
          if (!statsMap[p.name]) {
            statsMap[p.name] = {
              id: p.id,
              name: p.name,
              image: p.image,
              category: p.category || 'other',
              isPack: !!p.isPack,
              price: p.price,
              unitsSold: 0,
              buyers: new Set<string>()
            };
          }
          
          statsMap[p.name].unitsSold += qty;
          if (customerId) {
            statsMap[p.name].buyers.add(customerId);
          }
        });
      }
    });

    // Map to array with computed fields
    let result = Object.values(statsMap).map(item => ({
      ...item,
      uniqueBuyersCount: item.buyers.size,
      totalRevenue: item.unitsSold * item.price
    }));

    // Filter by search term
    if (salesSearchTerm.trim()) {
      const term = salesSearchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: any;
      let valB: any;

      if (salesSortKey === 'name') {
        valA = a.name;
        valB = b.name;
        return salesSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (salesSortKey === 'buyers') {
        valA = a.uniqueBuyersCount;
        valB = b.uniqueBuyersCount;
      } else if (salesSortKey === 'totalRevenue') {
        valA = a.totalRevenue;
        valB = b.totalRevenue;
      } else {
        valA = a.unitsSold;
        valB = b.unitsSold;
      }

      return salesSortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [orders, products, packs, salesSearchTerm, salesSortKey, salesSortOrder]);

  const salesSummary = useMemo(() => {
    let totalUnitsSold = 0;
    const bestSellerMap: Record<string, number> = {};
    const allUniqueBuyers = new Set<string>();

    orders.forEach(order => {
      if (order.status !== 'delivered') return;
      const customerId = order.phone.trim() || order.customerName.trim();
      if (customerId) {
        allUniqueBuyers.add(customerId);
      }

      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!item || !item.product) return;
          const p = item.product;
          const qty = item.quantity || 0;
          totalUnitsSold += qty;

          bestSellerMap[p.name] = (bestSellerMap[p.name] || 0) + qty;
        });
      }
    });

    // Find best-selling product
    let bestSellerName = 'لا يوجد';
    let bestSellerQty = 0;
    Object.entries(bestSellerMap).forEach(([name, qty]) => {
      if (qty > bestSellerQty) {
        bestSellerName = name;
        bestSellerQty = qty;
      }
    });

    return {
      totalUnitsSold,
      bestSeller: { name: bestSellerName, unitsSold: bestSellerQty },
      uniqueBuyersCount: allUniqueBuyers.size
    };
  }, [orders]);

  // Daily Sales Analysis for Chart
  const salesOverTime = useMemo(() => {
    const dailyData: Record<string, { date: string; dateLabel: string; ordersCount: number; unitsSold: number; revenue: number }> = {};

    // Sort orders by date chronologically
    const sortedOrders = [...orders].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    sortedOrders.forEach(order => {
      let dateStr = '';
      try {
        const d = new Date(order.date);
        if (!isNaN(d.getTime())) {
          dateStr = d.toISOString().split('T')[0];
        } else {
          dateStr = String(order.date).split('T')[0] || 'أخرى';
        }
      } catch (e) {
        dateStr = 'أخرى';
      }

      if (!dailyData[dateStr]) {
        let dateLabel = dateStr;
        try {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
            dateLabel = d.toLocaleDateString('ar-DZ', options);
          }
        } catch (err) {}

        dailyData[dateStr] = {
          date: dateStr,
          dateLabel,
          ordersCount: 0,
          unitsSold: 0,
          revenue: 0,
        };
      }

      dailyData[dateStr].ordersCount += 1;
      
      let itemsQty = 0;
      if (order.status === 'delivered' && order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          itemsQty += (item.quantity || 0);
        });
      }
      dailyData[dateStr].unitsSold += itemsQty;
      dailyData[dateStr].revenue += order.total;
    });

    const chartData = Object.values(dailyData).sort((a, b) => {
      if (a.date === 'أخرى') return 1;
      if (b.date === 'أخرى') return -1;
      return a.date.localeCompare(b.date);
    });

    if (chartData.length === 0) {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
        chartData.push({
          date: dateStr,
          dateLabel: d.toLocaleDateString('ar-DZ', options),
          ordersCount: 0,
          unitsSold: 0,
          revenue: 0
        });
      }
    }

    return chartData;
  }, [orders]);

  // --- STATS COMPUTATIONS ---
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);
  }, [orders]);

  const totalProfit = useMemo(() => {
    return orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => {
        const orderProfit = o.items.reduce((itemSum, item) => {
          const sellPrice = item.product.price;
          const activeProd = products.find(p => p.id === item.product.id) || packs.find(p => p.id === item.product.id);
          const purchasePrice = activeProd?.purchasePrice !== undefined
            ? activeProd.purchasePrice
            : item.product.purchasePrice !== undefined
              ? item.product.purchasePrice
              : Math.round(sellPrice * 0.8);
          
          return itemSum + (sellPrice - purchasePrice) * item.quantity;
        }, 0);
        
        // Deduct the affiliate commission from the net collected profit if commission has been calculated
        const commissionPaid = o.commissionCalculated && o.commissionAmount ? o.commissionAmount : 0;
        
        return sum + (orderProfit - commissionPaid);
      }, 0);
  }, [orders, products, packs]);

  const totalExpectedProfit = useMemo(() => {
    return orders
      .reduce((sum, o) => {
        const orderProfit = o.items.reduce((itemSum, item) => {
          const sellPrice = item.product.price;
          const activeProd = products.find(p => p.id === item.product.id) || packs.find(p => p.id === item.product.id);
          const purchasePrice = activeProd?.purchasePrice !== undefined
            ? activeProd.purchasePrice
            : item.product.purchasePrice !== undefined
              ? item.product.purchasePrice
              : Math.round(sellPrice * 0.8);
          
          return itemSum + (sellPrice - purchasePrice) * item.quantity;
        }, 0);
        return sum + orderProfit;
      }, 0);
  }, [orders, products, packs]);

  const stats = useMemo(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const confirmedOrders = orders.filter(o => o.status === 'confirmed').length;
    const shippedOrders = orders.filter(o => o.status === 'shipped').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

    return {
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      deliveredOrders,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCustomers: users.length + 12, // Simulate with some preloaded accounts
    };
  }, [orders, products, users]);

  // --- INVENTORY STATS COMPUTATIONS ---
  const inventoryStats = useMemo(() => {
    let totalPurchaseCost = 0;
    let totalPotentialRevenue = 0;
    let totalPotentialProfit = 0;
    let totalQuantity = 0;

    products.forEach(p => {
      const purchasePrice = p.purchasePrice !== undefined ? p.purchasePrice : Math.round(p.price * 0.8);
      const quantity = getProductStock(p);
      
      totalPurchaseCost += purchasePrice * quantity;
      totalPotentialRevenue += p.price * quantity;
      totalPotentialProfit += (p.price - purchasePrice) * quantity;
      totalQuantity += quantity;
    });

    return {
      totalPurchaseCost,
      totalPotentialRevenue,
      totalPotentialProfit,
      totalQuantity
    };
  }, [products]);

  // Save Settings
  const handleSettingsSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSiteSettings({
      storeName: setStoreName,
      storeDescription: setStoreDesc,
      contactPhone1: setPhone1,
      contactPhone2: setPhone2,
      warehouseAddress: setWarehouse,
      freeShippingThreshold: setThreshold,
      promoBannerText: setBannerText,
      logoUrl: setLogoUrl || undefined,
      referralCommissionRate: Number(setCommissionRate),
      heroBadge: setHeroBadge,
      heroTitle: setHeroTitle,
      heroSubtitle: setHeroSubtitle,
      heroBgColor: setHeroBgColor,
      heroShowImages: setHeroShowImages,
      heroCard1Image: setHeroCard1Image || undefined,
      heroCard1Title: setHeroCard1Title,
      heroCard1Price: setHeroCard1Price,
      heroCard2Image: setHeroCard2Image || undefined,
      heroCard2Title: setHeroCard2Title,
      heroCard2Price: setHeroCard2Price,
      heroBannerImage: setHeroBannerImage || undefined,
    });
    triggerNoti('تم حفظ إعدادات الموقع والبانر بنجاح!');
  };

  // Delete Product
  const handleDeleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setDeleteConfirm({
      id,
      type: 'product',
      title: 'حذف المنتج نهائياً 🗑️',
      message: `هل أنت متأكد من رغبتك في حذف المنتج "${prod?.name || id}" نهائياً من قاعدة بيانات المتجر؟ لن يكون بإمكان الزوار تصفحه أو طلبه مجدداً.`
    });
  };

  // Add/Edit Product Save
  const [stockFilterTab, setStockFilterTab] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  const handleProductSave = (e: React.FormEvent) => {
    e.preventDefault();
    const featuresList = prodFeatures.split(',').map(f => f.trim()).filter(Boolean);

    const finalImage = convertGoogleDriveUrl(prodImage) || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600';

    const parsedPrice = parseFloat(String(prodPrice).replace(',', '.')) || 0;
    const parsedPurchasePrice = parseFloat(String(prodPurchasePrice).replace(',', '.')) || 0;
    const numericStock = Math.max(0, Math.floor(Number(prodStockQuantity) || 0));
    const computedInStock = prodInStock && numericStock > 0;

    if (editingProduct) {
      // Edit
      const updated = products.map(p => p.id === editingProduct.id ? {
        ...p,
        name: prodName,
        description: prodDesc,
        price: parsedPrice,
        purchasePrice: parsedPurchasePrice,
        stock: numericStock,
        stockQuantity: numericStock,
        image: finalImage,
        category: prodCategory,
        brand: prodBrand,
        features: featuresList,
        inStock: computedInStock,
        isPopular: prodIsPopular
      } : p);
      onUpdateProducts(updated);
      setEditingProduct(null);
      triggerNoti('تم تعديل بيانات ومخزون المنتج بنجاح');
    } else {
      // Create new
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        name: prodName,
        description: prodDesc,
        price: parsedPrice,
        purchasePrice: parsedPurchasePrice,
        stock: numericStock,
        stockQuantity: numericStock,
        image: finalImage,
        category: prodCategory || categories[0]?.id || 'bags',
        rating: 5.0,
        brand: prodBrand || 'مدرستنا',
        features: featuresList.length ? featuresList : ['مستلزم عالي الجودة لولاية توقرت'],
        inStock: computedInStock,
        isPopular: prodIsPopular
      };
      onUpdateProducts([newProd, ...products]);
      setIsAddingProduct(false);
      triggerNoti('تمت إضافة المنتج الجديد وتحديث المخزون بنجاح!');
    }
    // Reset Form
    clearProductForm();
  };

  const clearProductForm = () => {
    setProdName('');
    setProdDesc('');
    setProdPrice('1000');
    setProdPurchasePrice('800');
    setProdStockQuantity(10);
    setProdImage('');
    setProdCategory(categories[0]?.id || 'bags');
    setProdBrand('');
    setProdFeatures('');
    setProdInStock(true);
    setProdIsPopular(false);
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setIsAddingProduct(true);
    setProdName(p.name);
    setProdDesc(p.description);
    setProdPrice(p.price.toString());
    setProdPurchasePrice(p.purchasePrice !== undefined ? p.purchasePrice.toString() : Math.round(p.price * 0.8).toString());
    setProdStockQuantity(getProductStock(p));
    setProdImage(p.image);
    setProdCategory(p.category);
    setProdBrand(p.brand || '');
    setProdFeatures(p.features.join(', '));
    setProdInStock(p.inStock && getProductStock(p) > 0);
    setProdIsPopular(p.isPopular);

    // Smooth scroll to product edit form with top offset
    setTimeout(() => {
      const formEl = document.getElementById('product-edit-form');
      if (formEl) {
        const topOffset = 80;
        const elementPosition = formEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - topOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
        const nameInput = document.getElementById('product-name-input') as HTMLInputElement | null;
        if (nameInput) {
          nameInput.focus();
        }
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  // Set Product Stock directly from keyboard input in products table
  const handleSetProductStockDirect = (p: Product, newStockValue: number) => {
    const numericStock = Math.max(0, isNaN(newStockValue) ? 0 : Math.floor(newStockValue));
    const inStock = numericStock > 0;
    const updated = products.map(item => item.id === p.id ? {
      ...item,
      stock: numericStock,
      stockQuantity: numericStock,
      inStock: inStock
    } : item);
    onUpdateProducts(updated);
  };

  // Adjust Product Stock directly (+/- delta)
  const handleAdjustProductStock = (p: Product, delta: number) => {
    const currentStock = getProductStock(p);
    const newStock = Math.max(0, currentStock + delta);
    const inStock = newStock > 0;
    const updated = products.map(item => item.id === p.id ? {
      ...item,
      stock: newStock,
      stockQuantity: newStock,
      inStock: inStock
    } : item);
    onUpdateProducts(updated);
  };

  // Toggle Stock status directly
  const handleToggleStock = (p: Product) => {
    const currentStock = getProductStock(p);
    const nextInStock = !p.inStock;
    const nextStock = nextInStock ? (currentStock > 0 ? currentStock : 10) : 0;
    const updated = products.map(item => item.id === p.id ? { 
      ...item, 
      inStock: nextInStock,
      stock: nextStock,
      stockQuantity: nextStock
    } : item);
    onUpdateProducts(updated);
    triggerNoti(`تم تغيير حالة توفر المنتج: ${p.name}`);
  };

  // Order status update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    console.log(`%c[REFERRAL TRACE - STATUS UPDATE] Admin triggered status update...`, "color: #eab308; font-weight: bold;");
    console.log(`[REFERRAL TRACE - STATUS UPDATE] Order ID: "${orderId}", New Target Status: "${newStatus}"`);
    
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) {
      console.error(`[REFERRAL TRACE - STATUS UPDATE] [FAIL] Order with ID ${orderId} not found in local orders state.`);
      return;
    }

    console.log(`[REFERRAL TRACE - STATUS UPDATE] Order Info:`);
    console.log(`   - Customer Name: "${originalOrder.customerName}"`);
    console.log(`   - Current Status: "${originalOrder.status}"`);
    console.log(`   - Referrer Code in Order: "${originalOrder.referrer || 'None'}"`);
    console.log(`   - Total Order Value: ${originalOrder.total} DA`);
    console.log(`   - Has Commission Been Calculated Already?: ${originalOrder.commissionCalculated || false}`);

    const isMovingToDelivered = (newStatus === 'delivered' || (newStatus as string) === 'completed');
    let commission = 0;

    if (isMovingToDelivered && originalOrder.referrer && !originalOrder.commissionCalculated) {
      const code = originalOrder.referrer.trim().toUpperCase();
      console.log(`[REFERRAL TRACE - STATUS UPDATE] Order is transitioning to delivered/completed & has active referrer "${code}". Finding commission rate...`);
      const affiliateObj = affiliates.find(a => a.code.toUpperCase() === code);
      const rate = affiliateObj && (affiliateObj.commissionRate !== undefined && affiliateObj.commissionRate !== null)
        ? affiliateObj.commissionRate
        : (siteSettings.referralCommissionRate || 10);
      
      // Calculate order profit
      const orderProfit = originalOrder.items.reduce((itemSum, item) => {
        const sellPrice = item.product.price;
        const activeProd = products.find(p => p.id === item.product.id) || packs.find(p => p.id === item.product.id);
        const purchasePrice = activeProd?.purchasePrice !== undefined
          ? activeProd.purchasePrice
          : item.product.purchasePrice !== undefined
            ? item.product.purchasePrice
            : Math.round(sellPrice * 0.8);
        
        return itemSum + (sellPrice - purchasePrice) * item.quantity;
      }, 0);

      const cleanProfit = Math.max(0, orderProfit);
      commission = Math.round(cleanProfit * (rate / 100));
      console.log(`[REFERRAL TRACE - STATUS UPDATE] Profit-based commission calculation:`);
      console.log(`   - Order Gross Profit: ${orderProfit} DA`);
      console.log(`   - Cleaned Profit (min 0): ${cleanProfit} DA`);
      console.log(`   - Affiliate Commission Rate: ${rate}%`);
      console.log(`   - Calculated Commission (Profit * Rate): ${commission} DA`);
    } else {
      console.log(`[REFERRAL TRACE - STATUS UPDATE] No commission calculation triggers met for this status update.`);
    }

    try {
      await updateOrderStatusAtomic(
        orderId, 
        newStatus, 
        commission, 
        originalOrder.referrer || "", 
        originalOrder.total
      );

      triggerNoti(`تم تغيير حالة الطلبية رقم ${orderId} بنجاح`);
      if (commission > 0) {
        const affiliateName = affiliates.find(a => a.code.toUpperCase() === (originalOrder.referrer || "").trim().toUpperCase())?.name || originalOrder.referrer;
        triggerNoti(`تم توصيل الطلبية واحتساب عمولة بقيمة ${formatPrice(commission)} للمسوّق ${affiliateName}`);
      }
    } catch (err: any) {
      console.error("[REFERRAL TRACE - STATUS UPDATE] [ERROR] updateOrderStatusAtomic failed:", err);
      triggerNoti(`فشل تحديث حالة الطلبية: ${err.message || err}`, "info");
    }
  };

  // Delete Order
  const handleDeleteOrder = (orderId: string) => {
    setDeleteConfirm({
      id: orderId,
      type: 'order',
      title: 'حذف الطلبية نهائياً 🗑️',
      message: `هل أنت متأكد من رغبتك في حذف الطلبية رقم "${orderId}" نهائياً من سجلات الإدارة؟ لا يمكن استرجاع هذا السجل بعد حذفه.`
    });
  };

  // Delete All Orders
  const handleDeleteAllOrders = () => {
    if (orders.length === 0) {
      triggerNoti('لا توجد أي طلبيات لحذفها حالياً');
      return;
    }
    setDeleteConfirm({
      id: 'all_orders',
      type: 'all_orders',
      title: 'حذف جميع الطلبيات نهائياً 🗑️',
      message: `تحذير: هل أنت متأكد تماماً من رغبتك في حذف جميع الطلبيات (${orders.length} طلبية) نهائياً من قاعدة البيانات والمتجر؟ هذا الإجراء سيقوم بمسح كافة سجلات الطلبيات بالكامل ولا يمكن التراجع عنه.`
    });
  };

  // Execute actual deletion from state (replacing native blocking confirm dialogs)
  const handleExecuteDelete = () => {
    if (!deleteConfirm) return;
    const { id, type } = deleteConfirm;
    if (type === 'product') {
      const updated = products.filter(p => p.id !== id);
      onUpdateProducts(updated);
      triggerNoti('تم حذف المنتج بنجاح');
    } else if (type === 'order') {
      const updated = orders.filter(o => o.id !== id);
      onUpdateOrders(updated);
      triggerNoti(`تم حذف الطلبية رقم ${id} بنجاح`);
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
      }
    } else if (type === 'all_orders') {
      onUpdateOrders([]);
      setSelectedOrder(null);
      triggerNoti('تم حذف جميع الطلبيات نهائياً بنجاح');
    } else if (type === 'pack') {
      const updated = packs.filter(p => p.id !== id);
      onUpdatePacks(updated);
      triggerNoti('تم حذف الباك بنجاح');
    } else if (type === 'visitors_reset') {
      onUpdateVisitorsCount(0);
      triggerNoti('تم تصفير عدد زوار الموقع بنجاح');
    } else if (type === 'category') {
      const updated = categories.filter(c => c.id !== id);
      onUpdateCategories(updated);
      triggerNoti('تم حذف التصنيف بنجاح');
    } else if (type === 'affiliate') {
      const updated = affiliates.filter(a => a.id !== id);
      onUpdateAffiliates(updated);
      triggerNoti('تم حذف المسوق بالعمولة بنجاح');
    }
    setDeleteConfirm(null);
  };

  const startEditAffiliate = (aff: Affiliate) => {
    setEditingAffiliate(aff);
    setAffiliateName(aff.name);
    setAffiliateCode(aff.code);
    setAffiliateCommissionRate(aff.commissionRate !== undefined && aff.commissionRate !== null ? String(aff.commissionRate) : '');
    setIsAddingAffiliate(true);
  };

  const handleDeleteAffiliate = (id: string, name: string) => {
    setDeleteConfirm({
      id,
      type: 'affiliate',
      title: 'حذف المسوّق بالكامل 🗑️',
      message: `هل أنت متأكد من حذف المسوق "${name}"؟ سيتم حذف بياناته وسجله بالكامل من لوحة التحكم.`
    });
  };

  // --- PACK FORM ACTIONS ---
  const handlePackSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName.trim() || !packImage.trim()) {
      triggerNoti('يرجى ملء جميع الحقول الإلزامية!', 'info');
      return;
    }
    if (packItemsList.length === 0) {
      triggerNoti('يرجى إضافة أداة واحدة على الأقل داخل الباك!', 'info');
      return;
    }

    const featuresArray = packFeaturesText
      ? packFeaturesText.split(',').map(f => f.trim()).filter(Boolean)
      : ['باك متكامل موفر', 'أدوات ممتازة ومجربة', 'أفضل سعر بولاية توقرت'];

    if (editingPack) {
      // Edit mode
      const updated = packs.map(p => p.id === editingPack.id ? {
        ...p,
        name: packName.trim(),
        description: packDesc.trim(),
        price: Number(packPrice),
        image: packImage.trim(),
        category: packCategory,
        inStock: packInStock,
        isPopular: packIsPopular,
        packItems: packItemsList,
        features: featuresArray,
      } : p);
      onUpdatePacks(updated);
      setEditingPack(null);
      setIsAddingPack(false);
      triggerNoti('تم تحديث بيانات الباك بنجاح!');
    } else {
      // Create mode
      const newPack: Product = {
        id: 'pack-' + Date.now(),
        name: packName.trim(),
        description: packDesc.trim(),
        price: Number(packPrice),
        image: packImage.trim(),
        category: packCategory,
        rating: 4.8,
        inStock: packInStock,
        isPopular: packIsPopular,
        brand: 'SchoolStore',
        features: featuresArray,
        isPack: true,
        packItems: packItemsList
      };
      onUpdatePacks([...packs, newPack]);
      setIsAddingPack(false);
      triggerNoti('تمت إضافة الباك الجديد بنجاح!');
    }
    clearPackForm();
  };

  const clearPackForm = () => {
    setPackName('');
    setPackDesc('');
    setPackPrice(3000);
    setPackImage('');
    setPackCategory(categories[0]?.id || 'bags');
    setPackIsPopular(false);
    setPackInStock(true);
    setPackFeaturesText('');
    setPackItemsList([]);
    setTempToolName('');
    setTempToolQty(1);
    setEditingPack(null);
  };

  const startEditPack = (p: Product) => {
    setEditingPack(p);
    setIsAddingPack(true);
    setPackName(p.name);
    setPackDesc(p.description);
    setPackPrice(p.price);
    setPackImage(p.image);
    setPackCategory(p.category);
    setPackIsPopular(p.isPopular);
    setPackInStock(p.inStock);
    setPackFeaturesText(p.features ? p.features.join(', ') : '');
    setPackItemsList(p.packItems || []);

    // Smooth scroll to pack edit form with top offset
    setTimeout(() => {
      const formEl = document.getElementById('pack-edit-form');
      if (formEl) {
        const topOffset = 80;
        const elementPosition = formEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - topOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleDeletePack = (packId: string, packName: string) => {
    setDeleteConfirm({
      id: packId,
      type: 'pack',
      title: 'حذف الباك نهائياً 🗑️',
      message: `هل أنت متأكد من رغبتك في حذف الباك "${packName}" نهائياً من المتجر؟ لا يمكن التراجع عن هذا الإجراء.`
    });
  };

  const handleAddToolRow = () => {
    if (!tempToolName.trim()) return;
    const newItem = {
      id: 'tool-' + Date.now() + Math.random().toString(36).substr(2, 4),
      name: tempToolName.trim(),
      quantity: Number(tempToolQty) || 1
    };
    setPackItemsList([...packItemsList, newItem]);
    setTempToolName('');
    setTempToolQty(1);
  };

  const handleDirectAddTool = (toolName: string) => {
    const trimmed = toolName.trim();
    if (!trimmed) return;
    
    const existingIndex = packItemsList.findIndex(
      item => item.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    
    if (existingIndex !== -1) {
      const updated = [...packItemsList];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + 1
      };
      setPackItemsList(updated);
    } else {
      const newItem = {
        id: 'tool-' + Date.now() + Math.random().toString(36).substr(2, 4),
        name: trimmed,
        quantity: 1
      };
      setPackItemsList([...packItemsList, newItem]);
    }
    setTempToolName('');
    setShowProductSuggestions(false);
  };

  const handleRemoveToolRow = (id: string) => {
    setPackItemsList(packItemsList.filter(item => item.id !== id));
  };

  const handleUpdateToolQty = (id: string, newQty: number) => {
    setPackItemsList(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, newQty) } : item));
  };

  // Category Edit / Add Save
  const handleCategorySave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      const updated = categories.map(c => c.id === editingCategory.id ? {
        ...c,
        name: catName,
        image: catImage || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600',
        iconName: catIcon,
        count: products.filter(p => p.category === c.id).length
      } : c);
      onUpdateCategories(updated);
      setEditingCategory(null);
      setCatName('');
      setCatImage('');
      setCatIcon('ShoppingBag');
      triggerNoti('تم تحديث تصنيف الأدوات المدرسية بنجاح');
    } else if (isAddingCategory) {
      const categoryId = catName.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      const finalId = categoryId || 'cat-' + Date.now();

      if (categories.some(c => c.id === finalId)) {
        triggerNoti('هذا التصنيف موجود بالفعل بنفس المعرف', 'info');
        return;
      }

      const newCat: Category = {
        id: finalId,
        name: catName,
        image: catImage || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600',
        iconName: catIcon,
        count: 0,
        colorClass: 'bg-brand-blue/10 border-brand-blue text-brand-blue'
      };

      onUpdateCategories([...categories, newCat]);
      setIsAddingCategory(false);
      setCatName('');
      setCatImage('');
      setCatIcon('ShoppingBag');
      triggerNoti('تم إضافة التصنيف الجديد بنجاح');
    }
  };

  // Delete Category
  const handleDeleteCategory = (catId: string, catName: string) => {
    const associatedProducts = products.filter(p => p.category === catId).length;
    const associatedPacks = packs.filter(p => p.category === catId).length;
    
    let warningMsg = `هل أنت متأكد من رغبتك في حذف تصنيف "${catName}" نهائياً من قاعدة بيانات المتجر؟ لا يمكن التراجع عن هذا الإجراء.`;
    if (associatedProducts > 0 || associatedPacks > 0) {
      warningMsg += ` تنبيه هام: يوجد ${associatedProducts} منتج و ${associatedPacks} باك مدرسي مرتبطين بهذا التصنيف حالياً.`;
    }

    setDeleteConfirm({
      id: catId,
      type: 'category',
      title: 'حذف تصنيف السلع 🗑️',
      message: warningMsg
    });
  };

  // Shipping Municipality Save
  const handleMuniSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMuni) {
      const updated = municipalities.map(m => m.name === editingMuni.name ? {
        ...m,
        shippingFee: muniFee,
        deliveryTime: muniTime,
        available: muniAvailable
      } : m);
      onUpdateMunicipalities(updated);
      setEditingMuni(null);
      triggerNoti('تم حفظ رسوم الشحن وحالة التوفر المحدثة للبلدية بنجاح');
    }
  };

  // Review Status Update
  const handleReviewStatus = (reviewId: string, status: Review['status']) => {
    const updated = reviews.map(r => r.id === reviewId ? { ...r, status } : r);
    onUpdateReviews(updated);
    triggerNoti(`تم تحديث تقييم المنتج وتعديل عرضه`);
  };

  // Stock statistics
  const stockStats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => isProductAvailable(p) && getProductStock(p) > 5).length;
    const lowStock = products.filter(p => isProductAvailable(p) && getProductStock(p) >= 1 && getProductStock(p) <= 5).length;
    const outOfStock = products.filter(p => !isProductAvailable(p) || getProductStock(p) <= 0).length;
    return { total, inStock, lowStock, outOfStock };
  }, [products]);

  // Filter lists based on search & stock filter
  const filteredProductsList = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;

      const stock = getProductStock(p);
      const available = isProductAvailable(p);

      if (stockFilterTab === 'in_stock') return available && stock > 5;
      if (stockFilterTab === 'low_stock') return available && stock >= 1 && stock <= 5;
      if (stockFilterTab === 'out_of_stock') return !available || stock <= 0;
      return true;
    });
  }, [products, searchTerm, stockFilterTab]);

  const filteredOrdersList = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col" id="admin-main-view">
      
      {/* Admin Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-xs gap-3">
        <div className="flex items-center gap-2.5">
          {/* Universal Admin Step Back Button */}
          <button
            type="button"
            onClick={handleAdminGoBack}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-brand-blue hover:text-white text-slate-800 font-extrabold text-xs px-3 py-2 rounded-xl transition-all border border-slate-200 hover:border-brand-blue shadow-xs cursor-pointer group shrink-0"
            title="الرجوع خطوة للخلف"
          >
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            <span className="hidden sm:inline">
              {editingProduct || editingPack || isAddingProduct || isAddingPack ? 'إلغاء وتراجع' : activeTab !== 'overview' ? 'الرجوع للإحصائيات' : 'رجوع للمتجر'}
            </span>
          </button>

          <div className="bg-brand-blue text-white p-2 rounded-xl shadow-xs shrink-0">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="text-right">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">لوحة التحكم والمخزون</h1>
            <p className="text-[10px] text-slate-500 font-bold">midad | مداد • إدارة المتجر</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          {onGoBackToStore && (
            <button
              onClick={onGoBackToStore}
              className="bg-blue-50 hover:bg-blue-100 text-brand-blue px-3.5 py-2.5 rounded-xl text-xs font-black transition-all border border-blue-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="الرجوع إلى المتجر الرئيسي للزبائن"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">الرجوع للمتجر</span>
            </button>
          )}
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold block text-slate-800">{siteSettings.storeName}</span>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">مدير عام المتجر</span>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-black transition-all border border-red-200 flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="تسجيل الخروج من لوحة التحكم"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">تسجيل خروج</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* Navigation Sidebar Panel */}
        <aside className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-l border-slate-200 p-3 space-y-1.5 shrink-0 text-right shadow-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span>لوحة الإحصائيات</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_stats')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sales_stats' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>إحصائيات المبيعات</span>
          </button>

          <button
            onClick={() => { setActiveTab('products'); clearProductForm(); setIsAddingProduct(false); }}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'products' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0" />
              <span>المنتجات والمخزون</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>{products.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('packs'); clearPackForm(); setIsAddingPack(false); }}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'packs' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>إدارة الباكات</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'packs' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>{packs.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'categories' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FolderTree className="h-4 w-4 shrink-0" />
            <span>إدارة التصنيفات</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'orders' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>إدارة الطلبات</span>
            </div>
            {stats.pendingOrders > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                {stats.pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'shipping' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>البلديات والشحن</span>
          </button>

          <button
            onClick={() => setActiveTab('affiliates')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'affiliates' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>المسوّقون بالعمولة</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === 'affiliates' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>{affiliates?.length || 0}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-brand-blue text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>إعدادات الموقع</span>
          </button>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 bg-slate-100 overflow-y-auto p-4 sm:p-6">
          
          {/* Internal Toast Feedback */}
          {noti && (
            <div className="mb-6 bg-emerald-500 text-white p-4 rounded-2xl text-xs font-black flex items-center gap-2.5 shadow-md border border-emerald-400/30">
              <Check className="h-5 w-5 shrink-0" />
              <span>{noti.msg}</span>
            </div>
          )}

          {/* Tab 1: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-8 text-right">
              {/* PDF Report Generation Panel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:border-slate-300">
                <div className="flex items-start gap-4">
                  <div className="p-3.5 bg-brand-blue/10 text-brand-blue rounded-2xl shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <span>نظام التقارير الذكي وتصدير PDF</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] rounded-full font-black">جاهز للطباعة</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed max-w-2xl">
                      قم بتوليد تقرير رسمي شامل يحاكي نشاط المتجر بالكامل؛ ويشمل ذلك مؤشرات المبيعات، الأرباح الصافية، والكميات المتبقية من السلع، مع جرد دقيق لأرباح ومبيعات كل مسوّق مسجل وقائمة الزبائن بالتفصيل.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="bg-brand-blue hover:bg-brand-blue/95 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow shrink-0"
                >
                  <FileText className="h-4.5 w-4.5" />
                  <span>توليد التقرير الشامل (PDF)</span>
                </button>
              </div>

              {/* Main Bento Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-black">إجمالي إيرادات المتجر</span>
                    <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-emerald-600">{formatPrice(totalRevenue)}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">من الطلبيات المستلمة والمسلمة بالكامل</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-black">صافي الأرباح المحصلة</span>
                    <span className="p-2 bg-teal-50 text-teal-600 rounded-xl"><TrendingUp className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-teal-600">{formatPrice(totalProfit)}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold">
                    الربح المتوقع الإجمالي: <span className="text-slate-900 font-mono">{formatPrice(totalExpectedProfit)}</span>
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-black">إجمالي الطلبات المستلمة</span>
                    <span className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl"><ShoppingBag className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-slate-900">{stats.totalOrders} طلبية</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">بما في ذلك الطلبات قيد التجهيز والتأكيد</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-black">السلع والمنتجات المعروضة</span>
                    <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Package className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-slate-900">{stats.totalProducts} منتج</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">موزعة على كافة باقات المدارس والجامعات</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-xs font-black">عدد الزوار للموقع</span>
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Eye className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-slate-900">{visitorsCount.toLocaleString()} زائر</h3>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirm({
                          id: 'visitors',
                          type: 'visitors_reset',
                          title: 'تصفير إحصائية الزوار 🔄',
                          message: 'هل أنت متأكد من رغبتك في تصفير (مسح) إجمالي عدد زوار الموقع وإعادته إلى (0)؟ لا يمكن التراجع عن هذا الإجراء.'
                        });
                      }}
                      className="text-[9px] bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors shadow-xs cursor-pointer"
                    >
                      تصفير (0)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">نشاط حقيقي بولاية توقرت</p>
                </div>
              </div>

              {/* Firebase Database Live Usage Card */}
              <FirebaseStorageCard
                products={products}
                categories={categories}
                municipalities={municipalities}
                orders={orders}
                users={users}
                reviews={reviews}
                siteSettings={siteSettings}
                visitorsCount={visitorsCount}
                packs={packs}
                affiliates={affiliates}
              />

              {/* Order Status Breakdown Boxes */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <h4 className="text-sm font-black text-slate-900 mb-4">حالة الطلبات الحالية بالمخزن</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                    <span className="text-amber-700 text-xs font-black block">قيد الانتظار</span>
                    <span className="text-xl font-black text-amber-900 mt-1 block">{stats.pendingOrders}</span>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
                    <span className="text-brand-blue text-xs font-black block">تم التأكيد والمراجعة</span>
                    <span className="text-xl font-black text-blue-950 mt-1 block">{stats.confirmedOrders}</span>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-center">
                    <span className="text-purple-700 text-xs font-black block">قيد الشحن مع السائق</span>
                    <span className="text-xl font-black text-purple-950 mt-1 block">{stats.shippedOrders}</span>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
                    <span className="text-emerald-700 text-xs font-black block">تم الاستلام والتحصيل</span>
                    <span className="text-xl font-black text-emerald-950 mt-1 block">{stats.deliveredOrders}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Tab: SALES STATISTICS */}
          {activeTab === 'sales_stats' && (
            <div className="space-y-6 text-right animate-in fade-in duration-300" dir="rtl">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-blue" />
                  <span>إحصائيات وتحليلات المبيعات</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-bold">
                  تحليل فوري لحركة المبيعات والطلب الفعلي على مستوى المنتجات الفردية والباكات المدرسية.
                </p>
              </div>

              {/* Sales Statistics Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                  <span className="text-slate-500 text-xs font-black block">إجمالي القطع المباعة</span>
                  <h3 className="text-xl sm:text-2xl font-black mt-2 text-slate-900 font-mono">{salesSummary.totalUnitsSold} قطعة</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">مجموع الكميات المباعة من كافة الأدوات والباكات</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                  <span className="text-slate-500 text-xs font-black block">المنتج الأكثر طلباً 🔥</span>
                  <h3 className="text-base sm:text-lg font-black mt-2 text-brand-blue truncate" title={salesSummary.bestSeller.name}>
                    {salesSummary.bestSeller.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    تم بيع <strong className="text-slate-800 font-mono">{salesSummary.bestSeller.unitsSold} قطعة</strong> منه بنجاح
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs">
                  <span className="text-slate-500 text-xs font-black block">إجمالي المشترين الفريدين</span>
                  <h3 className="text-xl sm:text-2xl font-black mt-2 text-emerald-600 font-mono">{salesSummary.uniqueBuyersCount} عميل</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">عدد العملاء المتميزين ببيانات تواصل فريدة</p>
                </div>
              </div>

              {/* Sales Line Chart over Days */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">منحنى تغير مبيعات المتجر اليومي</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">متابعة تفصيلية لتغير عدد الطلبات والقطع المباعة يومياً</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-brand-blue block"></span>
                      <span className="text-slate-600">عدد الطلبيات</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
                      <span className="text-slate-600">القطع المباعة</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full pr-4" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="dateLabel" 
                        stroke="#94a3b8" 
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#94a3b8" 
                        fontSize={10}
                        fontWeight="bold"
                        tickLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#ffffff', 
                          borderColor: '#e2e8f0', 
                          borderRadius: '12px',
                          textAlign: 'right',
                          direction: 'rtl',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          color: '#0f172a',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                        labelStyle={{ color: '#0f172a', fontWeight: '900', marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        name="عدد الطلبيات" 
                        dataKey="ordersCount" 
                        stroke="#2563eb" 
                        strokeWidth={3} 
                        activeDot={{ r: 6 }} 
                        dot={{ r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        name="القطع المباعة" 
                        dataKey="unitsSold" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        activeDot={{ r: 6 }} 
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Table controls */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h4 className="text-xs font-black text-slate-900 self-start sm:self-center">جدول تحليل مبيعات السلع والباكات ({processedStats.length} عنصر)</h4>
                  
                  {/* Search stats input */}
                  <div className="relative w-full sm:max-w-xs">
                    <input
                      type="text"
                      placeholder="ابحث عن منتج أو تصنيف..."
                      value={salesSearchTerm}
                      onChange={(e) => setSalesSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-9 pl-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white font-bold text-right shadow-xs transition-colors"
                    />
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Sales Table list */}
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full text-right text-xs font-semibold">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th 
                          onClick={() => {
                            setSalesSortKey('name');
                            setSalesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          }}
                          className="p-4 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <div className="flex items-center gap-1">
                            <span>المنتج</span>
                            {salesSortKey === 'name' && (salesSortOrder === 'asc' ? ' ▲' : ' ▼')}
                          </div>
                        </th>
                        <th className="p-4">نوع المنتج</th>
                        <th className="p-4 text-left">السعر</th>
                        <th 
                          onClick={() => {
                            setSalesSortKey('unitsSold');
                            setSalesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          }}
                          className="p-4 text-center cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>عدد القطع المباعة</span>
                            {salesSortKey === 'unitsSold' && (salesSortOrder === 'asc' ? ' ▲' : ' ▼')}
                          </div>
                        </th>
                        <th 
                          onClick={() => {
                            setSalesSortKey('buyers');
                            setSalesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          }}
                          className="p-4 text-center cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>عدد المشترين</span>
                            {salesSortKey === 'buyers' && (salesSortOrder === 'asc' ? ' ▲' : ' ▼')}
                          </div>
                        </th>
                        <th 
                          onClick={() => {
                            setSalesSortKey('totalRevenue');
                            setSalesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          }}
                          className="p-4 text-left cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-colors"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>إجمالي المبيعات</span>
                            {salesSortKey === 'totalRevenue' && (salesSortOrder === 'asc' ? ' ▲' : ' ▼')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {processedStats.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 font-bold">
                            لا توجد منتجات أو باكات تطابق معايير البحث
                          </td>
                        </tr>
                      ) : (
                        processedStats.map((item) => (
                          <tr key={item.id + '-' + item.name} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getCompatibleImageUrl(item.image)}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50 shadow-xs"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-right">
                                  <p className="font-extrabold text-slate-900 text-[12px] sm:text-xs leading-normal max-w-[220px] sm:max-w-[320px] truncate" title={item.name}>
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    الفئة: {categories.find(c => c.id === item.category)?.name || item.category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {item.isPack ? (
                                <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200 shadow-xs">
                                  باك مدرسي 🎁
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
                                  منتج فردي 📦
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-left font-mono font-bold text-slate-600">
                              {formatPrice(item.price)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-mono font-black ${
                                item.unitsSold > 0 
                                  ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20 shadow-xs' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {item.unitsSold}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-mono font-black ${
                                item.uniqueBuyersCount > 0 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                                  : 'bg-slate-100 text-slate-400'
                              }`}>
                                {item.uniqueBuyersCount}
                              </span>
                            </td>
                            <td className="p-4 text-left font-mono font-black text-slate-900">
                              {formatPrice(item.totalRevenue)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: PRODUCT MANAGEMENT */}
          {activeTab === 'products' && (
            <div className="space-y-6 text-right" dir="rtl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">إدارة مخزون وسلع المتجر</h3>
                  <p className="text-xs text-slate-500 mt-1 font-bold">متابعة الكميات، ضبط المخزون، وإضافة وتعديل المنتجات مع التزامن السحابي المباشر في Firestore</p>
                </div>
                {!isAddingProduct && (
                  <button
                    onClick={() => { clearProductForm(); setIsAddingProduct(true); }}
                    className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة منتج جديد</span>
                  </button>
                )}
              </div>

              {/* Financial & Stock Overview Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div 
                  className="p-4 rounded-2xl border bg-white border-slate-200 shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1">
                    <span>إجمالي السلع</span>
                    <Package className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{products.length}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-semibold">كل المنتجات المسجلة بالمتجر</div>
                </div>

                <div 
                  className="p-4 rounded-2xl border bg-white border-slate-200 shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-emerald-600 font-bold mb-1">
                    <span>إجمالي إيرادات المتجر</span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <DollarSign className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">{formatPrice(totalRevenue)}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-semibold">من الطلبيات المستلمة والمسلمة</div>
                </div>

                <div 
                  className="p-4 rounded-2xl border bg-white border-slate-200 shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-teal-600 font-bold mb-1">
                    <span>صافي الأرباح المحصلة</span>
                    <span className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                      <TrendingUp className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-teal-600 font-mono">{formatPrice(totalProfit)}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-semibold">الأرباح الصافية بعد خصم التكاليف</div>
                </div>

                <div 
                  className="p-4 rounded-2xl border bg-white border-slate-200 shadow-xs transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-amber-600 font-bold mb-1">
                    <span>رأس المال</span>
                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                      <Wallet className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">{formatPrice(inventoryStats.totalPurchaseCost)}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-semibold">قيمة بضاعة المخزون الحالية</div>
                </div>
              </div>

              {/* Add/Edit Product Panel */}
              {isAddingProduct && (
                <form 
                  onSubmit={handleProductSave} 
                  id="product-edit-form" 
                  className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs animate-in slide-in-from-top duration-300 scroll-mt-6"
                >
                  <h4 className="text-sm font-black text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-1.5">
                    <span>{editingProduct ? 'تعديل بيانات ومخزون المنتج' : 'إضافة منتج مدرسي جديد'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">اسم السلعة / المنتج</label>
                      <input
                        type="text"
                        id="product-name-input"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue focus:bg-white text-right text-slate-900 transition-colors"
                        placeholder="مثال: آلة حاسبة كاسيو أصلية"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">سعر الشراء (دج)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          value={prodPurchasePrice}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                            setProdPurchasePrice(cleaned);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue focus:bg-white text-right text-slate-900 transition-colors"
                          placeholder="مثال: 800"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">سعر البيع (دج)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          value={prodPrice}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                            setProdPrice(cleaned);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue focus:bg-white text-right text-slate-900 transition-colors"
                          placeholder="مثال: 1000"
                        />
                      </div>
                      
                      {/* حساب الربح تلقائياً */}
                      {(() => {
                        const profit = (Number(prodPrice) || 0) - (Number(prodPurchasePrice) || 0);
                        const isLoss = profit < 0;
                        return (
                          <div 
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all duration-200 ${
                              isLoss 
                                ? 'bg-red-50 border-red-200 text-red-700' 
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isLoss ? (
                                <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse shrink-0" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                              )}
                              <span>
                                {isLoss ? 'خسارة متوقعة' : 'الربح المتوقع'}
                              </span>
                            </div>
                            <span className="text-sm font-black font-mono">
                              الربح: {profit} دج
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Stock Input Section with direct Keyboard Input */}
                    <div className="space-y-2 bg-slate-50 border border-slate-200 p-4 rounded-2xl sm:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700">الكمية الحالية في المخزون (Stock)</label>
                        {/* Live Stock Status Indicator */}
                        {(() => {
                          const qty = Number(prodStockQuantity) || 0;
                          if (qty > 5) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                متوفر في المخزن
                              </span>
                            );
                          } else if (qty >= 1) {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                مخزون منخفض ({qty} قطع متبقية)
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                                نفد المخزون (0 قطع)
                              </span>
                            );
                          }
                        })()}
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          required
                          value={prodStockQuantity === 0 ? '0' : (prodStockQuantity || '')}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            let raw = e.target.value.replace(/[^0-9]/g, '');
                            if (raw === '') {
                              setProdStockQuantity('');
                              return;
                            }
                            // Strip leading zeroes so typing '5' over '0' becomes '5', not '05'
                            if (raw.length > 1 && raw.startsWith('0')) {
                              raw = raw.replace(/^0+/, '');
                              if (raw === '') raw = '0';
                            }
                            setProdStockQuantity(raw);
                          }}
                          onBlur={() => {
                            if (prodStockQuantity === '' || isNaN(Number(prodStockQuantity))) {
                              setProdStockQuantity(0);
                            } else {
                              setProdStockQuantity(Math.max(0, parseInt(String(prodStockQuantity), 10)));
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-black font-mono focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue text-right text-slate-900 transition-colors shadow-xs"
                          placeholder="أدخل عدد القطع المتوفرة في المخزن (مثال: 15)"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">التصنيف</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold focus:outline-none focus:border-brand-blue focus:bg-white text-right text-slate-900 transition-colors"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <ImageUploaderWithCompression
                      imageUrl={prodImage}
                      onImageChange={(url) => setProdImage(url)}
                      placement="product"
                      label="صورة المنتج (رابط أو رفع ملف من عندك مع الضغط والقص التلقائي)"
                      triggerNotification={triggerNoti}
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodInStock}
                        onChange={(e) => setProdInStock(e.target.checked)}
                        className="rounded border-slate-300 bg-white text-brand-blue focus:ring-0 h-4 w-4"
                      />
                      <span>متوفر للبيع في المتجر (يُحجب تلقائياً إذا كان المخزون 0)</span>
                    </label>
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
                    >
                      <span>حفظ وإدراج في المعرض</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { clearProductForm(); setIsAddingProduct(false); setEditingProduct(null); }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-bold text-slate-900">قائمة المعروضات ({filteredProductsList.length} منتج)</h4>
                    {stockFilterTab !== 'all' && (
                      <span className="text-[10px] bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-full font-bold border border-brand-blue/20">
                        فلتر المخزون مفعّل
                      </span>
                    )}
                  </div>
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="البحث بالاسم أو الماركة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pr-9 pl-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-blue focus:bg-white shadow-xs transition-colors"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs font-semibold">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-4">المنتج</th>
                        <th className="p-4">التصنيف</th>
                        <th className="p-4">سعر الشراء</th>
                        <th className="p-4">سعر البيع</th>
                        <th className="p-4 text-center">الكمية في المخزن</th>
                        <th className="p-4 text-center">حالة المخزون</th>
                        <th className="p-4 text-center">عمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredProductsList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            لا توجد منتجات تطابق الفلتر الحالي.
                          </td>
                        </tr>
                      ) : (
                        filteredProductsList.map((p) => {
                          const purchasePrice = p.purchasePrice !== undefined ? p.purchasePrice : Math.round(p.price * 0.8);
                          const stock = getProductStock(p);
                          const statusInfo = getStockStatusInfo(p);
                          
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-4 flex items-center gap-3">
                                <img src={getCompatibleImageUrl(p.image)} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs" referrerPolicy="no-referrer" />
                                <span className="font-extrabold truncate max-w-xs text-slate-900">{p.name}</span>
                              </td>
                              <td className="p-4 text-slate-600">{p.category}</td>
                              <td className="p-4 font-mono text-slate-500">{formatPrice(purchasePrice)}</td>
                              <td className="p-4 font-mono font-black text-brand-blue">{formatPrice(p.price)}</td>
                              
                              {/* Stock Quantity Direct Keyboard Input */}
                              <td className="p-4">
                                <div className="flex items-center justify-center">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={stock}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                      let raw = e.target.value.replace(/[^0-9]/g, '');
                                      if (raw.length > 1 && raw.startsWith('0')) {
                                        raw = raw.replace(/^0+/, '');
                                        if (raw === '') raw = '0';
                                      }
                                      const val = raw === '' ? 0 : parseInt(raw, 10);
                                      handleSetProductStockDirect(p, isNaN(val) ? 0 : val);
                                    }}
                                    className={`w-24 py-1.5 px-3 text-center text-xs font-black font-mono rounded-xl border focus:outline-none focus:ring-2 focus:ring-brand-blue shadow-xs transition-all ${
                                      stock > 5 
                                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white' 
                                        : stock >= 1 
                                          ? 'bg-amber-50 border-amber-300 text-amber-900 focus:bg-white' 
                                          : 'bg-rose-50 border-rose-300 text-rose-900 focus:bg-white'
                                    }`}
                                    title="كتابة وتعديل الكمية مباشرة بلوحة المفاتيح"
                                    placeholder="0"
                                  />
                                </div>
                              </td>

                              {/* Stock Status Badge */}
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleStock(p)}
                                  className={`px-3 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer ${
                                    statusInfo.status === 'in_stock'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                      : statusInfo.status === 'low_stock'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                                  }`}
                                  title="اضغط للتبديل السريع"
                                >
                                  {statusInfo.status === 'in_stock' && '🟢 متوفر'}
                                  {statusInfo.status === 'low_stock' && '🟠 مخزون منخفض'}
                                  {statusInfo.status === 'out_of_stock' && '🔴 نفد المخزون'}
                                </button>
                              </td>

                              <td className="p-4 text-center space-x-1 space-x-reverse">
                                <button
                                  type="button"
                                  onClick={() => startEditProduct(p)}
                                  className="p-1.5 bg-slate-100 hover:bg-brand-blue hover:text-white rounded-lg transition-colors text-slate-700 border border-slate-200 cursor-pointer"
                                  title="تعديل"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white rounded-lg transition-colors text-slate-700 border border-slate-200 cursor-pointer"
                                  title="حذف"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6 text-right" dir="rtl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">إدارة تصنيفات السلع</h3>
                  <p className="text-xs text-slate-500 mt-1 font-bold">إضافة وتعديل وحذف تصنيفات الأدوات واللوازم المدرسية في المتجر</p>
                </div>
                {!isAddingCategory && !editingCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(true);
                      setCatName('');
                      setCatImage('');
                      setCatIcon('ShoppingBag');
                    }}
                    className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all self-start"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة تصنيف جديد</span>
                  </button>
                )}
              </div>

               {isAddingCategory && (
                <form onSubmit={handleCategorySave} className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4 animate-in slide-in-from-top duration-300">
                  <h4 className="text-sm font-black text-slate-900">إضافة تصنيف مدرسي جديد</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">اسم التصنيف الجديد</label>
                      <input
                        type="text"
                        required
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue focus:bg-white text-right text-slate-900"
                        placeholder="مثال: أطقم وحزم مدرسية"
                      />
                    </div>

                    <ImageUploaderWithCompression
                      imageUrl={catImage}
                      onImageChange={(url) => setCatImage(url)}
                      placement="category"
                      label="صورة المعاينة للتصنيف (رابط أو رفع ملف وضغطه وقصه)"
                      triggerNotification={triggerNoti}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600">اختر أيقونة التصنيف المتواجدة في الصفحة الرئيسية</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {Object.entries(adminIconMap).map(([key, { icon: IconComp, label }]) => {
                        const isSelected = catIcon === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCatIcon(key)}
                            className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand-blue/10 border-brand-blue text-brand-blue ring-2 ring-brand-blue/20 font-black'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 font-bold'
                            }`}
                          >
                            <IconComp className={`h-5 w-5 ${isSelected ? 'text-brand-blue' : ''}`} />
                            <span className="text-[10px] truncate max-w-full">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button
                      type="submit"
                      className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black transition-all"
                    >
                      <span>حفظ التصنيف الجديد</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              {editingCategory && (
                <form onSubmit={handleCategorySave} id="category-edit-form" className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4 animate-in slide-in-from-top duration-300 scroll-mt-6">
                  <h4 className="text-sm font-black text-slate-900">تعديل التصنيف: {editingCategory.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">اسم التصنيف الجديد</label>
                      <input
                        type="text"
                        required
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue focus:bg-white text-right text-slate-900"
                      />
                    </div>

                    <ImageUploaderWithCompression
                      imageUrl={catImage}
                      onImageChange={(url) => setCatImage(url)}
                      placement="category"
                      label="صورة المعاينة للتصنيف (رابط أو رفع ملف وضغطه وقصه)"
                      triggerNotification={triggerNoti}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600">اختر أيقونة التصنيف المتواجدة في الصفحة الرئيسية</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                      {Object.entries(adminIconMap).map(([key, { icon: IconComp, label }]) => {
                        const isSelected = catIcon === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCatIcon(key)}
                            className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-brand-blue/10 border-brand-blue text-brand-blue ring-2 ring-brand-blue/20 font-black'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-300 font-bold'
                            }`}
                          >
                            <IconComp className={`h-5 w-5 ${isSelected ? 'text-brand-blue' : ''}`} />
                            <span className="text-[10px] truncate max-w-full">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black transition-all"
                    >
                      <span>تحديث التصنيف</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCategory(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-white border border-slate-200 shadow-xs rounded-2xl p-4 flex gap-4 items-center">
                    {(() => {
                      const iconObj = adminIconMap[cat.iconName] || adminIconMap.ShoppingBag;
                      const IconComp = iconObj.icon;
                      return (
                        <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-brand-blue shrink-0">
                          <IconComp className="h-8 w-8" />
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1 justify-end">
                        <span className="text-xs font-black text-slate-900">{cat.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">عدد معروضات التصنيف: <strong className="text-slate-700">{products.filter(p => p.category === cat.id).length} منتج</strong></p>
                      
                      <div className="flex items-center gap-2.5 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatName(cat.name);
                            setCatImage(cat.image);
                            setCatCount(products.filter(p => p.category === cat.id).length);
                            setCatIcon(cat.iconName || 'ShoppingBag');
                            setTimeout(() => {
                              const formEl = document.getElementById('category-edit-form');
                              if (formEl) {
                                const topOffset = 80;
                                const elementPosition = formEl.getBoundingClientRect().top;
                                const offsetPosition = elementPosition + window.pageYOffset - topOffset;
                                window.scrollTo({
                                  top: Math.max(0, offsetPosition),
                                  behavior: 'smooth'
                                });
                              }
                            }, 100);
                          }}
                          className="text-[10px] font-bold text-brand-blue hover:underline flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="text-[10px] font-bold text-rose-500 hover:underline flex items-center gap-1 border-r border-slate-200 pr-2.5"
                        >
                          <Trash2 className="h-3 w-3 text-rose-500" />
                          <span>حذف التصنيف</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6 text-right">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">إدارة طلبيات ولاية توقرت</h3>
                <p className="text-xs text-slate-500 mt-1 font-bold">تعديل حالة الشحن، تأكيد العناوين والهواتف والتوصيل السريع</p>
              </div>

              <div className="bg-white border border-slate-200 shadow-xs rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-bold text-slate-900">كل الطلبيات ({filteredOrdersList.length} طلبية)</h4>
                    {orders.length > 0 && (
                      <button
                        type="button"
                        onClick={handleDeleteAllOrders}
                        className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="حذف جميع الطلبيات نهائياً من المتجر"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف الكل 🗑️</span>
                      </button>
                    )}
                  </div>
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="رقم الطلب، اسم الزبون، الهاتف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 pr-9 pl-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-blue"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                <div className="overflow-x-auto font-semibold text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-4">#</th>
                        <th className="p-4">الزبون والهاتف</th>
                        <th className="p-4">البلدية والعنوان</th>
                        <th className="p-4">الإجمالي</th>
                        <th className="p-4">حالة الطلبية</th>
                        <th className="p-4 text-center">تحديث الحالة</th>
                        <th className="p-4 text-center">العمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredOrdersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ShoppingBag className="h-8 w-8 text-slate-300" />
                              <p className="text-xs">لا توجد أي طلبيات مسجلة حالياً</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredOrdersList.map((order, index) => (
                        <tr 
                          key={order.id} 
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="p-4 font-mono font-black text-brand-blue">{index + 1}</td>
                          <td className="p-4">
                            <p className="font-extrabold text-slate-900">{order.customerName}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{order.phone}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-800 font-bold">{order.municipality}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">{order.address}</p>
                          </td>
                          <td className="p-4 font-black text-slate-900">{formatPrice(order.total)}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                              order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              order.status === 'confirmed' ? 'bg-blue-50 text-brand-blue border-blue-200' :
                              order.status === 'shipped' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {order.status === 'pending' ? 'قيد الانتظار' :
                               order.status === 'confirmed' ? 'تم التأكيد' :
                               order.status === 'shipped' ? 'مع المندوب' : 'تم الاستلام'}
                            </span>
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                              className="bg-slate-50 border border-slate-200 text-[10px] font-black rounded-lg p-1.5 text-slate-800 focus:outline-none focus:border-brand-blue focus:bg-white cursor-pointer"
                            >
                              <option value="pending">⏳ تعليق الانتظار</option>
                              <option value="confirmed">✅ تأكيد الطلبية</option>
                              <option value="shipped">🚚 خروج مع المندوب</option>
                              <option value="delivered">💵 تم التوصيل والقبض</option>
                            </select>
                          </td>
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="p-2 bg-slate-100 hover:bg-brand-blue hover:text-white rounded-xl transition-all text-slate-700 inline-flex items-center gap-1.5 cursor-pointer font-bold text-[11px]"
                                title="عرض التفاصيل"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>التفاصيل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-xl transition-all text-rose-600 inline-flex items-center gap-1.5 cursor-pointer font-bold text-[11px] border border-rose-200"
                                title="حذف الطلبية"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: SHIPPING */}
          {activeTab === 'shipping' && (
            <div className="space-y-6 text-right">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">إدارة البلديات ورسوم التوصيل</h3>
                <p className="text-xs text-slate-500 mt-1 font-bold">تعديل مدة التوصيل والتوفر لبلديات ولاية توقرت الـ 11</p>
              </div>

              {editingMuni && (
                <form onSubmit={handleMuniSave} className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4 animate-in slide-in-from-top duration-300">
                  <h4 className="text-sm font-black text-slate-900">تعديل مدة وتوفر الشحن: {editingMuni.name}</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">مدة التوصيل التقريبية</label>
                      <input
                        type="text"
                        required
                        value={muniTime}
                        onChange={(e) => setMuniTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue focus:bg-white text-right text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-2">
                    <input
                      type="checkbox"
                      id="muni-available"
                      checked={muniAvailable}
                      onChange={(e) => setMuniAvailable(e.target.checked)}
                      className="w-4 h-4 text-brand-blue bg-white border-slate-300 rounded focus:ring-brand-blue cursor-pointer"
                    />
                    <label htmlFor="muni-available" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                      الشحن متوفر لهذه الولاية / البلدية حالياً
                    </label>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black transition-all"
                    >
                      <span>تحديث إعدادات الشحن</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMuni(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-white border border-slate-200 shadow-xs rounded-3xl overflow-hidden text-xs font-semibold">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-4">اسم البلدية بتوقرت</th>
                      <th className="p-4">مدة التوصيل المتوقعة</th>
                      <th className="p-4 text-center">حالة الشحن</th>
                      <th className="p-4 text-center">تحديث</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {municipalities.map((m) => (
                      <tr key={m.name} className={`hover:bg-slate-50/80 transition-colors ${m.available === false ? 'opacity-70 bg-slate-50/50' : ''}`}>
                        <td className="p-4 font-bold text-slate-900">
                          {m.name}
                          {m.available === false && <span className="text-[10px] text-rose-500 font-black mr-2 font-mono">(موقف مؤقتاً)</span>}
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{m.deliveryTime}</td>
                        <td className="p-4 text-center">
                          {m.available !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              متوفر
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              غير متوفر للشحن
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMuni(m);
                              setMuniName(m.name);
                              setMuniFee(m.shippingFee);
                              setMuniTime(m.deliveryTime);
                              setMuniAvailable(m.available !== false);
                            }}
                            className="bg-slate-50 hover:bg-brand-blue text-slate-700 hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors font-bold"
                          >
                            تعديل الرسوم والتوفر
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 9: SETTINGS */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSave} className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-6 text-right">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">إعدادات المتجر العامة</h3>
                <p className="text-xs text-slate-500 mt-1 font-bold">تغيير الأسماء وعناوين المستودع وجهات اتصال ولاية توقرت</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">اسم المتجر الإلكتروني</label>
                  <input
                    type="text"
                    required
                    value={setStoreName}
                    onChange={(e) => setSetStoreName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                  />
                </div>

                <ImageUploaderWithCompression
                  imageUrl={setLogoUrl}
                  onImageChange={(url) => setSetLogoUrl(url)}
                  placement="logo"
                  label="شعار الموقع (Logo)"
                  placeholder="رابط الشعار أو ارفع ملفاً من جهازك..."
                  triggerNotification={triggerNoti}
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">حد التوصيل المجاني بالدينار (د.ج)</label>
                  <input
                    type="number"
                    required
                    value={setThreshold}
                    onChange={(e) => setSetThreshold(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">نسبة عمولة التسويق بالإحالة (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={setCommissionRate}
                    onChange={(e) => setSetCommissionRate(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">رقم الهاتف الأول</label>
                  <input
                    type="tel"
                    required
                    value={setPhone1}
                    onChange={(e) => setSetPhone1(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-mono text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">رقم الهاتف الثاني (اختياري)</label>
                  <input
                    type="tel"
                    value={setPhone2}
                    onChange={(e) => setSetPhone2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-mono text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">شريط الإعلان المتحرك</label>
                <input
                  type="text"
                  required
                  value={setBannerText}
                  onChange={(e) => setSetBannerText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">عنوان المستودع الرئيسي بالتفصيل</label>
                <input
                  type="text"
                  required
                  value={setWarehouse}
                  onChange={(e) => setSetWarehouse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                />
              </div>

              {/* Dedicated Section: HERO BANNER CUSTOMIZATION */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>🎨 تخصيص البانر الرئيسي والواجهة (Hero Banner)</span>
                    <span className="bg-brand-blue/10 text-brand-blue text-[10px] px-2 py-0.5 rounded-full font-bold">قابل للقص والتعديل</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-bold">
                    يمكنك تعديل نصوص البانر، تغيير لونه، وإضافة أو إزالة الصور المرفقة وقصها وتعبئة خلفياتها بسهولة.
                  </p>
                </div>

                {/* Hero Texts & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">العنوان الرئيسي للبانر</label>
                    <input
                      type="text"
                      value={setHeroTitle}
                      onChange={(e) => setSetHeroTitle(e.target.value)}
                      placeholder="مثال: أبطال الدراسة"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 focus:border-brand-blue text-right"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">شارة البانر (Badge العلوية)</label>
                    <input
                      type="text"
                      value={setHeroBadge}
                      onChange={(e) => setSetHeroBadge(e.target.value)}
                      placeholder="مثال: عروض توقرت المعتمدة 🇩🇿"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 focus:border-brand-blue text-right"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600">النص الترويجي والفرعي للبانر</label>
                    <input
                      type="text"
                      value={setHeroSubtitle}
                      onChange={(e) => setSetHeroSubtitle(e.target.value)}
                      placeholder="مثال: أفضل عروض الأدوات المدرسية والآلات الحاسبة بتخفيضات تصل لـ 30% ✨"
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 focus:border-brand-blue text-right"
                    />
                  </div>

                  {/* Background Color Picker */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-bold text-slate-600">لون خلفية البانر الرئيسي</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="color"
                        value={setHeroBgColor.startsWith('#') ? setHeroBgColor : '#2d3d4c'}
                        onChange={(e) => setSetHeroBgColor(e.target.value)}
                        className="w-10 h-10 rounded-xl border border-slate-300 bg-white cursor-pointer"
                      />
                      <input
                        type="text"
                        value={setHeroBgColor}
                        onChange={(e) => setSetHeroBgColor(e.target.value)}
                        placeholder="#2d3d4c"
                        className="w-28 bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs font-mono font-bold text-slate-900 text-center"
                      />
                      {/* Presets */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSetHeroBgColor('#2d3d4c')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-400 bg-[#2d3d4c] text-white hover:scale-105 transition-transform"
                        >
                          الافتراضي (رمادي/كحلي)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSetHeroBgColor('#0f172a')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-400 bg-[#0f172a] text-white hover:scale-105 transition-transform"
                        >
                          ليلي غامق
                        </button>
                        <button
                          type="button"
                          onClick={() => setSetHeroBgColor('#1e3a8a')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-400 bg-[#1e3a8a] text-white hover:scale-105 transition-transform"
                        >
                          أزرق ملكي
                        </button>
                        <button
                          type="button"
                          onClick={() => setSetHeroBgColor('#14532d')}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-400 bg-[#14532d] text-white hover:scale-105 transition-transform"
                        >
                          زمردي أنيق
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hero Images Management (With Image Cropper) */}
                <div className="border-t border-slate-200 pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-black text-slate-900">صور البانر والعروض المصورة</h5>
                      <p className="text-[10px] text-slate-500 font-semibold">ارفع الصور وقصها بنسبة 1:1 أو 16:9 أو قص حر مع تعبئة الخلفية المناسبة</p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                      <input
                        type="checkbox"
                        checked={setHeroShowImages}
                        onChange={(e) => setSetHeroShowImages(e.target.checked)}
                        className="w-4 h-4 text-brand-blue bg-white border-slate-300 rounded focus:ring-brand-blue"
                      />
                      <span className="text-xs font-bold text-slate-700">إظهار الصور في البانر</span>
                    </label>
                  </div>

                  {setHeroShowImages && (
                    <div className="space-y-4">
                      {/* Grid for Promo Card 1 and Promo Card 2 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Promo Card 1 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-700">بطاقة العرض 1 (الخلفية المائلة)</span>
                            {setHeroCard1Image && (
                              <button
                                type="button"
                                onClick={() => setSetHeroCard1Image('')}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                              >
                                إزالة الصورة
                              </button>
                            )}
                          </div>
                          
                          <ImageUploaderWithCompression
                            imageUrl={setHeroCard1Image}
                            onImageChange={(url) => setSetHeroCard1Image(url)}
                            placement="product"
                            label="صورة العرض 1 (مع خاصية القص والتعديل)"
                            placeholder="ارفع صورة أو الصق رابط..."
                            triggerNotification={triggerNoti}
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-600">العنوان التوضيحي</label>
                              <input
                                type="text"
                                value={setHeroCard1Title}
                                onChange={(e) => setSetHeroCard1Title(e.target.value)}
                                placeholder="مثال: حاسبة كاسيو أصلية"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] font-bold text-slate-900 text-right"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-600">شارة السعر</label>
                              <input
                                type="text"
                                value={setHeroCard1Price}
                                onChange={(e) => setSetHeroCard1Price(e.target.value)}
                                placeholder="مثال: DA 1,950"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] font-bold text-amber-700 font-mono text-right"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Promo Card 2 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-rose-700">بطاقة العرض 2 (الأمامية البارزة)</span>
                            {setHeroCard2Image && (
                              <button
                                type="button"
                                onClick={() => setSetHeroCard2Image('')}
                                className="text-[10px] text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                              >
                                إزالة الصورة
                              </button>
                            )}
                          </div>

                          <ImageUploaderWithCompression
                            imageUrl={setHeroCard2Image}
                            onImageChange={(url) => setSetHeroCard2Image(url)}
                            placement="product"
                            label="صورة العرض 2 (مع خاصية القص والتعديل)"
                            placeholder="ارفع صورة أو الصق رابط..."
                            triggerNotification={triggerNoti}
                          />

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-600">العنوان التوضيحي</label>
                              <input
                                type="text"
                                value={setHeroCard2Title}
                                onChange={(e) => setSetHeroCard2Title(e.target.value)}
                                placeholder="مثال: حقيبة طبية مريحة"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] font-bold text-slate-900 text-right"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-slate-600">شارة السعر</label>
                              <input
                                type="text"
                                value={setHeroCard2Price}
                                onChange={(e) => setSetHeroCard2Price(e.target.value)}
                                placeholder="مثال: DA 4,350"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2.5 text-[11px] font-bold text-rose-700 font-mono text-right"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Or Full Single Wide Banner Image */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-900">أو صورة بانر عرضية مدمجة واحدة (Full Banner Graphic)</span>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">إذا رفعت صورة هنا ستظهر بدلاً من البطاقات الفردية</p>
                          </div>
                          {setHeroBannerImage && (
                            <button
                              type="button"
                              onClick={() => setSetHeroBannerImage('')}
                              className="text-[10px] text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200"
                            >
                              إزالة البانر
                            </button>
                          )}
                        </div>

                        <ImageUploaderWithCompression
                          imageUrl={setHeroBannerImage}
                          onImageChange={(url) => setSetHeroBannerImage(url)}
                          placement="category"
                          label="صورة البانر العريضة (استخدم خيار القص لضبط الأبعاد)"
                          placeholder="ارفع صورة بانر كاملة أو الصق رابط..."
                          triggerNotification={triggerNoti}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">وصف المتجر (SEO/Footer)</label>
                <textarea
                  required
                  value={setStoreDesc}
                  onChange={(e) => setSetStoreDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-semibold text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                />
              </div>

              <button
                type="submit"
                className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>حفظ كافة إعدادات الموقع والبانر</span>
              </button>
            </form>
          )}

          {/* Tab 10: SCHOOL PACKS */}
          {activeTab === 'packs' && (
            <div className="space-y-6 text-right" dir="rtl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>🎁 إدارة الباكات المدرسية (School Packs)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-bold">
                    إعداد الباكات التوفيرية وتحديث محتويات الحقائب الجاهزة بضغطة زر واحدة.
                  </p>
                </div>
                {!isAddingPack && (
                  <button
                    onClick={() => { clearPackForm(); setIsAddingPack(true); }}
                    className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer shadow-sm"
                  >
                    <span>➕ إضافة باك جديد</span>
                  </button>
                )}
              </div>

              {isAddingPack ? (
                /* PACK FORM CONTAINER */
                <form onSubmit={handlePackSave} id="pack-edit-form" className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-6 scroll-mt-6">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h4 className="text-sm font-black text-slate-900">
                      {editingPack ? '✏️ تعديل بيانات الباك' : '➕ إنشاء باك مدرسي متكامل جديد'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => { clearPackForm(); setIsAddingPack(false); }}
                      className="text-xs text-slate-500 hover:text-slate-900 font-bold"
                    >
                      إلغاء والعودة
                    </button>
                  </div>

                  <div className="w-full">
                    <ImageUploaderWithCompression
                      imageUrl={packImage}
                      onImageChange={(url) => setPackImage(url)}
                      placement="pack"
                      label="صورة الباك المدرسي (رابط أو رفع صورة وقصها وتصغير حجمها)"
                      placeholder="رابط صورة الباك المدرسي (مثال: https://example.com/image.jpg)"
                      triggerNotification={triggerNoti}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 2: Pack Items Manager */}
                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h5 className="text-xs font-black text-slate-900 border-b border-slate-200 pb-2">📦 قائمة الأدوات داخل هذا الباك ({packItemsList.length})</h5>
                      
                      {/* Add Item Form Row */}
                      <div className="space-y-2 pt-1 text-right">
                        <label className="block text-[11px] font-bold text-slate-600">إضافة أداة جديدة لمحتويات الباك</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="ابحث أو اكتب اسم الأداة واضغط Enter للإضافة"
                            value={tempToolName}
                            onChange={(e) => {
                              setTempToolName(e.target.value);
                              setShowProductSuggestions(true);
                            }}
                            onFocus={() => setShowProductSuggestions(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (tempToolName.trim()) {
                                  handleDirectAddTool(tempToolName);
                                }
                              }
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-[11px] font-semibold text-slate-900 text-right focus:border-brand-blue focus:outline-none"
                          />
                          {showProductSuggestions && (
                            <>
                              {/* Overlay to dismiss dropdown when clicking outside */}
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowProductSuggestions(false)}
                              />
                              <div className="absolute right-0 top-full mt-1.5 w-full bg-white border-2 border-slate-200 rounded-2xl shadow-2xl z-50 max-h-[360px] overflow-y-auto divide-y divide-slate-100 text-right">
                                {products.filter(p => {
                                  if (!tempToolName.trim()) return true;
                                  return p.name.toLowerCase().includes(tempToolName.toLowerCase());
                                }).length === 0 ? (
                                  <div className="p-4 text-xs text-slate-500 text-center font-bold">
                                    لا توجد منتجات تطابق البحث
                                  </div>
                                ) : (
                                  products.filter(p => {
                                    if (!tempToolName.trim()) return true;
                                    return p.name.toLowerCase().includes(tempToolName.toLowerCase());
                                  }).map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        handleDirectAddTool(p.name);
                                      }}
                                      className="w-full p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs font-bold text-slate-700 hover:text-slate-900 transition-all text-right cursor-pointer"
                                    >
                                      <span className="font-mono text-brand-blue text-[11px] sm:text-xs shrink-0 font-extrabold">{formatPrice(p.price)}</span>
                                      <div className="flex items-center gap-3 max-w-[80%] text-right justify-end">
                                        <span className="truncate text-[11px] sm:text-xs text-slate-800">{p.name}</span>
                                        <img 
                                          src={getCompatibleImageUrl(p.image)} 
                                          alt={p.name} 
                                          className="h-8 w-8 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs" 
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                    </button>
                                  ))
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Items List Table */}
                      <div className="space-y-2.5 max-h-96 overflow-y-auto pl-1">
                        {packItemsList.length === 0 ? (
                          <p className="text-xs text-slate-500 font-bold text-center py-8">الباك فارغ حالياً. يرجى إضافة الأدوات أعلاه.</p>
                        ) : (
                          packItemsList.map((item) => (
                            <div key={item.id} className="bg-white border border-slate-200 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs text-sm transition-all hover:border-slate-300">
                              <span className="truncate text-slate-900 font-black text-right">{item.name}</span>
                              <div className="flex items-center gap-3 shrink-0 justify-end w-full sm:w-auto">
                                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1.5 py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateToolQty(item.id, item.quantity + 1)}
                                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateToolQty(item.id, Number(e.target.value) || 1)}
                                    className="w-8 bg-transparent text-center font-mono text-xs font-black text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateToolQty(item.id, Math.max(1, item.quantity - 1))}
                                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-slate-500 font-bold">حبة</span>
                                <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveToolRow(item.id)}
                                  className="text-xs text-rose-600 hover:text-rose-700 font-black cursor-pointer hover:scale-105 transition-all"
                                >
                                  إزالة
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Column 3: Details fields */}
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600">اسم الباك المدرسي (مكتمل الأدوات)</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: الباك الماسي الشامل للطور الابتدائي"
                          value={packName}
                          onChange={(e) => setPackName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-600">السعر الإجمالي للقطع (تلقائي)</label>
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-black text-brand-blue text-right select-none">
                            {formatPrice(calculatedOriginalPrice)}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-600">سعر العرض للباك (د.ج)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={packPrice}
                            onChange={(e) => setPackPrice(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-black text-slate-900 focus:bg-white text-right focus:border-brand-blue focus:outline-none"
                            placeholder="سعر البيع النهائي"
                          />
                        </div>
                      </div>

                      {/* نسبة التخفيض وتحليل السعر */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between text-right">
                        <div className="flex items-center gap-1.5">
                          {discountPercentage > 0 ? (
                            <span className="bg-red-50 text-red-600 text-xs font-black px-3 py-1 rounded-xl border border-red-200">
                              خصم {discountPercentage}% 🔥
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs font-bold bg-white border border-slate-200 px-2.5 py-1 rounded-lg">
                              لا يوجد تخفيض بعد
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 font-bold block">مجموع التوفير للأولياء:</span>
                          <span className="text-xs font-black text-brand-blue">
                            {calculatedOriginalPrice > packPrice 
                              ? formatPrice(calculatedOriginalPrice - packPrice) 
                              : '0 د.ج'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-600">مميزات الباك (تفصل بفاصلة كـ: مميز1, مميز2)</label>
                        <input
                          type="text"
                          placeholder="مثال: حقيبة متينة وضد المطر، آلة حاسبة أصلية، توفير مالي كبير"
                          value={packFeaturesText}
                          onChange={(e) => setPackFeaturesText(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-blue text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Submission */}
                  <div className="flex gap-3 pt-4 border-t border-slate-200 justify-end">
                    <button
                      type="button"
                      onClick={() => { clearPackForm(); setIsAddingPack(false); }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer"
                    >
                      إلغاء والتراجع
                    </button>
                    <button
                      type="submit"
                      className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>حفظ وحفظ التغييرات 💾</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* PACKS LIST SHOWCASE */
                <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6">
                  {packs.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-slate-50 text-slate-500 p-5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                        <Sparkles className="h-8 w-8 text-brand-blue" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900">لا توجد باكات مدرجة حالياً</h4>
                      <p className="text-[11px] text-slate-500 mt-2 max-w-sm mx-auto font-bold leading-normal">
                        ابدأ بصناعة باكات دراسية توفيرية للأطوار الابتدائية والمتوسطة والثانوية واجذب الأولياء للشراء المباشر!
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddingPack(true)}
                        className="mt-4 bg-brand-blue text-white font-extrabold text-xs py-2.5 px-5 rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
                      >
                        صمم أول باك مدرسي الآن
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" dir="rtl text-right">
                      {packs.map((p) => {
                        return (
                          <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs text-right">
                            {/* Pack Top Info */}
                            <div className="p-4.5 space-y-4">
                              <div className="flex gap-4 items-center">
                                <img
                                  src={getCompatibleImageUrl(p.image)}
                                  alt={p.name}
                                  className="h-16 w-16 rounded-xl object-cover bg-white border border-slate-200 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="bg-amber-50 text-amber-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-200">باك مدرسي 🎁</span>
                                    {p.isPopular && <span className="bg-yellow-50 text-yellow-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-yellow-200">شائع 🔥</span>}
                                  </div>
                                  <h4 className="text-xs font-black text-slate-900 truncate mt-1">{p.name}</h4>
                                  <span className="text-[11px] font-black text-brand-blue mt-1 block">{formatPrice(p.price)}</span>
                                </div>
                              </div>

                              {/* Tools list preview */}
                              <div className="bg-white p-3 rounded-xl space-y-1.5 border border-slate-200 shadow-xs">
                                <span className="text-[10px] text-slate-500 font-black block border-b border-slate-100 pb-1">📦 محتويات هذا الباك:</span>
                                <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pl-1">
                                  {p.packItems && p.packItems.map((item, index) => (
                                    <span key={item.id || index} className="text-[9px] font-semibold text-slate-600 truncate flex items-center gap-1 justify-end">
                                      <span>({item.quantity} حبة) {item.name}</span>
                                      <span className="text-brand-blue shrink-0">•</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Pack Bottom Actions */}
                            <div className="bg-white p-3 border-t border-slate-200 flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-bold ${p.inStock ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-red-700 bg-red-50 border border-red-200'} px-2.5 py-1 rounded-full`}>
                                {p.inStock ? '🟢 متوفر للطلب' : '🔴 غير متوفر حالياً'}
                              </span>
                              <div className="flex gap-2 text-xs font-black">
                                <button
                                  type="button"
                                  onClick={() => startEditPack(p)}
                                  className="text-brand-blue hover:underline bg-slate-50 border border-slate-200 hover:border-brand-blue/30 px-3 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePack(p.id, p.name)}
                                  className="text-rose-600 hover:underline bg-rose-50 border border-rose-200 hover:bg-rose-100 px-3 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  حذف 🗑️
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 11: AFFILIATES PROGRAM */}
          {activeTab === 'affiliates' && (
            <div className="space-y-6 text-right animate-in fade-in-50 duration-200" dir="rtl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-blue" />
                    <span>نظام التسويق بالعمولة والإحالة (Affiliates)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-bold">
                    أضف مسوقين جدد، وتابع مبيعاتهم، عمولاتهم ورابط الإحالة الخاص بهم دون الحاجة لإنشاء حسابات.
                  </p>
                </div>
                {!isAddingAffiliate && (
                  <button
                    onClick={() => {
                      setEditingAffiliate(null);
                      setAffiliateName('');
                      setAffiliateCode('MIDAD' + Math.floor(10 + Math.random() * 90));
                      setIsAddingAffiliate(true);
                    }}
                    className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer shadow-sm"
                  >
                    <span>➕ إضافة مسوّق جديد</span>
                  </button>
                )}
              </div>

              {/* Stats Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block">إجمالي المسوقين</span>
                  <span className="text-xl font-black text-slate-900 block mt-1 font-mono">{affiliates?.length || 0}</span>
                </div>
                <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block">إجمالي المبيعات المحالة</span>
                  <span className="text-xl font-black text-brand-blue block mt-1 font-mono">
                    {formatPrice(affiliates?.reduce((sum, a) => sum + (a.totalSales || 0), 0) || 0)}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block">إجمالي العمولات المستحقة</span>
                  <span className="text-xl font-black text-emerald-600 block mt-1 font-mono">
                    {formatPrice(affiliates?.reduce((sum, a) => sum + (a.commissionBalance || 0), 0) || 0)}
                  </span>
                </div>
                <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold block">إجمالي الطلبات المحالة</span>
                  <span className="text-xl font-black text-purple-700 block mt-1 font-mono">
                    {affiliates?.reduce((sum, a) => sum + (a.totalOrders || 0), 0) || 0} طلبية
                  </span>
                </div>
              </div>

              {isAddingAffiliate ? (
                /* ADD / EDIT AFFILIATE FORM */
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!affiliateName.trim() || !affiliateCode.trim()) {
                    triggerNoti('يرجى ملء كافة الحقول الإلزامية', 'info');
                    return;
                  }
                  const cleanCode = affiliateCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
                  if (!cleanCode) {
                    triggerNoti('يرجى كتابة رمز إحالة صحيح يتكون من حروف وأرقام فقط', 'info');
                    return;
                  }

                  const rateVal = affiliateCommissionRate.trim() !== '' ? Number(affiliateCommissionRate) : undefined;

                  let updatedList = [...affiliates];
                  if (editingAffiliate) {
                    // check duplicates
                    const isDup = affiliates.some(a => a.id !== editingAffiliate.id && a.code.toUpperCase() === cleanCode);
                    if (isDup) {
                      triggerNoti('رمز الإحالة هذا مستخدم بالفعل لمسوّق آخر!', 'info');
                      return;
                    }
                    updatedList = affiliates.map(a => a.id === editingAffiliate.id ? {
                      ...a,
                      code: cleanCode,
                      name: affiliateName.trim(),
                      commissionRate: rateVal
                    } : a);
                    triggerNoti('تم تعديل بيانات المسوّق بنجاح');
                  } else {
                    const isDup = affiliates.some(a => a.code.toUpperCase() === cleanCode);
                    if (isDup) {
                      triggerNoti('رمز الإحالة هذا مستخدم بالفعل لمسوّق آخر!', 'info');
                      return;
                    }
                    const newAff: Affiliate = {
                      id: cleanCode,
                      code: cleanCode,
                      name: affiliateName.trim(),
                      commissionBalance: 0,
                      totalSales: 0,
                      totalOrders: 0,
                      createdAt: new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' }),
                      commissionRate: rateVal
                    };
                    updatedList.push(newAff);
                    triggerNoti('تم تسجيل المسوّق الجديد بنجاح');
                  }

                  onUpdateAffiliates(updatedList);
                  setIsAddingAffiliate(false);
                  setEditingAffiliate(null);
                  setAffiliateName('');
                  setAffiliateCode('');
                  setAffiliateCommissionRate('');
                }} className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-6 max-w-xl text-right">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      {editingAffiliate ? 'تعديل بيانات المسوّق' : 'إضافة مسوّق جديد بالعمولة'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-bold">
                      يرجى تحديد الاسم والرمز التعريفي الفريد لرابط الإحالة ونسبة العمولة.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">الاسم الكامل للمسوّق</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: خالد بوزيدي"
                        value={affiliateName}
                        onChange={(e) => setAffiliateName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 text-right focus:bg-white focus:border-brand-blue focus:outline-none font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">رمز الإحالة التعريفي (Alphanumeric Code)</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: KHALED01"
                        value={affiliateCode}
                        onChange={(e) => setAffiliateCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-mono font-black text-slate-900 text-right focus:bg-white focus:border-brand-blue focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 font-bold">سيظهر الرمز في الرابط كـ: {`${getPublicOrigin()}/?ref=${affiliateCode.trim().toUpperCase() || 'CODE'}`}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">نسبة عمولة المسوّق (%) <span className="text-slate-500 font-normal">(اختياري)</span></label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder={`الافتراضية للموقع: ${siteSettings.referralCommissionRate || 10}%`}
                        value={affiliateCommissionRate}
                        onChange={(e) => setAffiliateCommissionRate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-900 text-right focus:bg-white focus:border-brand-blue focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 font-bold">اتركه فارغاً ليتم اعتماد النسبة العامة المضبوطة في إعدادات الموقع.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-200 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAffiliate(false);
                        setEditingAffiliate(null);
                        setAffiliateName('');
                        setAffiliateCode('');
                        setAffiliateCommissionRate('');
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer"
                    >
                      إلغاء والتراجع
                    </button>
                    <button
                      type="submit"
                      className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>حفظ المسوّق 💾</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* AFFILIATES TABLE LIST */
                <div className="bg-white border border-slate-200 shadow-xs rounded-3xl p-6 space-y-4 text-right">
                  {/* Search and filter row */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative w-full sm:max-w-xs">
                      <input
                        type="text"
                        placeholder="ابحث عن مسوق بالاسم أو الرمز..."
                        value={affiliatesSearch}
                        onChange={(e) => setAffiliatesSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold text-slate-900 text-right focus:bg-white focus:border-brand-blue focus:outline-none"
                      />
                      <Search className="h-4 w-4 text-slate-400 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  {affiliates.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-slate-50 text-slate-500 p-5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                        <Users className="h-8 w-8 text-brand-blue" />
                      </div>
                      <h4 className="text-sm font-black text-slate-900">لا يوجد مسوقون مسجلون حالياً</h4>
                      <p className="text-[11px] text-slate-500 mt-2 max-w-sm mx-auto font-bold leading-normal">
                        أضف مسوقين يدويًا، شارك روابط الإحالة معهم، وتابع العمولات المترتبة على كل طلبية مستلمة بنجاح!
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-black">
                            <th className="pb-3 pt-2 font-black pr-2 text-right">المسوّق</th>
                            <th className="pb-3 pt-2 font-black text-right">كود الإحالة</th>
                            <th className="pb-3 pt-2 font-black text-right">إجمالي الطلبات</th>
                            <th className="pb-3 pt-2 font-black text-right">إجمالي المبيعات</th>
                            <th className="pb-3 pt-2 font-black text-right text-emerald-600">العمولة الحالية</th>
                            <th className="pb-3 pt-2 font-black pl-2 text-left">رابط الإحالة والعمليات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                          {affiliates
                            .filter(a => {
                              if (!affiliatesSearch) return true;
                              const s = affiliatesSearch.toLowerCase();
                              return a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s);
                            })
                            .map((aff) => {
                              const refUrl = `${getPublicOrigin()}/?ref=${aff.code}`;
                              const isExpanded = expandedAffiliateId === aff.id;
                              const affiliateOrders = orders.filter(
                                o => (o.referrer || '').trim().toUpperCase() === aff.code.trim().toUpperCase()
                              );

                              return (
                                <React.Fragment key={aff.id}>
                                  <tr 
                                    onClick={() => setExpandedAffiliateId(isExpanded ? null : aff.id)}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                  >
                                    <td className="py-3.5 pr-2 font-black text-right">
                                      <div className="flex items-center gap-2 justify-start">
                                        {isExpanded ? (
                                          <ChevronUp className="h-4 w-4 text-brand-blue shrink-0" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                                        )}
                                        <div className="h-8 w-8 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue font-black text-xs shrink-0">
                                          {aff.name.trim().charAt(0)}
                                        </div>
                                        <div className="text-right">
                                          <span className="block text-slate-900 text-xs font-black">{aff.name}</span>
                                          <div className="flex flex-col gap-0.5 mt-0.5">
                                            <span className="text-[10px] text-slate-500 block">
                                              العمولة: {aff.commissionRate !== undefined && aff.commissionRate !== null ? `${aff.commissionRate}%` : `${siteSettings.referralCommissionRate || 10}% (عامة)`}
                                            </span>
                                            <span className="text-[10px] text-brand-blue font-bold block hover:underline">
                                              {isExpanded ? 'إخفاء المشترين والزبائن 👥' : `عرض المشترين المحالين (${affiliateOrders.length}) 👥`}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-3.5 font-mono font-black text-slate-700 text-right">
                                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                        {aff.code}
                                      </span>
                                    </td>
                                    <td className="py-3.5 font-mono text-right">
                                      <span className="block font-black text-slate-900">{aff.totalOrders || 0} طلب</span>
                                      <span className="text-[10px] text-brand-blue block mt-0.5">👥 {affiliateOrders.length} زبائن</span>
                                    </td>
                                    <td className="py-3.5 font-mono text-slate-700 text-right">{formatPrice(aff.totalSales || 0)}</td>
                                    <td className="py-3.5 font-mono text-emerald-600 font-black text-sm text-right">{formatPrice(aff.commissionBalance || 0)}</td>
                                    <td className="py-3.5 pl-2 text-left">
                                      <div className="flex items-center gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(refUrl);
                                            triggerNoti('تم نسخ رابط الإحالة بنجاح 🔗');
                                          }}
                                          className="bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-[10px] font-black px-3 py-1.5 rounded-xl border border-brand-blue/20 transition-all flex items-center gap-1 cursor-pointer"
                                          title="نسخ رابط الإحالة الفريد للمسوق"
                                        >
                                          <span>نسخ الرابط 🔗</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            startEditAffiliate(aff);
                                          }}
                                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                                        >
                                          تعديل
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteAffiliate(aff.id, aff.name);
                                          }}
                                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-rose-200 transition-all cursor-pointer"
                                        >
                                          حذف
                                        </button>
                                      </div>
                                    </td>
                                  </tr>

                                  {/* Buyers list for this affiliate */}
                                  {isExpanded && (
                                    <tr className="bg-slate-50/70">
                                      <td colSpan={6} className="p-4 border-t border-b border-slate-200 bg-slate-50/50">
                                        <div className="space-y-3 text-right">
                                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 mb-2">
                                            <span className="text-slate-900 font-black">👥 قائمة المشترين والزبائن المحالين من هذا المسوّق ({affiliateOrders.length} زبون)</span>
                                          </h4>
                                          
                                          {affiliateOrders.length === 0 ? (
                                            <p className="text-[11px] text-slate-500 font-bold py-2">لا يوجد أي مبيعات أو مشترين مسجلين لهذا المسوّق بعد.</p>
                                          ) : (
                                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden text-xs max-h-72 overflow-y-auto shadow-xs">
                                              <table className="w-full text-right">
                                                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                                  <tr>
                                                    <th className="p-2.5">المشتري والهاتف</th>
                                                    <th className="p-2.5">البلدية والعنوان</th>
                                                    <th className="p-2.5 text-center">التاريخ</th>
                                                    <th className="p-2.5 text-center">الحالة</th>
                                                    <th className="p-2.5 text-left">قيمة الطلب</th>
                                                    <th className="p-2.5 text-center">الإجراء</th>
                                                  </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                  {affiliateOrders.map((ord) => (
                                                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                                                      <td className="p-2.5">
                                                        <div className="flex flex-col">
                                                          <span className="font-extrabold text-slate-900 text-[11px]">{ord.customerName}</span>
                                                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">{ord.phone}</span>
                                                        </div>
                                                      </td>
                                                      <td className="p-2.5">
                                                        <div className="flex flex-col">
                                                          <span className="font-bold text-slate-800">{ord.municipality}</span>
                                                          {ord.address && (
                                                            <span className="text-[10px] text-slate-500 truncate max-w-[150px]">{ord.address}</span>
                                                          )}
                                                        </div>
                                                      </td>
                                                      <td className="p-2.5 text-center text-[10px] text-slate-500 font-mono">{ord.date}</td>
                                                      <td className="p-2.5 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                                                          ord.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
                                                          ord.status === 'confirmed' ? 'bg-blue-500/10 text-brand-blue border-blue-200' :
                                                          ord.status === 'shipped' ? 'bg-purple-500/10 text-purple-700 border-purple-200' :
                                                          'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                                                        }`}>
                                                          {ord.status === 'pending' ? 'قيد الانتظار' :
                                                           ord.status === 'confirmed' ? 'تم التأكيد' :
                                                           ord.status === 'shipped' ? 'مع المندوب' : 'تم الاستلام والدفع'}
                                                        </span>
                                                      </td>
                                                      <td className="p-2.5 text-left font-black text-slate-900 font-mono">{formatPrice(ord.total)}</td>
                                                      <td className="p-2.5 text-center">
                                                        <button
                                                          type="button"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedOrder(ord);
                                                          }}
                                                          className="bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue text-[10px] font-black px-2.5 py-1 rounded-lg border border-brand-blue/20 transition-all cursor-pointer"
                                                        >
                                                          عرض التفاصيل 🔎
                                                        </button>
                                                      </td>
                                                    </tr>
                                                  ))}
                                                </tbody>
                                              </table>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative text-slate-900">
            {/* Close Button */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute left-4 top-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">تفاصيل طلبية رقم:</span>
                <h3 className="text-lg font-black font-mono text-brand-blue">{orders.findIndex(o => o.id === selectedOrder.id) + 1}</h3>
                <span className="text-xs text-slate-500 font-mono">تاريخ الطلب: {selectedOrder.date}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-600 font-bold">الحالة الحالية:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                  selectedOrder.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
                  selectedOrder.status === 'confirmed' ? 'bg-blue-500/10 text-brand-blue border-blue-200' :
                  selectedOrder.status === 'shipped' ? 'bg-purple-500/10 text-purple-700 border-purple-200' :
                  'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                }`}>
                  {selectedOrder.status === 'pending' ? '⏳ قيد الانتظار' :
                   selectedOrder.status === 'confirmed' ? '✅ تم التأكيد' :
                   selectedOrder.status === 'shipped' ? '🚚 مع المندوب' : '💵 تم الاستلام'}
                </span>
              </div>
            </div>

            {/* Customer Details Grid */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                <span>👤 معلومات الزبون والتوصيل</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">اسم العميل:</span>
                  <span className="font-extrabold text-slate-900 text-sm">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">رقم الهاتف:</span>
                  <span className="font-black font-mono text-slate-900 select-all">{selectedOrder.phone}</span>
                </div>
                {selectedOrder.customerEmail && (
                  <div>
                    <span className="text-slate-500 block mb-0.5">البريد الإلكتروني:</span>
                    <span className="font-semibold font-mono text-slate-700">{selectedOrder.customerEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block mb-0.5">البلدية:</span>
                  <span className="font-extrabold text-brand-blue">{selectedOrder.municipality}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block mb-0.5">العنوان الكامل بالتفصيل:</span>
                  <span className="font-semibold text-slate-700 leading-relaxed block">{selectedOrder.address}</span>
                </div>
                {selectedOrder.referrer && (
                  <div className="sm:col-span-2 border-t border-slate-200 pt-2.5 mt-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-slate-500 block mb-0.5">رمز المسوّق بالإحالة:</span>
                      <span className="font-mono font-black text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded border border-brand-blue/20">
                        {selectedOrder.referrer}
                      </span>
                    </div>
                    {selectedOrder.commissionCalculated && (
                      <div className="text-right sm:text-left">
                        <span className="text-slate-500 block mb-0.5">العمولة المحتسبة:</span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {formatPrice(selectedOrder.commissionAmount || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <span>📦 السلع واللوازم المطلوبة</span>
              </h4>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden text-xs shadow-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">المنتج</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-left">السعر الفردي</th>
                      <th className="p-3 text-left">الإجمالي الفرعي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-3 flex items-center gap-2.5">
                          <img src={getCompatibleImageUrl(it.product.image)} alt={it.product.name} className="h-8 w-8 rounded object-cover border border-slate-200 bg-slate-50" referrerPolicy="no-referrer" />
                          <div className="text-right" dir="rtl">
                            <p className="font-bold text-slate-900 leading-normal truncate max-w-[200px] sm:max-w-[280px]">{it.product.name}</p>
                            {it.product.brand && <p className="text-[10px] text-slate-500 font-mono">{it.product.brand}</p>}
                            {it.product.isPack && it.product.packItems && (
                              <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] text-slate-600 space-y-0.5 text-right" dir="rtl">
                                <p className="font-bold text-slate-800">📦 محتويات الباك المعدلة:</p>
                                {it.product.packItems.map((pi, piIdx) => (
                                  <div key={pi.id || piIdx}>- {pi.name} ({pi.quantity}x)</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-black text-slate-900">{it.quantity}</td>
                        <td className="p-3 text-left font-mono text-slate-600">{formatPrice(it.product.price)}</td>
                        <td className="p-3 text-left font-black text-slate-900">{formatPrice(it.product.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total calculation summary */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <span className="text-xs font-black text-slate-900">إجمالي قيمة الفاتورة الكلي:</span>
              <span className="text-lg font-black text-emerald-600 font-mono">{formatPrice(selectedOrder.total)}</span>
            </div>

            {/* Action buttons inside detail modal */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <p className="text-[11px] font-black text-slate-600">تغيير حالة الطلب من هنا:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrder.id, 'pending');
                    setSelectedOrder(prev => prev ? { ...prev, status: 'pending' } : null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    selectedOrder.status === 'pending'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-amber-700 border-slate-200'
                  }`}
                >
                  ⏳ قيد الانتظار
                </button>
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrder.id, 'confirmed');
                    setSelectedOrder(prev => prev ? { ...prev, status: 'confirmed' } : null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    selectedOrder.status === 'confirmed'
                      ? 'bg-brand-blue text-white border-brand-blue shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-brand-blue border-slate-200'
                  }`}
                >
                  ✅ تأكيد الطلبية
                </button>
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrder.id, 'shipped');
                    setSelectedOrder(prev => prev ? { ...prev, status: 'shipped' } : null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    selectedOrder.status === 'shipped'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-purple-700 border-slate-200'
                  }`}
                >
                  🚚 مع المندوب
                </button>
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrder.id, 'delivered');
                    setSelectedOrder(prev => prev ? { ...prev, status: 'delivered' } : null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    selectedOrder.status === 'delivered'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-emerald-700 border-slate-200'
                  }`}
                >
                  💵 تم التوصيل والقبض
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-red-200"
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  <span>حذف هذه الطلبية نهائياً من المتجر 🗑️</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-slate-900 animate-in zoom-in-95 duration-200">
            {/* Warning Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${
                deleteConfirm.type === 'visitors_reset'
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}>
                {deleteConfirm.type === 'visitors_reset' ? (
                  <RefreshCw className="h-5 w-5" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{deleteConfirm.title}</h3>
                <p className="text-[10px] text-slate-500 font-bold">إجراء نهائي وغير قابل للتراجع</p>
              </div>
            </div>

            {/* Message */}
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              {deleteConfirm.message}
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleExecuteDelete}
                className={`flex-1 py-3 px-4 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  deleteConfirm.type === 'visitors_reset'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {deleteConfirm.type === 'visitors_reset' ? (
                  <span>تأكيد التصفير 🔄</span>
                ) : (
                  <span>تأكيد الحذف 🗑️</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center"
              >
                <span>تراجع وإلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Site Report PDF Preview Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] text-right" dir="rtl">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl relative text-slate-900 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-blue/10 text-brand-blue rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">معاينة التقرير العام الشامل قبل الطباعة</h3>
                  <p className="text-[10px] text-slate-500 font-bold">يمكنك مراجعة البيانات بالأسفل ومن ثم حفظها كـ PDF أو طباعتها مباشرة</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50">
              <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-xs border border-slate-200 text-right text-xs max-w-4xl mx-auto space-y-6 select-none leading-relaxed">
                {/* Simulated Printed Page Header */}
                <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
                  <div>
                    <h1 className="text-xl font-black text-slate-900">متجر توقرت المدرسي</h1>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">بوابتك المتكاملة للمستلزمات الدراسية بولاية توقرت</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-mono">البلد: الجزائر | الولاية: توقرت</p>
                  </div>
                  <div className="text-left">
                    <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-[10px] font-black">تقرير رسمي معتمد</span>
                    <p className="text-[10px] text-slate-500 font-mono mt-2">تاريخ التصدير: {new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">الوقت: {new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Report Title */}
                <div className="text-center py-2">
                  <h2 className="text-base font-black text-slate-900 underline underline-offset-4 decoration-brand-blue">التقرير الإحصائي الشامل والتحليلي لنشاط المتجر</h2>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-bold">يغطي كافة المعاملات المالية، أداء المسوقين بالعمولة، حركة المنتجات والمخزون الحالي</p>
                </div>

                {/* Section 1: Financial & Sales Indicators */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 border-r-4 border-brand-blue pr-2 py-0.5">أولاً: المؤشرات المالية والمبيعات الكلية</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-right">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold block">إجمالي الإيرادات المحققة</span>
                      <span className="text-sm font-black text-emerald-700 block mt-1">{formatPrice(totalRevenue)}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">من الطلبيات المستلمة</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold block">صافي الأرباح الفعلية</span>
                      <span className="text-sm font-black text-teal-700 block mt-1">{formatPrice(totalProfit)}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">بعد خصم عمولة المسوقين</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold block">صافي الأرباح المتوقعة</span>
                      <span className="text-sm font-black text-blue-700 block mt-1">{formatPrice(totalExpectedProfit)}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">لكامل الطلبات بالمخزن</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold block">إجمالي عدد الطلبات</span>
                      <span className="text-sm font-black text-slate-900 block mt-1">{stats.totalOrders} طلبية</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">بمتوسط {formatPrice(stats.totalOrders > 0 ? Math.round(totalRevenue / stats.totalOrders) : 0)} / طلب</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-slate-500 text-[10px] font-bold block">إجمالي عدد زوار الموقع</span>
                      <span className="text-sm font-black text-purple-700 block mt-1">{visitorsCount.toLocaleString()} زائر</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">حركة حقيقية بولاية توقرت</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Affiliates Performance */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 border-r-4 border-purple-500 pr-2 py-0.5">ثانياً: حركة وأداء المسوقين بالعمولة (Affiliate Program)</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">الاسم</th>
                          <th className="p-2">الرمز (Code)</th>
                          <th className="p-2 text-center">الطلبيات</th>
                          <th className="p-2 text-left">إجمالي المبيعات</th>
                          <th className="p-2 text-left">العمولة المستحقة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {affiliates.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-3 text-center text-slate-400 font-bold">لا يوجد مسوقين مسجلين بالشبكة حالياً.</td>
                          </tr>
                        ) : (
                          affiliates.map((aff) => {
                            const affiliateOrders = orders.filter(
                              o => (o.referrer || '').trim().toUpperCase() === aff.code.trim().toUpperCase()
                            );
                            return (
                              <React.Fragment key={aff.id}>
                                <tr className="hover:bg-slate-50 bg-slate-50/20">
                                  <td className="p-2 font-black text-slate-800">{aff.name}</td>
                                  <td className="p-2 font-mono font-bold text-brand-blue">{aff.code}</td>
                                  <td className="p-2 text-center font-mono font-black">{aff.totalOrders || 0}</td>
                                  <td className="p-2 text-left font-mono font-bold">{formatPrice(aff.totalSales || 0)}</td>
                                  <td className="p-2 text-left font-mono font-black text-emerald-600">{formatPrice(aff.commissionBalance || 0)}</td>
                                </tr>
                                {affiliateOrders.length > 0 && (
                                  <tr>
                                    <td colSpan={5} className="p-2.5 bg-slate-50/50">
                                      <div className="text-[10px] text-slate-600 mr-4 border-r-2 border-purple-300 pr-2 space-y-1">
                                        <span className="font-extrabold text-purple-800 block mb-1">👥 المشترون والزبائن المحالون من هذا المسوّق ({affiliateOrders.length}):</span>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-slate-700">
                                          {affiliateOrders.map((o, idx) => (
                                            <div key={o.id} className="flex justify-between border-b border-slate-200/60 pb-0.5">
                                              <span>{idx + 1}. {o.customerName} ({o.municipality})</span>
                                              <span className="font-mono text-slate-600 font-bold">{formatPrice(o.total)}</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Best Selling Products & Packs */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 border-r-4 border-emerald-500 pr-2 py-0.5">ثالثاً: حركة السلع والمنتجات الأكثر طلباً</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-[11px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">المنتج / الباقة المدرسية</th>
                          <th className="p-2">الفئة</th>
                          <th className="p-2 text-center">الكمية المباعة</th>
                          <th className="p-2 text-left">سعر القطعة</th>
                          <th className="p-2 text-left">مجموع المبيعات الكلية</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {processedStats.slice(0, 5).map((p, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-black text-slate-800 flex items-center gap-1">
                              <span>{p.name}</span>
                              {p.isPack && <span className="px-1.5 py-0.5 bg-brand-blue/10 text-brand-blue text-[8px] rounded-full font-black">باقة</span>}
                            </td>
                            <td className="p-2 text-slate-500 font-bold">{p.category}</td>
                            <td className="p-2 text-center font-mono font-bold text-slate-900">{p.unitsSold} وحدة</td>
                            <td className="p-2 text-left font-mono">{formatPrice(p.price)}</td>
                            <td className="p-2 text-left font-mono font-black text-teal-700">{formatPrice(p.unitsSold * p.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 4: Recent Orders Log */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-slate-900 border-r-4 border-blue-500 pr-2 py-0.5">رابعاً: آخر 10 طلبيات تمت في المتجر</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-right text-[10px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">#</th>
                          <th className="p-2">الزبون</th>
                          <th className="p-2">الهاتف</th>
                          <th className="p-2">البلدية والعنوان</th>
                          <th className="p-2 text-center">التاريخ</th>
                          <th className="p-2 text-center">الحالة</th>
                          <th className="p-2 text-left">المبلغ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.slice(0, 10).map((ord, idx) => (
                          <tr key={ord.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-black">#{idx + 1}</td>
                            <td className="p-2 font-black text-slate-800">{ord.customerName}</td>
                            <td className="p-2 font-mono">{ord.phone}</td>
                            <td className="p-2 font-bold text-slate-600">{ord.municipality}</td>
                            <td className="p-2 text-center font-mono">{ord.date}</td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black border ${
                                ord.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
                                ord.status === 'confirmed' ? 'bg-blue-500/10 text-brand-blue border-blue-200' :
                                ord.status === 'shipped' ? 'bg-purple-500/10 text-purple-700 border-purple-200' :
                                'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                              }`}>
                                {ord.status === 'pending' ? 'قيد الانتظار' :
                                 ord.status === 'confirmed' ? 'تم التأكيد' :
                                 ord.status === 'shipped' ? 'مع المندوب' : 'تم الاستلام والدفع'}
                              </span>
                            </td>
                            <td className="p-2 text-left font-mono font-black text-slate-900">{formatPrice(ord.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Page Footer / Stamp Area */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-300 mt-6 text-[10px]">
                  <div>
                    <p className="font-bold text-slate-500">تم إنشاؤه بواسطة: نظام المتجر الإداري الذكي 💻</p>
                    <p className="text-slate-400 mt-0.5">معلومات دقيقة مدعومة بخادم Firestore المتكامل</p>
                  </div>
                  <div className="text-center bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 min-w-[120px]">
                    <span className="block text-slate-400 text-[8px] font-black mb-1">ختم إدارة المتجر الرسمي</span>
                    <span className="font-black text-brand-blue text-[11px] block tracking-widest">TOUGGOURT STORE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-200 shrink-0 bg-white flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <span>إغلاق المعاينة</span>
              </button>

              <button
                type="button"
                disabled={isDownloadingPdf}
                onClick={handleDownloadPdfDirectly}
                className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
              >
                {isDownloadingPdf ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    <span>جاري توليد وتنزيل ملف PDF... ⏳</span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4.5 w-4.5" />
                    <span>تنزيل ملف PDF مباشرة 📥📄</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container specifically for browser window.print() */}
      {showReportModal && (
        <div id="print-report-container" className="hidden">
          <div className="bg-white text-slate-900 p-8 text-right text-xs space-y-6 leading-relaxed" dir="rtl">
            {/* Printed Page Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">متجر توقرت المدرسي</h1>
                <p className="text-xs text-slate-500 font-bold mt-1">بوابتك المتكاملة للمستلزمات الدراسية بولاية توقرت</p>
                <p className="text-xs text-slate-400 mt-2 font-mono">البلد: الجزائر | الولاية: توقرت</p>
              </div>
              <div className="text-left">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-black">تقرير رسمي معتمد</span>
                <p className="text-xs text-slate-500 font-mono mt-3">تاريخ التصدير: {new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p className="text-xs text-slate-400 font-mono mt-1">الوقت: {new Date().toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>

            {/* Report Title */}
            <div className="text-center py-4">
              <h2 className="text-xl font-black text-slate-900 underline underline-offset-4 decoration-blue-600">التقرير الإحصائي الشامل والتحليلي لنشاط المتجر</h2>
              <p className="text-xs text-slate-500 mt-2 font-bold">يغطي كافة المعاملات المالية، أداء المسوقين بالعمولة، حركة المنتجات والمخزون الحالي</p>
            </div>

            {/* Section 1: Financial & Sales Indicators */}
            <div className="space-y-3 print-avoid-break">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-blue-600 pr-2.5 py-0.5">أولاً: المؤشرات المالية والمبيعات الكلية</h3>
              <div className="grid grid-cols-5 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] font-bold block">إجمالي الإيرادات المحققة</span>
                  <span className="text-sm font-black text-emerald-700 block mt-1">{formatPrice(totalRevenue)}</span>
                  <span className="text-[9px] text-slate-400 block mt-1">من الطلبيات المستلمة والمسددة</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] font-bold block">صافي الأرباح الفعلية</span>
                  <span className="text-sm font-black text-teal-700 block mt-1">{formatPrice(totalProfit)}</span>
                  <span className="text-[9px] text-slate-400 block mt-1">بعد خصم عمولة المسوقين</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] font-bold block">صافي الأرباح المتوقعة</span>
                  <span className="text-sm font-black text-blue-700 block mt-1">{formatPrice(totalExpectedProfit)}</span>
                  <span className="text-[9px] text-slate-400 block mt-1">لكامل الطلبات بالمخزن</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] font-bold block">إجمالي عدد الطلبات</span>
                  <span className="text-sm font-black text-slate-900 block mt-1">{stats.totalOrders} طلبية</span>
                  <span className="text-[9px] text-slate-400 block mt-1">بمتوسط {formatPrice(stats.totalOrders > 0 ? Math.round(totalRevenue / stats.totalOrders) : 0)} / طلب</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] font-bold block">إجمالي زوار الموقع</span>
                  <span className="text-sm font-black text-purple-700 block mt-1">{visitorsCount.toLocaleString()} زائر</span>
                  <span className="text-[9px] text-slate-400 block mt-1">حركة نشطة بولاية توقرت</span>
                </div>
              </div>
            </div>

            {/* Section 2: Affiliates Performance */}
            <div className="space-y-3 print-avoid-break">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-purple-500 pr-2.5 py-0.5">ثانياً: حركة وأداء المسوقين بالعمولة (Affiliate Program)</h3>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-3">الاسم الكلي</th>
                      <th className="p-3">الرمز (Code)</th>
                      <th className="p-3 text-center">الطلبيات الكلية</th>
                      <th className="p-3 text-left">إجمالي المبيعات</th>
                      <th className="p-3 text-left">العمولة المستحقة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {affiliates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-400 font-bold">لا يوجد مسوقين مسجلين بالشبكة حالياً.</td>
                      </tr>
                    ) : (
                      affiliates.map((aff) => {
                        const affiliateOrders = orders.filter(
                          o => (o.referrer || '').trim().toUpperCase() === aff.code.trim().toUpperCase()
                        );
                        return (
                          <React.Fragment key={aff.id}>
                            <tr className="bg-slate-50/40">
                              <td className="p-3 font-black text-slate-800">{aff.name}</td>
                              <td className="p-3 font-mono font-bold text-blue-600">{aff.code}</td>
                              <td className="p-3 text-center font-mono font-black">{aff.totalOrders || 0}</td>
                              <td className="p-3 text-left font-mono font-bold">{formatPrice(aff.totalSales || 0)}</td>
                              <td className="p-3 text-left font-mono font-black text-emerald-600">{formatPrice(aff.commissionBalance || 0)}</td>
                            </tr>
                            {affiliateOrders.length > 0 && (
                              <tr className="print-avoid-break">
                                <td colSpan={5} className="p-3 bg-white">
                                  <div className="text-[11px] text-slate-600 mr-6 border-r-2 border-purple-400 pr-3 space-y-1">
                                    <span className="font-black text-purple-700 block mb-1">👥 قائمة الزبائن والمشترين المحالين من هذا المسوّق:</span>
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                                      {affiliateOrders.map((o, idx) => (
                                        <div key={o.id} className="flex justify-between border-b border-slate-100 pb-1">
                                          <span className="font-bold text-slate-800">{idx + 1}. {o.customerName} - {o.municipality} ({o.date})</span>
                                          <span className="font-mono text-slate-600 font-black">{formatPrice(o.total)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Best Selling Products & Packs */}
            <div className="space-y-3 print-avoid-break">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-emerald-500 pr-2.5 py-0.5">ثالثاً: حركة السلع والمنتجات الأكثر طلباً</h3>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-3">المنتج / الباقة المدرسية</th>
                      <th className="p-3">الفئة</th>
                      <th className="p-3 text-center">الكمية المباعة</th>
                      <th className="p-3 text-left">سعر القطعة</th>
                      <th className="p-3 text-left">مجموع المبيعات الكلية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {processedStats.slice(0, 10).map((p, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-black text-slate-800">
                          {p.name}
                          {p.isPack && <span className="mr-1 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded-full font-black">باقة</span>}
                        </td>
                        <td className="p-3 text-slate-500 font-bold">{p.category}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">{p.unitsSold} وحدة</td>
                        <td className="p-3 text-left font-mono">{formatPrice(p.price)}</td>
                        <td className="p-3 text-left font-mono font-black text-teal-700">{formatPrice(p.unitsSold * p.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4: Recent Orders Log */}
            <div className="space-y-3 print-avoid-break">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-blue-500 pr-2.5 py-0.5">رابعاً: آخر الطلبيات المستلمة والمسجلة بالمتجر</h3>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">الزبون</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3">البلدية والعنوان</th>
                      <th className="p-3 text-center">التاريخ</th>
                      <th className="p-3 text-center">الحالة</th>
                      <th className="p-3 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.slice(0, 15).map((ord, idx) => (
                      <tr key={ord.id}>
                        <td className="p-3 font-mono font-black">#{idx + 1}</td>
                        <td className="p-3 font-black text-slate-800">{ord.customerName}</td>
                        <td className="p-3 font-mono">{ord.phone}</td>
                        <td className="p-3 font-bold text-slate-600">{ord.municipality}</td>
                        <td className="p-3 text-center font-mono">{ord.date}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                            ord.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-200' :
                            ord.status === 'confirmed' ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
                            ord.status === 'shipped' ? 'bg-purple-500/10 text-purple-700 border-purple-200' :
                            'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                          }`}>
                            {ord.status === 'pending' ? 'قيد الانتظار' :
                             ord.status === 'confirmed' ? 'تم التأكيد' :
                             ord.status === 'shipped' ? 'مع المندوب' : 'تم الاستلام والدفع'}
                          </span>
                        </td>
                        <td className="p-3 text-left font-mono font-black text-slate-900">{formatPrice(ord.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* General Warehouse Info */}
            <div className="space-y-3 print-avoid-break">
              <h3 className="text-sm font-black text-slate-900 border-r-4 border-slate-700 pr-2.5 py-0.5">خامساً: جرد المخزون والقيمة الرأسمالية للمستودع</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-xs font-bold block">إجمالي تكلفة شراء المخزون الحالي</span>
                  <span className="text-lg font-black text-slate-900 block mt-1.5">{formatPrice(inventoryStats.totalPurchaseCost)}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">القيمة المالية الرأسمالية لكافة السلع والكتب والكراريس المخزنة</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-xs font-bold block">الأرباح التقديرية الكامنة بالمخزن</span>
                  <span className="text-lg font-black text-emerald-700 block mt-1.5">{formatPrice(inventoryStats.totalPotentialProfit)}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">صافي العوائد المتوقعة بعد تسويق وبيع كامل المخزون المتوفر</span>
                </div>
              </div>
            </div>

            {/* Page Footer / Stamp Area */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-300 mt-8 text-xs print-avoid-break">
              <div>
                <p className="font-bold text-slate-500">تم إنشاؤه بواسطة: نظام المتجر الإداري الذكي 💻</p>
                <p className="text-slate-400 mt-1">تقرير رسمي معزز بقواعد بيانات حية وفورية بولاية توقرت</p>
              </div>
              <div className="text-center bg-slate-50 px-6 py-3 rounded-xl border border-slate-200 min-w-[150px]">
                <span className="block text-slate-400 text-[10px] font-black mb-1">ختم وتوقيع الإدارة الرسمي</span>
                <span className="font-black text-blue-600 text-sm block tracking-widest">TOUGGOURT STORE</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
