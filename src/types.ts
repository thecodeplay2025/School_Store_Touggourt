export interface PackItem {
  id: string;
  name: string;
  quantity: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // in DZD
  purchasePrice?: number; // in DZD
  stock?: number; // Current quantity in stock
  stockQuantity?: number; // in stock quantity (synced alias)
  image: string;
  category: string;
  rating: number;
  isPopular: boolean;
  inStock: boolean;
  brand?: string;
  features: string[];
  isPack?: boolean;
  packItems?: PackItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Category {
  id: string;
  name: string;
  count: number;
  image: string;
  iconName: string;
  colorClass: string;
  bgHex?: string;
}

export interface Municipality {
  name: string;
  shippingFee: number;
  deliveryTime: string;
  available?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  municipality: string;
  address: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  date: string;
  referrer?: string;
  deliveryType?: 'home' | 'office';
  commissionCalculated?: boolean;
  commissionAmount?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  municipality?: string;
  role: 'customer' | 'admin';
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
}

export interface SiteSettings {
  storeName: string;
  storeDescription: string;
  contactPhone1: string;
  contactPhone2: string;
  warehouseAddress: string;
  freeShippingThreshold: number;
  promoBannerText: string;
  // Top Announcement Bar Customization
  showTopBanner?: boolean;
  topBannerBgColor?: string;
  topBannerTextColor?: string;
  topBannerIcon?: 'sparkles' | 'truck' | 'bell' | 'tag' | 'gift' | 'megaphone' | 'none';
  topBannerDismissible?: boolean;
  logoUrl?: string;
  referralCommissionRate?: number; // percentage, e.g. 10 for 10%
  // Hero Banner Customization
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBgColor?: string;
  heroShowImages?: boolean;
  heroCard1Image?: string;
  heroCard1Title?: string;
  heroCard1Price?: string;
  heroCard2Image?: string;
  heroCard2Title?: string;
  heroCard2Price?: string;
  heroBannerImage?: string;
}

export interface Affiliate {
  id: string; // matches code
  code: string; // e.g. KHALED01
  name: string;
  commissionBalance: number;
  totalSales: number;
  totalOrders: number;
  createdAt: string;
  commissionRate?: number; // specific percentage if set
}
