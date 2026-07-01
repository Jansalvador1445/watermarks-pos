import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { UserRole, UserStatus } from '../types/enums';
import { logger } from '../config/logger';

export const DEFAULT_ADMIN_EMAIL = 'admin@h2o.com';
export const DEFAULT_ADMIN_PASSWORD = 'Admin@123';
export const DEFAULT_ADMIN_USERNAME = 'admin';

export const ensureAdminUser = async (): Promise<'created' | 'exists'> => {
  const adminExists = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

  if (adminExists) {
    if (!adminExists.isOnboarded) {
      adminExists.isOnboarded = true;
      adminExists.username = adminExists.username || DEFAULT_ADMIN_USERNAME;
      await adminExists.save();
    }
    logger.info(`Admin user already exists: ${DEFAULT_ADMIN_EMAIL}`);
    return 'exists';
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 12);
  await User.create({
    name: 'Admin User',
    email: DEFAULT_ADMIN_EMAIL,
    username: DEFAULT_ADMIN_USERNAME,
    passwordHash,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    isOnboarded: true,
  });

  logger.info(`Admin user created: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
  return 'created';
};
