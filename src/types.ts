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
}
