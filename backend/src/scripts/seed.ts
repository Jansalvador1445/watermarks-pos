import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Settings, Log } from '../models/Notification';
import { Inventory, Gallon } from '../models/Gallon';
import { Product } from '../models/Product';
import { Customer, Delivery } from '../models/Customer';
import { PricingTier, PricingTierCode } from '../models/PricingTier';
import { Transaction } from '../models/Transaction';
import {
  UserRole,
  UserStatus,
  GallonType,
  CustomerStatus,
  TransactionType,
  PaymentMethod,
  TransactionStatus,
  ProductCategory,
  ProductStatus,
} from '../types/enums';
import { logger } from '../config/logger';
import { generateSecureReference } from '../utils/secureReference';

const seed = async () => {
  await connectDB();

  const adminExists = await User.findOne({ email: 'admin@h2o.com' });
  let adminUser = adminExists;
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@123', 12);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@h2o.com',
      username: 'admin',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isOnboarded: true,
    });
    logger.info('Admin user created: admin@h2o.com / Admin@123');
  } else if (!adminExists.isOnboarded) {
    adminExists.isOnboarded = true;
    adminExists.username = adminExists.username || 'admin';
    await adminExists.save();
  }

  const cashierExists = await User.findOne({ email: 'cashier@h2o.com' });
  if (!cashierExists) {
    const passwordHash = await bcrypt.hash('Cashier@123', 12);
    await User.create({
      name: 'Cashier User',
      email: 'cashier@h2o.com',
      username: 'cashier',
      passwordHash,
      role: UserRole.CASHIER,
      status: UserStatus.ACTIVE,
      isOnboarded: true,
    });
  }

  const settingsExists = await Settings.findOne();
  if (!settingsExists) {
    await Settings.create({});
  }

  const tierDefaults = [
    { code: PricingTierCode.TIER_A, label: 'Retail', slimPrice: 35, roundPrice: 40 },
    { code: PricingTierCode.TIER_B, label: 'Wholesale', slimPrice: 32, roundPrice: 38 },
    { code: PricingTierCode.TIER_C, label: 'Special', slimPrice: 30, roundPrice: 35 },
  ];
  for (const tier of tierDefaults) {
    await PricingTier.findOneAndUpdate({ code: tier.code }, { $setOnInsert: tier }, { upsert: true });
  }
  const tierA = await PricingTier.findOne({ code: PricingTierCode.TIER_A });
  if (!tierA) throw new Error('Pricing tier seed failed');

  const inventoryCount = await Inventory.countDocuments();
  if (inventoryCount === 0) {
    await Inventory.create([
      {
        name: 'Slim Gallon (Faucet)',
        unit: 'pcs',
        category: 'refill-slim',
        refillType: GallonType.SLIM,
        price: 35,
        currentStock: 65,
        lowStockThreshold: 10,
      },
      {
        name: 'Round Gallon',
        unit: 'pcs',
        category: 'refill-round',
        refillType: GallonType.ROUND,
        price: 40,
        currentStock: 48,
        lowStockThreshold: 10,
      },
    ]);
  }

  const inventoryMissingPublicId = await Inventory.find({
    $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: '' }],
  });
  for (const item of inventoryMissingPublicId) {
    item.publicId = generateSecureReference('ITM');
    await item.save();
  }

  const deliveriesMissingRef = await Delivery.find({
    $or: [{ referenceNo: { $exists: false } }, { referenceNo: null }, { referenceNo: '' }],
  });
  for (const delivery of deliveriesMissingRef) {
    delivery.referenceNo = generateSecureReference('DLV');
    await delivery.save();
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.create([
      {
        name: 'Slim Gallon Refill',
        price: 35,
        gallonType: GallonType.SLIM,
        category: ProductCategory.REFILL,
        decrementsStock: true,
        status: ProductStatus.ACTIVE,
      },
      {
        name: 'Round Gallon Refill',
        price: 40,
        gallonType: GallonType.ROUND,
        category: ProductCategory.REFILL,
        decrementsStock: true,
        status: ProductStatus.ACTIVE,
      },
      {
        name: 'New Slim Gallon',
        price: 250,
        gallonType: GallonType.SLIM,
        category: ProductCategory.CONTAINER,
        decrementsStock: false,
        status: ProductStatus.ACTIVE,
      },
      {
        name: 'New Round Gallon',
        price: 280,
        gallonType: GallonType.ROUND,
        category: ProductCategory.CONTAINER,
        decrementsStock: false,
        status: ProductStatus.ACTIVE,
      },
      {
        name: 'Dispenser Rental',
        price: 150,
        category: ProductCategory.RENTAL,
        decrementsStock: false,
        status: ProductStatus.ACTIVE,
      },
    ]);
    logger.info('Sample products created');
  }

  await Product.updateMany(
    { category: ProductCategory.REFILL, isDeleted: false },
    { $set: { decrementsStock: true } },
  );

  const slimInv = await Inventory.findOne({ refillType: GallonType.SLIM, isDeleted: false });
  const roundInv = await Inventory.findOne({ refillType: GallonType.ROUND, isDeleted: false });
  if (slimInv) {
    await Product.updateMany(
      { gallonType: GallonType.SLIM, decrementsStock: true, isDeleted: false },
      { $set: { linkedInventoryId: slimInv._id } },
    );
  }
  if (roundInv) {
    await Product.updateMany(
      { gallonType: GallonType.ROUND, decrementsStock: true, isDeleted: false },
      { $set: { linkedInventoryId: roundInv._id } },
    );
  }

  const gallonCount = await Gallon.countDocuments();
  if (gallonCount === 0) {
    await Gallon.create([
      {
        itemKey: GallonType.SLIM,
        label: 'Slim Container',
        type: GallonType.SLIM,
        currentIn: 65,
        currentOut: 12,
        returned: 3,
      },
      {
        itemKey: GallonType.ROUND,
        label: 'Round Container',
        type: GallonType.ROUND,
        currentIn: 48,
        currentOut: 8,
        returned: 2,
      },
    ]);
  }

  const customerCount = await Customer.countDocuments();
  if (customerCount === 0) {
    await Customer.create([
      {
        fullName: 'Juan Dela Cruz',
        address: '123 Main St, Quezon City',
        phone: '09171234567',
        pricingCategory: tierA._id,
        contacts: [{ name: 'Juan Dela Cruz', mobile: '09171234567' }],
        status: CustomerStatus.ENABLED,
      },
      {
        fullName: 'Maria Santos',
        address: '456 Oak Ave, Makati',
        phone: '09181234567',
        pricingCategory: tierA._id,
        contacts: [{ name: 'Maria Santos', mobile: '09181234567' }],
        status: CustomerStatus.ENABLED,
      },
      {
        fullName: 'Pedro Reyes',
        address: '789 Pine Rd, Pasig',
        phone: '09191234567',
        pricingCategory: tierA._id,
        contacts: [{ name: 'Pedro Reyes', mobile: '09191234567' }],
        status: CustomerStatus.ENABLED,
      },
      {
        fullName: 'Ana Garcia',
        address: '321 Elm St, Manila',
        phone: '09201234567',
        pricingCategory: tierA._id,
        contacts: [{ name: 'Ana Garcia', mobile: '09201234567' }],
        status: CustomerStatus.ENABLED,
      },
    ]);
  }

  const customers = await Customer.find({ isDeleted: false }).limit(4).lean();
  const adminId = adminUser?._id;

  const deliveryCount = await Delivery.countDocuments();
  if (deliveryCount === 0 && customers.length >= 3) {
    const [juan, maria, pedro, ana] = customers;
    const today = dayjs().startOf('day').toDate();
    const yesterday = dayjs().subtract(1, 'day').startOf('day').toDate();
    const twoDaysAgo = dayjs().subtract(2, 'day').startOf('day').toDate();
    const threeDaysAgo = dayjs().subtract(3, 'day').startOf('day').toDate();
    const fourDaysAgo = dayjs().subtract(4, 'day').startOf('day').toDate();

    await Delivery.create([
      {
        customerId: juan._id,
        date: today,
        schedule: 'Daily',
        status: 'delivered',
        colorCode: 'white',
        paid: true,
        slimOut: 2,
        roundOut: 0,
      },
      {
        customerId: maria._id,
        date: today,
        schedule: 'Every 2 Days',
        status: 'pending',
        colorCode: 'white',
        paid: false,
        slimOut: 1,
        roundOut: 1,
      },
      {
        customerId: pedro._id,
        date: today,
        schedule: 'Weekly',
        status: 'delivered',
        colorCode: 'white',
        paid: true,
        slimOut: 0,
        roundOut: 2,
      },
      {
        customerId: ana?._id ?? maria._id,
        date: yesterday,
        schedule: 'Daily',
        status: 'delivered',
        colorCode: 'white',
        paid: true,
        slimOut: 1,
        roundOut: 1,
      },
      {
        customerId: maria._id,
        date: twoDaysAgo,
        schedule: 'Every 2 Days',
        status: 'overdue',
        colorCode: 'orange',
        paid: false,
        slimOut: 1,
        roundOut: 0,
      },
      {
        customerId: pedro._id,
        date: threeDaysAgo,
        schedule: 'Weekly',
        status: 'overdue',
        colorCode: 'red',
        paid: false,
        slimOut: 0,
        roundOut: 1,
      },
      {
        customerId: juan._id,
        date: fourDaysAgo,
        schedule: 'Daily',
        status: 'delivered',
        colorCode: 'white',
        paid: true,
        slimOut: 2,
        roundOut: 1,
      },
    ]);
    logger.info('Sample deliveries created');
  }

  const transactionCount = await Transaction.countDocuments();
  if (transactionCount === 0 && customers.length >= 3) {
    const [juan, maria, pedro, ana] = customers;
    const transactions: Array<Record<string, unknown>> = [];
    let invoiceCounter = 1;

    const addTransaction = (
      customer: (typeof customers)[0] | undefined,
      daysAgo: number,
      amount: number,
      type: TransactionType = TransactionType.DELIVERY,
    ) => {
      const createdAt = dayjs().subtract(daysAgo, 'day').hour(10 + (daysAgo % 8)).minute(30).toDate();
      transactions.push({
        type,
        invoiceNo: `INV-${String(invoiceCounter++).padStart(5, '0')}`,
        customerId: customer?._id,
        customerName: customer?.fullName,
        items: [{ name: 'Water Refill', quantity: 2, price: amount / 2, gallonType: 'slim' }],
        paymentMethod: daysAgo % 3 === 0 ? PaymentMethod.GCASH : PaymentMethod.CASH,
        amount,
        status: TransactionStatus.PAID,
        createdAt,
        updatedAt: createdAt,
      });
    };

    // Spread sales across the last 30 days for the chart
    const dailyAmounts = [420, 680, 350, 890, 520, 760, 430, 910, 580, 640, 720, 480, 850, 390, 670];
    for (let i = 0; i < 15; i++) {
      const customer = [juan, maria, pedro, ana][i % 4];
      addTransaction(customer, i, dailyAmounts[i] ?? 500);
    }

    // Extra transactions for this month totals
    addTransaction(juan, 0, 1250);
    addTransaction(maria, 0, 840);
    addTransaction(pedro, 1, 960);
    addTransaction(ana, 2, 720);
    addTransaction(juan, 5, 1100, TransactionType.WALKIN);
    addTransaction(maria, 8, 650, TransactionType.POS);

    await Transaction.insertMany(transactions);
    logger.info('Sample transactions created');
  }

  const logCount = await Log.countDocuments();
  if (logCount === 0 && adminId) {
    await Log.create([
      { userId: adminId, action: 'logged in', module: 'auth', ipAddress: '127.0.0.1' },
      { userId: adminId, action: 'viewed dashboard', module: 'dashboard' },
      { userId: adminId, action: 'created customer', module: 'customers' },
      { userId: adminId, action: 'recorded delivery', module: 'deliveries' },
      { userId: adminId, action: 'processed transaction', module: 'transactions' },
      { userId: adminId, action: 'updated inventory', module: 'inventory' },
    ]);
    logger.info('Sample activity logs created');
  }

  logger.info('Seed completed');
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seed failed', { error: err });
  process.exit(1);
});
