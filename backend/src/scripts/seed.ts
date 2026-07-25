/**
 * Demo seed — login: admin@h2o.com / Admin@123 | cashier@h2o.com / Cashier@123 | driver@h2o.com / Driver@123
 * Run: npm run seed | npm run seed -- --fresh
 */
import bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Settings, Log } from '../models/Notification';
import { Inventory, Gallon } from '../models/Gallon';
import { Product } from '../models/Product';
import { Customer, Delivery } from '../models/Customer';
import { PricingTier, PricingTierCode } from '../models/PricingTier';
import { Transaction } from '../models/Transaction';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Payment } from '../models/Payment';
import { InventoryMovement } from '../models/InventoryMovement';
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
  InventoryMovementType,
} from '../types/enums';
import { logger } from '../config/logger';
import { generateSecureReference } from '../utils/secureReference';
import { ensureAdminUser } from '../services/ensureAdminUser';

const DEMO_MARKER = 'seed-demo';
const isFresh = process.argv.includes('--fresh');

async function clearDemoData() {
  logger.info('Clearing demo data (--fresh)...');
  await Promise.all([
    Payment.deleteMany({ notes: DEMO_MARKER }),
    Invoice.deleteMany({ notes: DEMO_MARKER }),
    Delivery.deleteMany({ remarks: DEMO_MARKER }),
    Transaction.deleteMany({ notes: DEMO_MARKER }),
    InventoryMovement.deleteMany({ remarks: DEMO_MARKER }),
    Customer.deleteMany({ locationNotes: DEMO_MARKER }),
    Log.deleteMany({ module: DEMO_MARKER }),
  ]);
  await User.deleteMany({ email: { $in: ['cashier@h2o.com', 'driver@h2o.com'] } });
  await Customer.deleteMany({
    phone: {
      $in: [
        '09171234567', '09181234567', '09191234567', '09201234567',
        '09211234567', '09221234567', '09231234567', '09241234567',
        '09251234567', '09261234567',
      ],
    },
  });
}

async function seedUsers() {
  await ensureAdminUser();
  const adminUser = await User.findOne({ email: 'admin@h2o.com' });

  const users = [
    { name: 'Cashier User', email: 'cashier@h2o.com', username: 'cashier', role: UserRole.CASHIER, password: 'Cashier@123' },
    { name: 'Delivery Driver', email: 'driver@h2o.com', username: 'driver', role: UserRole.DELIVERY_STAFF, password: 'Driver@123' },
  ];

  for (const u of users) {
    const exists = await User.findOne({ email: u.email });
    if (exists) continue;
    const passwordHash = await bcrypt.hash(u.password, 12);
    await User.create({
      name: u.name,
      email: u.email,
      username: u.username,
      passwordHash,
      role: u.role,
      status: UserStatus.ACTIVE,
      isOnboarded: true,
    });
    logger.info(`User created: ${u.email} / ${u.password}`);
  }

  return adminUser;
}

async function seedPricingTiers() {
  const tierDefaults = [
    { code: PricingTierCode.TIER_A, label: 'Retail', slimPrice: 35, roundPrice: 40 },
    { code: PricingTierCode.TIER_B, label: 'Wholesale', slimPrice: 32, roundPrice: 38 },
    { code: PricingTierCode.TIER_C, label: 'Special', slimPrice: 30, roundPrice: 35 },
  ];
  for (const tier of tierDefaults) {
    await PricingTier.findOneAndUpdate({ code: tier.code }, { $setOnInsert: tier }, { upsert: true });
  }
  return {
    tierA: await PricingTier.findOne({ code: PricingTierCode.TIER_A }),
    tierB: await PricingTier.findOne({ code: PricingTierCode.TIER_B }),
    tierC: await PricingTier.findOne({ code: PricingTierCode.TIER_C }),
  };
}

