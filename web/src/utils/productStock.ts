import type { Product } from '@/types';

export const getProductStockLabel = (product: Product): string | null => {
  if (!product.decrementsStock) return null;
  if (product.linkedInventory?.name) return product.linkedInventory.name;
  if (product.gallonType) return `${product.gallonType.charAt(0).toUpperCase()}${product.gallonType.slice(1)} refill`;
  return 'Linked stock';
};
