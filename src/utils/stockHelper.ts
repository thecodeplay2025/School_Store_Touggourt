import { Product } from '../types';

/**
 * Get accurate numeric stock for any product object
 */
export function getProductStock(product?: Product | null): number {
  if (!product) return 0;
  if (typeof product.stock === 'number') {
    return Math.max(0, product.stock);
  }
  if (typeof product.stockQuantity === 'number') {
    return Math.max(0, product.stockQuantity);
  }
  return product.inStock !== false ? 10 : 0;
}

/**
 * Check if a product is in stock and available for purchase
 */
export function isProductAvailable(product?: Product | null): boolean {
  if (!product) return false;
  if (product.inStock === false) return false;
  const stock = getProductStock(product);
  return stock > 0;
}

export type StockStatusType = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface StockStatusInfo {
  status: StockStatusType;
  label: string;
  badgeClass: string;
  dotColor: string;
  stockCount: number;
}

/**
 * Returns formatted status badge metadata based on current stock count
 */
export function getStockStatusInfo(productOrStock: Product | number | null | undefined): StockStatusInfo {
  const stock = typeof productOrStock === 'number' ? productOrStock : getProductStock(productOrStock);

  if (stock <= 0) {
    return {
      status: 'out_of_stock',
      label: 'نفد المخزون',
      badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      dotColor: 'bg-rose-500',
      stockCount: 0
    };
  }

  if (stock <= 5) {
    return {
      status: 'low_stock',
      label: `مخزون منخفض (${stock})`,
      badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      dotColor: 'bg-amber-500',
      stockCount: stock
    };
  }

  return {
    status: 'in_stock',
    label: `متوفر (${stock})`,
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    dotColor: 'bg-emerald-500',
    stockCount: stock
  };
}
