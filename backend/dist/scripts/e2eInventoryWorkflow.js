"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * End-to-end inventory workflow smoke test.
 * Run: npx tsx src/scripts/e2eInventoryWorkflow.ts
 */
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const Gallon_1 = require("../models/Gallon");
const InventoryMovement_1 = require("../models/InventoryMovement");
const Product_1 = require("../models/Product");
const Transaction_1 = require("../models/Transaction");
const User_1 = require("../models/User");
const inventoryMovementService_1 = require("../services/inventoryMovementService");
const transactionService_1 = require("../services/transactionService");
const inventoryService_1 = require("../services/inventoryService");
const enums_1 = require("../types/enums");
dotenv_1.default.config();
const assert = (condition, message) => {
    if (!condition)
        throw new Error(message);
};
async function main() {
    await mongoose_1.default.connect((0, db_1.normalizeMongoUri)(process.env.MONGODB_URI));
    console.log('Connected to MongoDB');
    const admin = await User_1.User.findOne({ role: enums_1.UserRole.ADMIN, isDeleted: false });
    assert(!!admin, 'Admin user required — run npm run seed first');
    const userId = admin._id.toString();
    const slimInventory = await Gallon_1.Inventory.findOne({ refillType: enums_1.GallonType.SLIM, isDeleted: false });
    assert(!!slimInventory, 'Slim inventory item required');
    const invId = slimInventory._id.toString();
    const stockBefore = slimInventory.currentStock;
    await inventoryMovementService_1.InventoryMovementService.addProduction(invId, 5, 'E2E test production', userId);
    const afterProduction = await Gallon_1.Inventory.findById(invId);
    assert(afterProduction.currentStock === stockBefore + 5, 'Production should increase stock by 5');
    let product = await Product_1.Product.findOne({
        decrementsStock: true,
        gallonType: enums_1.GallonType.SLIM,
        isDeleted: false,
        status: enums_1.ProductStatus.ACTIVE,
    });
    if (!product) {
        product = await Product_1.Product.create({
            name: 'E2E Slim Refill',
            price: 25,
            gallonType: enums_1.GallonType.SLIM,
            category: enums_1.ProductCategory.REFILL,
            decrementsStock: true,
            status: enums_1.ProductStatus.ACTIVE,
        });
    }
    const stockBeforeSale = afterProduction.currentStock;
    await transactionService_1.TransactionService.create({
        type: enums_1.TransactionType.POS,
        customerName: 'E2E Customer',
        items: [{ productId: product._id.toString(), quantity: 2 }],
        paymentMethod: enums_1.PaymentMethod.CASH,
        discount: 5,
    }, userId);
    const afterSale = await Gallon_1.Inventory.findById(invId);
    assert(afterSale.currentStock === stockBeforeSale - 2, 'POS sale should decrease stock by 2');
    const lastTx = await Transaction_1.Transaction.findOne({ customerName: 'E2E Customer', isDeleted: false }).sort({ createdAt: -1 });
    assert(lastTx.discount === 5, 'Discount should be persisted on transaction');
    await inventoryService_1.GallonService.recordTransaction({ type: enums_1.GallonType.SLIM, action: 'out', quantity: 3 }, userId);
    let gallonOverview = await inventoryService_1.GallonService.getOverview();
    assert(gallonOverview.slim.currentOut >= 3, 'Gallon out should increase currentOut');
    try {
        await inventoryService_1.GallonService.recordTransaction({ type: enums_1.GallonType.SLIM, action: 'return', quantity: 999 }, userId);
        throw new Error('Return over currentOut should fail');
    }
    catch (err) {
        assert(err instanceof Error && err.message.includes('Cannot return'), 'Return validation should block over-return');
    }
    await inventoryService_1.GallonService.recordTransaction({ type: enums_1.GallonType.SLIM, action: 'return', quantity: 1 }, userId);
    gallonOverview = await inventoryService_1.GallonService.getOverview();
    const history = await inventoryService_1.GallonService.getHistory(enums_1.GallonType.SLIM);
    assert(history.length > 0 && typeof history[0].direction === 'string', 'Gallon history should return flattened events');
    const movementCount = await InventoryMovement_1.InventoryMovement.countDocuments({ isDeleted: false, itemId: slimInventory._id });
    assert(movementCount >= 2, 'Inventory movements should be recorded');
    try {
        await inventoryMovementService_1.InventoryMovementService.manualAdjust(invId, -99999, 'Should fail', userId);
        throw new Error('Negative stock adjust should fail');
    }
    catch (err) {
        assert(err instanceof Error && err.message.toLowerCase().includes('insufficient'), 'Should prevent negative stock');
    }
    console.log('E2E workflow passed');
    console.log({
        stockAfterProduction: afterProduction.currentStock,
        stockAfterSale: afterSale.currentStock,
        gallonOut: gallonOverview.slim.currentOut,
        historyEvents: history.length,
        movements: movementCount,
        discount: lastTx.discount,
    });
    await mongoose_1.default.disconnect();
}
main().catch((err) => {
    console.error('E2E failed:', err.message);
    mongoose_1.default.disconnect().finally(() => process.exit(1));
});
//# sourceMappingURL=e2eInventoryWorkflow.js.map