async function seedProductsAndInventory() {
  let slimInv = await Inventory.findOne({ refillType: GallonType.SLIM, isDeleted: false });
  let roundInv = await Inventory.findOne({ refillType: GallonType.ROUND, isDeleted: false });

  if (!slimInv) {
    slimInv = await Inventory.create({
      name: 'Slim Gallon (Faucet)',
      unit: 'pcs',
      category: 'refill-slim',
      refillType: GallonType.SLIM,
      price: 35,
      currentStock: 120,
      lowStockThreshold: 15,
    });
  }

  if (!roundInv) {
    roundInv = await Inventory.create({
      name: 'Round Gallon',
      unit: 'pcs',
      category: 'refill-round',
      refillType: GallonType.ROUND,
      price: 40,
      currentStock: 95,
      lowStockThreshold: 12,
    });
  }

  if ((await Product.countDocuments()) === 0) {
    await Product.create([
      { name: 'Slim Gallon Refill', price: 35, gallonType: GallonType.SLIM, category: ProductCategory.REFILL, decrementsStock: true, status: ProductStatus.ACTIVE },
      { name: 'Round Gallon Refill', price: 40, gallonType: GallonType.ROUND, category: ProductCategory.REFILL, decrementsStock: true, status: ProductStatus.ACTIVE },
      { name: 'New Slim Gallon', price: 250, gallonType: GallonType.SLIM, category: ProductCategory.CONTAINER, decrementsStock: false, status: ProductStatus.ACTIVE },
      { name: 'New Round Gallon', price: 280, gallonType: GallonType.ROUND, category: ProductCategory.CONTAINER, decrementsStock: false, status: ProductStatus.ACTIVE },
      { name: 'Dispenser Rental', price: 150, category: ProductCategory.RENTAL, decrementsStock: false, status: ProductStatus.ACTIVE },
    ]);
  }

  if (slimInv) {
    await Product.updateMany({ gallonType: GallonType.SLIM, decrementsStock: true, isDeleted: false }, { $set: { linkedInventoryId: slimInv._id } });
  }
  if (roundInv) {
    await Product.updateMany({ gallonType: GallonType.ROUND, decrementsStock: true, isDeleted: false }, { $set: { linkedInventoryId: roundInv._id } });
  }

  if ((await Gallon.countDocuments()) === 0) {
    await Gallon.create([
      { itemKey: GallonType.SLIM, label: 'Slim Container', type: GallonType.SLIM, currentIn: 120, currentOut: 18, returned: 5 },
      { itemKey: GallonType.ROUND, label: 'Round Container', type: GallonType.ROUND, currentIn: 95, currentOut: 14, returned: 4 },
    ]);
  }

  return {
    slimInv,
    roundInv,
    slimProduct:
      (await Product.findOne({ gallonType: GallonType.SLIM, category: ProductCategory.REFILL, isDeleted: false })) ??
      (await Product.create({
        name: 'Slim Gallon Refill',
        price: 35,
        gallonType: GallonType.SLIM,
        category: ProductCategory.REFILL,
        decrementsStock: true,
        status: ProductStatus.ACTIVE,
        linkedInventoryId: slimInv._id,
      })),
    roundProduct:
      (await Product.findOne({ gallonType: GallonType.ROUND, category: ProductCategory.REFILL, isDeleted: false })) ??
      (await Product.create({
        name: 'Round Gallon Refill',
        price: 40,
        gallonType: GallonType.ROUND,
        category: ProductCategory.REFILL,
        decrementsStock: true,
        status: ProductStatus.ACTIVE,
        linkedInventoryId: roundInv._id,
      })),
    rentalProduct:
      (await Product.findOne({ category: ProductCategory.RENTAL, isDeleted: false })) ??
      (await Product.create({
        name: 'Dispenser Rental',
        price: 150,
        category: ProductCategory.RENTAL,
        decrementsStock: false,
        status: ProductStatus.ACTIVE,
      })),
  };
}

