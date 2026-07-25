import mongoose from 'mongoose';
import { Payment } from '../models/Payment';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Delivery } from '../models/Customer';
import { AppError } from '../utils/response';
import { PaymentMethod } from '../types/enums';
import { computePaymentStatus } from '../utils/invoicePaymentStatus';

export interface PaymentTotals {
  total: number;
  count: number;
}

export class PaymentService {
  static async getTotalsByInvoiceIds(invoiceIds: mongoose.Types.ObjectId[]): Promise<Map<string, PaymentTotals>> {
    if (!invoiceIds.length) return new Map();

    const rows = await Payment.aggregate<{ _id: mongoose.Types.ObjectId; total: number; count: number }>([
      { $match: { isDeleted: false, invoiceId: { $in: invoiceIds } } },
      { $group: { _id: '$invoiceId', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    const map = new Map<string, PaymentTotals>();
    for (const row of rows) {
      map.set(String(row._id), { total: row.total, count: row.count });
    }
    return map;
  }

  static async listByInvoice(invoiceId: string) {
    const invoice = await Invoice.findOne({ _id: invoiceId, isDeleted: false }).lean();
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status === InvoiceStatus.REJECTED) {
      throw new AppError('Cannot view payments for rejected invoices', 400);
    }

    const payments = await Payment.find({ invoiceId, isDeleted: false })
      .populate('recordedBy', 'name email')
      .sort({ paymentDate: -1 })
      .lean();

    const totals = await this.getTotalsByInvoiceIds([new mongoose.Types.ObjectId(invoiceId)]);
    const paymentTotals = totals.get(invoiceId) ?? { total: 0, count: 0 };
    const paymentStatus = computePaymentStatus(invoice.total, paymentTotals.total);

    return {
      invoice: {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        total: invoice.total,
        status: invoice.status,
      },
      payments,
      summary: {
        totalPaid: paymentTotals.total,
        paymentCount: paymentTotals.count,
        outstandingBalance: Math.max(0, invoice.total - paymentTotals.total),
        paymentStatus,
      },
    };
  }

  static async create(
    data: {
      invoiceId: string;
      amount: number;
      paymentMethod: PaymentMethod;
      paymentDate?: string | Date;
      notes?: string;
    },
    userId: string,
  ) {
    const invoice = await Invoice.findOne({ _id: data.invoiceId, isDeleted: false });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status === InvoiceStatus.REJECTED) {
      throw new AppError('Cannot record payment on rejected invoice', 400);
    }

    const payment = await Payment.create({
      invoiceId: data.invoiceId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      notes: data.notes,
      recordedBy: userId,
    });

    await this.syncDeliveryPaidState(invoice._id, invoice.total, invoice.deliveryId);

    return payment.populate('recordedBy', 'name email');
  }

  static async delete(id: string) {
    const payment = await Payment.findOne({ _id: id, isDeleted: false });
    if (!payment) throw new AppError('Payment not found', 404);

    payment.isDeleted = true;
    payment.deletedAt = new Date();
    await payment.save();

    const invoice = await Invoice.findOne({ _id: payment.invoiceId, isDeleted: false });
    if (invoice) {
      await this.syncDeliveryPaidState(invoice._id, invoice.total, invoice.deliveryId);
    }

    return payment;
  }

  private static async syncDeliveryPaidState(
    invoiceId: mongoose.Types.ObjectId,
    invoiceTotal: number,
    deliveryId?: mongoose.Types.ObjectId,
  ) {
    const totals = await this.getTotalsByInvoiceIds([invoiceId]);
    const totalPaid = totals.get(String(invoiceId))?.total ?? 0;
    const status = computePaymentStatus(invoiceTotal, totalPaid);
    const isFullyPaid = status === 'paid' || status === 'credit';

    if (deliveryId) {
      await Delivery.findByIdAndUpdate(deliveryId, { paid: isFullyPaid });
    }
  }
}
