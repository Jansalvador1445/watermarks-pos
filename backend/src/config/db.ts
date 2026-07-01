import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

/**
 * Standalone MongoDB (local dev) requires retryWrites=false for session/transaction ops.
 * Atlas and replica sets keep the driver default (retryWrites=true).
 */
export const normalizeMongoUri = (uri: string): string => {
  if (/retryWrites=/i.test(uri)) return uri;

  const isLocalStandalone = /mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(uri);
  if (!isLocalStandalone) return uri;

  const separator = uri.includes('?') ? '&' : '?';
  return `${uri}${separator}retryWrites=false`;
};

export const connectDB = async (): Promise<void> => {
  const uri = normalizeMongoUri(env.MONGODB_URI);
  try {
    await mongoose.connect(uri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed', { error });

    if (env.NODE_ENV === 'production') {
      logger.info('Waiting 3 seconds for MongoDB to start...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await mongoose.connect(uri);
      logger.info('MongoDB connected successfully');
      return;
    }

    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
