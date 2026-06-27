import { Router } from 'express';
import {
  getGallonOverview,
  recordGallonTransaction,
  recordGallonOut,
  recordGallonReturn,
  getGallonHistory,
  getInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getSalesReport,
  getDeliveryReport,
  getCustomerReport,
  getInventoryReport,
  addProduction,
  manualAdjust,
  getInventoryMovements,
} from '../controllers/inventoryController';
import { authenticate } from '../middlewares/auth';
import { authorize, authorizeRoles } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import {
  createGallonSchema,
  recordGallonOutSchema,
  recordGallonReturnSchema,
  createInventorySchema,
  updateInventorySchema,
  productionSchema,
  adjustmentSchema,
} from '../validators/schemas';
import { auditLog } from '../middlewares/auditLog';
import { UserRole } from '../types/enums';

const gallonRouter = Router();
gallonRouter.use(authenticate);
gallonRouter.get('/', authorize('gallons:read', 'gallons:*'), getGallonOverview);
gallonRouter.get('/history', authorize('gallons:read', 'gallons:*'), getGallonHistory);
gallonRouter.post('/out', authorize('gallons:*'), validate(recordGallonOutSchema), auditLog('gallons', 'record-out'), recordGallonOut);
gallonRouter.post('/return', authorize('gallons:*'), validate(recordGallonReturnSchema), auditLog('gallons', 'record-return'), recordGallonReturn);
gallonRouter.post('/', authorize('gallons:*'), validate(createGallonSchema), auditLog('gallons', 'record'), recordGallonTransaction);

const inventoryRouter = Router();
inventoryRouter.use(authenticate);
inventoryRouter.get('/', authorize('inventory:read', 'inventory:*'), getInventory);
inventoryRouter.post('/', authorizeRoles(UserRole.ADMIN), validate(createInventorySchema), auditLog('inventory', 'create'), createInventoryItem);
inventoryRouter.post(
  '/:id/production',
  authorizeRoles(UserRole.ADMIN),
  validate(productionSchema),
  auditLog('inventory', 'production'),
  addProduction,
);
inventoryRouter.post(
  '/:id/adjust',
  authorizeRoles(UserRole.ADMIN),
  validate(adjustmentSchema),
  auditLog('inventory', 'adjust'),
  manualAdjust,
);
inventoryRouter.get('/:id', authorize('inventory:read', 'inventory:*'), getInventoryItem);
inventoryRouter.put('/:id', authorizeRoles(UserRole.ADMIN), validate(updateInventorySchema), auditLog('inventory', 'update'), updateInventoryItem);
inventoryRouter.delete('/:id', authorizeRoles(UserRole.ADMIN), auditLog('inventory', 'delete'), deleteInventoryItem);

const movementRouter = Router();
movementRouter.use(authenticate);
movementRouter.get('/', authorize('inventory:read', 'inventory:*'), getInventoryMovements);

const reportRouter = Router();
reportRouter.use(authenticate);
reportRouter.get('/sales', authorize('dashboard:read'), getSalesReport);
reportRouter.get('/deliveries', authorize('dashboard:read'), getDeliveryReport);
reportRouter.get('/customers', authorize('dashboard:read'), getCustomerReport);
reportRouter.get('/inventory', authorize('dashboard:read'), getInventoryReport);

export { gallonRouter, inventoryRouter, movementRouter, reportRouter };
