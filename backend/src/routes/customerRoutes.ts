import { Router } from 'express';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  toggleCustomerStatus,
  importCustomers,
  uploadCustomerPhoto,
  deleteCustomerPhoto,
} from '../controllers/customerController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createCustomerSchema, updateCustomerSchema } from '../validators/schemas';
import { auditLog } from '../middlewares/auditLog';
import { customerPhotoUpload } from '../middlewares/upload';

const router = Router();

router.use(authenticate);

router.get('/', authorize('customers:read'), getCustomers);
router.get('/:id', authorize('customers:read'), getCustomer);
router.post('/', authorize('customers:*'), validate(createCustomerSchema), auditLog('customers', 'create'), createCustomer);
router.put('/:id', authorize('customers:*'), validate(updateCustomerSchema), auditLog('customers', 'update'), updateCustomer);
router.delete('/:id', authorize('customers:*'), auditLog('customers', 'delete'), deleteCustomer);
router.patch('/:id/toggle-status', authorize('customers:*'), toggleCustomerStatus);
router.post('/import', authorize('customers:*'), importCustomers);
router.post(
  '/:id/photo',
  authorize('customers:*'),
  customerPhotoUpload.single('photo'),
  auditLog('customers', 'upload-photo'),
  uploadCustomerPhoto,
);
router.delete('/:id/photo', authorize('customers:*'), auditLog('customers', 'delete-photo'), deleteCustomerPhoto);

export default router;
