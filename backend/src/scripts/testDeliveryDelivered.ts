/**
 * Smoke test: mark delivery as delivered (inventory + outstanding update).
 * Run: npx tsx src/scripts/testDeliveryDelivered.ts [deliveryId]
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { normalizeMongoUri } from '../config/db';
import { Delivery } from '../models/Customer';
import { User } from '../models/User';
import { DeliveryService } from '../services/deliveryService';
import { UserRole } from '../types/enums';

dotenv.config();

async function main() {
  await mongoose.connect(normalizeMongoUri(process.env.MONGODB_URI!));

  const admin = await User.findOne({ role: UserRole.ADMIN, isDeleted: false });
  if (!admin) throw new Error('Admin user required');

  const deliveryId = process.argv[2];
  let delivery = deliveryId
    ? await Delivery.findOne({ _id: deliveryId, isDeleted: false })
    : await Delivery.findOne({ isDeleted: false, status: { $ne: 'delivered' }, inventoryProcessedAt: { $exists: false } });

  if (!delivery) {
    console.log('No pending delivery found to test — all good if DB is empty');
    await mongoose.disconnect();
    return;
  }

  console.log(`Testing delivery ${delivery._id} (${delivery.referenceNo}) → delivered`);

  const result = await DeliveryService.update(
    delivery._id.toString(),
    { status: 'delivered', roundOut: delivery.roundOut || 1 },
    admin._id.toString(),
  );

  console.log('Success:', {
    status: result.status,
    inventoryProcessedAt: (result as { inventoryProcessedAt?: Date }).inventoryProcessedAt,
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  mongoose.disconnect().finally(() => process.exit(1));
});
