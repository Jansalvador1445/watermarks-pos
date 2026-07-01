"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const Product_1 = require("../models/Product");
const Gallon_1 = require("../models/Gallon");
const Customer_1 = require("../models/Customer");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const enums_1 = require("../types/enums");
const productPricing_1 = require("../utils/productPricing");
const LINKED_INVENTORY_FIELDS = 'name category unit refillType currentStock lowStockThreshold';
class ProductService {
    static formatProduct(product) {
        const linked = product.linkedInventoryId;
        if (linked && typeof linked === 'object' && linked !== null && '_id' in linked) {
            const doc = linked;
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
    static normalizeProductPayload(data) {
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
    static async applyInventoryLink(payload) {
        if (!payload.linkedInventoryId)
            return;
        const inv = await Gallon_1.Inventory.findOne({ _id: payload.linkedInventoryId, isDeleted: false });
        if (!inv)
            throw new response_1.AppError('Linked inventory item not found', 400);
        if (!payload.gallonType && inv.refillType) {
            payload.gallonType = inv.refillType;
        }
    }
    static validateProductData(data) {
        if (data.decrementsStock === true && !data.linkedInventoryId && !data.gallonType) {
            throw new response_1.AppError('Products that decrement stock must be linked to an inventory item', 400);
        }
    }
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { search, status, activeOnly } = req.query;
        const filter = { isDeleted: false };
        if (status)
            filter.status = status;
        if (activeOnly === 'true')
            filter.status = enums_1.ProductStatus.ACTIVE;
        Object.assign(filter, (0, pagination_1.buildSearchQuery)(search, ['name']));
        const [data, total] = await Promise.all([
            Product_1.Product.find(filter)
                .populate('linkedInventoryId', LINKED_INVENTORY_FIELDS)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Product_1.Product.countDocuments(filter),
        ]);
        return {
            data: data.map((item) => this.formatProduct({ ...item })),
            pagination: { page, limit, total },
        };
    }
    static async getActiveProducts() {
        const products = await Product_1.Product.find({ isDeleted: false, status: enums_1.ProductStatus.ACTIVE })
            .populate('linkedInventoryId', LINKED_INVENTORY_FIELDS)
            .sort({ name: 1 })
            .lean();
        return products.map((item) => this.formatProduct({ ...item }));
    }
    static async getById(id) {
        const product = await Product_1.Product.findOne({ _id: id, isDeleted: false }).populate('linkedInventoryId', 'name category unit refillType');
        if (!product)
            throw new response_1.AppError('Product not found', 404);
        return product;
    }
    static async create(data) {
        const normalized = this.normalizeProductPayload(data);
        await this.applyInventoryLink(normalized);
        this.validateProductData(normalized);
        const created = await Product_1.Product.create(normalized);
        const populated = await Product_1.Product.findById(created._id).populate('linkedInventoryId', 'name category unit refillType');
        return this.formatProduct({ ...(populated?.toObject() ?? created.toObject()) });
    }
    static async update(id, data) {
        const existing = await Product_1.Product.findOne({ _id: id, isDeleted: false });
        if (!existing)
            throw new response_1.AppError('Product not found', 404);
        const normalized = this.normalizeProductPayload({ ...existing.toObject(), ...data });
        await this.applyInventoryLink(normalized);
        this.validateProductData(normalized);
        const { _id: _omitId, createdAt: _omitCreated, updatedAt: _omitUpdated, __v: _omitV, ...updateFields } = normalized;
        const product = await Product_1.Product.findOneAndUpdate({ _id: id, isDeleted: false }, updateFields, {
            new: true,
            runValidators: true,
        }).populate('linkedInventoryId', LINKED_INVENTORY_FIELDS);
        if (!product)
            throw new response_1.AppError('Product not found', 404);
        return this.formatProduct({ ...product.toObject() });
    }
    static async delete(id) {
        const product = await Product_1.Product.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!product)
            throw new response_1.AppError('Product not found', 404);
        return product;
    }
    /**
     * Resolves POS/walk-in line items from the product catalog — never trusts client price or stock flags.
     */
    static async resolveCatalogItems(items, session, customerId) {
        if (!items.length)
            throw new response_1.AppError('At least one item is required', 400);
        let tierCode;
        if (customerId) {
            const customerQuery = Customer_1.Customer.findOne({ _id: customerId, isDeleted: false }).populate('pricingCategory', 'code');
            if (session)
                customerQuery.session(session);
            const customer = await customerQuery.lean();
            const tier = customer?.pricingCategory;
            tierCode = tier?.code;
        }
        const productIds = items.map((i) => i.productId);
        const uniqueIds = new Set(productIds);
        if (uniqueIds.size !== productIds.length) {
            throw new response_1.AppError('Duplicate product entries are not allowed', 400);
        }
        const query = Product_1.Product.find({
            _id: { $in: productIds },
            isDeleted: false,
            status: enums_1.ProductStatus.ACTIVE,
        });
        if (session)
            query.session(session);
        const products = await query.lean();
        if (products.length !== productIds.length) {
            throw new response_1.AppError('One or more products are invalid or inactive', 400);
        }
        const productMap = new Map(products.map((p) => [p._id.toString(), p]));
        return items.map((item) => {
            const product = productMap.get(item.productId);
            if (product.decrementsStock && !product.gallonType && !product.linkedInventoryId) {
                throw new response_1.AppError(`Product "${product.name}" is misconfigured: decrements stock but has no inventory link`, 500);
            }
            return {
                productId: product._id.toString(),
                name: product.name,
                quantity: item.quantity,
                price: (0, productPricing_1.getProductPriceForTier)(product, tierCode),
                gallonType: product.gallonType,
                linkedInventoryId: product.linkedInventoryId?.toString(),
                decrementsStock: product.decrementsStock,
            };
        });
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=productService.js.map