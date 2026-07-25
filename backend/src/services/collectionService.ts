import dayjs from 'dayjs';
import { Transaction } from '../models/Transaction';
import { Delivery } from '../models/Customer';
import { Payment } from '../models/Payment';
import { TransactionStatus } from '../types/enums';

export class CollectionService {
  static async getDaily(dateStr?: string) {
    const date = dateStr ? dayjs(dateStr) : dayjs();
    const start = date.startOf('day').toDate();
    const end = date.endOf('day').toDate();

    const [transactions, deliveries, invoicePayments] = await Promise.all([
      Transaction.find({
        isDeleted: false,
        status: TransactionStatus.PAID,
        createdAt: { $gte: start, $lte: end },
      })
        .populate('customerId', 'fullName phone')
        .sort({ createdAt: -1 })
        .lean(),
      Delivery.find({
        isDeleted: false,
        date: { $gte: start, $lte: end },
      })
        .populate({
          path: 'customerId',
          select: 'fullName phone pricingCategory',
          populate: { path: 'pricingCategory', select: 'slimPrice roundPrice' },
        })
        .populate('assignedStaffId', 'name')
        .sort({ date: -1 })
        .lean(),
      Payment.find({
        isDeleted: false,
        paymentDate: { $gte: start, $lte: end },
      })
        .populate({
          path: 'invoiceId',
          select: 'invoiceNo customerId',
          populate: { path: 'customerId', select: 'fullName phone' },
        })
        .sort({ paymentDate: -1 })
        .lean(),
    ]);

    const summary = { cash: 0, gcash: 0, bank: 0, total: 0 };

    transactions.forEach((tx) => {
      const amount = tx.amount - (tx.discount || 0);
      summary[tx.paymentMethod as keyof typeof summary] =
        (summary[tx.paymentMethod as keyof typeof summary] as number) + amount;
      summary.total += amount;
    });

    invoicePayments.forEach((payment) => {
      summary[payment.paymentMethod as keyof typeof summary] =
        (summary[payment.paymentMethod as keyof typeof summary] as number) + payment.amount;
      summary.total += payment.amount;
    });

    const transactionItems = transactions.map((tx) => ({
      id: tx._id,
      customer:
        (tx.customerId as { fullName?: string } | null)?.fullName || tx.customerName || 'Walk-in',
      amount: tx.amount - (tx.discount || 0),
      paymentMethod: tx.paymentMethod,
      paid: tx.status === TransactionStatus.PAID,
      type: tx.type,
      source: 'transaction' as const,
      createdAt: tx.createdAt,
    }));

    const deliveryItems = deliveries.map((d) => {
      const customer = d.customerId as {
        fullName?: string;
        pricingCategory?: { slimPrice?: number; roundPrice?: number } | string;
      } | null;
      const tier =
        customer?.pricingCategory && typeof customer.pricingCategory === 'object'
          ? customer.pricingCategory
          : { slimPrice: 0, roundPrice: 0 };
      const amount =
        (d.slimOut || 0) * (tier.slimPrice || 0) +
        (d.roundOut || 0) * (tier.roundPrice || 0) -
        (d.discount || 0);

      return {
        id: d._id,
        customer: customer?.fullName || 'Unknown',
        amount: Math.max(amount, 0),
        paymentMethod: d.paid ? 'cash' : 'pending',
        paid: d.paid,
        type: 'delivery',
        source: 'delivery' as const,
        staff: (d.assignedStaffId as { name?: string } | null)?.name,
        createdAt: d.date,
      };
    });

    const paymentItems = invoicePayments.map((payment) => {
      const invoice = payment.invoiceId as {
        invoiceNo?: string;
        customerId?: { fullName?: string } | string;
      } | null;
      const customer =
        invoice?.customerId && typeof invoice.customerId === 'object'
          ? invoice.customerId.fullName
          : 'Unknown';

      return {
        id: payment._id,
        customer: customer || 'Unknown',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paid: true,
        type: 'invoice_payment',
        source: 'invoice_payment' as const,
        createdAt: payment.paymentDate,
      };
    });

    const unpaidTotal = deliveryItems.filter((i) => !i.paid).reduce((sum, i) => sum + i.amount, 0);

    return {
      date: date.format('YYYY-MM-DD'),
      summary,
      unpaidTotal,
      items: [...transactionItems, ...deliveryItems, ...paymentItems],
    };
  }
}
