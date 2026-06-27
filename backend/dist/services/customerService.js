"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const Customer_1 = require("../models/Customer");
const PricingTier_1 = require("../models/PricingTier");
const response_1 = require("../utils/response");
const pagination_1 = require("../utils/pagination");
const enums_1 = require("../types/enums");
const PricingTier_2 = require("../models/PricingTier");
const env_1 = require("../config/env");
const customerLocation_1 = require("../utils/customerLocation");
class CustomerService {
    static normalizeLocationFields(data) {
        if (data.locationNotes === '')
            data.locationNotes = undefined;
        if (data.manualLocation === '')
            data.manualLocation = undefined;
        delete data.addressLink;
        const lat = data.latitude != null ? Number(data.latitude) : undefined;
        const lng = data.longitude != null ? Number(data.longitude) : undefined;
        const hasPin = (0, customerLocation_1.isValidCoordinatePair)(lat, lng);
        const hasManual = typeof data.manualLocation === 'string' && data.manualLocation.trim().length > 0;
        if (hasPin) {
            data.latitude = lat;
            data.longitude = lng;
            data.manualLocation = undefined;
            return;
        }
        data.latitude = undefined;
        data.longitude = undefined;
        if (hasManual)
            return;
        if (lat != null || lng != null) {
            throw new response_1.AppError('Invalid latitude/longitude', 400);
        }
    }
    static async getAll(req) {
        const { page, limit, skip, sort } = (0, pagination_1.getPagination)(req);
        const { search, status } = req.query;
        const filter = { isDeleted: false };
        if (status)
            filter.status = status;
        Object.assign(filter, (0, pagination_1.buildSearchQuery)(search, ['fullName', 'phone', 'address']));
        const [data, total] = await Promise.all([
            Customer_1.Customer.find(filter)
                .populate('pricingCategory', 'code label slimPrice roundPrice')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            Customer_1.Customer.countDocuments(filter),
        ]);
        return { data, pagination: { page, limit, total } };
    }
    static async getById(id) {
        const customer = await Customer_1.Customer.findOne({ _id: id, isDeleted: false })
            .populate('pricingCategory', 'code label slimPrice roundPrice');
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        return customer;
    }
    static async create(data) {
        await this.validatePricingCategory(String(data.pricingCategory));
        this.normalizeLocationFields(data);
        return Customer_1.Customer.create(data);
    }
    static async update(id, data) {
        if (data.pricingCategory) {
            await this.validatePricingCategory(String(data.pricingCategory));
        }
        this.normalizeLocationFields(data);
        const customer = await Customer_1.Customer.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true, runValidators: true }).populate('pricingCategory', 'code label slimPrice roundPrice');
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        return customer;
    }
    static async delete(id) {
        const customer = await Customer_1.Customer.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true });
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        return customer;
    }
    static async toggleStatus(id) {
        const customer = await Customer_1.Customer.findOne({ _id: id, isDeleted: false });
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        customer.status =
            customer.status === enums_1.CustomerStatus.ENABLED ? enums_1.CustomerStatus.DISABLED : enums_1.CustomerStatus.ENABLED;
        await customer.save();
        return customer;
    }
    static async importCSV(customers) {
        const tierA = await PricingTier_1.PricingTier.findOne({ code: PricingTier_2.PricingTierCode.TIER_A });
        if (!tierA)
            throw new response_1.AppError('Pricing tiers not configured. Run migration or seed.', 500);
        const results = await Customer_1.Customer.insertMany(customers.map((c) => ({
            fullName: c.fullName,
            address: c.address,
            phone: c.phone,
            pricingCategory: tierA._id,
            contacts: [],
            status: enums_1.CustomerStatus.ENABLED,
        })), { ordered: false });
        return { imported: results.length };
    }
    static async uploadPropertyPhoto(id, filename) {
        const customer = await Customer_1.Customer.findOne({ _id: id, isDeleted: false });
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        if (customer.propertyPhoto) {
            const oldPath = path_1.default.join(process.cwd(), env_1.env.UPLOAD_DIR, 'customers', customer.propertyPhoto);
            if (fs_1.default.existsSync(oldPath))
                fs_1.default.unlinkSync(oldPath);
        }
        customer.propertyPhoto = filename;
        await customer.save();
        return customer;
    }
    static async deletePropertyPhoto(id) {
        const customer = await Customer_1.Customer.findOne({ _id: id, isDeleted: false });
        if (!customer)
            throw new response_1.AppError('Customer not found', 404);
        if (customer.propertyPhoto) {
            const filePath = path_1.default.join(process.cwd(), env_1.env.UPLOAD_DIR, 'customers', customer.propertyPhoto);
            if (fs_1.default.existsSync(filePath))
                fs_1.default.unlinkSync(filePath);
            customer.propertyPhoto = undefined;
            await customer.save();
        }
        return customer;
    }
    static async validatePricingCategory(id) {
        const tier = await PricingTier_1.PricingTier.findById(id);
        if (!tier)
            throw new response_1.AppError('Invalid pricing category', 400);
    }
}
exports.CustomerService = CustomerService;
//# sourceMappingURL=customerService.js.map