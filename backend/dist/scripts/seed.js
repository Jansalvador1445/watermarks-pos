"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Demo seed — login: admin@h2o.com / Admin@123 | cashier@h2o.com / Cashier@123 | driver@h2o.com / Driver@123
 * Run: npm run seed | npm run seed -- --fresh
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dayjs_1 = __importDefault(require("dayjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_1 = require("../config/db");
const User_1 = require("../models/User");
const Notification_1 = require("../models/Notification");
const Gallon_1 = require("../models/Gallon");
const Product_1 = require("../models/Product");
const Customer_1 = require("../models/Customer");
const PricingTier_1 = require("../models/PricingTier");
const Transaction_1 = require("../models/Transaction");
const Invoice_1 = require("../models/Invoice");
const Payment_1 = require("../models/Payment");
const InventoryMovement_1 = require("../models/InventoryMovement");
const enums_1 = require("../types/enums");
const logger_1 = require("../config/logger");
const secureReference_1 = require("../utils/secureReference");
const ensureAdminUser_1 = require("../services/ensureAdminUser");
const DEMO_MARKER = 'seed-demo';
const isFresh = process.argv.includes('--fresh');
async function clearDemoData() {
    logger_1.logger.info('Clearing demo data (--fresh)...');
    await Promise.all([
        Payment_1.Payment.deleteMany({ notes: DEMO_MARKER }),
        Invoice_1.Invoice.deleteMany({ notes: DEMO_MARKER }),
        Customer_1.Delivery.deleteMany({ remarks: DEMO_MARKER }),
        Transaction_1.Transaction.deleteMany({ notes: DEMO_MARKER }),
        InventoryMovement_1.InventoryMovement.deleteMany({ remarks: DEMO_MARKER }),
        Customer_1.Customer.deleteMany({ locationNotes: DEMO_MARKER }),
        Notification_1.Log.deleteMany({ module: DEMO_MARKER }),
    ]);
    await User_1.User.deleteMany({ email: { $in: ['cashier@h2o.com', 'driver@h2o.com'] } });
    await Customer_1.Customer.deleteMany({
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
    await (0, ensureAdminUser_1.ensureAdminUser)();
    const adminUser = await User_1.User.findOne({ email: 'admin@h2o.com' });
    const users = [
        { name: 'Cashier User', email: 'cashier@h2o.com', username: 'cashier', role: enums_1.UserRole.CASHIER, password: 'Cashier@123' },
        { name: 'Delivery Driver', email: 'driver@h2o.com', username: 'driver', role: enums_1.UserRole.DELIVERY_STAFF, password: 'Driver@123' },
    ];
    for (const u of users) {
        const exists = await User_1.User.findOne({ email: u.email });
        if (exists)
            continue;
        const passwordHash = await bcryptjs_1.default.hash(u.password, 12);
        await User_1.User.create({
            name: u.name,
            email: u.email,
            username: u.username,
            passwordHash,
            role: u.role,
            status: enums_1.UserStatus.ACTIVE,
            isOnboarded: true,
        });
        logger_1.logger.info(`User created: ${u.email} / ${u.password}`);
    }
    return adminUser;
}
async function seedPricingTiers() {
    const tierDefaults = [
        { code: PricingTier_1.PricingTierCode.TIER_A, label: 'Retail', slimPrice: 35, roundPrice: 40 },
        { code: PricingTier_1.PricingTierCode.TIER_B, label: 'Wholesale', slimPrice: 32, roundPrice: 38 },
        { code: PricingTier_1.PricingTierCode.TIER_C, label: 'Special', slimPrice: 30, roundPrice: 35 },
    ];
    for (const tier of tierDefaults) {
        await PricingTier_1.PricingTier.findOneAndUpdate({ code: tier.code }, { $setOnInsert: tier }, { upsert: true });
    }
    return {
        tierA: await PricingTier_1.PricingTier.findOne({ code: PricingTier_1.PricingTierCode.TIER_A }),
        tierB: await PricingTier_1.PricingTier.findOne({ code: PricingTier_1.PricingTierCode.TIER_B }),
        tierC: await PricingTier_1.PricingTier.findOne({ code: PricingTier_1.PricingTierCode.TIER_C }),
    };
}
async function seedProductsAndInventory() {
    let slimInv = await Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.SLIM, isDeleted: false });
    let roundInv = await Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.ROUND, isDeleted: false });
    if (!slimInv) {
        slimInv = await Gallon_1.Inventory.create({
            name: 'Slim Gallon (Faucet)',
            unit: 'pcs',
            category: 'refill-slim',
            refillType: enums_1.GallonType.SLIM,
            price: 35,
            currentStock: 120,
            lowStockThreshold: 15,
        });
    }
    if (!roundInv) {
        roundInv = await Gallon_1.Inventory.create({
            name: 'Round Gallon',
            unit: 'pcs',
            category: 'refill-round',
            refillType: enums_1.GallonType.ROUND,
            price: 40,
            currentStock: 95,
            lowStockThreshold: 12,
        });
    }
    if ((await Product_1.Product.countDocuments()) === 0) {
        await Product_1.Product.create([
            { name: 'Slim Gallon Refill', price: 35, gallonType: enums_1.GallonType.SLIM, category: enums_1.ProductCategory.REFILL, decrementsStock: true, status: enums_1.ProductStatus.ACTIVE },
            { name: 'Round Gallon Refill', price: 40, gallonType: enums_1.GallonType.ROUND, category: enums_1.ProductCategory.REFILL, decrementsStock: true, status: enums_1.ProductStatus.ACTIVE },
            { name: 'New Slim Gallon', price: 250, gallonType: enums_1.GallonType.SLIM, category: enums_1.ProductCategory.CONTAINER, decrementsStock: false, status: enums_1.ProductStatus.ACTIVE },
            { name: 'New Round Gallon', price: 280, gallonType: enums_1.GallonType.ROUND, category: enums_1.ProductCategory.CONTAINER, decrementsStock: false, status: enums_1.ProductStatus.ACTIVE },
            { name: 'Dispenser Rental', price: 150, category: enums_1.ProductCategory.RENTAL, decrementsStock: false, status: enums_1.ProductStatus.ACTIVE },
        ]);
    }
    if (slimInv) {
        await Product_1.Product.updateMany({ gallonType: enums_1.GallonType.SLIM, decrementsStock: true, isDeleted: false }, { $set: { linkedInventoryId: slimInv._id } });
    }
    if (roundInv) {
        await Product_1.Product.updateMany({ gallonType: enums_1.GallonType.ROUND, decrementsStock: true, isDeleted: false }, { $set: { linkedInventoryId: roundInv._id } });
    }
    if ((await Gallon_1.Gallon.countDocuments()) === 0) {
        await Gallon_1.Gallon.create([
            { itemKey: enums_1.GallonType.SLIM, label: 'Slim Container', type: enums_1.GallonType.SLIM, currentIn: 120, currentOut: 18, returned: 5 },
            { itemKey: enums_1.GallonType.ROUND, label: 'Round Container', type: enums_1.GallonType.ROUND, currentIn: 95, currentOut: 14, returned: 4 },
        ]);
    }
    return {
        slimInv,
        roundInv,
        slimProduct: (await Product_1.Product.findOne({ gallonType: enums_1.GallonType.SLIM, category: enums_1.ProductCategory.REFILL, isDeleted: false })) ??
            (await Product_1.Product.create({
                name: 'Slim Gallon Refill',
                price: 35,
                gallonType: enums_1.GallonType.SLIM,
                category: enums_1.ProductCategory.REFILL,
                decrementsStock: true,
                status: enums_1.ProductStatus.ACTIVE,
                linkedInventoryId: slimInv._id,
            })),
        roundProduct: (await Product_1.Product.findOne({ gallonType: enums_1.GallonType.ROUND, category: enums_1.ProductCategory.REFILL, isDeleted: false })) ??
            (await Product_1.Product.create({
                name: 'Round Gallon Refill',
                price: 40,
                gallonType: enums_1.GallonType.ROUND,
                category: enums_1.ProductCategory.REFILL,
                decrementsStock: true,
                status: enums_1.ProductStatus.ACTIVE,
                linkedInventoryId: roundInv._id,
            })),
        rentalProduct: (await Product_1.Product.findOne({ category: enums_1.ProductCategory.RENTAL, isDeleted: false })) ??
            (await Product_1.Product.create({
                name: 'Dispenser Rental',
                price: 150,
                category: enums_1.ProductCategory.RENTAL,
                decrementsStock: false,
                status: enums_1.ProductStatus.ACTIVE,
            })),
    };
}
async function seedCustomers(tiers) {
    if ((await Customer_1.Customer.countDocuments({ locationNotes: DEMO_MARKER })) > 0 && !isFresh) {
        return Customer_1.Customer.find({ isDeleted: false }).limit(12).lean();
    }
    const customers = [
        { fullName: 'Juan Dela Cruz', address: '123 Main St, Quezon City', phone: '09171234567', pricingCategory: tiers.tierA, outstandingSlim: 4, outstandingRound: 0 },
        { fullName: 'Maria Santos', address: '456 Oak Ave, Makati', phone: '09181234567', pricingCategory: tiers.tierA, outstandingSlim: 2, outstandingRound: 1 },
        { fullName: 'Pedro Reyes', address: '789 Pine Rd, Pasig', phone: '09191234567', pricingCategory: tiers.tierB, outstandingSlim: 0, outstandingRound: 3 },
        { fullName: 'Ana Garcia', address: '321 Elm St, Manila', phone: '09201234567', pricingCategory: tiers.tierB, outstandingSlim: 1, outstandingRound: 0 },
        { fullName: 'Rosa Mendoza', address: '88 Sampaguita, Caloocan', phone: '09211234567', pricingCategory: tiers.tierC, outstandingSlim: 0, outstandingRound: 0 },
        { fullName: 'Carlos Villanueva', address: '15 Rizal Ave, Taguig', phone: '09221234567', pricingCategory: tiers.tierC, outstandingSlim: 3, outstandingRound: 2 },
        { fullName: 'Elena Torres', address: '42 Mabini, Marikina', phone: '09231234567', pricingCategory: tiers.tierA, outstandingSlim: 0, outstandingRound: 0 },
        { fullName: 'Miguel Ramos', address: '7 Luna St, Paranaque', phone: '09241234567', pricingCategory: tiers.tierB, outstandingSlim: 2, outstandingRound: 0 },
        { fullName: 'Sofia Cruz', address: '19 Bonifacio, Mandaluyong', phone: '09251234567', pricingCategory: tiers.tierC, outstandingSlim: 0, outstandingRound: 1 },
        { fullName: 'Inactive Customer', address: '99 Closed Rd, Manila', phone: '09261234567', pricingCategory: tiers.tierA, outstandingSlim: 0, outstandingRound: 0, status: enums_1.CustomerStatus.DISABLED },
    ];
    const created = [];
    for (const c of customers) {
        const doc = await Customer_1.Customer.create({
            ...c,
            contacts: [{ name: c.fullName, mobile: c.phone }],
            status: c.status ?? enums_1.CustomerStatus.ENABLED,
            locationNotes: DEMO_MARKER,
        });
        created.push(doc);
    }
    logger_1.logger.info(`Created ${created.length} demo customers`);
    return created;
}
async function seedInventoryMovements(adminId, slimInv, roundInv) {
    if ((await InventoryMovement_1.InventoryMovement.countDocuments({ remarks: DEMO_MARKER })) > 0 && !isFresh)
        return;
    const types = [
        enums_1.InventoryMovementType.PRODUCTION,
        enums_1.InventoryMovementType.DELIVERY,
        enums_1.InventoryMovementType.POS_SALE,
        enums_1.InventoryMovementType.WALKIN_SALE,
        enums_1.InventoryMovementType.INVOICE_SALE,
        enums_1.InventoryMovementType.RETURN,
        enums_1.InventoryMovementType.ADJUSTMENT,
    ];
    const movements = [];
    for (let i = 0; i < 24; i++) {
        const isSlim = i % 2 === 0;
        const item = isSlim ? slimInv : roundInv;
        const qty = (i % 5) + 1;
        const before = item.currentStock;
        const type = types[i % types.length];
        const delta = type === enums_1.InventoryMovementType.PRODUCTION || type === enums_1.InventoryMovementType.RETURN ? qty : -qty;
        const after = Math.max(0, before + delta);
        movements.push({
            date: (0, dayjs_1.default)().subtract(i, 'day').hour(9).toDate(),
            itemId: item._id,
            movementType: type,
            quantity: delta,
            beforeStock: before,
            afterStock: after,
            referenceNo: (0, secureReference_1.generateSecureReference)('MOV'),
            userId: adminId,
            remarks: DEMO_MARKER,
        });
    }
    await InventoryMovement_1.InventoryMovement.insertMany(movements);
    logger_1.logger.info(`Created ${movements.length} inventory movements`);
}
async function seedInvoicesAndPayments(adminId, customers, products) {
    if ((await Invoice_1.Invoice.countDocuments({ notes: DEMO_MARKER })) > 0 && !isFresh) {
        return Invoice_1.Invoice.find({ notes: DEMO_MARKER }).lean();
    }
    if (!products.slimProduct || !products.roundProduct)
        throw new Error('Products required for invoice seed');
    const mkItem = (product, qty = 2) => ({
        productId: product._id,
        name: product.name,
        quantity: qty,
        unitPrice: product.price,
        discount: 0,
        subtotal: product.price * qty,
    });
    const scenarios = [
        { daysAgo: 5, customerIdx: 0, status: Invoice_1.InvoiceStatus.CONVERTED, items: [mkItem(products.slimProduct)], payments: [{ amount: 70, daysAgo: 3, method: enums_1.PaymentMethod.CASH }] },
        { daysAgo: 10, customerIdx: 1, status: Invoice_1.InvoiceStatus.CONVERTED, items: [mkItem(products.roundProduct)], payments: [{ amount: 40, daysAgo: 8, method: enums_1.PaymentMethod.GCASH }] },
        { daysAgo: 15, customerIdx: 2, status: Invoice_1.InvoiceStatus.CONVERTED, items: [mkItem(products.slimProduct, 3)], payments: [] },
        { daysAgo: 35, customerIdx: 3, status: Invoice_1.InvoiceStatus.APPROVED, items: [mkItem(products.roundProduct, 4)], payments: [{ amount: 60, daysAgo: 30, method: enums_1.PaymentMethod.CASH }] },
        { daysAgo: 45, customerIdx: 4, status: Invoice_1.InvoiceStatus.APPROVED, items: [mkItem(products.slimProduct)], payments: [] },
        { daysAgo: 55, customerIdx: 5, status: Invoice_1.InvoiceStatus.CONVERTED, items: [mkItem(products.roundProduct, 2), mkItem(products.slimProduct)], payments: [{ amount: 100, daysAgo: 50, method: enums_1.PaymentMethod.BANK }] },
        { daysAgo: 70, customerIdx: 6, status: Invoice_1.InvoiceStatus.CONVERTED, items: [mkItem(products.slimProduct)], payments: [] },
        { daysAgo: 95, customerIdx: 7, status: Invoice_1.InvoiceStatus.CONVERTED, items: [mkItem(products.roundProduct, 3)], payments: [{ amount: 50, daysAgo: 90, method: enums_1.PaymentMethod.CASH }] },
        { daysAgo: 3, customerIdx: 8, status: Invoice_1.InvoiceStatus.PENDING, items: [mkItem(products.slimProduct)], payments: [] },
        { daysAgo: 7, customerIdx: 0, status: Invoice_1.InvoiceStatus.PENDING, items: [mkItem(products.rentalProduct ?? products.slimProduct, 1)], payments: [] },
        { daysAgo: 20, customerIdx: 1, status: Invoice_1.InvoiceStatus.APPROVED, items: [mkItem(products.slimProduct, 2)], payments: [] },
        { daysAgo: 25, customerIdx: 2, status: Invoice_1.InvoiceStatus.REJECTED, items: [mkItem(products.roundProduct)], payments: [] },
        { daysAgo: 12, customerIdx: 4, status: Invoice_1.InvoiceStatus.CONVERTED, items: [mkItem(products.slimProduct)], payments: [{ amount: 200, daysAgo: 10, method: enums_1.PaymentMethod.CASH }] },
    ];
    const invoices = [];
    for (let i = 0; i < scenarios.length; i++) {
        const s = scenarios[i];
        const customer = customers[s.customerIdx % customers.length];
        const subtotal = s.items.reduce((sum, item) => sum + item.subtotal, 0);
        const createdAt = (0, dayjs_1.default)().subtract(s.daysAgo, 'day').toDate();
        const invoice = await Invoice_1.Invoice.create({
            invoiceNo: `SEED-${String(i + 1).padStart(4, '0')}`,
            customerId: customer._id,
            items: s.items,
            subtotal,
            tax: 0,
            total: subtotal,
            paymentMethod: enums_1.PaymentMethod.CASH,
            notes: DEMO_MARKER,
            status: s.status,
            createdBy: adminId,
            createdAt,
            updatedAt: createdAt,
        });
        for (const p of s.payments) {
            await Payment_1.Payment.create({
                invoiceId: invoice._id,
                amount: p.amount,
                paymentMethod: p.method,
                paymentDate: (0, dayjs_1.default)().subtract(p.daysAgo, 'day').toDate(),
                notes: DEMO_MARKER,
                recordedBy: adminId,
            });
        }
        invoices.push(invoice);
    }
    logger_1.logger.info(`Created ${invoices.length} demo invoices with payments`);
    return invoices;
}
async function seedDeliveries(customers, driverId, invoices) {
    if ((await Customer_1.Delivery.countDocuments({ remarks: DEMO_MARKER })) > 0 && !isFresh)
        return;
    const converted = invoices.filter((inv) => inv.status === Invoice_1.InvoiceStatus.CONVERTED);
    const deliveries = [];
    for (let i = 0; i < converted.length; i++) {
        const inv = converted[i];
        const daysAgo = 2 + i;
        const paid = i % 3 === 0;
        const delivery = await Customer_1.Delivery.create({
            referenceNo: (0, secureReference_1.generateSecureReference)('DLV'),
            customerId: inv.customerId,
            date: (0, dayjs_1.default)().subtract(daysAgo % 10, 'day').toDate(),
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
        await Invoice_1.Invoice.findByIdAndUpdate(inv._id, { deliveryId: delivery._id, status: Invoice_1.InvoiceStatus.CONVERTED });
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
        deliveries.push(await Customer_1.Delivery.create({
            referenceNo: (0, secureReference_1.generateSecureReference)('DLV'),
            customerId: customers[d.customerIdx]._id,
            date: (0, dayjs_1.default)().subtract(d.daysAgo, 'day').toDate(),
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
        }));
    }
    logger_1.logger.info(`Created ${deliveries.length} demo deliveries`);
}
async function seedTransactions(customers) {
    if ((await Transaction_1.Transaction.countDocuments({ notes: DEMO_MARKER })) > 0 && !isFresh)
        return;
    const transactions = [];
    let invoiceCounter = 1;
    const dailyAmounts = [420, 680, 350, 890, 520, 760, 430, 910, 580, 640, 720, 480, 850, 390, 670, 540, 810, 460, 730, 620];
    for (let i = 0; i < dailyAmounts.length; i++) {
        const customer = customers[i % customers.length];
        const createdAt = (0, dayjs_1.default)().subtract(i, 'day').hour(10 + (i % 8)).toDate();
        const type = i % 5 === 0 ? enums_1.TransactionType.WALKIN : i % 7 === 0 ? enums_1.TransactionType.POS : enums_1.TransactionType.DELIVERY;
        transactions.push({
            type,
            invoiceNo: `TX-${String(invoiceCounter++).padStart(5, '0')}`,
            customerId: customer._id,
            customerName: customer.fullName,
            items: [{ name: 'Water Refill', quantity: 2, price: dailyAmounts[i] / 2, gallonType: 'slim' }],
            paymentMethod: i % 3 === 0 ? enums_1.PaymentMethod.GCASH : i % 5 === 0 ? enums_1.PaymentMethod.BANK : enums_1.PaymentMethod.CASH,
            amount: dailyAmounts[i],
            status: enums_1.TransactionStatus.PAID,
            notes: DEMO_MARKER,
            createdAt,
            updatedAt: createdAt,
        });
    }
    await Transaction_1.Transaction.insertMany(transactions);
    logger_1.logger.info(`Created ${transactions.length} demo transactions`);
}
async function seedActivityLogs(adminId) {
    if ((await Notification_1.Log.countDocuments({ module: DEMO_MARKER })) > 0 && !isFresh)
        return;
    await Notification_1.Log.insertMany([
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
    await (0, db_1.connectDB)();
    if (isFresh)
        await clearDemoData();
    const settingsExists = await Notification_1.Settings.findOne();
    if (!settingsExists)
        await Notification_1.Settings.create({});
    const adminUser = await seedUsers();
    if (!adminUser)
        throw new Error('Admin user required');
    const tiers = await seedPricingTiers();
    if (!tiers.tierA || !tiers.tierB || !tiers.tierC)
        throw new Error('Pricing tier seed failed');
    const products = await seedProductsAndInventory();
    if (!products.slimInv || !products.roundInv)
        throw new Error('Inventory seed failed');
    const customers = await seedCustomers({
        tierA: tiers.tierA?._id,
        tierB: tiers.tierB?._id,
        tierC: tiers.tierC?._id,
    });
    const driver = await User_1.User.findOne({ email: 'driver@h2o.com' });
    await seedInventoryMovements(adminUser._id, products.slimInv, products.roundInv);
    const invoices = await seedInvoicesAndPayments(adminUser._id, customers, products);
    await seedDeliveries(customers, driver?._id, invoices);
    await seedTransactions(customers);
    await seedActivityLogs(adminUser._id);
    logger_1.logger.info('Seed completed successfully');
    await mongoose_1.default.disconnect();
    process.exit(0);
};
seed().catch((err) => {
    logger_1.logger.error('Seed failed', { error: err instanceof Error ? err.message : err, stack: err instanceof Error ? err.stack : undefined });
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map