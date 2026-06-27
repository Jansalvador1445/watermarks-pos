/**
 * End-to-end inventory workflow smoke test.
 * Run: npx tsx src/scripts/e2eInventoryWorkflow.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { normalizeMongoUri } from '../config/db';
import { Inventory } from '../models/Gallon';
import { InventoryMovement } from '../models/InventoryMovement';
import { Product } from '../models/Product';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { InventoryMovementService } from '../services/inventoryMovementService';
import { TransactionService } from '../services/transactionService';
import { GallonService } from '../services/inventoryService';
import {
  GallonType,
  PaymentMethod,
  ProductCategory,
  ProductStatus,
  TransactionType,
  UserRole,
} from '../types/enums';

dotenv.config();

const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};

async function main() {
  await mongoose.connect(normalizeMongoUri(process.env.MONGODB_URI!));
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ role: UserRole.ADMIN, isDeleted: false });
  assert(!!admin, 'Admin user required — run npm run seed first');
  const userId = admin!._id.toString();

  const slimInventory = await Inventory.findOne({ refillType: GallonType.SLIM, isDeleted: false });
  assert(!!slimInventory, 'Slim inventory item required');
  const invId = slimInventory!._id.toString();
  const stockBefore = slimInventory!.currentStock;

  await InventoryMovementService.addProduction(invId, 5, 'E2E test production', userId);
  const afterProduction = await Inventory.findById(invId);
  assert(afterProduction!.currentStock === stockBefore + 5, 'Production should increase stock by 5');

  let product = await Product.findOne({
    decrementsStock: true,
    gallonType: GallonType.SLIM,
    isDeleted: false,
    status: ProductStatus.ACTIVE,
  });
  if (!product) {
    product = await Product.create({
      name: 'E2E Slim Refill',
      price: 25,
      gallonType: GallonType.SLIM,
      category: ProductCategory.REFILL,
      decrementsStock: true,
      status: ProductStatus.ACTIVE,
    });
  }

  const stockBeforeSale = afterProduction!.currentStock;
  await TransactionService.create(
    {
      type: TransactionType.POS,
      customerName: 'E2E Customer',
      items: [{ productId: product._id.toString(), quantity: 2 }],
      paymentMethod: PaymentMethod.CASH,
      discount: 5,
    },
    userId,
  );

  const afterSale = await Inventory.findById(invId);
  assert(afterSale!.currentStock === stockBeforeSale - 2, 'POS sale should decrease stock by 2');

  const lastTx = await Transaction.findOne({ customerName: 'E2E Customer', isDeleted: false }).sort({ createdAt: -1 });
  assert(lastTx!.discount === 5, 'Discount should be persisted on transaction');

  await GallonService.recordTransaction({ type: GallonType.SLIM, action: 'out', quantity: 3 }, userId);
  let gallonOverview = await GallonService.getOverview();
  assert(gallonOverview.slim.currentOut >= 3, 'Gallon out should increase currentOut');

  try {
    await GallonService.recordTransaction({ type: GallonType.SLIM, action: 'return', quantity: 999 }, userId);
    throw new Error('Return over currentOut should fail');
  } catch (err) {
    assert(err instanceof Error && err.message.includes('Cannot return'), 'Return validation should block over-return');
  }

  await GallonService.recordTransaction({ type: GallonType.SLIM, action: 'return', quantity: 1 }, userId);
  gallonOverview = await GallonService.getOverview();

  const history = await GallonService.getHistory(GallonType.SLIM);
  assert(history.length > 0 && typeof history[0].direction === 'string', 'Gallon history should return flattened events');

  const movementCount = await InventoryMovement.countDocuments({ isDeleted: false, itemId: slimInventory!._id });
  assert(movementCount >= 2, 'Inventory movements should be recorded');

  try {
    await InventoryMovementService.manualAdjust(invId, -99999, 'Should fail', userId);
    throw new Error('Negative stock adjust should fail');
  } catch (err) {
    assert(err instanceof Error && err.message.toLowerCase().includes('insufficient'), 'Should prevent negative stock');
  }

  console.log('E2E workflow passed');
  console.log({
    stockAfterProduction: afterProduction!.currentStock,
    stockAfterSale: afterSale!.currentStock,
    gallonOut: gallonOverview.slim.currentOut,
    historyEvents: history.length,
    movements: movementCount,
    discount: lastTx!.discount,
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('E2E failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
