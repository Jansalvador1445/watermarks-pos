"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dayjs_1 = __importDefault(require("dayjs"));
const db_1 = require("../config/db");
const User_1 = require("../models/User");
const Notification_1 = require("../models/Notification");
const Gallon_1 = require("../models/Gallon");
const Product_1 = require("../models/Product");
const Customer_1 = require("../models/Customer");
const PricingTier_1 = require("../models/PricingTier");
const Transaction_1 = require("../models/Transaction");
const enums_1 = require("../types/enums");
const logger_1 = require("../config/logger");
const secureReference_1 = require("../utils/secureReference");
const ensureAdminUser_1 = require("../services/ensureAdminUser");
const seed = async () => {
    await (0, db_1.connectDB)();
    await (0, ensureAdminUser_1.ensureAdminUser)();
    const adminUser = await User_1.User.findOne({ email: 'admin@h2o.com' });
    const cashierExists = await User_1.User.findOne({ email: 'cashier@h2o.com' });
    if (!cashierExists) {
        const passwordHash = await bcryptjs_1.default.hash('Cashier@123', 12);
        await User_1.User.create({
            name: 'Cashier User',
            email: 'cashier@h2o.com',
            username: 'cashier',
            passwordHash,
            role: enums_1.UserRole.CASHIER,
            status: enums_1.UserStatus.ACTIVE,
            isOnboarded: true,
        });
    }
    const settingsExists = await Notification_1.Settings.findOne();
    if (!settingsExists) {
        await Notification_1.Settings.create({});
    }
    const tierDefaults = [
        { code: PricingTier_1.PricingTierCode.TIER_A, label: 'Retail', slimPrice: 35, roundPrice: 40 },
        { code: PricingTier_1.PricingTierCode.TIER_B, label: 'Wholesale', slimPrice: 32, roundPrice: 38 },
        { code: PricingTier_1.PricingTierCode.TIER_C, label: 'Special', slimPrice: 30, roundPrice: 35 },
    ];
    for (const tier of tierDefaults) {
        await PricingTier_1.PricingTier.findOneAndUpdate({ code: tier.code }, { $setOnInsert: tier }, { upsert: true });
    }
    const tierA = await PricingTier_1.PricingTier.findOne({ code: PricingTier_1.PricingTierCode.TIER_A });
    if (!tierA)
        throw new Error('Pricing tier seed failed');
    const inventoryCount = await Gallon_1.Inventory.countDocuments();
    if (inventoryCount === 0) {
        await Gallon_1.Inventory.create([
            {
                name: 'Slim Gallon (Faucet)',
                unit: 'pcs',
                category: 'refill-slim',
                refillType: enums_1.GallonType.SLIM,
                price: 35,
                currentStock: 65,
                lowStockThreshold: 10,
            },
            {
                name: 'Round Gallon',
                unit: 'pcs',
                category: 'refill-round',
                refillType: enums_1.GallonType.ROUND,
                price: 40,
                currentStock: 48,
                lowStockThreshold: 10,
            },
        ]);
    }
    const inventoryMissingPublicId = await Gallon_1.Inventory.find({
        $or: [{ publicId: { $exists: false } }, { publicId: null }, { publicId: '' }],
    });
    for (const item of inventoryMissingPublicId) {
        item.publicId = (0, secureReference_1.generateSecureReference)('ITM');
        await item.save();
    }
    const deliveriesMissingRef = await Customer_1.Delivery.find({
        $or: [{ referenceNo: { $exists: false } }, { referenceNo: null }, { referenceNo: '' }],
    });
    for (const delivery of deliveriesMissingRef) {
        delivery.referenceNo = (0, secureReference_1.generateSecureReference)('DLV');
        await delivery.save();
    }
    const productCount = await Product_1.Product.countDocuments();
    if (productCount === 0) {
        await Product_1.Product.create([
            {
                name: 'Slim Gallon Refill',
                price: 35,
                gallonType: enums_1.GallonType.SLIM,
                category: enums_1.ProductCategory.REFILL,
                decrementsStock: true,
                status: enums_1.ProductStatus.ACTIVE,
            },
            {
                name: 'Round Gallon Refill',
                price: 40,
                gallonType: enums_1.GallonType.ROUND,
                category: enums_1.ProductCategory.REFILL,
                decrementsStock: true,
                status: enums_1.ProductStatus.ACTIVE,
            },
            {
                name: 'New Slim Gallon',
                price: 250,
                gallonType: enums_1.GallonType.SLIM,
                category: enums_1.ProductCategory.CONTAINER,
                decrementsStock: false,
                status: enums_1.ProductStatus.ACTIVE,
            },
            {
                name: 'New Round Gallon',
                price: 280,
                gallonType: enums_1.GallonType.ROUND,
                category: enums_1.ProductCategory.CONTAINER,
                decrementsStock: false,
                status: enums_1.ProductStatus.ACTIVE,
            },
            {
                name: 'Dispenser Rental',
                price: 150,
                category: enums_1.ProductCategory.RENTAL,
                decrementsStock: false,
                status: enums_1.ProductStatus.ACTIVE,
            },
        ]);
        logger_1.logger.info('Sample products created');
    }
    await Product_1.Product.updateMany({ category: enums_1.ProductCategory.REFILL, isDeleted: false }, { $set: { decrementsStock: true } });
    const slimInv = await Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.SLIM, isDeleted: false });
    const roundInv = await Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.ROUND, isDeleted: false });
    if (slimInv) {
        await Product_1.Product.updateMany({ gallonType: enums_1.GallonType.SLIM, decrementsStock: true, isDeleted: false }, { $set: { linkedInventoryId: slimInv._id } });
    }
    if (roundInv) {
        await Product_1.Product.updateMany({ gallonType: enums_1.GallonType.ROUND, decrementsStock: true, isDeleted: false }, { $set: { linkedInventoryId: roundInv._id } });
    }
    const gallonCount = await Gallon_1.Gallon.countDocuments();
    if (gallonCount === 0) {
        await Gallon_1.Gallon.create([
            {
                itemKey: enums_1.GallonType.SLIM,
                label: 'Slim Container',
                type: enums_1.GallonType.SLIM,
                currentIn: 65,
                currentOut: 12,
                returned: 3,
            },
            {
                itemKey: enums_1.GallonType.ROUND,
                label: 'Round Container',
                type: enums_1.GallonType.ROUND,
                currentIn: 48,
                currentOut: 8,
                returned: 2,
            },
        ]);
    }
    const customerCount = await Customer_1.Customer.countDocuments();
    if (customerCount === 0) {
        await Customer_1.Customer.create([
            {
                fullName: 'Juan Dela Cruz',
                address: '123 Main St, Quezon City',
                phone: '09171234567',
                pricingCategory: tierA._id,
                contacts: [{ name: 'Juan Dela Cruz', mobile: '09171234567' }],
                status: enums_1.CustomerStatus.ENABLED,
            },
            {
                fullName: 'Maria Santos',
                address: '456 Oak Ave, Makati',
                phone: '09181234567',
                pricingCategory: tierA._id,
                contacts: [{ name: 'Maria Santos', mobile: '09181234567' }],
                status: enums_1.CustomerStatus.ENABLED,
            },
            {
                fullName: 'Pedro Reyes',
                address: '789 Pine Rd, Pasig',
                phone: '09191234567',
                pricingCategory: tierA._id,
                contacts: [{ name: 'Pedro Reyes', mobile: '09191234567' }],
                status: enums_1.CustomerStatus.ENABLED,
            },
            {
                fullName: 'Ana Garcia',
                address: '321 Elm St, Manila',
                phone: '09201234567',
                pricingCategory: tierA._id,
                contacts: [{ name: 'Ana Garcia', mobile: '09201234567' }],
                status: enums_1.CustomerStatus.ENABLED,
            },
        ]);
    }
    const customers = await Customer_1.Customer.find({ isDeleted: false }).limit(4).lean();
    const adminId = adminUser?._id;
    const deliveryCount = await Customer_1.Delivery.countDocuments();
    if (deliveryCount === 0 && customers.length >= 3) {
        const [juan, maria, pedro, ana] = customers;
        const today = (0, dayjs_1.default)().startOf('day').toDate();
        const yesterday = (0, dayjs_1.default)().subtract(1, 'day').startOf('day').toDate();
        const twoDaysAgo = (0, dayjs_1.default)().subtract(2, 'day').startOf('day').toDate();
        const threeDaysAgo = (0, dayjs_1.default)().subtract(3, 'day').startOf('day').toDate();
        const fourDaysAgo = (0, dayjs_1.default)().subtract(4, 'day').startOf('day').toDate();
        await Customer_1.Delivery.create([
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
        logger_1.logger.info('Sample deliveries created');
    }
    const transactionCount = await Transaction_1.Transaction.countDocuments();
    if (transactionCount === 0 && customers.length >= 3) {
        const [juan, maria, pedro, ana] = customers;
        const transactions = [];
        let invoiceCounter = 1;
        const addTransaction = (customer, daysAgo, amount, type = enums_1.TransactionType.DELIVERY) => {
            const createdAt = (0, dayjs_1.default)().subtract(daysAgo, 'day').hour(10 + (daysAgo % 8)).minute(30).toDate();
            transactions.push({
                type,
                invoiceNo: `INV-${String(invoiceCounter++).padStart(5, '0')}`,
                customerId: customer?._id,
                customerName: customer?.fullName,
                items: [{ name: 'Water Refill', quantity: 2, price: amount / 2, gallonType: 'slim' }],
                paymentMethod: daysAgo % 3 === 0 ? enums_1.PaymentMethod.GCASH : enums_1.PaymentMethod.CASH,
                amount,
                status: enums_1.TransactionStatus.PAID,
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
        addTransaction(juan, 5, 1100, enums_1.TransactionType.WALKIN);
        addTransaction(maria, 8, 650, enums_1.TransactionType.POS);
        await Transaction_1.Transaction.insertMany(transactions);
        logger_1.logger.info('Sample transactions created');
    }
    const logCount = await Notification_1.Log.countDocuments();
    if (logCount === 0 && adminId) {
        await Notification_1.Log.create([
            { userId: adminId, action: 'logged in', module: 'auth', ipAddress: '127.0.0.1' },
            { userId: adminId, action: 'viewed dashboard', module: 'dashboard' },
            { userId: adminId, action: 'created customer', module: 'customers' },
            { userId: adminId, action: 'recorded delivery', module: 'deliveries' },
            { userId: adminId, action: 'processed transaction', module: 'transactions' },
            { userId: adminId, action: 'updated inventory', module: 'inventory' },
        ]);
        logger_1.logger.info('Sample activity logs created');
    }
    logger_1.logger.info('Seed completed');
    process.exit(0);
};
seed().catch((err) => {
    logger_1.logger.error('Seed failed', { error: err });
    process.exit(1);
});
//# sourceMappingURL=seed.js.map