import { Router } from 'express';
import {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  convertInvoice,
} from '../controllers/invoiceController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createInvoiceSchema, updateInvoiceSchema } from '../validators/schemas';
import { auditLog } from '../middlewares/auditLog';

const router = Router();

router.use(authenticate);

router.get('/', authorize('orders:read', 'orders:*'), getInvoices);
router.get('/:id', authorize('orders:read', 'orders:*'), getInvoice);
router.post('/', authorize('orders:*'), validate(createInvoiceSchema), auditLog('orders', 'create'), createInvoice);
router.put('/:id', authorize('orders:*'), validate(updateInvoiceSchema), auditLog('orders', 'update'), updateInvoice);
router.delete('/:id', authorize('orders:*'), auditLog('orders', 'delete'), deleteInvoice);
router.post('/:id/convert', authorize('orders:*'), auditLog('orders', 'convert'), convertInvoice);

export default router;
