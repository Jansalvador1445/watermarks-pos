import { Request } from 'express';
import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/response';
import { getPagination, buildSearchQuery } from '../utils/pagination';
import { TransactionStatus, TransactionType, PaymentMethod } from '../types/enums';
import { InventoryMovementService } from './inventoryMovementService';
import { ProductService } from './productService';
import { generateSecureReference } from '../utils/secureReference';

const generateInvoiceNo = () => generateSecureReference('INV');

const STOCK_TRANSACTION_TYPES = new Set([TransactionType.POS, TransactionType.WALKIN]);

export class TransactionService {
  static async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const { search, type, types, status, startDate, endDate } = req.query;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (types && typeof types === 'string') {
      const typeList = types.split(',').map((t) => t.trim()).filter(Boolean);
      if (typeList.length > 0) filter.type = { $in: typeList };
    } else if (type) {
      filter.type = type;
    }
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    }
    Object.assign(filter, buildSearchQuery(search as string, ['invoiceNo', 'customerName']));

    const [data, total] = await Promise.all([
      Transaction.find(filter)
        .populate('customerId', 'fullName phone')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    return { data, pagination: { page, limit, total } };
  }

  static async getById(id: string) {
    const transaction = await Transaction.findOne({ _id: id, isDeleted: false }).populate(
      'customerId',
      'fullName address phone',
    );
    if (!transaction) throw new AppError('Transaction not found', 404);
    return transaction;
  }

  static async create(data: Record<string, unknown>, userId: string) {
    const type = data.type as TransactionType;
    const discount = Math.max(0, (data.discount as number) || 0);
    const status = TransactionStatus.PAID;
    const invoiceNo = generateInvoiceNo();

    return InventoryMovementService.withTransaction(async (session) => {
      let resolvedItems: Array<{
        productId?: string;
        name: string;
        quantity: number;
        price: number;
        gallonType?: string;
        decrementsStock?: boolean;
      }>;

      if (type === TransactionType.POS || type === TransactionType.WALKIN) {
        const catalogItems = data.items as Array<{ productId: string; quantity: number }>;
        const customerId = data.customerId ? String(data.customerId) : undefined;
        const resolved = await ProductService.resolveCatalogItems(catalogItems, session, customerId);
        resolvedItems = resolved;
      } else {
        resolvedItems = (
          data.items as Array<{
            name: string;
            quantity: number;
            price: number;
            gallonType?: string;
          }>
        ).map((item) => ({
          name: item.name.trim(),
          quantity: item.quantity,
          price: item.price,
          gallonType: item.gallonType,
          decrementsStock: false,
        }));
      }

      const subtotal = resolvedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
      if (discount > subtotal) {
        throw new AppError('Discount cannot exceed subtotal', 400);
      }
      const amount = subtotal - discount;

      if (status === TransactionStatus.PAID && STOCK_TRANSACTION_TYPES.has(type)) {
        await InventoryMovementService.processTransactionStock(
          session,
          {
            type,
            invoiceNo,
            items: resolvedItems,
          },
          userId,
        );
      }

      const transaction = new Transaction({
        type,
        customerId: data.customerId,
        customerName: data.customerName as string | undefined,
        items: resolvedItems,
        paymentMethod: data.paymentMethod as PaymentMethod,
        notes: data.notes as string | undefined,
        invoiceNo,
        amount,
        discount,
        status,
      });
      await transaction.save({ session: session || undefined });

      return transaction;
    });
  }

  static async update(id: string, data: Record<string, unknown>) {
    const allowedFields = new Set(['notes']);
    const disallowed = Object.keys(data).filter(
      (key) => data[key] !== undefined && !allowedFields.has(key),
    );
    if (disallowed.length > 0) {
      throw new AppError('Only notes can be updated on a completed transaction', 400);
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { notes: data.notes },
      { new: true, runValidators: true },
    );
    if (!transaction) throw new AppError('Transaction not found', 404);
    return transaction;
  }

  static async delete(id: string, userId: string) {
    const existing = await Transaction.findOne({ _id: id, isDeleted: false });
    if (!existing) throw new AppError('Transaction not found', 404);

    return InventoryMovementService.withTransaction(async (session) => {
      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true, deletedAt: new Date() },
        { new: true, session: session || undefined },
      );
      if (!transaction) throw new AppError('Transaction not found', 404);

      if (
        transaction.status === TransactionStatus.PAID &&
        STOCK_TRANSACTION_TYPES.has(transaction.type as TransactionType)
      ) {
        await InventoryMovementService.reverseTransactionStock(
          session,
          {
            invoiceNo: transaction.invoiceNo,
            items: transaction.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              gallonType: item.gallonType,
              decrementsStock: item.decrementsStock,
            })),
          },
          userId,
        );
      }

      return transaction;
    });
  }
}