async function seedCustomers(tiers: {
  tierA: mongoose.Types.ObjectId | null | undefined;
  tierB: mongoose.Types.ObjectId | null | undefined;
  tierC: mongoose.Types.ObjectId | null | undefined;
}) {
  if ((await Customer.countDocuments({ locationNotes: DEMO_MARKER })) > 0 && !isFresh) {
    return Customer.find({ isDeleted: false }).limit(12).lean();
  }

  const customers = [
    { fullName: 'Juan Dela Cruz', address: '123 Main St, Quezon City', phone: '09171234567', pricingCategory: tiers.tierA!, outstandingSlim: 4, outstandingRound: 0 },
    { fullName: 'Maria Santos', address: '456 Oak Ave, Makati', phone: '09181234567', pricingCategory: tiers.tierA!, outstandingSlim: 2, outstandingRound: 1 },
    { fullName: 'Pedro Reyes', address: '789 Pine Rd, Pasig', phone: '09191234567', pricingCategory: tiers.tierB!, outstandingSlim: 0, outstandingRound: 3 },
    { fullName: 'Ana Garcia', address: '321 Elm St, Manila', phone: '09201234567', pricingCategory: tiers.tierB!, outstandingSlim: 1, outstandingRound: 0 },
    { fullName: 'Rosa Mendoza', address: '88 Sampaguita, Caloocan', phone: '09211234567', pricingCategory: tiers.tierC!, outstandingSlim: 0, outstandingRound: 0 },
    { fullName: 'Carlos Villanueva', address: '15 Rizal Ave, Taguig', phone: '09221234567', pricingCategory: tiers.tierC!, outstandingSlim: 3, outstandingRound: 2 },
    { fullName: 'Elena Torres', address: '42 Mabini, Marikina', phone: '09231234567', pricingCategory: tiers.tierA!, outstandingSlim: 0, outstandingRound: 0 },
    { fullName: 'Miguel Ramos', address: '7 Luna St, Paranaque', phone: '09241234567', pricingCategory: tiers.tierB!, outstandingSlim: 2, outstandingRound: 0 },
    { fullName: 'Sofia Cruz', address: '19 Bonifacio, Mandaluyong', phone: '09251234567', pricingCategory: tiers.tierC!, outstandingSlim: 0, outstandingRound: 1 },
    { fullName: 'Inactive Customer', address: '99 Closed Rd, Manila', phone: '09261234567', pricingCategory: tiers.tierA!, outstandingSlim: 0, outstandingRound: 0, status: CustomerStatus.DISABLED },
  ];

  const created: Array<{ _id: mongoose.Types.ObjectId }> = [];
  for (const c of customers) {
    const doc = await Customer.create({
      ...c,
      contacts: [{ name: c.fullName, mobile: c.phone }],
      status: c.status ?? CustomerStatus.ENABLED,
      locationNotes: DEMO_MARKER,
    });
    created.push(doc);
  }
  logger.info(`Created ${created.length} demo customers`);
  return created;
}

async function seedInventoryMovements(adminId: mongoose.Types.ObjectId, slimInv: { _id: mongoose.Types.ObjectId; currentStock: number }, roundInv: { _id: mongoose.Types.ObjectId; currentStock: number }) {
  if ((await InventoryMovement.countDocuments({ remarks: DEMO_MARKER })) > 0 && !isFresh) return;

  const types: InventoryMovementType[] = [
    InventoryMovementType.PRODUCTION,
    InventoryMovementType.DELIVERY,
    InventoryMovementType.POS_SALE,
    InventoryMovementType.WALKIN_SALE,
    InventoryMovementType.INVOICE_SALE,
    InventoryMovementType.RETURN,
    InventoryMovementType.ADJUSTMENT,
  ];

  const movements = [];
  for (let i = 0; i < 24; i++) {
    const isSlim = i % 2 === 0;
    const item = isSlim ? slimInv : roundInv;
    const qty = (i % 5) + 1;
    const before = item.currentStock;
    const type = types[i % types.length];
    const delta = type === InventoryMovementType.PRODUCTION || type === InventoryMovementType.RETURN ? qty : -qty;
    const after = Math.max(0, before + delta);
    movements.push({
      date: dayjs().subtract(i, 'day').hour(9).toDate(),
      itemId: item._id,
      movementType: type,
      quantity: delta,
      beforeStock: before,
      afterStock: after,
      referenceNo: generateSecureReference('MOV'),
      userId: adminId,
      remarks: DEMO_MARKER,
    });
  }

  await InventoryMovement.insertMany(movements);
  logger.info(`Created ${movements.length} inventory movements`);
}

