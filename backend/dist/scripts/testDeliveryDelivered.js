"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Smoke test: mark delivery as delivered (inventory + outstanding update).
 * Run: npx tsx src/scripts/testDeliveryDelivered.ts [deliveryId]
 */
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("../config/db");
const Customer_1 = require("../models/Customer");
const User_1 = require("../models/User");
const deliveryService_1 = require("../services/deliveryService");
const enums_1 = require("../types/enums");
dotenv_1.default.config();
async function main() {
    await mongoose_1.default.connect((0, db_1.normalizeMongoUri)(process.env.MONGODB_URI));
    const admin = await User_1.User.findOne({ role: enums_1.UserRole.ADMIN, isDeleted: false });
    if (!admin)
        throw new Error('Admin user required');
    const deliveryId = process.argv[2];
    let delivery = deliveryId
        ? await Customer_1.Delivery.findOne({ _id: deliveryId, isDeleted: false })
        : await Customer_1.Delivery.findOne({ isDeleted: false, status: { $ne: 'delivered' }, inventoryProcessedAt: { $exists: false } });
    if (!delivery) {
        console.log('No pending delivery found to test — all good if DB is empty');
        await mongoose_1.default.disconnect();
        return;
    }
    console.log(`Testing delivery ${delivery._id} (${delivery.referenceNo}) → delivered`);
    const result = await deliveryService_1.DeliveryService.update(delivery._id.toString(), { status: 'delivered', roundOut: delivery.roundOut || 1 }, admin._id.toString());
    console.log('Success:', {
        status: result.status,
        inventoryProcessedAt: result.inventoryProcessedAt,
    });
    await mongoose_1.default.disconnect();
}
main().catch((err) => {
    console.error('Failed:', err.message);
    mongoose_1.default.disconnect().finally(() => process.exit(1));
});
//# sourceMappingURL=testDeliveryDelivered.js.map