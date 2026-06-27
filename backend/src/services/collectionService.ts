import dayjs from 'dayjs';
import { Transaction } from '../models/Transaction';
import { Delivery } from '../models/Customer';
import { TransactionStatus } from '../types/enums';

export class CollectionService {
  static async getDaily(dateStr?: string) {
    const date = dateStr ? dayjs(dateStr) : dayjs();
    const start = date.startOf('day').toDate();
    const end = date.endOf('day').toDate();

    const [transactions, deliveries] = await Promise.all([
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
    ]);

    const summary = { cash: 0, gcash: 0, bank: 0, total: 0 };

    transactions.forEach((tx) => {
      const amount = tx.amount - (tx.discount || 0);
      summary[tx.paymentMethod as keyof typeof summary] =
        (summary[tx.paymentMethod as keyof typeof summary] as number) + amount;
      summary.total += amount;
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

    const unpaidTotal = deliveryItems.filter((i) => !i.paid).reduce((sum, i) => sum + i.amount, 0);

    return {
      date: date.format('YYYY-MM-DD'),
      summary,
      unpaidTotal,
      items: [...transactionItems, ...deliveryItems],
    };
  }
}
