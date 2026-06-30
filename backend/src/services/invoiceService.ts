import { Request } from 'express';
import mongoose, { ClientSession } from 'mongoose';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Customer, Delivery } from '../models/Customer';
import { Product } from '../models/Product';
import { AppError } from '../utils/response';
import { getPagination } from '../utils/pagination';
import { GallonType, PaymentMethod, ProductStatus } from '../types/enums';
import { InventoryMovementService } from './inventoryMovementService';

interface InvoiceItemInput {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

interface ResolvedInvoiceItem extends InvoiceItemInput {
  subtotal?: number;
  decrementsStock?: boolean;
  gallonType?: string;
}

interface InvoiceStockItem {
  productId?: string;
  name: string;
  quantity: number;
  gallonType?: string;
  decrementsStock?: boolean;
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
    return InventoryMovementService.withTransaction(async (session) => {
      const customerId = String(data.customerId);
      const customerQuery = Customer.findOne({ _id: customerId, isDeleted: false });
      if (session) customerQuery.session(session);
      const customer = await customerQuery;
      if (!customer) throw new AppError('Customer not found', 404);

      const rawItems = (data.items as InvoiceItemInput[]) || [];
      const resolvedItems = await this.resolveItems(rawItems, session);
      const tax = Number(data.tax) || 0;
      const { lineItems, subtotal, total } = calcTotals(resolvedItems, tax);

      const invoice = new Invoice({
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
      await invoice.save({ session: session || undefined });

      await InventoryMovementService.processInvoiceStock(
        session,
        { invoiceNo: invoice.invoiceNo, items: this.toStockItems(resolvedItems) },
        userId,
      );

      return invoice;
    });
  }

  static async update(id: string, data: Record<string, unknown>, userId: string) {
    return InventoryMovementService.withTransaction(async (session) => {
      const invoiceQuery = Invoice.findOne({ _id: id, isDeleted: false });
      if (session) invoiceQuery.session(session);
      const invoice = await invoiceQuery;
      if (!invoice) throw new AppError('Invoice not found', 404);
      if (invoice.status === InvoiceStatus.CONVERTED) {
        throw new AppError('Cannot update a converted invoice', 400);
      }
      if (data.status && data.status === InvoiceStatus.CONVERTED) {
        throw new AppError('Use convert endpoint to mark as converted', 400);
      }

      const oldStatus = invoice.status;
      const oldItems = invoice.items;
      const newStatus = (data.status as InvoiceStatus | undefined) ?? oldStatus;

      const updatePayload: Record<string, unknown> = { ...data };
      delete updatePayload.items;

      let resolvedItems: ResolvedInvoiceItem[] | undefined;
      if (data.items) {
        resolvedItems = await this.resolveItems(data.items as InvoiceItemInput[], session);
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
        { new: true, runValidators: true, session: session || undefined },
      )
        .populate('customerId', 'fullName phone address')
        .populate('createdBy', 'name email');

      if (!updated) throw new AppError('Invoice not found', 404);

      const statusChangedToRejected =
        newStatus === InvoiceStatus.REJECTED && oldStatus !== InvoiceStatus.REJECTED;
      const statusChangedFromRejected =
        oldStatus === InvoiceStatus.REJECTED && newStatus !== InvoiceStatus.REJECTED;

      if (statusChangedToRejected) {
        const stockItems = await this.enrichStockItems(oldItems, session);
        await InventoryMovementService.reverseInvoiceStock(
          session,
          { invoiceNo: invoice.invoiceNo, items: stockItems },
          userId,
        );
      } else if (statusChangedFromRejected) {
        const stockItems = await this.enrichStockItems(updated.items, session);
        await InventoryMovementService.processInvoiceStock(
          session,
          { invoiceNo: invoice.invoiceNo, items: stockItems },
          userId,
        );
      } else if (data.items && newStatus !== InvoiceStatus.REJECTED) {
        const oldStockItems = await this.enrichStockItems(oldItems, session);
        const newStockItems = await this.enrichStockItems(updated.items, session);
        await InventoryMovementService.reverseInvoiceStock(
          session,
          { invoiceNo: invoice.invoiceNo, items: oldStockItems },
          userId,
        );
        await InventoryMovementService.processInvoiceStock(
          session,
          { invoiceNo: invoice.invoiceNo, items: newStockItems },
          userId,
        );
      }

      return updated;
    });
  }

  static async delete(id: string, userId: string) {
    return InventoryMovementService.withTransaction(async (session) => {
      const invoiceQuery = Invoice.findOne({ _id: id, isDeleted: false });
      if (session) invoiceQuery.session(session);
      const invoice = await invoiceQuery;
      if (!invoice) throw new AppError('Invoice not found', 404);

      if (invoice.status !== InvoiceStatus.REJECTED && invoice.status !== InvoiceStatus.CONVERTED) {
        const stockItems = await this.enrichStockItems(invoice.items, session);
        await InventoryMovementService.reverseInvoiceStock(
          session,
          { invoiceNo: invoice.invoiceNo, items: stockItems },
          userId,
        );
      }

      const deleted = await Invoice.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true, session: session || undefined },
      );
      if (!deleted) throw new AppError('Invoice not found', 404);
      return deleted;
    });
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
      sourceInvoiceId: invoice._id,
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

  private static toStockItems(items: ResolvedInvoiceItem[]): InvoiceStockItem[] {
    return items
      .filter((item) => item.productId && item.decrementsStock)
      .map((item) => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        gallonType: item.gallonType,
        decrementsStock: item.decrementsStock,
      }));
  }

  private static async enrichStockItems(
    items: Array<{ productId?: mongoose.Types.ObjectId | string; name: string; quantity: number }>,
    session?: ClientSession,
  ): Promise<InvoiceStockItem[]> {
    const result: InvoiceStockItem[] = [];

    for (const item of items) {
      if (!item.productId) continue;
      const productQuery = Product.findOne({ _id: item.productId, isDeleted: false });
      if (session) productQuery.session(session);
      const product = await productQuery.lean();
      if (!product?.decrementsStock) continue;

      result.push({
        productId: product._id.toString(),
        name: item.name,
        quantity: item.quantity,
        gallonType: product.gallonType,
        decrementsStock: product.decrementsStock,
      });
    }

    return result;
  }

  private static async resolveItems(items: InvoiceItemInput[], session?: ClientSession) {
    const resolved: ResolvedInvoiceItem[] = [];

    for (const item of items) {
      if (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) {
        const productQuery = Product.findOne({
          _id: item.productId,
          isDeleted: false,
          status: ProductStatus.ACTIVE,
        });
        if (session) productQuery.session(session);
        const product = await productQuery.lean();
        if (!product) throw new AppError(`Product not found: ${item.productId}`, 400);
        resolved.push({
          productId: item.productId,
          name: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice ?? product.price,
          discount: item.discount,
          decrementsStock: product.decrementsStock,
          gallonType: product.gallonType,
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
