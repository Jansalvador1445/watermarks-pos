"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Verifies inventory business rules end-to-end.
 * Run: npx tsx src/scripts/verifyBusinessRules.ts
 */
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const Gallon_1 = require("../models/Gallon");
const InventoryMovement_1 = require("../models/InventoryMovement");
const Customer_1 = require("../models/Customer");
const PricingTier_1 = require("../models/PricingTier");
const Product_1 = require("../models/Product");
const Notification_1 = require("../models/Notification");
const inventoryMovementService_1 = require("../services/inventoryMovementService");
const transactionService_1 = require("../services/transactionService");
const deliveryService_1 = require("../services/deliveryService");
const inventoryService_1 = require("../services/inventoryService");
const enums_1 = require("../types/enums");
const User_1 = require("../models/User");
const response_1 = require("../utils/response");
dotenv_1.default.config();
const results = [];
const pass = (rule, detail) => results.push({ rule, pass: true, detail });
const fail = (rule, detail) => results.push({ rule, pass: false, detail });
async function main() {
    await mongoose_1.default.connect((0, db_1.normalizeMongoUri)(process.env.MONGODB_URI));
    const admin = await User_1.User.findOne({ role: enums_1.UserRole.ADMIN, isDeleted: false });
    if (!admin)
        throw new Error('Admin user required — run npm run seed');
    const userId = admin._id.toString();
    const slimInv = await Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.SLIM, isDeleted: false });
    const roundInv = await Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.ROUND, isDeleted: false });
    if (!slimInv || !roundInv)
        throw new Error('Inventory items required — run npm run seed');
    let product = await Product_1.Product.findOne({
        decrementsStock: true,
        gallonType: enums_1.GallonType.SLIM,
        isDeleted: false,
        status: enums_1.ProductStatus.ACTIVE,
    });
    if (!product) {
        product = await Product_1.Product.create({
            name: 'Verify Slim Refill',
            price: 35,
            gallonType: enums_1.GallonType.SLIM,
            linkedInventoryId: slimInv._id,
            category: enums_1.ProductCategory.REFILL,
            decrementsStock: true,
            status: enums_1.ProductStatus.ACTIVE,
        });
    }
    else if (!product.linkedInventoryId) {
        product.linkedInventoryId = slimInv._id;
        await product.save();
    }
    const tierA = await PricingTier_1.PricingTier.findOne({ code: PricingTier_1.PricingTierCode.TIER_A });
    if (!tierA)
        throw new Error('Pricing tiers required — run npm run seed');
    const customer = await Customer_1.Customer.create({
        fullName: 'Business Rules Test Customer',
        address: 'Test Address 123',
        phone: '09999999001',
        pricingCategory: tierA._id,
        contacts: [],
        outstandingSlim: 0,
        outstandingRound: 0,
    });
    const invId = slimInv._id.toString();
    const stockStart = slimInv.currentStock;
    // Rule: Production increases stock + movement + activity log
    await inventoryMovementService_1.InventoryMovementService.addProduction(invId, 10, 'Verify production batch', userId);
    const afterProd = await Gallon_1.Inventory.findById(invId);
    const prodMovement = await InventoryMovement_1.InventoryMovement.findOne({
        itemId: slimInv._id,
        movementType: enums_1.InventoryMovementType.PRODUCTION,
        isDeleted: false,
    }).sort({ createdAt: -1 });
    const prodLog = await Notification_1.Log.findOne({ module: 'inventory', 'metadata.movementType': enums_1.InventoryMovementType.PRODUCTION }).sort({ createdAt: -1 });
    if (afterProd.currentStock === stockStart + 10 && prodMovement && prodLog) {
        pass('Water Production → increases filled water stock', `stock ${stockStart} → ${afterProd.currentStock}`);
    }
    else {
        fail('Water Production → increases filled water stock');
    }
    // Rule: Direct stock edit blocked
    try {
        await inventoryService_1.InventoryService.update(invId, { currentStock: 9999 }, userId);
        fail('Direct stock edit must be blocked');
    }
    catch (err) {
        if (err instanceof response_1.AppError && err.message.includes('Direct stock editing')) {
            pass('Direct stock editing is blocked');
        }
        else {
            fail('Direct stock edit must be blocked', err instanceof Error ? err.message : String(err));
        }
    }
    const beforePos = (await Gallon_1.Inventory.findById(invId)).currentStock;
    // Rule: POS sale decreases stock after payment
    await transactionService_1.TransactionService.create({
        type: enums_1.TransactionType.POS,
        customerName: 'POS Verify',
        items: [{ productId: product._id.toString(), quantity: 2 }],
        paymentMethod: enums_1.PaymentMethod.CASH,
    }, userId);
    const afterPos = (await Gallon_1.Inventory.findById(invId)).currentStock;
    const posMovement = await InventoryMovement_1.InventoryMovement.findOne({
        movementType: enums_1.InventoryMovementType.POS_SALE,
        isDeleted: false,
    }).sort({ createdAt: -1 });
    if (afterPos === beforePos - 2 && posMovement) {
        pass('POS Sale → decreases stock after successful payment', `stock ${beforePos} → ${afterPos}`);
    }
    else {
        fail('POS Sale → decreases stock after successful payment');
    }
    const beforeWalkin = afterPos;
    // Rule: Walk-in sale decreases stock
    await transactionService_1.TransactionService.create({
        type: enums_1.TransactionType.WALKIN,
        customerName: 'Walk-in Verify',
        items: [{ productId: product._id.toString(), quantity: 1 }],
        paymentMethod: enums_1.PaymentMethod.CASH,
    }, userId);
    const afterWalkin = (await Gallon_1.Inventory.findById(invId)).currentStock;
    const walkinMovement = await InventoryMovement_1.InventoryMovement.findOne({
        movementType: enums_1.InventoryMovementType.WALKIN_SALE,
        isDeleted: false,
    }).sort({ createdAt: -1 });
    if (afterWalkin === beforeWalkin - 1 && walkinMovement) {
        pass('Walk-in Sale → decreases filled water stock', `stock ${beforeWalkin} → ${afterWalkin}`);
    }
    else {
        fail('Walk-in Sale → decreases filled water stock');
    }
    // Rule: Pending delivery does NOT decrease stock
    const beforePending = (await Gallon_1.Inventory.findById(roundInv._id)).currentStock;
    const pendingDelivery = await deliveryService_1.DeliveryService.create({
        customerId: customer._id.toString(),
        date: new Date().toISOString(),
        schedule: 'Daily',
        status: enums_1.DeliveryStatus.PENDING,
        slimOut: 0,
        roundOut: 5,
        slimReturn: 0,
        roundReturn: 0,
    }, userId);
    const afterPendingCreate = (await Gallon_1.Inventory.findById(roundInv._id)).currentStock;
    if (afterPendingCreate === beforePending) {
        pass('Delivery created as Pending → no stock decrease');
    }
    else {
        fail('Delivery created as Pending → no stock decrease');
    }
    // Rule: Delivered decreases stock + outstanding formula
    const outstandingBefore = customer.outstandingRound;
    const stockBeforeDelivered = afterPendingCreate;
    await deliveryService_1.DeliveryService.update(pendingDelivery._id.toString(), { status: enums_1.DeliveryStatus.DELIVERED }, userId);
    const stockAfterDelivered = (await Gallon_1.Inventory.findById(roundInv._id)).currentStock;
    const updatedCustomer = await Customer_1.Customer.findById(customer._id);
    const deliveryMovement = await InventoryMovement_1.InventoryMovement.findOne({
        referenceNo: pendingDelivery.referenceNo,
        movementType: enums_1.InventoryMovementType.DELIVERY,
        isDeleted: false,
    });
    const outstandingLog = await Notification_1.Log.findOne({
        module: 'customers',
        'metadata.referenceNo': pendingDelivery.referenceNo,
        'metadata.type': 'outstanding_update',
    });
    const expectedOutstanding = outstandingBefore + 5 - 0;
    if (stockAfterDelivered === stockBeforeDelivered - 5 &&
        updatedCustomer.outstandingRound === expectedOutstanding &&
        deliveryMovement &&
        outstandingLog) {
        pass('Delivery Completed → decreases stock + updates outstanding', `Outstanding: ${outstandingBefore} + 5 - 0 = ${updatedCustomer.outstandingRound}`);
    }
    else {
        fail('Delivery Completed → decreases stock + updates outstanding', JSON.stringify({
            stockAfterDelivered,
            stockBeforeDelivered,
            outstanding: updatedCustomer.outstandingRound,
            expectedOutstanding,
        }));
    }
    // Rule: Customer return on delivery does NOT increase stock, updates outstanding
    const returnDelivery = await deliveryService_1.DeliveryService.create({
        customerId: customer._id.toString(),
        date: new Date().toISOString(),
        schedule: 'Daily',
        status: enums_1.DeliveryStatus.PENDING,
        slimOut: 0,
        roundOut: 2,
        slimReturn: 0,
        roundReturn: 0,
    }, userId);
    await deliveryService_1.DeliveryService.update(returnDelivery._id.toString(), { status: enums_1.DeliveryStatus.DELIVERED }, userId);
    const stockMid = (await Gallon_1.Inventory.findById(roundInv._id)).currentStock;
    const returnDelivery2 = await Customer_1.Delivery.create({
        customerId: customer._id,
        date: new Date(),
        schedule: 'Daily',
        status: enums_1.DeliveryStatus.PENDING,
        slimOut: 0,
        roundOut: 0,
        slimReturn: 0,
        roundReturn: 1,
        referenceNo: `DLV-TEST-${Date.now()}`,
    });
    await deliveryService_1.DeliveryService.update(returnDelivery2._id.toString(), { status: enums_1.DeliveryStatus.DELIVERED }, userId);
    const stockAfterReturn = (await Gallon_1.Inventory.findById(roundInv._id)).currentStock;
    const returnMovement = await InventoryMovement_1.InventoryMovement.findOne({
        referenceNo: returnDelivery2.referenceNo,
        movementType: enums_1.InventoryMovementType.RETURN,
        isDeleted: false,
    });
    const customerAfterReturn = await Customer_1.Customer.findById(customer._id);
    if (stockAfterReturn === stockMid && returnMovement && returnMovement.beforeStock === returnMovement.afterStock) {
        pass('Customer Return → no stock increase, logged as Return movement');
    }
    else {
        fail('Customer Return → no stock increase');
    }
    // Rule: Manual adjustment with reason
    const beforeAdjust = (await Gallon_1.Inventory.findById(invId)).currentStock;
    await inventoryMovementService_1.InventoryMovementService.manualAdjust(invId, -2, 'Verify adjustment — damaged bottles', userId);
    const afterAdjust = (await Gallon_1.Inventory.findById(invId)).currentStock;
    const adjustMovement = await InventoryMovement_1.InventoryMovement.findOne({
        movementType: enums_1.InventoryMovementType.ADJUSTMENT,
        isDeleted: false,
    }).sort({ createdAt: -1 });
    if (afterAdjust === beforeAdjust - 2 && adjustMovement?.remarks?.includes('damaged')) {
        pass('Manual Adjustment (admin) → changes stock with reason + movement log');
    }
    else {
        fail('Manual Adjustment (admin) → changes stock with reason');
    }
    // Rule: Negative stock prevented
    try {
        await inventoryMovementService_1.InventoryMovementService.manualAdjust(invId, -999999, 'Should fail', userId);
        fail('Negative stock must be prevented');
    }
    catch (err) {
        if (err instanceof response_1.AppError && err.message.toLowerCase().includes('insufficient')) {
            pass('Negative stock is prevented');
        }
        else {
            fail('Negative stock must be prevented', err instanceof Error ? err.message : String(err));
        }
    }
    // Rule: Idempotent delivery outstanding (re-save does not double-count)
    const outstandingBeforeIdempotent = customerAfterReturn.outstandingRound;
    await deliveryService_1.DeliveryService.update(returnDelivery2._id.toString(), { remarks: 'Re-save test' }, userId);
    const customerAfterIdempotent = await Customer_1.Customer.findById(customer._id);
    if (customerAfterIdempotent.outstandingRound === outstandingBeforeIdempotent) {
        pass('Outstanding update is idempotent on delivery re-save');
    }
    else {
        fail('Outstanding update is idempotent on delivery re-save');
    }
    // Movement log fields
    const sampleMovement = await InventoryMovement_1.InventoryMovement.findOne({ isDeleted: false })
        .populate('itemId', 'name')
        .populate('userId', 'name')
        .sort({ createdAt: -1 });
    if (sampleMovement?.date &&
        sampleMovement.itemId &&
        sampleMovement.movementType &&
        sampleMovement.quantity != null &&
        sampleMovement.beforeStock != null &&
        sampleMovement.afterStock != null &&
        sampleMovement.referenceNo &&
        sampleMovement.userId) {
        pass('Inventory Movement log has all required fields');
    }
    else {
        fail('Inventory Movement log has all required fields');
    }
    // Cleanup test customer
    await Customer_1.Customer.findByIdAndUpdate(customer._id, { isDeleted: true, deletedAt: new Date() });
    console.log('\n=== Inventory Business Rules Verification ===\n');
    for (const r of results) {
        console.log(`${r.pass ? '✓' : '✗'} ${r.rule}${r.detail ? ` — ${r.detail}` : ''}`);
    }
    const failed = results.filter((r) => !r.pass).length;
    console.log(`\n${results.length - failed}/${results.length} rules passed\n`);
    await mongoose_1.default.disconnect();
    if (failed > 0)
        process.exit(1);
}
main().catch((err) => {
    console.error('Verification failed:', err.message);
    mongoose_1.default.disconnect().finally(() => process.exit(1));
});
//# sourceMappingURL=verifyBusinessRules.js.map