import { Request } from 'express';
import mongoose, { ClientSession } from 'mongoose';
import { Product } from '../models/Product';
import { Inventory } from '../models/Gallon';
import { Customer } from '../models/Customer';
import { AppError } from '../utils/response';
import { getPagination, buildSearchQuery } from '../utils/pagination';
import { ProductStatus } from '../types/enums';
import { getProductPriceForTier } from '../utils/productPricing';

export interface ResolvedTransactionItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  gallonType?: string;
  linkedInventoryId?: string;
  decrementsStock: boolean;
}

const LINKED_INVENTORY_FIELDS = 'name category unit refillType currentStock lowStockThreshold';

export class ProductService {
  private static formatProduct(product: Record<string, unknown>) {
    const linked = product.linkedInventoryId;

    if (linked && typeof linked === 'object' && linked !== null && '_id' in linked) {
      const doc = linked as {
        _id: mongoose.Types.ObjectId;
        name?: string;
        category?: string;
        unit?: string;
        currentStock?: number;
        lowStockThreshold?: number;
      };
      const id = doc._id.toString();
      return {
        ...product,
        linkedInventoryId: id,
        linkedInventory: {
          _id: id,
          name: doc.name ?? 'Inventory item',
          category: doc.category,
          unit: doc.unit,
          currentStock: doc.currentStock,
          lowStockThreshold: doc.lowStockThreshold,
        },
      };
    }

    return product;
  }

  /** Refill products always decrement filled water stock when sold. */
  private static normalizeProductPayload(data: Record<string, unknown>) {
    const payload = { ...data };
    if (payload.category === 'refill') {
      payload.decrementsStock = true;
    }
    if (payload.decrementsStock === false) {
      payload.gallonType = undefined;
      payload.linkedInventoryId = undefined;
    }
    if (payload.purchasePrice === '' || payload.purchasePrice == null) {
      payload.purchasePrice = undefined;
    }
    if (payload.tierBPrice === '' || payload.tierBPrice == null) {
      payload.tierBPrice = undefined;
    }
    if (payload.tierCPrice === '' || payload.tierCPrice == null) {
      payload.tierCPrice = undefined;
    }
    return payload;
  }

  private static async applyInventoryLink(payload: Record<string, unknown>) {
    if (!payload.linkedInventoryId) return;

    const inv = await Inventory.findOne({ _id: payload.linkedInventoryId, isDeleted: false });
    if (!inv) throw new AppError('Linked inventory item not found', 400);

    if (!payload.gallonType && inv.refillType) {
      payload.gallonType = inv.refillType;
    }
  }

  private static validateProductData(data: Record<string, unknown>) {
    if (data.decrementsStock === true && !data.linkedInventoryId && !data.gallonType) {
      throw new AppError(
        'Products that decrement stock must be linked to an inventory item',
        400,
      );
    }
  }

  static async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { search, status, activeOnly } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (status) filter.status = status;
    if (activeOnly === 'true') filter.status = ProductStatus.ACTIVE;
    Object.assign(filter, buildSearchQuery(search as string, ['name']));

    const [data, total] = await Promise.all([
      Product.find(filter)
        .populate('linkedInventoryId', LINKED_INVENTORY_FIELDS)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      data: data.map((item) => this.formatProduct({ ...item } as Record<string, unknown>)),
      pagination: { page, limit, total },
    };
  }

  static async getActiveProducts() {
    const products = await Product.find({ isDeleted: false, status: ProductStatus.ACTIVE })
      .populate('linkedInventoryId', LINKED_INVENTORY_FIELDS)
      .sort({ name: 1 })
      .lean();

    return products.map((item) => this.formatProduct({ ...item } as Record<string, unknown>));
  }

  static async getById(id: string) {
    const product = await Product.findOne({ _id: id, isDeleted: false }).populate(
      'linkedInventoryId',
      'name category unit refillType',
    );
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  static async create(data: Record<string, unknown>) {
    const normalized = this.normalizeProductPayload(data);
    await this.applyInventoryLink(normalized);
    this.validateProductData(normalized);
    const created = await Product.create(normalized);
    const populated = await Product.findById(created._id).populate(
      'linkedInventoryId',
      'name category unit refillType',
    );
    return this.formatProduct({ ...(populated?.toObject() ?? created.toObject()) } as Record<string, unknown>);
  }

  static async update(id: string, data: Record<string, unknown>) {
    const existing = await Product.findOne({ _id: id, isDeleted: false });
    if (!existing) throw new AppError('Product not found', 404);

    const normalized = this.normalizeProductPayload({ ...existing.toObject(), ...data });
    await this.applyInventoryLink(normalized);
    this.validateProductData(normalized);

    const {
      _id: _omitId,
      createdAt: _omitCreated,
      updatedAt: _omitUpdated,
      __v: _omitV,
      ...updateFields
    } = normalized as Record<string, unknown>;

    const product = await Product.findOneAndUpdate({ _id: id, isDeleted: false }, updateFields, {
      new: true,
      runValidators: true,
    }).populate('linkedInventoryId', LINKED_INVENTORY_FIELDS);

    if (!product) throw new AppError('Product not found', 404);
    return this.formatProduct({ ...product.toObject() } as Record<string, unknown>);
  }

  static async delete(id: string) {
    const product = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  /**
   * Resolves POS/walk-in line items from the product catalog — never trusts client price or stock flags.
   */
  static async resolveCatalogItems(
    items: Array<{ productId: string; quantity: number }>,
    session?: ClientSession,
    customerId?: string,
  ): Promise<ResolvedTransactionItem[]> {
    if (!items.length) throw new AppError('At least one item is required', 400);

    let tierCode: string | undefined;
    if (customerId) {
      const customerQuery = Customer.findOne({ _id: customerId, isDeleted: false }).populate(
        'pricingCategory',
        'code',
      );
      if (session) customerQuery.session(session);
      const customer = await customerQuery.lean();
      const tier = customer?.pricingCategory as { code?: string } | undefined;
      tierCode = tier?.code;
    }

    const productIds = items.map((i) => i.productId);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      throw new AppError('Duplicate product entries are not allowed', 400);
    }

    const query = Product.find({
      _id: { $in: productIds },
      isDeleted: false,
      status: ProductStatus.ACTIVE,
    });
    if (session) query.session(session);

    const products = await query.lean();
    if (products.length !== productIds.length) {
      throw new AppError('One or more products are invalid or inactive', 400);
    }

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    return items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (product.decrementsStock && !product.gallonType && !product.linkedInventoryId) {
        throw new AppError(
          `Product "${product.name}" is misconfigured: decrements stock but has no inventory link`,
          500,
        );
      }
      return {
        productId: product._id.toString(),
        name: product.name,
        quantity: item.quantity,
        price: getProductPriceForTier(product, tierCode),
        gallonType: product.gallonType,
        linkedInventoryId: product.linkedInventoryId?.toString(),
        decrementsStock: product.decrementsStock,
      };
    });
  }
}
