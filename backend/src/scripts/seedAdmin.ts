import { connectDB } from '../config/db';
import { logger } from '../config/logger';
import { ensureAdminUser } from '../services/ensureAdminUser';
import mongoose from 'mongoose';

const seedAdmin = async () => {
  await connectDB();
  await ensureAdminUser();
  await mongoose.disconnect();
  process.exit(0);
};

seedAdmin().catch((err) => {
  logger.error('Admin seed failed', { error: err });
  process.exit(1);
});