async function seedInvoicesAndPayments(
  adminId: mongoose.Types.ObjectId,
  customers: Array<{ _id: mongoose.Types.ObjectId }>,
  products: { slimProduct: { _id: mongoose.Types.ObjectId; name: string; price: number } | null; roundProduct: { _id: mongoose.Types.ObjectId; name: string; price: number } | null; rentalProduct: { _id: mongoose.Types.ObjectId; name: string; price: number } | null },
) {
  if ((await Invoice.countDocuments({ notes: DEMO_MARKER })) > 0 && !isFresh) {
    return Invoice.find({ notes: DEMO_MARKER }).lean();
  }

  if (!products.slimProduct || !products.roundProduct) throw new Error('Products required for invoice seed');

  type SeedInvoice = {
    daysAgo: number;
    customerIdx: number;
    status: InvoiceStatus;
    items: Array<{ productId: mongoose.Types.ObjectId; name: string; quantity: number; unitPrice: number; discount: number; subtotal: number }>;
    payments: Array<{ amount: number; daysAgo: number; method: PaymentMethod }>;
  };

  const mkItem = (product: { _id: mongoose.Types.ObjectId; name: string; price: number }, qty = 2) => ({
    productId: product._id,
    name: product.name,
    quantity: qty,
    unitPrice: product.price,
    discount: 0,
    subtotal: product.price * qty,
  });

  const scenarios: SeedInvoice[] = [
    { daysAgo: 5, customerIdx: 0, status: InvoiceStatus.CONVERTED, items: [mkItem(products.slimProduct)], payments: [{ amount: 70, daysAgo: 3, method: PaymentMethod.CASH }] },
    { daysAgo: 10, customerIdx: 1, status: InvoiceStatus.CONVERTED, items: [mkItem(products.roundProduct)], payments: [{ amount: 40, daysAgo: 8, method: PaymentMethod.GCASH }] },
    { daysAgo: 15, customerIdx: 2, status: InvoiceStatus.CONVERTED, items: [mkItem(products.slimProduct, 3)], payments: [] },
    { daysAgo: 35, customerIdx: 3, status: InvoiceStatus.APPROVED, items: [mkItem(products.roundProduct, 4)], payments: [{ amount: 60, daysAgo: 30, method: PaymentMethod.CASH }] },
    { daysAgo: 45, customerIdx: 4, status: InvoiceStatus.APPROVED, items: [mkItem(products.slimProduct)], payments: [] },
    { daysAgo: 55, customerIdx: 5, status: InvoiceStatus.CONVERTED, items: [mkItem(products.roundProduct, 2), mkItem(products.slimProduct)], payments: [{ amount: 100, daysAgo: 50, method: PaymentMethod.BANK }] },
    { daysAgo: 70, customerIdx: 6, status: InvoiceStatus.CONVERTED, items: [mkItem(products.slimProduct)], payments: [] },
    { daysAgo: 95, customerIdx: 7, status: InvoiceStatus.CONVERTED, items: [mkItem(products.roundProduct, 3)], payments: [{ amount: 50, daysAgo: 90, method: PaymentMethod.CASH }] },
    { daysAgo: 3, customerIdx: 8, status: InvoiceStatus.PENDING, items: [mkItem(products.slimProduct)], payments: [] },
    { daysAgo: 7, customerIdx: 0, status: InvoiceStatus.PENDING, items: [mkItem(products.rentalProduct ?? products.slimProduct, 1)], payments: [] },
    { daysAgo: 20, customerIdx: 1, status: InvoiceStatus.APPROVED, items: [mkItem(products.slimProduct, 2)], payments: [] },
    { daysAgo: 25, customerIdx: 2, status: InvoiceStatus.REJECTED, items: [mkItem(products.roundProduct)], payments: [] },
    { daysAgo: 12, customerIdx: 4, status: InvoiceStatus.CONVERTED, items: [mkItem(products.slimProduct)], payments: [{ amount: 200, daysAgo: 10, method: PaymentMethod.CASH }] },
  ];

  const invoices = [];
  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    const customer = customers[s.customerIdx % customers.length];
    const subtotal = s.items.reduce((sum, item) => sum + item.subtotal, 0);
    const createdAt = dayjs().subtract(s.daysAgo, 'day').toDate();

    const invoice = await Invoice.create({
      invoiceNo: `SEED-${String(i + 1).padStart(4, '0')}`,
      customerId: customer._id,
      items: s.items,
      subtotal,
      tax: 0,
      total: subtotal,
      paymentMethod: PaymentMethod.CASH,
      notes: DEMO_MARKER,
      status: s.status,
      createdBy: adminId,
      createdAt,
      updatedAt: createdAt,
    });

    for (const p of s.payments) {
      await Payment.create({
        invoiceId: invoice._id,
        amount: p.amount,
        paymentMethod: p.method,
        paymentDate: dayjs().subtract(p.daysAgo, 'day').toDate(),
        notes: DEMO_MARKER,
        recordedBy: adminId,
      });
    }

    invoices.push(invoice);
  }

  logger.info(`Created ${invoices.length} demo invoices with payments`);
  return invoices;
}

