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
  Smartphone,
  Sparkles,
  RefreshCw,
  Upload,
  BookOpen,
  PenTool,
  Palette,
  Cpu
} from 'lucide-react';
import { Product, Category, Municipality, Order, User, Review, SiteSettings, Affiliate } from '../types';
import { convertGoogleDriveUrl, getCompatibleImageUrl } from '../utils/imageHelper';
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
  onUpdateAffiliates
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'categories' | 'orders' | 'customers' | 'shipping' | 'offers' | 'reviews' | 'settings' | 'packs' | 'sales_stats' | 'affiliates'>('overview');
  
  // Selected Order for details modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Custom Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    type: 'product' | 'order' | 'pack' | 'visitors_reset' | 'category' | 'affiliate';
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
  const [prodStockQuantity, setProdStockQuantity] = useState<number>(10);
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

  // --- AFFILIATES FORM STATES ---
  const [isAddingAffiliate, setIsAddingAffiliate] = useState(false);
  const [editingAffiliate, setEditingAffiliate] = useState<Affiliate | null>(null);
  const [affiliateName, setAffiliateName] = useState('');
  const [affiliateCode, setAffiliateCode] = useState('');
  const [affiliateCommissionRate, setAffiliateCommissionRate] = useState<string>('');
  const [affiliatesSearch, setAffiliatesSearch] = useState('');

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
        return sum + orderProfit;
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
      const quantity = p.stockQuantity !== undefined ? p.stockQuantity : 10;
      
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
      referralCommissionRate: Number(setCommissionRate)
    });
    triggerNoti('تم حفظ إعدادات الموقع وتطبيقها على المتجر بنجاح!');
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
  const handleProductSave = (e: React.FormEvent) => {
    e.preventDefault();
    const featuresList = prodFeatures.split(',').map(f => f.trim()).filter(Boolean);

    const finalImage = convertGoogleDriveUrl(prodImage) || 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600';

    const parsedPrice = parseFloat(String(prodPrice).replace(',', '.')) || 0;
    const parsedPurchasePrice = parseFloat(String(prodPurchasePrice).replace(',', '.')) || 0;

    if (editingProduct) {
      // Edit
      const updated = products.map(p => p.id === editingProduct.id ? {
        ...p,
        name: prodName,
        description: prodDesc,
        price: parsedPrice,
        purchasePrice: parsedPurchasePrice,
        stockQuantity: prodStockQuantity,
        image: finalImage,
        category: prodCategory,
        brand: prodBrand,
        features: featuresList,
        inStock: prodInStock,
        isPopular: prodIsPopular
      } : p);
      onUpdateProducts(updated);
      setEditingProduct(null);
      triggerNoti('تم تعديل بيانات المنتج بنجاح');
    } else {
      // Create new
      const newProd: Product = {
        id: 'prod-' + Date.now(),
        name: prodName,
        description: prodDesc,
        price: parsedPrice,
        purchasePrice: parsedPurchasePrice,
        stockQuantity: prodStockQuantity,
        image: finalImage,
        category: prodCategory || categories[0]?.id || 'bags',
        rating: 5.0,
        brand: prodBrand || 'مدرستنا',
        features: featuresList.length ? featuresList : ['مستلزم عالي الجودة لولاية توقرت'],
        inStock: prodInStock,
        isPopular: prodIsPopular
      };
      onUpdateProducts([newProd, ...products]);
      setIsAddingProduct(false);
      triggerNoti('تمت إضافة المنتج الجديد وعرضه في المعرض!');
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
    setProdStockQuantity(p.stockQuantity !== undefined ? p.stockQuantity : 10);
    setProdImage(p.image);
    setProdCategory(p.category);
    setProdBrand(p.brand || '');
    setProdFeatures(p.features.join(', '));
    setProdInStock(p.inStock);
    setProdIsPopular(p.isPopular);
  };

  // Toggle Stock directly
  const handleToggleStock = (p: Product) => {
    const updated = products.map(item => item.id === p.id ? { ...item, inStock: !item.inStock } : item);
    onUpdateProducts(updated);
    triggerNoti(`تم تغيير حالة المخزون للمنتج: ${p.name}`);
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
      commission = Math.round(originalOrder.total * (rate / 100));
      console.log(`[REFERRAL TRACE - STATUS UPDATE] Calculated commission for code "${code}": ${commission} DA (Rate used: ${rate}%)`);
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
        deliveryTime: muniTime
      } : m);
      onUpdateMunicipalities(updated);
      setEditingMuni(null);
      triggerNoti('تم حفظ رسوم الشحن ومدة التوصيل المحدثة');
    }
  };

  // Review Status Update
  const handleReviewStatus = (reviewId: string, status: Review['status']) => {
    const updated = reviews.map(r => r.id === reviewId ? { ...r, status } : r);
    onUpdateReviews(updated);
    triggerNoti(`تم تحديث تقييم المنتج وتعديل عرضه`);
  };

  // Filter lists based on search
  const filteredProductsList = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrdersList = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.phone.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col" id="admin-main-view">
      
      {/* Admin Top Header Bar */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-blue text-white p-2 rounded-xl">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div className="text-right">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">لوحة التحكم والمخزون</h1>
            <p className="text-[10px] text-slate-400 font-bold">midad | مداد • إدارة المتجر</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <span className="text-xs font-bold block text-white">{siteSettings.storeName}</span>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">مدير عام المتجر</span>
          </div>
          <button
            onClick={onLogout}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs font-black transition-all border border-red-500/20 flex items-center gap-1.5"
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
        <aside className="w-full md:w-56 bg-slate-950 border-b md:border-b-0 md:border-l border-slate-800 p-3 space-y-1.5 shrink-0 text-right">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span>لوحة الإحصائيات</span>
          </button>

          <button
            onClick={() => setActiveTab('sales_stats')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'sales_stats' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="h-4 w-4 shrink-0" />
            <span>إحصائيات المبيعات</span>
          </button>

          <button
            onClick={() => { setActiveTab('products'); clearProductForm(); setIsAddingProduct(false); }}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'products' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0" />
              <span>المنتجات والمخزون</span>
            </div>
            <span className="bg-slate-800 text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded-full">{products.length}</span>
          </button>

          <button
            onClick={() => { setActiveTab('packs'); clearPackForm(); setIsAddingPack(false); }}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'packs' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>إدارة الباكات</span>
            </div>
            <span className="bg-slate-800 text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded-full">{packs.length}</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'categories' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FolderTree className="h-4 w-4 shrink-0" />
            <span>إدارة التصنيفات</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'orders' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span>إدارة الطلبات</span>
            </div>
            {stats.pendingOrders > 0 && (
              <span className="bg-amber-500 text-slate-905 text-[10px] font-black px-2 py-0.5 rounded-full">
                {stats.pendingOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'shipping' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="h-4 w-4 shrink-0" />
            <span>البلديات والشحن</span>
          </button>

          <button
            onClick={() => setActiveTab('affiliates')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activeTab === 'affiliates' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0" />
              <span>المسوّقون بالعمولة</span>
            </div>
            <span className="bg-slate-800 text-[10px] text-slate-300 font-bold px-2 py-0.5 rounded-full">{affiliates?.length || 0}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-brand-blue text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>إعدادات الموقع</span>
          </button>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 bg-slate-900 overflow-y-auto p-4 sm:p-6">
          
          {/* Internal Toast Feedback */}
          {noti && (
            <div className="mb-6 bg-emerald-500 text-slate-950 p-4 rounded-2xl text-xs font-black flex items-center gap-2.5 shadow-lg border border-emerald-400/30">
              <Check className="h-5 w-5 shrink-0" />
              <span>{noti.msg}</span>
            </div>
          )}

          {/* Tab 1: OVERVIEW & STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-8 text-right">
              {/* Main Bento Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-black">إجمالي إيرادات المتجر</span>
                    <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><DollarSign className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-emerald-400">{formatPrice(totalRevenue)}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">من الطلبيات المستلمة والمسلمة بالكامل</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-black">صافي الأرباح المحصلة</span>
                    <span className="p-2 bg-teal-500/10 text-teal-500 rounded-xl"><TrendingUp className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-teal-400">{formatPrice(totalProfit)}</h3>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">
                    الربح المتوقع الإجمالي: <span className="text-white font-mono">{formatPrice(totalExpectedProfit)}</span>
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-black">إجمالي الطلبات المستلمة</span>
                    <span className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl"><ShoppingBag className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-white">{stats.totalOrders} طلبية</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">بما في ذلك الطلبات قيد التجهيز والتأكيد</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-black">السلع والمنتجات المعروضة</span>
                    <span className="p-2 bg-purple-500/10 text-purple-500 rounded-xl"><Package className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-white">{stats.totalProducts} منتج</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">موزعة على كافة باقات المدارس والجامعات</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs font-black">عدد الزوار للموقع</span>
                    <span className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Eye className="h-5 w-5" /></span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-3 text-white">{visitorsCount.toLocaleString()} زائر</h3>
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
                      className="text-[9px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-2.5 py-1.5 rounded border border-red-500/10 transition-colors"
                    >
                      تصفير (0)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">نشاط حقيقي بولاية توقرت</p>
                </div>
              </div>

              {/* Order Status Breakdown Boxes */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                <h4 className="text-sm font-black mb-4">حالة الطلبات الحالية بالمخزن</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-center">
                    <span className="text-amber-500 text-xs font-black block">قيد الانتظار</span>
                    <span className="text-xl font-black text-white mt-1 block">{stats.pendingOrders}</span>
                  </div>

                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 text-center">
                    <span className="text-brand-blue text-xs font-black block">تم التأكيد والمراجعة</span>
                    <span className="text-xl font-black text-white mt-1 block">{stats.confirmedOrders}</span>
                  </div>

                  <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-4 text-center">
                    <span className="text-purple-400 text-xs font-black block">قيد الشحن مع السائق</span>
                    <span className="text-xl font-black text-white mt-1 block">{stats.shippedOrders}</span>
                  </div>

                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-center">
                    <span className="text-emerald-400 text-xs font-black block">تم الاستلام والتحصيل</span>
                    <span className="text-xl font-black text-white mt-1 block">{stats.deliveredOrders}</span>
                  </div>
                </div>
              </div>


            </div>
          )}

          {/* Tab: SALES STATISTICS */}
          {activeTab === 'sales_stats' && (
            <div className="space-y-6 text-right animate-in fade-in duration-300" dir="rtl">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-brand-blue" />
                  <span>إحصائيات وتحليلات المبيعات</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-bold">
                  تحليل فوري لحركة المبيعات والطلب الفعلي على مستوى المنتجات الفردية والباكات المدرسية.
                </p>
              </div>

              {/* Sales Statistics Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow">
                  <span className="text-slate-400 text-xs font-black block">إجمالي القطع المباعة</span>
                  <h3 className="text-xl sm:text-2xl font-black mt-2 text-white font-mono">{salesSummary.totalUnitsSold} قطعة</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">مجموع الكميات المباعة من كافة الأدوات والباكات</p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow">
                  <span className="text-slate-400 text-xs font-black block">المنتج الأكثر طلباً 🔥</span>
                  <h3 className="text-base sm:text-lg font-black mt-2 text-brand-blue truncate" title={salesSummary.bestSeller.name}>
                    {salesSummary.bestSeller.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                    تم بيع <strong className="text-white font-mono">{salesSummary.bestSeller.unitsSold} قطعة</strong> منه بنجاح
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow">
                  <span className="text-slate-400 text-xs font-black block">إجمالي المشترين الفريدين</span>
                  <h3 className="text-xl sm:text-2xl font-black mt-2 text-emerald-400 font-mono">{salesSummary.uniqueBuyersCount} عميل</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold">عدد العملاء المتميزين ببيانات تواصل فريدة</p>
                </div>
              </div>

              {/* Sales Line Chart over Days */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                  <div>
                    <h4 className="text-sm font-black text-white">منحنى تغير مبيعات المتجر اليومي</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">متابعة تفصيلية لتغير عدد الطلبات والقطع المباعة يومياً</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-brand-blue block"></span>
                      <span className="text-slate-300">عدد الطلبيات</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 block"></span>
                      <span className="text-slate-300">القطع المباعة</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full pr-4" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
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
                          backgroundColor: '#020617', 
                          borderColor: '#1e293b', 
                          borderRadius: '12px',
                          textAlign: 'right',
                          direction: 'rtl',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}
                        labelStyle={{ color: '#ffffff', fontWeight: '900', marginBottom: '4px' }}
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
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <h4 className="text-xs font-black text-white self-start sm:self-center">جدول تحليل مبيعات السلع والباكات ({processedStats.length} عنصر)</h4>
                  
                  {/* Search stats input */}
                  <div className="relative w-full sm:max-w-xs">
                    <input
                      type="text"
                      placeholder="ابحث عن منتج أو تصنيف..."
                      value={salesSearchTerm}
                      onChange={(e) => setSalesSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pr-9 pl-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-blue font-bold text-right"
                    />
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                {/* Sales Table list */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs font-semibold">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th 
                          onClick={() => {
                            setSalesSortKey('name');
                            setSalesSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                          }}
                          className="p-4 cursor-pointer hover:bg-slate-850 hover:text-white transition-colors"
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
                          className="p-4 text-center cursor-pointer hover:bg-slate-850 hover:text-white transition-colors"
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
                          className="p-4 text-center cursor-pointer hover:bg-slate-850 hover:text-white transition-colors"
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
                          className="p-4 text-left cursor-pointer hover:bg-slate-850 hover:text-white transition-colors"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>إجمالي المبيعات</span>
                            {salesSortKey === 'totalRevenue' && (salesSortOrder === 'asc' ? ' ▲' : ' ▼')}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {processedStats.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-500 font-bold">
                            لا توجد منتجات أو باكات تطابق معايير البحث
                          </td>
                        </tr>
                      ) : (
                        processedStats.map((item) => (
                          <tr key={item.id + '-' + item.name} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getCompatibleImageUrl(item.image)}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-950"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="text-right">
                                  <p className="font-extrabold text-white text-[12px] sm:text-xs leading-normal max-w-[220px] sm:max-w-[320px] truncate" title={item.name}>
                                    {item.name}
                                  </p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    الفئة: {categories.find(c => c.id === item.category)?.name || item.category}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              {item.isPack ? (
                                <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-500/20">
                                  باك مدرسي 🎁
                                </span>
                              ) : (
                                <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                                  منتج فردي 📦
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-left font-mono font-bold text-slate-400">
                              {formatPrice(item.price)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-mono font-black ${
                                item.unitsSold > 0 
                                  ? 'bg-brand-blue/15 text-white ring-1 ring-brand-blue/30' 
                                  : 'bg-slate-900 text-slate-500'
                              }`}>
                                {item.unitsSold}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-mono font-black ${
                                item.uniqueBuyersCount > 0 
                                  ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30' 
                                  : 'bg-slate-900 text-slate-500'
                              }`}>
                                {item.uniqueBuyersCount}
                              </span>
                            </td>
                            <td className="p-4 text-left font-mono font-black text-white">
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
            <div className="space-y-6 text-right">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">إدارة مخزون وسلع المتجر</h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold">إضافة وتعديل وحذف المنتجات في معرض متجر توقرت</p>
                </div>
                {!isAddingProduct && (
                  <button
                    onClick={() => { clearProductForm(); setIsAddingProduct(true); }}
                    className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة منتج جديد</span>
                  </button>
                )}
              </div>

              {/* Add/Edit Product Panel */}
              {isAddingProduct && (
                <form onSubmit={handleProductSave} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top duration-300">
                  <h4 className="text-sm font-black text-white pb-3 border-b border-slate-800 flex items-center gap-1.5">
                    <span>{editingProduct ? 'تعديل بيانات منتج' : 'إضافة منتج مدرسي جديد'}</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">اسم السلعة / المنتج</label>
                      <input
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue text-right text-white"
                        placeholder="مثال: آلة حاسبة كاسيو أصلية"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400">سعر الشراء (دج)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          value={prodPurchasePrice}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                            setProdPurchasePrice(cleaned);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue text-right text-white"
                          placeholder="مثال: 800"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400">سعر البيع (دج)</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          required
                          value={prodPrice}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^0-9.,]/g, '');
                            setProdPrice(cleaned);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue text-right text-white"
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
                                ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isLoss ? (
                                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse shrink-0" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
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

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">التصنيف</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-bold focus:outline-none focus:border-brand-blue text-right text-white"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">صورة المنتج (رابط أو رفع ملف من عندك)</label>
                      <div className="space-y-2">
                        <input
                          type="url"
                          value={prodImage && !prodImage.startsWith('data:') ? prodImage : ''}
                          onChange={(e) => setProdImage(convertGoogleDriveUrl(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono focus:outline-none focus:border-brand-blue text-left text-slate-200"
                          placeholder="أدخل رابط الصورة (URL) أو ارفع ملفاً بالأسفل..."
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-brand-blue text-slate-200 py-2 px-3 rounded-xl text-xs font-bold cursor-pointer text-center transition-all flex items-center justify-center gap-1.5 select-none">
                            <Upload className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>رفع صورة من جهازك 📁</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      setProdImage(reader.result);
                                      triggerNoti('تم تحميل الصورة المحلية بنجاح!', 'success');
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {prodImage && (
                            <div className="relative shrink-0 h-10 w-10 border border-slate-800 rounded-xl overflow-hidden bg-slate-900">
                              <img src={getCompatibleImageUrl(prodImage)} alt="Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => {
                                  setProdImage('');
                                  triggerNoti('تم إزالة الصورة');
                                }}
                                className="absolute inset-0 bg-red-600/80 hover:bg-red-700 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                title="إزالة الصورة"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400">الوصف التفصيلي</label>
                    <textarea
                      required
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue text-right text-white"
                      placeholder="اكتب وصفاً مفصلاً يوضح للتلاميذ جودة السلعة..."
                    />
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodInStock}
                        onChange={(e) => setProdInStock(e.target.checked)}
                        className="rounded border-slate-800 bg-slate-900 text-brand-blue focus:ring-0 h-4 w-4"
                      />
                      <span>متوفر في المخزن حالياً</span>
                    </label>
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black transition-all"
                    >
                      <span>حفظ وإدراج في المعرض</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { clearProductForm(); setIsAddingProduct(false); setEditingProduct(null); }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-xl text-xs font-bold transition-all"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Products Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
                  <h4 className="text-xs font-bold">قائمة المعروضات ({filteredProductsList.length} منتج)</h4>
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="البحث بالاسم..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 pr-9 pl-3 text-xs text-white"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs font-semibold">
                    <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">المنتج</th>
                        <th className="p-4">التصنيف</th>
                        <th className="p-4">سعر الشراء</th>
                        <th className="p-4">سعر البيع</th>
                        <th className="p-4">حالة المخزن</th>
                        <th className="p-4 text-center">عمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredProductsList.map((p) => {
                        const purchasePrice = p.purchasePrice !== undefined ? p.purchasePrice : Math.round(p.price * 0.8);
                        
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-4 flex items-center gap-3">
                              <img src={getCompatibleImageUrl(p.image)} alt={p.name} className="h-10 w-10 rounded-lg object-cover border border-slate-800 shrink-0" referrerPolicy="no-referrer" />
                              <span className="font-extrabold truncate max-w-xs">{p.name}</span>
                            </td>
                            <td className="p-4 text-slate-300">{p.category}</td>
                            <td className="p-4 font-mono text-slate-400">{formatPrice(purchasePrice)}</td>
                            <td className="p-4 font-mono font-black text-brand-blue">{formatPrice(p.price)}</td>
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleToggleStock(p)}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                                  p.inStock 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}
                              >
                                {p.inStock ? 'متوفر' : 'غير متوفر'}
                              </button>
                            </td>
                            <td className="p-4 text-center space-x-1 space-x-reverse">
                              <button
                                type="button"
                                onClick={() => startEditProduct(p)}
                                className="p-1.5 bg-slate-800 hover:bg-brand-blue hover:text-white rounded-lg transition-colors text-slate-300"
                                title="تعديل"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-600 hover:text-white rounded-lg transition-colors text-rose-400"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
                  <h3 className="text-base sm:text-lg font-black text-white">إدارة تصنيفات السلع</h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold">إضافة وتعديل وحذف تصنيفات الأدوات واللوازم المدرسية في المتجر</p>
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
                <form onSubmit={handleCategorySave} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top duration-300">
                  <h4 className="text-sm font-black text-white">إضافة تصنيف مدرسي جديد</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">اسم التصنيف الجديد</label>
                      <input
                        type="text"
                        required
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue text-right text-white"
                        placeholder="مثال: أطقم وحزم مدرسية"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">رابط صورة المعاينة (رابط Drive أو عادي)</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="url"
                          value={catImage}
                          onChange={(e) => setCatImage(convertGoogleDriveUrl(e.target.value))}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono text-left text-slate-200 focus:outline-none focus:border-brand-blue"
                          placeholder="أدخل رابط صورة التصنيف (مثال: رابط Google Drive)..."
                        />
                        {catImage && (
                          <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                            <img src={getCompatibleImageUrl(catImage)} alt="Category Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400">اختر أيقونة التصنيف المتواجدة في الصفحة الرئيسية</label>
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
                                ? 'bg-brand-blue/20 border-brand-blue text-white ring-2 ring-brand-blue/25'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <IconComp className={`h-5 w-5 ${isSelected ? 'text-brand-blue' : ''}`} />
                            <span className="text-[10px] font-bold truncate max-w-full">{label}</span>
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
                      className="bg-slate-800 text-slate-300 px-5 py-3 rounded-xl text-xs font-bold"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              {editingCategory && (
                <form onSubmit={handleCategorySave} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top duration-300">
                  <h4 className="text-sm font-black text-white">تعديل التصنيف: {editingCategory.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">اسم التصنيف الجديد</label>
                      <input
                        type="text"
                        required
                        value={catName}
                        onChange={(e) => setCatName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue text-right text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">رابط صورة المعاينة (رابط Drive أو عادي)</label>
                      <div className="flex gap-3 items-center">
                        <input
                          type="url"
                          value={catImage}
                          onChange={(e) => setCatImage(convertGoogleDriveUrl(e.target.value))}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono text-left text-slate-200 focus:outline-none focus:border-brand-blue"
                          placeholder="أدخل رابط صورة التصنيف (مثال: رابط Google Drive)..."
                        />
                        {catImage && (
                          <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                            <img src={getCompatibleImageUrl(catImage)} alt="Category Preview" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400">اختر أيقونة التصنيف المتواجدة في الصفحة الرئيسية</label>
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
                                ? 'bg-brand-blue/20 border-brand-blue text-white ring-2 ring-brand-blue/25'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <IconComp className={`h-5 w-5 ${isSelected ? 'text-brand-blue' : ''}`} />
                            <span className="text-[10px] font-bold truncate max-w-full">{label}</span>
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
                      className="bg-slate-800 text-slate-300 px-5 py-3 rounded-xl text-xs font-bold"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center">
                    {(() => {
                      const iconObj = adminIconMap[cat.iconName] || adminIconMap.ShoppingBag;
                      const IconComp = iconObj.icon;
                      return (
                        <div className="h-16 w-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-brand-blue shrink-0">
                          <IconComp className="h-8 w-8" />
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1 justify-end">
                        <span className="text-xs font-black text-white">{cat.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">عدد معروضات التصنيف: <strong className="text-slate-300">{products.filter(p => p.category === cat.id).length} منتج</strong></p>
                      
                      <div className="flex items-center gap-2.5 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setCatName(cat.name);
                            setCatImage(cat.image);
                            setCatCount(products.filter(p => p.category === cat.id).length);
                            setCatIcon(cat.iconName || 'ShoppingBag');
                          }}
                          className="text-[10px] font-bold text-brand-blue hover:underline flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="text-[10px] font-bold text-rose-400 hover:underline flex items-center gap-1 border-r border-slate-800 pr-2.5"
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
                <h3 className="text-base sm:text-lg font-black text-white">إدارة طلبيات ولاية توقرت</h3>
                <p className="text-xs text-slate-400 mt-1 font-bold">تعديل حالة الشحن، تأكيد العناوين والهواتف والتوصيل السريع</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
                  <h4 className="text-xs font-bold">كل الطلبيات ({filteredOrdersList.length} طلبية)</h4>
                  <div className="relative max-w-xs w-full">
                    <input
                      type="text"
                      placeholder="رقم الطلب، اسم الزبون، الهاتف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-1.5 pr-9 pl-3 text-xs text-white"
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  </div>
                </div>

                <div className="overflow-x-auto font-semibold text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-4">كود الطلبية</th>
                        <th className="p-4">الزبون والهاتف</th>
                        <th className="p-4">البلدية والعنوان</th>
                        <th className="p-4">الإجمالي</th>
                        <th className="p-4">حالة الطلبية</th>
                        <th className="p-4 text-center">تحديث الحالة</th>
                        <th className="p-4 text-center">العمليات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredOrdersList.map((order) => (
                        <tr 
                          key={order.id} 
                          className="hover:bg-slate-900/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <td className="p-4 font-mono font-black text-brand-blue">{order.id}</td>
                          <td className="p-4">
                            <p className="font-extrabold text-white">{order.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{order.phone}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-200">{order.municipality}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">{order.address}</p>
                          </td>
                          <td className="p-4 font-black text-white">{formatPrice(order.total)}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                              order.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                              order.status === 'confirmed' ? 'bg-blue-500/10 text-brand-blue border-blue-500/20' :
                              order.status === 'shipped' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
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
                              className="bg-slate-900 border border-slate-800 text-[10px] font-black rounded-lg p-1.5 text-white focus:outline-none focus:border-brand-blue"
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
                                className="p-2 bg-slate-800 hover:bg-brand-blue hover:text-white rounded-xl transition-all text-slate-300 inline-flex items-center gap-1.5 cursor-pointer font-bold text-[11px]"
                                title="عرض التفاصيل"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>التفاصيل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-2 bg-slate-800 hover:bg-rose-600 hover:text-white rounded-xl transition-all text-rose-400 inline-flex items-center gap-1.5 cursor-pointer font-bold text-[11px] border border-rose-500/20"
                                title="حذف الطلبية"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
                <h3 className="text-base sm:text-lg font-black text-white">إدارة البلديات ورسوم التوصيل</h3>
                <p className="text-xs text-slate-400 mt-1 font-bold">تعديل تكلفة الشحن ومدة التوصيل لبلديات ولاية توقرت الـ 11</p>
              </div>

              {editingMuni && (
                <form onSubmit={handleMuniSave} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top duration-300">
                  <h4 className="text-sm font-black text-white">تعديل رسوم: {editingMuni.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">تكلفة التوصيل (د.ج)</label>
                      <input
                        type="number"
                        required
                        value={muniFee}
                        onChange={(e) => setMuniFee(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue text-right text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">مدة التوصيل التقريبية</label>
                      <input
                        type="text"
                        required
                        value={muniTime}
                        onChange={(e) => setMuniTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold focus:outline-none focus:border-brand-blue text-right text-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-3">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl text-xs font-black transition-all"
                    >
                      <span>تحديث الرسوم</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMuni(null)}
                      className="bg-slate-800 text-slate-300 px-5 py-3 rounded-xl text-xs font-bold"
                    >
                      <span>إلغاء</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden text-xs font-semibold">
                <table className="w-full text-right">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-4">اسم البلدية بتوقرت</th>
                      <th className="p-4">سعر التوصيل للمنزل</th>
                      <th className="p-4">مدة التوصيل المتوقعة</th>
                      <th className="p-4 text-center">تحديث</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {municipalities.map((m) => (
                      <tr key={m.name} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-4 font-bold text-white">{m.name}</td>
                        <td className="p-4 font-black text-brand-blue">{formatPrice(m.shippingFee)}</td>
                        <td className="p-4 text-slate-300">{m.deliveryTime}</td>
                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMuni(m);
                              setMuniName(m.name);
                              setMuniFee(m.shippingFee);
                              setMuniTime(m.deliveryTime);
                            }}
                            className="bg-slate-900 hover:bg-brand-blue text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 transition-colors"
                          >
                            تعديل الرسوم
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
            <form onSubmit={handleSettingsSave} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 text-right">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">إعدادات المتجر العامة</h3>
                <p className="text-xs text-slate-400 mt-1 font-bold">تغيير الأسماء وعناوين المستودع وجهات اتصال ولاية توقرت</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">اسم المتجر الإلكتروني</label>
                  <input
                    type="text"
                    required
                    value={setStoreName}
                    onChange={(e) => setSetStoreName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">رابط شعار الموقع (Logo URL)</label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="url"
                      placeholder="رابط الشعار (اترك فارغاً للمحافظة على الشعار الافتراضي)..."
                      value={setLogoUrl}
                      onChange={(e) => setSetLogoUrl(convertGoogleDriveUrl(e.target.value))}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono text-left text-white focus:outline-none focus:border-brand-blue"
                    />
                    {setLogoUrl && (
                      <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 shrink-0">
                        <img src={getCompatibleImageUrl(setLogoUrl)} alt="Logo Preview" className="h-full w-full object-contain p-1" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">حد التوصيل المجاني بالدينار (د.ج)</label>
                  <input
                    type="number"
                    required
                    value={setThreshold}
                    onChange={(e) => setSetThreshold(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">نسبة عمولة التسويق بالإحالة (%)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    value={setCommissionRate}
                    onChange={(e) => setSetCommissionRate(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">رقم الهاتف الأول</label>
                  <input
                    type="tel"
                    required
                    value={setPhone1}
                    onChange={(e) => setSetPhone1(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono text-white text-right"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">رقم الهاتف الثاني (اختياري)</label>
                  <input
                    type="tel"
                    value={setPhone2}
                    onChange={(e) => setSetPhone2(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono text-white text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400">شريط الإعلان المتحرك</label>
                <input
                  type="text"
                  required
                  value={setBannerText}
                  onChange={(e) => setSetBannerText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold text-white text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400">عنوان المستودع الرئيسي بالتفصيل</label>
                <input
                  type="text"
                  required
                  value={setWarehouse}
                  onChange={(e) => setSetWarehouse(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold text-white text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-400">وصف المتجر (SEO/Footer)</label>
                <textarea
                  required
                  value={setStoreDesc}
                  onChange={(e) => setSetStoreDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold text-white text-right"
                />
              </div>

              <button
                type="submit"
                className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>حفظ كافة إعدادات الموقع</span>
              </button>
            </form>
          )}

          {/* Tab 10: SCHOOL PACKS */}
          {activeTab === 'packs' && (
            <div className="space-y-6 text-right" dir="rtl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>🎁 إدارة الباكات المدرسية (School Packs)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold">
                    إعداد الباكات التوفيرية وتحديث محتويات الحقائب الجاهزة بضغطة زر واحدة.
                  </p>
                </div>
                {!isAddingPack && (
                  <button
                    onClick={() => { clearPackForm(); setIsAddingPack(true); }}
                    className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                  >
                    <span>➕ إضافة باك جديد</span>
                  </button>
                )}
              </div>

              {isAddingPack ? (
                /* PACK FORM CONTAINER */
                <form onSubmit={handlePackSave} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                    <h4 className="text-sm font-black text-white">
                      {editingPack ? '✏️ تعديل بيانات الباك' : '➕ إنشاء باك مدرسي متكامل جديد'}
                    </h4>
                    <button
                      type="button"
                      onClick={() => { clearPackForm(); setIsAddingPack(false); }}
                      className="text-xs text-slate-500 hover:text-white font-bold"
                    >
                      إلغاء والعودة
                    </button>
                  </div>

                  {/* Image Link Input - Full Width across the entire container */}
                  <div className="w-full">
                    <input
                      type="url"
                      required
                      placeholder="رابط صورة الباك المدرسي (مثال: https://example.com/image.jpg)"
                      value={packImage}
                      onChange={(e) => setPackImage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white text-right placeholder-slate-600 focus:border-brand-blue focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 2: Pack Items Manager */}
                    <div className="space-y-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-850">
                      <h5 className="text-xs font-black text-white border-b border-slate-800 pb-2">📦 قائمة الأدوات داخل هذا الباك ({packItemsList.length})</h5>
                      
                      {/* Add Item Form Row */}
                      <div className="space-y-2 pt-1 text-right">
                        <label className="block text-[11px] font-bold text-slate-400">إضافة أداة جديدة لمحتويات الباك</label>
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
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-[11px] font-semibold text-white text-right focus:border-brand-blue focus:outline-none"
                          />
                          {showProductSuggestions && (
                            <>
                              {/* Overlay to dismiss dropdown when clicking outside */}
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowProductSuggestions(false)}
                              />
                              <div className="absolute right-0 top-full mt-1.5 w-full bg-slate-950 border-2 border-slate-800 rounded-2xl shadow-2xl z-50 max-h-[360px] overflow-y-auto divide-y divide-slate-900 text-right">
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
                                      className="w-full p-3 hover:bg-slate-900/80 flex items-center justify-between gap-3 text-xs font-bold text-slate-300 hover:text-white transition-all text-right"
                                    >
                                      <span className="font-mono text-brand-blue text-[11px] sm:text-xs shrink-0 font-extrabold">{formatPrice(p.price)}</span>
                                      <div className="flex items-center gap-3 max-w-[80%] text-right justify-end">
                                        <span className="truncate text-[11px] sm:text-xs text-slate-200">{p.name}</span>
                                        <img 
                                          src={getCompatibleImageUrl(p.image)} 
                                          alt={p.name} 
                                          className="h-8 w-8 rounded-lg object-cover border border-slate-800 shrink-0 shadow-sm" 
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
                            <div key={item.id} className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md text-sm transition-all hover:border-slate-800">
                              <span className="truncate text-slate-100 font-black text-right">{item.name}</span>
                              <div className="flex items-center gap-3 shrink-0 justify-end w-full sm:w-auto">
                                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl px-1.5 py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateToolQty(item.id, item.quantity + 1)}
                                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => handleUpdateToolQty(item.id, Number(e.target.value) || 1)}
                                    className="w-8 bg-transparent text-center font-mono text-xs font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateToolQty(item.id, Math.max(1, item.quantity - 1))}
                                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">حبة</span>
                                <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveToolRow(item.id)}
                                  className="text-xs text-rose-500 hover:text-rose-400 font-black cursor-pointer hover:scale-105 transition-all"
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
                        <label className="block text-xs font-bold text-slate-400">اسم الباك المدرسي (مكتمل الأدوات)</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: الباك الماسي الشامل للطور الابتدائي"
                          value={packName}
                          onChange={(e) => setPackName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white text-right"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-400">الوصف الموجه للأولياء والتلاميذ</label>
                        <textarea
                          rows={4}
                          required
                          placeholder="اكتب تفاصيل وإقناع حافز للأولياء لشراء الباك كامل وبأرخص الأسعار..."
                          value={packDesc}
                          onChange={(e) => setPackDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-semibold text-white text-right"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-400">السعر الإجمالي للقطع (تلقائي)</label>
                          <div className="w-full bg-slate-950/60 border border-slate-850 rounded-xl py-2.5 px-4 text-xs font-black text-brand-blue text-right select-none">
                            {formatPrice(calculatedOriginalPrice)}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-300">سعر العرض للباك (د.ج)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={packPrice}
                            onChange={(e) => setPackPrice(Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-black text-white text-right focus:border-brand-blue focus:outline-none"
                            placeholder="سعر البيع النهائي"
                          />
                        </div>
                      </div>

                      {/* نسبة التخفيض وتحليل السعر */}
                      <div className="bg-slate-950 border border-slate-850 rounded-2xl p-3.5 flex items-center justify-between text-right">
                        <div className="flex items-center gap-1.5">
                          {discountPercentage > 0 ? (
                            <span className="bg-red-500/10 text-red-400 text-xs font-black px-3 py-1 rounded-xl border border-red-500/20 animate-pulse">
                              خصم {discountPercentage}% 🔥
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs font-bold bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg">
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
                        <label className="block text-xs font-bold text-slate-400">مميزات الباك (تفصل بفاصلة كـ: مميز1, مميز2)</label>
                        <input
                          type="text"
                          placeholder="مثال: حقيبة متينة وضد المطر، آلة حاسبة أصلية، توفير مالي كبير"
                          value={packFeaturesText}
                          onChange={(e) => setPackFeaturesText(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white text-right"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Submission */}
                  <div className="flex gap-3 pt-4 border-t border-slate-900 justify-end">
                    <button
                      type="button"
                      onClick={() => { clearPackForm(); setIsAddingPack(false); }}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer"
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
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                  {packs.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-slate-900 text-slate-600 p-5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                        <Sparkles className="h-8 w-8 text-brand-blue" />
                      </div>
                      <h4 className="text-sm font-black text-white">لا توجد باكات مدرجة حالياً</h4>
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
                          <div key={p.id} className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between shadow-md text-right">
                            {/* Pack Top Info */}
                            <div className="p-4.5 space-y-4">
                              <div className="flex gap-4 items-center">
                                <img
                                  src={getCompatibleImageUrl(p.image)}
                                  alt={p.name}
                                  className="h-16 w-16 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="bg-amber-500/10 text-amber-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-500/20">باك مدرسي 🎁</span>
                                    {p.isPopular && <span className="bg-yellow-500/10 text-yellow-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-yellow-500/20">شائع 🔥</span>}
                                  </div>
                                  <h4 className="text-xs font-black text-white truncate mt-1">{p.name}</h4>
                                  <span className="text-[11px] font-black text-brand-blue mt-1 block">{formatPrice(p.price)}</span>
                                </div>
                              </div>

                              <p className="text-[10px] text-slate-400 font-bold leading-relaxed line-clamp-2">{p.description}</p>

                              {/* Tools list preview */}
                              <div className="bg-slate-950/70 p-3 rounded-xl space-y-1.5 border border-slate-850">
                                <span className="text-[10px] text-slate-500 font-black block border-b border-slate-900 pb-1">📦 محتويات هذا الباك:</span>
                                <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto pl-1">
                                  {p.packItems && p.packItems.map((item, index) => (
                                    <span key={item.id || index} className="text-[9px] font-semibold text-slate-400 truncate flex items-center gap-1 justify-end">
                                      <span>({item.quantity} حبة) {item.name}</span>
                                      <span className="text-brand-blue shrink-0">•</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Pack Bottom Actions */}
                            <div className="bg-slate-950 p-3 border-t border-slate-850 flex items-center justify-between gap-2">
                              <span className={`text-[10px] font-bold ${p.inStock ? 'text-emerald-400 bg-emerald-400/5 border border-emerald-500/10' : 'text-red-400 bg-red-400/5 border border-red-500/10'} px-2.5 py-1 rounded-full`}>
                                {p.inStock ? '🟢 متوفر للطلب' : '🔴 غير متوفر حالياً'}
                              </span>
                              <div className="flex gap-2 text-xs font-black">
                                <button
                                  type="button"
                                  onClick={() => startEditPack(p)}
                                  className="text-brand-blue hover:underline bg-slate-900 border border-slate-800 hover:border-brand-blue/30 px-3 py-1 rounded-lg transition-all cursor-pointer"
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePack(p.id, p.name)}
                                  className="text-rose-500 hover:underline bg-slate-900 border border-slate-800 hover:border-rose-500/20 px-3 py-1 rounded-lg transition-all cursor-pointer"
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

          {/* Tab 11: AFFILIATES (REFERRAL SYSTEM) */}
          {activeTab === 'affiliates' && (
            <div className="space-y-6 text-right animate-in fade-in-50 duration-200" dir="rtl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-brand-blue" />
                    <span>نظام التسويق بالعمولة والإحالة (Affiliates)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-bold">
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
                    className="bg-brand-blue hover:bg-blue-700 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer shadow-lg shadow-brand-blue/10"
                  >
                    <span>➕ إضافة مسوّق جديد</span>
                  </button>
                )}
              </div>

              {/* Stats Overview Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي المسوقين</span>
                  <span className="text-xl font-black text-white block mt-1 font-mono">{affiliates?.length || 0}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي المبيعات المحالة</span>
                  <span className="text-xl font-black text-brand-blue block mt-1 font-mono">
                    {formatPrice(affiliates?.reduce((sum, a) => sum + (a.totalSales || 0), 0) || 0)}
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي العمولات المستحقة</span>
                  <span className="text-xl font-black text-emerald-400 block mt-1 font-mono">
                    {formatPrice(affiliates?.reduce((sum, a) => sum + (a.commissionBalance || 0), 0) || 0)}
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4.5 rounded-2xl">
                  <span className="text-[10px] text-slate-400 font-bold block">إجمالي الطلبات المحالة</span>
                  <span className="text-xl font-black text-purple-400 block mt-1 font-mono">
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
                }} className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6 max-w-xl text-right">
                  <div>
                    <h4 className="text-sm font-black text-white">
                      {editingAffiliate ? 'تعديل بيانات المسوّق' : 'إضافة مسوّق جديد بالعمولة'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-bold">
                      يرجى تحديد الاسم والرمز التعريفي الفريد لرابط الإحالة ونسبة العمولة.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">الاسم الكامل للمسوّق</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: خالد بوزيدي"
                        value={affiliateName}
                        onChange={(e) => setAffiliateName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white text-right focus:border-brand-blue focus:outline-none font-sans"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">رمز الإحالة التعريفي (Alphanumeric Code)</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: KHALED01"
                        value={affiliateCode}
                        onChange={(e) => setAffiliateCode(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-mono font-black text-white text-right focus:border-brand-blue focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 font-bold">سيظهر الرمز في الرابط كـ: {`${getPublicOrigin()}/?ref=${affiliateCode.trim().toUpperCase() || 'CODE'}`}</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400">نسبة عمولة المسوّق (%) <span className="text-slate-500 font-normal">(اختياري)</span></label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder={`الافتراضية للموقع: ${siteSettings.referralCommissionRate || 10}%`}
                        value={affiliateCommissionRate}
                        onChange={(e) => setAffiliateCommissionRate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-xs font-bold text-white text-right focus:border-brand-blue focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 font-bold">اتركه فارغاً ليتم اعتماد النسبة العامة المضبوطة في إعدادات الموقع.</p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-900 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAffiliate(false);
                        setEditingAffiliate(null);
                        setAffiliateName('');
                        setAffiliateCode('');
                        setAffiliateCommissionRate('');
                      }}
                      className="bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white px-5 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer"
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
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-4 text-right">
                  {/* Search and filter row */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="relative w-full sm:max-w-xs">
                      <input
                        type="text"
                        placeholder="ابحث عن مسوق بالاسم أو الرمز..."
                        value={affiliatesSearch}
                        onChange={(e) => setAffiliatesSearch(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold text-white text-right focus:border-brand-blue focus:outline-none"
                      />
                      <Search className="h-4 w-4 text-slate-500 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  {affiliates.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="bg-slate-900 text-slate-600 p-5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 border border-slate-800">
                        <Users className="h-8 w-8 text-brand-blue" />
                      </div>
                      <h4 className="text-sm font-black text-white">لا يوجد مسوقون مسجلون حالياً</h4>
                      <p className="text-[11px] text-slate-500 mt-2 max-w-sm mx-auto font-bold leading-normal">
                        أضف مسوقين يدويًا، شارك روابط الإحالة معهم، وتابع العمولات المترتبة على كل طلبية مستلمة بنجاح!
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-850 text-slate-400 font-black">
                            <th className="pb-3 pt-2 font-black pr-2 text-right">المسوّق</th>
                            <th className="pb-3 pt-2 font-black text-right">كود الإحالة</th>
                            <th className="pb-3 pt-2 font-black text-right">إجمالي الطلبات</th>
                            <th className="pb-3 pt-2 font-black text-right">إجمالي المبيعات</th>
                            <th className="pb-3 pt-2 font-black text-right text-emerald-400">العمولة الحالية</th>
                            <th className="pb-3 pt-2 font-black pl-2 text-left">رابط الإحالة والعمليات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900 font-bold text-slate-200">
                          {affiliates
                            .filter(a => {
                              if (!affiliatesSearch) return true;
                              const s = affiliatesSearch.toLowerCase();
                              return a.name.toLowerCase().includes(s) || a.code.toLowerCase().includes(s);
                            })
                            .map((aff) => {
                              const refUrl = `${getPublicOrigin()}/?ref=${aff.code}`;
                              return (
                                <tr key={aff.id} className="hover:bg-slate-900/30 transition-colors">
                                  <td className="py-3.5 pr-2 font-black text-right">
                                    <div className="flex items-center gap-2 justify-start">
                                      <div className="h-8 w-8 rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center text-brand-blue font-black text-xs shrink-0">
                                        {aff.name.trim().charAt(0)}
                                      </div>
                                      <div className="text-right">
                                        <span className="block text-white text-xs">{aff.name}</span>
                                        <span className="text-[10px] text-slate-500 block">
                                          العمولة: {aff.commissionRate !== undefined && aff.commissionRate !== null ? `${aff.commissionRate}%` : `${siteSettings.referralCommissionRate || 10}% (عامة)`}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3.5 font-mono font-black text-slate-300 text-right">
                                    <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                      {aff.code}
                                    </span>
                                  </td>
                                  <td className="py-3.5 font-mono text-right">{aff.totalOrders || 0} طلب</td>
                                  <td className="py-3.5 font-mono text-slate-300 text-right">{formatPrice(aff.totalSales || 0)}</td>
                                  <td className="py-3.5 font-mono text-emerald-400 font-black text-sm text-right">{formatPrice(aff.commissionBalance || 0)}</td>
                                  <td className="py-3.5 pl-2 text-left">
                                    <div className="flex items-center gap-2 justify-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          navigator.clipboard.writeText(refUrl);
                                          triggerNoti('تم نسخ رابط الإحالة بنجاح 🔗');
                                        }}
                                        className="bg-brand-blue/10 hover:bg-brand-blue/25 text-brand-blue text-[10px] font-black px-3 py-1.5 rounded-xl border border-brand-blue/20 transition-all flex items-center gap-1 cursor-pointer"
                                        title="نسخ رابط الإحالة الفريد للمسوق"
                                      >
                                        <span>نسخ الرابط 🔗</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => startEditAffiliate(aff)}
                                        className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-slate-850 transition-all cursor-pointer"
                                      >
                                        تعديل
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAffiliate(aff.id, aff.name)}
                                        className="bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 text-[10px] font-black px-2.5 py-1.5 rounded-xl border border-rose-500/20 transition-all cursor-pointer"
                                      >
                                        حذف
                                      </button>
                                    </div>
                                  </td>
                                </tr>
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
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right" dir="rtl">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative text-slate-100">
            {/* Close Button */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute left-4 top-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">تفاصيل طلبية رقم:</span>
                <h3 className="text-lg font-black font-mono text-brand-blue">{selectedOrder.id}</h3>
                <span className="text-xs text-slate-500 font-mono">تاريخ الطلب: {selectedOrder.date}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400 font-bold">الحالة الحالية:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                  selectedOrder.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  selectedOrder.status === 'confirmed' ? 'bg-blue-500/10 text-brand-blue border-blue-500/20' :
                  selectedOrder.status === 'shipped' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {selectedOrder.status === 'pending' ? '⏳ قيد الانتظار' :
                   selectedOrder.status === 'confirmed' ? '✅ تم التأكيد' :
                   selectedOrder.status === 'shipped' ? '🚚 مع المندوب' : '💵 تم الاستلام'}
                </span>
              </div>
            </div>

            {/* Customer Details Grid */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-3.5">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 border-b border-slate-900 pb-2">
                <span>👤 معلومات الزبون والتوصيل</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">اسم العميل:</span>
                  <span className="font-extrabold text-white text-sm">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">رقم الهاتف:</span>
                  <span className="font-black font-mono text-white select-all">{selectedOrder.phone}</span>
                </div>
                {selectedOrder.customerEmail && (
                  <div>
                    <span className="text-slate-500 block mb-0.5">البريد الإلكتروني:</span>
                    <span className="font-semibold font-mono text-slate-300">{selectedOrder.customerEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-500 block mb-0.5">البلدية:</span>
                  <span className="font-extrabold text-brand-blue">{selectedOrder.municipality}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block mb-0.5">العنوان الكامل بالتفصيل:</span>
                  <span className="font-semibold text-slate-300 leading-relaxed block">{selectedOrder.address}</span>
                </div>
                {selectedOrder.referrer && (
                  <div className="sm:col-span-2 border-t border-slate-900 pt-2.5 mt-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <span className="text-slate-500 block mb-0.5">رمز المسوّق بالإحالة:</span>
                      <span className="font-mono font-black text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded border border-brand-blue/10">
                        {selectedOrder.referrer}
                      </span>
                    </div>
                    {selectedOrder.commissionCalculated && (
                      <div className="text-right sm:text-left">
                        <span className="text-slate-500 block mb-0.5">العمولة المحتسبة:</span>
                        <span className="font-black text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-500/10">
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
              <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                <span>📦 السلع واللوازم المطلوبة</span>
              </h4>
              <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold border-b border-slate-850">
                    <tr>
                      <th className="p-3">المنتج</th>
                      <th className="p-3 text-center">الكمية</th>
                      <th className="p-3 text-left">السعر الفردي</th>
                      <th className="p-3 text-left">الإجمالي الفرعي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {selectedOrder.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-3 flex items-center gap-2.5">
                          <img src={getCompatibleImageUrl(it.product.image)} alt={it.product.name} className="h-8 w-8 rounded object-cover border border-slate-800" referrerPolicy="no-referrer" />
                          <div className="text-right" dir="rtl">
                            <p className="font-bold text-white leading-normal truncate max-w-[200px] sm:max-w-[280px]">{it.product.name}</p>
                            {it.product.brand && <p className="text-[10px] text-slate-500 font-mono">{it.product.brand}</p>}
                            {it.product.isPack && it.product.packItems && (
                              <div className="mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-400 space-y-0.5 text-right" dir="rtl">
                                <p className="font-bold text-slate-300">📦 محتويات الباك المعدلة:</p>
                                {it.product.packItems.map((pi, piIdx) => (
                                  <div key={pi.id || piIdx}>- {pi.name} ({pi.quantity}x)</div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-black text-white">{it.quantity}</td>
                        <td className="p-3 text-left font-mono text-slate-400">{formatPrice(it.product.price)}</td>
                        <td className="p-3 text-left font-black text-white">{formatPrice(it.product.price * it.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total calculation summary */}
            <div className="flex justify-between items-center bg-slate-950 border border-slate-850 p-4 rounded-2xl">
              <span className="text-xs font-black text-white">إجمالي قيمة الفاتورة الكلي:</span>
              <span className="text-lg font-black text-emerald-400 font-mono">{formatPrice(selectedOrder.total)}</span>
            </div>

            {/* Action buttons inside detail modal */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <p className="text-[11px] font-black text-slate-400">تغيير حالة الطلب من هنا:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    handleUpdateOrderStatus(selectedOrder.id, 'pending');
                    setSelectedOrder(prev => prev ? { ...prev, status: 'pending' } : null);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    selectedOrder.status === 'pending'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'bg-slate-950 hover:bg-slate-850 text-amber-500 border-amber-500/20'
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
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-slate-950 hover:bg-slate-850 text-brand-blue border-brand-blue/20'
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
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : 'bg-slate-950 hover:bg-slate-850 text-purple-400 border-purple-400/20'
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
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-slate-950 hover:bg-slate-850 text-emerald-400 border-emerald-400/20'
                  }`}
                >
                  💵 تم التوصيل والقبض
                </button>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteOrder(selectedOrder.id)}
                  className="py-2.5 px-4 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-red-500/20"
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
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[60] text-right" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative text-slate-100 animate-in zoom-in-95 duration-200">
            {/* Warning Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${
                deleteConfirm.type === 'visitors_reset'
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                {deleteConfirm.type === 'visitors_reset' ? (
                  <RefreshCw className="h-5 w-5" />
                ) : (
                  <Trash2 className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{deleteConfirm.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold">إجراء نهائي وغير قابل للتراجع</p>
              </div>
            </div>

            {/* Message */}
            <p className="text-xs text-slate-300 leading-relaxed font-bold">
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
                className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center"
              >
                <span>تراجع وإلغاء</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
