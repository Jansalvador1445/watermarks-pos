import crypto from 'crypto';

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: crypto.webcrypto,
  });
}

import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { apiLimiter } from './middlewares/rateLimiter';
import { initSocket } from './socket';
import { initCronJobs } from './jobs/cronJobs';
import { DeliveryNotificationService } from './services/deliveryNotificationService';
import { ensureAdminUser } from './services/ensureAdminUser';
import { ensurePricingTiers } from './services/ensurePricingTiers';

import authRoutes from './routes/authRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import customerRoutes from './routes/customerRoutes';
import deliveryRoutes from './routes/deliveryRoutes';
import transactionRoutes from './routes/transactionRoutes';
import { gallonRouter, inventoryRouter, movementRouter, reportRouter } from './routes/inventoryRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import pricingTierRoutes from './routes/pricingTierRoutes';
import collectionRoutes from './routes/collectionRoutes';
import productRoutes from './routes/productRoutes';
import {
  userRouter,
  notificationRouter,
  logRouter,
  backupRouter,
  settingsRouter,
  searchRouter,
} from './routes/userRoutes';

const app = express();
const server = http.createServer(app);

['logs', env.UPLOAD_DIR, env.BACKUP_DIR].forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
});

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
if (env.NODE_ENV === 'development') {
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
} else {
  app.use(cors({ origin: false, credentials: true }));
}
app.use(compression());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD_DIR)));
app.use('/api', apiLimiter);

app.get('/api/health', (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    message: 'WATERMARKS Water Refilling Station API is running',
    database: dbConnected ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/water-orders', invoiceRoutes);
app.use('/api/pricing-tiers', pricingTierRoutes);
app.use('/api/collection', collectionRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/gallons', gallonRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/inventory-movements', movementRouter);
app.use('/api/products', productRoutes);
app.use('/api/reports', reportRouter);
app.use('/api/users', userRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/logs', logRouter);
app.use('/api/backups', backupRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/search', searchRouter);

const staticPath = path.join(process.cwd(), 'web', 'dist');
if (fs.existsSync(staticPath)) {
  app.use(express.static(staticPath));

  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

initSocket(server);

const isSeedAdminOnly = process.argv.includes('--seed-admin-only');

const start = async () => {
  await connectDB();
  await ensureAdminUser();
  await ensurePricingTiers();

  if (isSeedAdminOnly) {
    await mongoose.disconnect();
    process.exit(0);
  }

  initCronJobs();
  DeliveryNotificationService.checkAndNotifyDeliveries().catch((err) =>
    logger.warn('Initial delivery notification check skipped', { err }),
  );

  server.listen(env.PORT, () => {
    logger.info(
      `WATERMARKS Water Refilling Station server running on port ${env.PORT} in ${env.NODE_ENV} mode`,
    );
  });
};

start();

export default app;