async function seedDeliveries(
  customers: Array<{ _id: mongoose.Types.ObjectId }>,
  driverId: mongoose.Types.ObjectId | undefined,
  invoices: Array<{ _id: mongoose.Types.ObjectId; status: InvoiceStatus; customerId: mongoose.Types.ObjectId }>,
) {
  if ((await Delivery.countDocuments({ remarks: DEMO_MARKER })) > 0 && !isFresh) return;

  const converted = invoices.filter((inv) => inv.status === InvoiceStatus.CONVERTED);
  const deliveries = [];

  for (let i = 0; i < converted.length; i++) {
    const inv = converted[i];
    const daysAgo = 2 + i;
    const paid = i % 3 === 0;
    const delivery = await Delivery.create({
      referenceNo: generateSecureReference('DLV'),
      customerId: inv.customerId,
      date: dayjs().subtract(daysAgo % 10, 'day').toDate(),
      schedule: i % 2 === 0 ? 'Daily' : 'Weekly',
      status: i % 4 === 0 ? 'overdue' : i % 3 === 0 ? 'pending' : 'delivered',
      colorCode: i % 4 === 0 ? 'orange' : 'white',
      paid,
      slimOut: 2,
      roundOut: i % 2,
      slimIn: 0,
      roundIn: 0,
      slimReturn: 0,
      roundReturn: 0,
      sourceInvoiceId: inv._id,
      assignedStaffId: driverId,
      remarks: DEMO_MARKER,
    });
    await Invoice.findByIdAndUpdate(inv._id, { deliveryId: delivery._id, status: InvoiceStatus.CONVERTED });
    deliveries.push(delivery);
  }

  const extraDeliveries = [
    { customerIdx: 0, daysAgo: 0, status: 'delivered', paid: true },
    { customerIdx: 1, daysAgo: 0, status: 'pending', paid: false },
    { customerIdx: 2, daysAgo: 1, status: 'delivered', paid: true },
    { customerIdx: 3, daysAgo: 2, status: 'overdue', paid: false, color: 'red' },
    { customerIdx: 4, daysAgo: 3, status: 'overdue', paid: false, color: 'orange' },
  ];

  for (const d of extraDeliveries) {
    deliveries.push(
      await Delivery.create({
        referenceNo: generateSecureReference('DLV'),
        customerId: customers[d.customerIdx]._id,
        date: dayjs().subtract(d.daysAgo, 'day').toDate(),
        schedule: 'Daily',
        status: d.status,
        colorCode: d.color ?? 'white',
        paid: d.paid,
        slimOut: 1,
        roundOut: 1,
        slimIn: 0,
        roundIn: 0,
        slimReturn: 0,
        roundReturn: 0,
        assignedStaffId: driverId,
        remarks: DEMO_MARKER,
      }),
    );
  }

  logger.info(`Created ${deliveries.length} demo deliveries`);
}

