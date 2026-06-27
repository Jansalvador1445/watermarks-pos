import { Router } from 'express';
import {
  getProducts,
  getActiveProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticate } from '../middlewares/auth';
import { authorize, authorizeRoles } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createProductSchema, updateProductSchema } from '../validators/schemas';
import { auditLog } from '../middlewares/auditLog';
import { validateParamObjectId } from '../middlewares/validateObjectId';
import { UserRole } from '../types/enums';

const router = Router();

router.use(authenticate);

router.get('/active', authorize('pos:*', 'transactions:*'), getActiveProducts);
router.get('/', authorizeRoles(UserRole.ADMIN), getProducts);
router.get('/:id', authorizeRoles(UserRole.ADMIN), validateParamObjectId, getProduct);
router.post('/', authorizeRoles(UserRole.ADMIN), validate(createProductSchema), auditLog('products', 'create'), createProduct);
router.put('/:id', authorizeRoles(UserRole.ADMIN), validateParamObjectId, validate(updateProductSchema), auditLog('products', 'update'), updateProduct);
router.delete('/:id', authorizeRoles(UserRole.ADMIN), validateParamObjectId, auditLog('products', 'delete'), deleteProduct);

export default router;
