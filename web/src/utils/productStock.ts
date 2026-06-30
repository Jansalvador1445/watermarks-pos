import type { InventoryItem, Product } from '@/types';

export interface ProductStockInfo {
  label: string;
  currentStock: number;
  lowStockThreshold: number;
  inventoryId: string;
}

export interface InventoryLookup {
  byId: Map<string, InventoryItem>;
  byRefillType: Map<string, InventoryItem>;
}

export const getProductStockLabel = (product: Product): string | null => {
  if (!product.decrementsStock) return null;
  if (product.linkedInventory?.name) return product.linkedInventory.name;
  if (product.gallonType) return `${product.gallonType.charAt(0).toUpperCase()}${product.gallonType.slice(1)} refill`;
  return 'Linked stock';
};

export const buildInventoryLookup = (items: InventoryItem[]): InventoryLookup => {
  const byId = new Map<string, InventoryItem>();
  const byRefillType = new Map<string, InventoryItem>();

  for (const item of items) {
    byId.set(item._id, item);
    if (item.refillType) {
      byRefillType.set(item.refillType, item);
    }
  }

  return { byId, byRefillType };
};

export const getAvailableStock = (product: Product, lookup?: InventoryLookup): number | null => {
  if (!product.decrementsStock) return null;

  if (product.linkedInventory?.currentStock != null) {
    return product.linkedInventory.currentStock;
  }

  if (product.linkedInventoryId && lookup?.byId.has(product.linkedInventoryId)) {
    return lookup.byId.get(product.linkedInventoryId)!.currentStock;
  }

  if (product.linkedInventory?._id && lookup?.byId.has(product.linkedInventory._id)) {
    return lookup.byId.get(product.linkedInventory._id)!.currentStock;
  }

  if (product.gallonType && lookup?.byRefillType.has(product.gallonType)) {
    return lookup.byRefillType.get(product.gallonType)!.currentStock;
  }

  return null;
};

export const getProductStockInfo = (product: Product, lookup?: InventoryLookup): ProductStockInfo | null => {
  const label = getProductStockLabel(product);
  if (!label) return null;

  const currentStock = getAvailableStock(product, lookup);
  if (currentStock == null) return null;

  const inventoryId =
    product.linkedInventoryId ??
    product.linkedInventory?._id ??
    (product.gallonType ? lookup?.byRefillType.get(product.gallonType)?._id : undefined);

  if (!inventoryId) return null;

  const lowStockThreshold =
    product.linkedInventory?.lowStockThreshold ??
    lookup?.byId.get(inventoryId)?.lowStockThreshold ??
    lookup?.byRefillType.get(product.gallonType ?? '')?.lowStockThreshold ??
    0;

  return { label, currentStock, lowStockThreshold, inventoryId };
};

export interface StockCartLine {
  productId: string;
  quantity: number;
  decrementsStock: boolean;
  inventoryId?: string;
}

export interface StockOversellIssue {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

export const cartExceedsStock = (
  cartLines: StockCartLine[],
  products: Product[],
  lookup?: InventoryLookup,
  creditByInventory?: Map<string, number>,
): { exceeds: boolean; issues: StockOversellIssue[] } => {
  const productMap = new Map(products.map((p) => [p._id, p]));
  const demandByInventory = new Map<string, { requested: number; names: string[]; productIds: string[] }>();

  for (const line of cartLines) {
    if (!line.decrementsStock) continue;
    const product = productMap.get(line.productId);
    if (!product) continue;

    const stockInfo = getProductStockInfo(product, lookup);
    if (!stockInfo) continue;

    const key = line.inventoryId ?? stockInfo.inventoryId;
    const existing = demandByInventory.get(key) ?? { requested: 0, names: [], productIds: [] };
    existing.requested += line.quantity;
    if (!existing.names.includes(product.name)) {
      existing.names.push(product.name);
    }
    if (!existing.productIds.includes(line.productId)) {
      existing.productIds.push(line.productId);
    }
    demandByInventory.set(key, existing);
  }

  const issues: StockOversellIssue[] = [];

  for (const [inventoryId, demand] of demandByInventory) {
    const sampleProduct = products.find((p) => {
      const info = getProductStockInfo(p, lookup);
      return info?.inventoryId === inventoryId;
    });
    if (!sampleProduct) continue;

    const available = (getAvailableStock(sampleProduct, lookup) ?? 0) + (creditByInventory?.get(inventoryId) ?? 0);
    if (demand.requested > available) {
      for (const productId of demand.productIds) {
        const product = productMap.get(productId);
        if (!product) continue;
        issues.push({
          productId,
          name: product.name,
          requested: demand.requested,
          available,
        });
      }
    }
  }

  return { exceeds: issues.length > 0, issues };
};

export const invoiceLinesExceedStock = (
  lines: Array<{ productId?: string; quantity?: number }>,
  products: Product[],
  lookup?: InventoryLookup,
  creditByInventory?: Map<string, number>,
): { exceeds: boolean; issues: StockOversellIssue[] } => {
  const cartLines: StockCartLine[] = lines
    .filter((line) => line.productId && (line.quantity ?? 0) > 0)
    .map((line) => {
      const product = products.find((p) => p._id === line.productId);
      const stockInfo = product ? getProductStockInfo(product, lookup) : null;
      return {
        productId: line.productId!,
        quantity: line.quantity ?? 0,
        decrementsStock: Boolean(product?.decrementsStock),
        inventoryId: stockInfo?.inventoryId,
      };
    });

  return cartExceedsStock(cartLines, products, lookup, creditByInventory);
};

export const buildInvoiceStockCredit = (
  lines: Array<{ productId?: string; quantity?: number }>,
  products: Product[],
  lookup?: InventoryLookup,
): Map<string, number> => {
  const credit = new Map<string, number>();

  for (const line of lines) {
    if (!line.productId || !(line.quantity ?? 0)) continue;
    const product = products.find((p) => p._id === line.productId);
    if (!product?.decrementsStock) continue;
    const stockInfo = getProductStockInfo(product, lookup);
    if (!stockInfo) continue;
    credit.set(stockInfo.inventoryId, (credit.get(stockInfo.inventoryId) ?? 0) + (line.quantity ?? 0));
  }

  return credit;
};
