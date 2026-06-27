import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { Customer } from '../models/Customer';
import { PricingTier } from '../models/PricingTier';
import { AppError } from '../utils/response';
import { getPagination, buildSearchQuery } from '../utils/pagination';
import { CustomerStatus, PaymentMethod } from '../types/enums';
import { PricingTierCode } from '../models/PricingTier';
import { env } from '../config/env';
import { isValidCoordinatePair } from '../utils/customerLocation';

export class CustomerService {
  private static normalizeLocationFields(data: Record<string, unknown>) {
    if (data.locationNotes === '') data.locationNotes = undefined;
    if (data.manualLocation === '') data.manualLocation = undefined;
    delete data.addressLink;

    const lat = data.latitude != null ? Number(data.latitude) : undefined;
    const lng = data.longitude != null ? Number(data.longitude) : undefined;
    const hasPin = isValidCoordinatePair(lat, lng);
    const hasManual =
      typeof data.manualLocation === 'string' && data.manualLocation.trim().length > 0;

    if (hasPin) {
      data.latitude = lat;
      data.longitude = lng;
      data.manualLocation = undefined;
      return;
    }

    data.latitude = undefined;
    data.longitude = undefined;

    if (hasManual) return;

    if (lat != null || lng != null) {
      throw new AppError('Invalid latitude/longitude', 400);
    }
  }

  static async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { search, status } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (status) filter.status = status;
    Object.assign(filter, buildSearchQuery(search as string, ['fullName', 'phone', 'address']));

    const [data, total] = await Promise.all([
      Customer.find(filter)
        .populate('pricingCategory', 'code label slimPrice roundPrice')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(filter),
    ]);

    return { data, pagination: { page, limit, total } };
  }

  static async getById(id: string) {
    const customer = await Customer.findOne({ _id: id, isDeleted: false })
      .populate('pricingCategory', 'code label slimPrice roundPrice');
    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  static async create(data: Record<string, unknown>) {
    await this.validatePricingCategory(String(data.pricingCategory));
    this.normalizeLocationFields(data);
    return Customer.create(data);
  }

  static async update(id: string, data: Record<string, unknown>) {
    if (data.pricingCategory) {
      await this.validatePricingCategory(String(data.pricingCategory));
    }
    this.normalizeLocationFields(data);

    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true, runValidators: true },
    ).populate('pricingCategory', 'code label slimPrice roundPrice');

    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  static async delete(id: string) {
    const customer = await Customer.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!customer) throw new AppError('Customer not found', 404);
    return customer;
  }

  static async toggleStatus(id: string) {
    const customer = await Customer.findOne({ _id: id, isDeleted: false });
    if (!customer) throw new AppError('Customer not found', 404);
    customer.status =
      customer.status === CustomerStatus.ENABLED ? CustomerStatus.DISABLED : CustomerStatus.ENABLED;
    await customer.save();
    return customer;
  }

  static async importCSV(customers: Record<string, unknown>[]) {
    const tierA = await PricingTier.findOne({ code: PricingTierCode.TIER_A });
    if (!tierA) throw new AppError('Pricing tiers not configured. Run migration or seed.', 500);

    const results = await Customer.insertMany(
      customers.map((c) => ({
        fullName: c.fullName,
        address: c.address,
        phone: c.phone,
        pricingCategory: tierA._id,
        contacts: [],
        status: CustomerStatus.ENABLED,
      })),
      { ordered: false },
    );
    return { imported: results.length };
  }

  static async uploadPropertyPhoto(id: string, filename: string) {
    const customer = await Customer.findOne({ _id: id, isDeleted: false });
    if (!customer) throw new AppError('Customer not found', 404);

    if (customer.propertyPhoto) {
      const oldPath = path.join(process.cwd(), env.UPLOAD_DIR, 'customers', customer.propertyPhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    customer.propertyPhoto = filename;
    await customer.save();
    return customer;
  }

  static async deletePropertyPhoto(id: string) {
    const customer = await Customer.findOne({ _id: id, isDeleted: false });
    if (!customer) throw new AppError('Customer not found', 404);

    if (customer.propertyPhoto) {
      const filePath = path.join(process.cwd(), env.UPLOAD_DIR, 'customers', customer.propertyPhoto);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      customer.propertyPhoto = undefined;
      await customer.save();
    }

    return customer;
  }

  private static async validatePricingCategory(id: string) {
    const tier = await PricingTier.findById(id);
    if (!tier) throw new AppError('Invalid pricing category', 400);
  }
}
