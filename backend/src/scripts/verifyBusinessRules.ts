/**
 * Verifies inventory business rules end-to-end.
 * Run: npx tsx src/scripts/verifyBusinessRules.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { normalizeMongoUri } from '../config/db';
import { Inventory } from '../models/Gallon';
import { InventoryMovement } from '../models/InventoryMovement';
import { Customer, Delivery } from '../models/Customer';
import { PricingTier, PricingTierCode } from '../models/PricingTier';
import { Product } from '../models/Product';
import { Log } from '../models/Notification';
import { InventoryMovementService } from '../services/inventoryMovementService';
import { TransactionService } from '../services/transactionService';
import { DeliveryService } from '../services/deliveryService';
import { InventoryService } from '../services/inventoryService';
import {
  DeliveryStatus,
  GallonType,
  InventoryMovementType,
  PaymentMethod,
  ProductCategory,
  ProductStatus,
  TransactionType,
  UserRole,
} from '../types/enums';
import { User } from '../models/User';
import { AppError } from '../utils/response';

dotenv.config();

const results: Array<{ rule: string; pass: boolean; detail?: string }> = [];
const pass = (rule: string, detail?: string) => results.push({ rule, pass: true, detail });
const fail = (rule: string, detail?: string) => results.push({ rule, pass: false, detail });

async function main() {
  await mongoose.connect(normalizeMongoUri(process.env.MONGODB_URI!));

  const admin = await User.findOne({ role: UserRole.ADMIN, isDeleted: false });
  if (!admin) throw new Error('Admin user required — run npm run seed');
  const userId = admin._id.toString();

  const slimInv = await Inventory.findOne({ refillType: GallonType.SLIM, isDeleted: false });
  const roundInv = await Inventory.findOne({ refillType: GallonType.ROUND, isDeleted: false });
  if (!slimInv || !roundInv) throw new Error('Inventory items required — run npm run seed');

  let product = await Product.findOne({
    decrementsStock: true,
    gallonType: GallonType.SLIM,
    isDeleted: false,
    status: ProductStatus.ACTIVE,
  });
  if (!product) {
    product = await Product.create({
      name: 'Verify Slim Refill',
      price: 35,
      gallonType: GallonType.SLIM,
      linkedInventoryId: slimInv._id,
      category: ProductCategory.REFILL,
      decrementsStock: true,
      status: ProductStatus.ACTIVE,
    });
  } else if (!product.linkedInventoryId) {
    product.linkedInventoryId = slimInv._id;
    await product.save();
  }

  const tierA = await PricingTier.findOne({ code: PricingTierCode.TIER_A });
  if (!tierA) throw new Error('Pricing tiers required — run npm run seed');

  const customer = await Customer.create({
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
  await InventoryMovementService.addProduction(invId, 10, 'Verify production batch', userId);
  const afterProd = await Inventory.findById(invId);
  const prodMovement = await InventoryMovement.findOne({
    itemId: slimInv._id,
    movementType: InventoryMovementType.PRODUCTION,
    isDeleted: false,
  }).sort({ createdAt: -1 });
  const prodLog = await Log.findOne({ module: 'inventory', 'metadata.movementType': InventoryMovementType.PRODUCTION }).sort({ createdAt: -1 });
  if (afterProd!.currentStock === stockStart + 10 && prodMovement && prodLog) {
    pass('Water Production → increases filled water stock', `stock ${stockStart} → ${afterProd!.currentStock}`);
  } else {
    fail('Water Production → increases filled water stock');
  }

  // Rule: Direct stock edit blocked
  try {
    await InventoryService.update(invId, { currentStock: 9999 }, userId);
    fail('Direct stock edit must be blocked');
  } catch (err) {
    if (err instanceof AppError && err.message.includes('Direct stock editing')) {
      pass('Direct stock editing is blocked');
    } else {
      fail('Direct stock edit must be blocked', err instanceof Error ? err.message : String(err));
    }
  }

  const beforePos = (await Inventory.findById(invId))!.currentStock;

  // Rule: POS sale decreases stock after payment
  await TransactionService.create(
    {
      type: TransactionType.POS,
      customerName: 'POS Verify',
      items: [{ productId: product._id.toString(), quantity: 2 }],
      paymentMethod: PaymentMethod.CASH,
    },
    userId,
  );
  const afterPos = (await Inventory.findById(invId))!.currentStock;
  const posMovement = await InventoryMovement.findOne({
    movementType: InventoryMovementType.POS_SALE,
    isDeleted: false,
  }).sort({ createdAt: -1 });
  if (afterPos === beforePos - 2 && posMovement) {
    pass('POS Sale → decreases stock after successful payment', `stock ${beforePos} → ${afterPos}`);
  } else {
    fail('POS Sale → decreases stock after successful payment');
  }

  const beforeWalkin = afterPos;

  // Rule: Walk-in sale decreases stock
  await TransactionService.create(
    {
      type: TransactionType.WALKIN,
      customerName: 'Walk-in Verify',
      items: [{ productId: product._id.toString(), quantity: 1 }],
      paymentMethod: PaymentMethod.CASH,
    },
    userId,
  );
  const afterWalkin = (await Inventory.findById(invId))!.currentStock;
  const walkinMovement = await InventoryMovement.findOne({
    movementType: InventoryMovementType.WALKIN_SALE,
    isDeleted: false,
  }).sort({ createdAt: -1 });
  if (afterWalkin === beforeWalkin - 1 && walkinMovement) {
    pass('Walk-in Sale → decreases filled water stock', `stock ${beforeWalkin} → ${afterWalkin}`);
  } else {
    fail('Walk-in Sale → decreases filled water stock');
  }

  // Rule: Pending delivery does NOT decrease stock
  const beforePending = (await Inventory.findById(roundInv._id))!.currentStock;
  const pendingDelivery = await DeliveryService.create(
    {
      customerId: customer._id.toString(),
      date: new Date().toISOString(),
      schedule: 'Daily',
      status: DeliveryStatus.PENDING,
      slimOut: 0,
      roundOut: 5,
      slimReturn: 0,
      roundReturn: 0,
    },
    userId,
  );
  const afterPendingCreate = (await Inventory.findById(roundInv._id))!.currentStock;
  if (afterPendingCreate === beforePending) {
    pass('Delivery created as Pending → no stock decrease');
  } else {
    fail('Delivery created as Pending → no stock decrease');
  }

  // Rule: Delivered decreases stock + outstanding formula
  const outstandingBefore = customer.outstandingRound;
  const stockBeforeDelivered = afterPendingCreate;
  await DeliveryService.update(
    pendingDelivery._id.toString(),
    { status: DeliveryStatus.DELIVERED },
    userId,
  );
  const stockAfterDelivered = (await Inventory.findById(roundInv._id))!.currentStock;
  const updatedCustomer = await Customer.findById(customer._id);
  const deliveryMovement = await InventoryMovement.findOne({
    referenceNo: pendingDelivery.referenceNo,
    movementType: InventoryMovementType.DELIVERY,
    isDeleted: false,
  });
  const outstandingLog = await Log.findOne({
    module: 'customers',
    'metadata.referenceNo': pendingDelivery.referenceNo,
    'metadata.type': 'outstanding_update',
  });
  const expectedOutstanding = outstandingBefore + 5 - 0;
  if (
    stockAfterDelivered === stockBeforeDelivered - 5 &&
    updatedCustomer!.outstandingRound === expectedOutstanding &&
    deliveryMovement &&
    outstandingLog
  ) {
    pass(
      'Delivery Completed → decreases stock + updates outstanding',
      `Outstanding: ${outstandingBefore} + 5 - 0 = ${updatedCustomer!.outstandingRound}`,
    );
  } else {
    fail('Delivery Completed → decreases stock + updates outstanding', JSON.stringify({
      stockAfterDelivered,
      stockBeforeDelivered,
      outstanding: updatedCustomer!.outstandingRound,
      expectedOutstanding,
    }));
  }

  // Rule: Customer return on delivery does NOT increase stock, updates outstanding
  const returnDelivery = await DeliveryService.create(
    {
      customerId: customer._id.toString(),
      date: new Date().toISOString(),
      schedule: 'Daily',
      status: DeliveryStatus.PENDING,
      slimOut: 0,
      roundOut: 2,
      slimReturn: 0,
      roundReturn: 0,
    },
    userId,
  );
  await DeliveryService.update(returnDelivery._id.toString(), { status: DeliveryStatus.DELIVERED }, userId);
  const stockMid = (await Inventory.findById(roundInv._id))!.currentStock;

  const returnDelivery2 = await Delivery.create({
    customerId: customer._id,
    date: new Date(),
    schedule: 'Daily',
    status: DeliveryStatus.PENDING,
    slimOut: 0,
    roundOut: 0,
    slimReturn: 0,
    roundReturn: 1,
    referenceNo: `DLV-TEST-${Date.now()}`,
  });
  await DeliveryService.update(returnDelivery2._id.toString(), { status: DeliveryStatus.DELIVERED }, userId);
  const stockAfterReturn = (await Inventory.findById(roundInv._id))!.currentStock;
  const returnMovement = await InventoryMovement.findOne({
    referenceNo: returnDelivery2.referenceNo,
    movementType: InventoryMovementType.RETURN,
    isDeleted: false,
  });
  const customerAfterReturn = await Customer.findById(customer._id);
  if (stockAfterReturn === stockMid && returnMovement && returnMovement.beforeStock === returnMovement.afterStock) {
    pass('Customer Return → no stock increase, logged as Return movement');
  } else {
    fail('Customer Return → no stock increase');
  }

  // Rule: Manual adjustment with reason
  const beforeAdjust = (await Inventory.findById(invId))!.currentStock;
  await InventoryMovementService.manualAdjust(invId, -2, 'Verify adjustment — damaged bottles', userId);
  const afterAdjust = (await Inventory.findById(invId))!.currentStock;
  const adjustMovement = await InventoryMovement.findOne({
    movementType: InventoryMovementType.ADJUSTMENT,
    isDeleted: false,
  }).sort({ createdAt: -1 });
  if (afterAdjust === beforeAdjust - 2 && adjustMovement?.remarks?.includes('damaged')) {
    pass('Manual Adjustment (admin) → changes stock with reason + movement log');
  } else {
    fail('Manual Adjustment (admin) → changes stock with reason');
  }

  // Rule: Negative stock prevented
  try {
    await InventoryMovementService.manualAdjust(invId, -999999, 'Should fail', userId);
    fail('Negative stock must be prevented');
  } catch (err) {
    if (err instanceof AppError && err.message.toLowerCase().includes('insufficient')) {
      pass('Negative stock is prevented');
    } else {
      fail('Negative stock must be prevented', err instanceof Error ? err.message : String(err));
    }
  }

  // Rule: Idempotent delivery outstanding (re-save does not double-count)
  const outstandingBeforeIdempotent = customerAfterReturn!.outstandingRound;
  await DeliveryService.update(returnDelivery2._id.toString(), { remarks: 'Re-save test' }, userId);
  const customerAfterIdempotent = await Customer.findById(customer._id);
  if (customerAfterIdempotent!.outstandingRound === outstandingBeforeIdempotent) {
    pass('Outstanding update is idempotent on delivery re-save');
  } else {
    fail('Outstanding update is idempotent on delivery re-save');
  }

  // Movement log fields
  const sampleMovement = await InventoryMovement.findOne({ isDeleted: false })
    .populate('itemId', 'name')
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
  if (
    sampleMovement?.date &&
    sampleMovement.itemId &&
    sampleMovement.movementType &&
    sampleMovement.quantity != null &&
    sampleMovement.beforeStock != null &&
    sampleMovement.afterStock != null &&
    sampleMovement.referenceNo &&
    sampleMovement.userId
  ) {
    pass('Inventory Movement log has all required fields');
  } else {
    fail('Inventory Movement log has all required fields');
  }

  // Cleanup test customer
  await Customer.findByIdAndUpdate(customer._id, { isDeleted: true, deletedAt: new Date() });

  console.log('\n=== Inventory Business Rules Verification ===\n');
  for (const r of results) {
    console.log(`${r.pass ? '✓' : '✗'} ${r.rule}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} rules passed\n`);
  await mongoose.disconnect();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Verification failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
