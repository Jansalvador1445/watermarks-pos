/**
 * One-time migration: v1 → v2 schema
 * Run: npx tsx src/scripts/migrateV2.ts
 */
import '../config/env';
import { connectDB } from '../config/db';
import mongoose from 'mongoose';
import { PricingTier, PricingTierCode } from '../models/PricingTier';
import { Customer } from '../models/Customer';
import { Inventory } from '../models/Gallon';
import { Product } from '../models/Product';
import { GallonType } from '../types/enums';
import { logger } from '../config/logger';

async function ensurePricingTiers() {
  const defaults = [
    { code: PricingTierCode.TIER_A, label: 'Retail', slimPrice: 35, roundPrice: 40 },
    { code: PricingTierCode.TIER_B, label: 'Wholesale', slimPrice: 32, roundPrice: 38 },
    { code: PricingTierCode.TIER_C, label: 'Special', slimPrice: 30, roundPrice: 35 },
  ];

  for (const tier of defaults) {
    await PricingTier.findOneAndUpdate(
      { code: tier.code },
      { $set: { label: tier.label }, $setOnInsert: { slimPrice: tier.slimPrice, roundPrice: tier.roundPrice, code: tier.code } },
      { upsert: true, new: true },
    );
  }

  return PricingTier.findOne({ code: PricingTierCode.TIER_A });
}

async function migrateCustomerLocations() {
  const db = mongoose.connection.db;
  if (!db) return 0;

  const collection = db.collection('customers');
  const cursor = collection.find({
    $or: [
      { latitude: { $exists: false } },
      { longitude: { $exists: false } },
      { latitude: null },
      { longitude: null },
    ],
    addressLink: { $exists: true, $nin: [null, ''] },
  });

  let count = 0;
  for await (const doc of cursor) {
    const { parseCoordsFromLegacyLink } = await import('../utils/customerLocation');
    const coords = parseCoordsFromLegacyLink(String(doc.addressLink));
    if (coords.latitude != null && coords.longitude != null) {
      await collection.updateOne(
        { _id: doc._id },
        { $set: { latitude: coords.latitude, longitude: coords.longitude } },
      );
      count++;
    }
  }

  return count;
}

async function migrateCustomers(tierAId: mongoose.Types.ObjectId) {
  const db = mongoose.connection.db;
  if (!db) return 0;

  const collection = db.collection('customers');
  const cursor = collection.find({});

  let count = 0;
  for await (const doc of cursor) {
    const update: Record<string, unknown> = {};

    if (!doc.pricingCategory) {
      update.pricingCategory = tierAId;
    }
    if (doc.contacts === undefined) {
      update.contacts = [];
    }

    const unset: Record<string, string> = {};
    if (doc.schedule !== undefined) unset.schedule = '';
    if (doc.slimPrice !== undefined) unset.slimPrice = '';
    if (doc.roundPrice !== undefined) unset.roundPrice = '';

    if (Object.keys(update).length || Object.keys(unset).length) {
      await collection.updateOne(
        { _id: doc._id },
        {
          ...(Object.keys(update).length ? { $set: update } : {}),
          ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
      );
      count++;
    }
  }

  return count;
}

async function migrateInventory() {
  const db = mongoose.connection.db;
  if (!db) return 0;

  const collection = db.collection('inventories');
  const cursor = collection.find({ isDeleted: { $ne: true } });
  let count = 0;

  for await (const doc of cursor) {
    const update: Record<string, unknown> = {};
    const unset: Record<string, string> = {};

    if (!doc.unit) update.unit = 'pcs';
    if (!doc.category) {
      if (doc.type === 'slim') update.category = 'refill-slim';
      else if (doc.type === 'round') update.category = 'refill-round';
      else update.category = 'general';
    }
    if (doc.price === undefined) update.price = 0;
    if (doc.type === 'slim' || doc.type === 'round') {
      update.refillType = doc.type;
    }
    if (doc.status !== undefined) unset.status = '';
    if (doc.type !== undefined) unset.type = '';

    if (Object.keys(update).length || Object.keys(unset).length) {
      await collection.updateOne(
        { _id: doc._id },
        {
          ...(Object.keys(update).length ? { $set: update } : {}),
          ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
      );
      count++;
    }
  }

  return count;
}

async function linkProductsToInventory() {
  const products = await Product.find({ isDeleted: false, decrementsStock: true }).lean();
  let count = 0;

  for (const product of products) {
    if (product.linkedInventoryId) continue;
    if (!product.gallonType) continue;

    const inv = await Inventory.findOne({
      isDeleted: false,
      refillType: product.gallonType,
    }).sort({ createdAt: 1 });

    if (inv) {
      await Product.updateOne({ _id: product._id }, { linkedInventoryId: inv._id });
      count++;
    }
  }

  return count;
}

async function migrateWaterOrdersToInvoices() {
  const db = mongoose.connection.db;
  if (!db) return { archived: 0 };

  const waterOrders = db.collection('waterorders');
  const invoices = db.collection('invoices');

  const existing = await invoices.countDocuments({});
  if (existing > 0) {
    return { archived: 0, skipped: true };
  }

  const legacyOrders = await waterOrders.find({ isDeleted: { $ne: true } }).toArray();
  let archived = 0;

  for (const order of legacyOrders) {
    await invoices.insertOne({
      ...order,
      legacyWaterOrder: true,
      invoiceNo: order.invoiceNo || `LEG-${order._id.toString().slice(-8).toUpperCase()}`,
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
    });
    await waterOrders.updateOne(
      { _id: order._id },
      { $set: { isDeleted: true, deletedAt: new Date(), legacyMigrated: true } },
    );
    archived++;
  }

  return { archived };
}

async function migrateGallons() {
  const db = mongoose.connection.db;
  if (!db) return 0;

  const collection = db.collection('gallons');
  const gallons = await collection.find({}).toArray();
  let count = 0;

  for (const g of gallons) {
    const unset: Record<string, string> = {};
    if (g.carryOver !== undefined) unset.carryOver = '';

    const itemKey = (g.itemKey || g.type || 'item').toString().toLowerCase();
    const label =
      g.label ||
      (g.type === 'slim' ? 'Slim Container' : g.type === 'round' ? 'Round Container' : itemKey);

    const history = (g.history || []).map((h: { action?: string; direction?: string }) => ({
      ...h,
      direction: h.direction || (h.action === 'return' ? 'return' : 'out'),
    }));

    await collection.updateOne(
      { _id: g._id },
      {
        $set: { itemKey, label, history },
        ...(Object.keys(unset).length ? { $unset: unset } : {}),
      },
    );
    count++;
  }

  try {
    await collection.dropIndex('type_1');
  } catch {
    // legacy index may not exist
  }

  return count;
}

async function main() {
  await connectDB();
  logger.info('Starting v2 migration...');

  const tierA = await ensurePricingTiers();
  if (!tierA) throw new Error('Failed to seed pricing tiers');

  const customersUpdated = await migrateCustomers(tierA._id);
  const locationsUpdated = await migrateCustomerLocations();
  const inventoryUpdated = await migrateInventory();
  const productsLinked = await linkProductsToInventory();
  const gallonUpdated = await migrateGallons();
  const { archived: ordersArchived } = await migrateWaterOrdersToInvoices();

  logger.info('Migration complete', {
    customersUpdated,
    locationsUpdated,
    inventoryUpdated,
    productsLinked,
    gallonUpdated,
    ordersArchived,
  });

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Migration failed', err);
  process.exit(1);
});