async function seedTransactions(customers: Array<{ _id: mongoose.Types.ObjectId; fullName: string }>) {
  if ((await Transaction.countDocuments({ notes: DEMO_MARKER })) > 0 && !isFresh) return;

  const transactions = [];
  let invoiceCounter = 1;
  const dailyAmounts = [420, 680, 350, 890, 520, 760, 430, 910, 580, 640, 720, 480, 850, 390, 670, 540, 810, 460, 730, 620];

  for (let i = 0; i < dailyAmounts.length; i++) {
    const customer = customers[i % customers.length];
    const createdAt = dayjs().subtract(i, 'day').hour(10 + (i % 8)).toDate();
    const type = i % 5 === 0 ? TransactionType.WALKIN : i % 7 === 0 ? TransactionType.POS : TransactionType.DELIVERY;
    transactions.push({
      type,
      invoiceNo: `TX-${String(invoiceCounter++).padStart(5, '0')}`,
      customerId: customer._id,
      customerName: customer.fullName,
      items: [{ name: 'Water Refill', quantity: 2, price: dailyAmounts[i] / 2, gallonType: 'slim' }],
      paymentMethod: i % 3 === 0 ? PaymentMethod.GCASH : i % 5 === 0 ? PaymentMethod.BANK : PaymentMethod.CASH,
      amount: dailyAmounts[i],
      status: TransactionStatus.PAID,
      notes: DEMO_MARKER,
      createdAt,
      updatedAt: createdAt,
    });
  }

  await Transaction.insertMany(transactions);
  logger.info(`Created ${transactions.length} demo transactions`);
}

async function seedActivityLogs(adminId: mongoose.Types.ObjectId) {
  if ((await Log.countDocuments({ module: DEMO_MARKER })) > 0 && !isFresh) return;

  await Log.insertMany([
    { userId: adminId, action: 'logged in', module: 'auth', ipAddress: '127.0.0.1' },
    { userId: adminId, action: 'viewed dashboard', module: DEMO_MARKER },
    { userId: adminId, action: 'created invoice', module: 'orders' },
    { userId: adminId, action: 'recorded payment', module: 'payments' },
    { userId: adminId, action: 'generated invoice report', module: 'reports' },
    { userId: adminId, action: 'recorded delivery', module: 'deliveries' },
    { userId: adminId, action: 'processed transaction', module: 'transactions' },
    { userId: adminId, action: 'updated inventory', module: 'inventory' },
    { userId: adminId, action: 'viewed customer report', module: 'reports' },
    { userId: adminId, action: 'ran demo seed', module: DEMO_MARKER },
  ]);
}

const seed = async () => {
  await connectDB();

  if (isFresh) await clearDemoData();

  const settingsExists = await Settings.findOne();
  if (!settingsExists) await Settings.create({});

  const adminUser = await seedUsers();
  if (!adminUser) throw new Error('Admin user required');

  const tiers = await seedPricingTiers();
  if (!tiers.tierA || !tiers.tierB || !tiers.tierC) throw new Error('Pricing tier seed failed');

  const products = await seedProductsAndInventory();
  if (!products.slimInv || !products.roundInv) throw new Error('Inventory seed failed');

  const customers = await seedCustomers({
    tierA: tiers.tierA?._id,
    tierB: tiers.tierB?._id,
    tierC: tiers.tierC?._id,
  });
  const driver = await User.findOne({ email: 'driver@h2o.com' });

  await seedInventoryMovements(adminUser._id, products.slimInv, products.roundInv);
  const invoices = await seedInvoicesAndPayments(adminUser._id, customers, products);
  await seedDeliveries(customers, driver?._id, invoices);
  await seedTransactions(customers as Array<{ _id: mongoose.Types.ObjectId; fullName: string }>);
  await seedActivityLogs(adminUser._id);

  logger.info('Seed completed successfully');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Seed failed', { error: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined });
  console.error(err);
  process.exit(1);
});
