import { Request } from 'express';
import mongoose from 'mongoose';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Customer, Delivery } from '../models/Customer';
import { Product } from '../models/Product';
import { AppError } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { GallonType, PaymentMethod, ProductStatus } from '../types/enums';

interface InvoiceItemInput {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

function calcLineSubtotal(item: InvoiceItemInput) {
  const discount = item.discount ?? 0;
  return Math.max(0, item.quantity * item.unitPrice - discount);
}

function calcTotals(items: InvoiceItemInput[], tax = 0) {
  const lineItems = items.map((item) => ({
    ...item,
    discount: item.discount ?? 0,
    subtotal: calcLineSubtotal(item),
  }));
  const subtotal = lineItems.reduce((sum, i) => sum + i.subtotal, 0);
  const total = subtotal + tax;
  return { lineItems, subtotal, tax, total };
}

export class InvoiceService {
  static async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { status, search } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false, legacyWaterOrder: { $ne: true } };
    if (status) filter.status = status;

    const [data, total] = await Promise.all([
      Invoice.find(filter)
        .populate('customerId', 'fullName phone address')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(filter),
    ]);

    let filtered = data;
    if (search && typeof search === 'string') {
      const regex = new RegExp(search.trim(), 'i');
      filtered = data.filter((inv) => {
        const customer = inv.customerId as { fullName?: string; phone?: string } | null;
        return (
          inv.invoiceNo?.match(regex) ||
          customer?.fullName?.match(regex) ||
          customer?.phone?.match(regex)
        );
      });
    }

    return { data: filtered, pagination: { page, limit, total: search ? filtered.length : total } };
  }

  static async getById(id: string) {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false })
      .populate('customerId', 'fullName phone address pricingCategory')
      .populate('createdBy', 'name email')
      .lean();
    if (!invoice) throw new AppError('Invoice not found', 404);
    return invoice;
  }

  static async create(data: Record<string, unknown>, userId: string) {
    const customerId = String(data.customerId);
    const customer = await Customer.findOne({ _id: customerId, isDeleted: false });
    if (!customer) throw new AppError('Customer not found', 404);

    const rawItems = (data.items as InvoiceItemInput[]) || [];
    const resolvedItems = await this.resolveItems(rawItems);
    const tax = Number(data.tax) || 0;
    const { lineItems, subtotal, total } = calcTotals(resolvedItems, tax);

    return Invoice.create({
      customerId,
      items: lineItems,
      subtotal,
      tax,
      total,
      paymentMethod: data.paymentMethod as PaymentMethod,
      notes: data.notes as string | undefined,
      createdBy: userId,
      status: InvoiceStatus.PENDING,
    });
  }

  static async update(id: string, data: Record<string, unknown>) {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status === InvoiceStatus.CONVERTED) {
      throw new AppError('Cannot update a converted invoice', 400);
    }
    if (data.status && data.status === InvoiceStatus.CONVERTED) {
      throw new AppError('Use convert endpoint to mark as converted', 400);
    }

    const updatePayload: Record<string, unknown> = { ...data };
    delete updatePayload.items;

    if (data.items) {
      const resolvedItems = await this.resolveItems(data.items as InvoiceItemInput[]);
      const tax = data.tax !== undefined ? Number(data.tax) : invoice.tax;
      const { lineItems, subtotal, total } = calcTotals(resolvedItems, tax);
      updatePayload.items = lineItems;
      updatePayload.subtotal = subtotal;
      updatePayload.total = total;
      updatePayload.tax = tax;
    }

    const updated = await Invoice.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updatePayload,
      { new: true, runValidators: true },
    )
      .populate('customerId', 'fullName phone address')
      .populate('createdBy', 'name email');

    return updated;
  }

  static async delete(id: string) {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true },
    );
    if (!invoice) throw new AppError('Invoice not found', 404);
    return invoice;
  }

  static async convertToDelivery(id: string, userId?: string) {
    const invoice = await Invoice.findOne({ _id: id, isDeleted: false }).populate(
      'customerId',
      'fullName',
    );
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status === InvoiceStatus.CONVERTED) {
      throw new AppError('Invoice already converted', 400);
    }
    if (invoice.status === InvoiceStatus.REJECTED) {
      throw new AppError('Cannot convert a rejected invoice', 400);
    }

    const customer = invoice.customerId as unknown as { _id: unknown };
    let slimOut = 0;
    let roundOut = 0;

    for (const item of invoice.items) {
      if (!item.productId) continue;
      const product = await Product.findById(item.productId);
      if (product?.gallonType === GallonType.SLIM) slimOut += item.quantity;
      if (product?.gallonType === GallonType.ROUND) roundOut += item.quantity;
    }

    const deliveryData: Record<string, unknown> = {
      customerId: customer._id,
      date: new Date(),
      schedule: 'Daily',
      status: 'pending',
      colorCode: 'white',
      paid: false,
      discount: 0,
      slimOut,
      roundOut,
      slimIn: 0,
      roundIn: 0,
      slimReturn: 0,
      roundReturn: 0,
      remarks: invoice.notes ? `From invoice ${invoice.invoiceNo}: ${invoice.notes}` : `Converted from invoice ${invoice.invoiceNo}`,
    };

    if (userId) deliveryData.assignedStaffId = userId;

    const delivery = await Delivery.create(deliveryData);

    invoice.status = InvoiceStatus.CONVERTED;
    invoice.deliveryId = delivery._id;
    await invoice.save();

    const populated = await Invoice.findById(invoice._id)
      .populate('customerId', 'fullName phone address')
      .populate('createdBy', 'name email')
      .lean();

    return { invoice: populated, delivery };
  }

  private static async resolveItems(items: InvoiceItemInput[]) {
    const resolved: InvoiceItemInput[] = [];

    for (const item of items) {
      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        const product = await Product.findOne({ _id: item.productId, isDeleted: false, status: ProductStatus.ACTIVE });
        if (!product) throw new AppError(`Product not found: ${item.productId}`, 400);
        resolved.push({
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? product.price,
          discount: item.discount,
        });
      } else {
        resolved.push(item);
      }
    }

    return resolved;
  }
}

/** @deprecated Use InvoiceService */
export { InvoiceService as WaterOrderService };
