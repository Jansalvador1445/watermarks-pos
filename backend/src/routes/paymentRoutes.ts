import { Router } from 'express';
import { createPayment, deletePayment, listPaymentsByInvoice } from '../controllers/paymentController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createPaymentSchema } from '../validators/schemas';
import { auditLog } from '../middlewares/auditLog';

const router = Router();

router.use(authenticate);

router.get('/invoice/:invoiceId', authorize('orders:read', 'orders:*'), listPaymentsByInvoice);
router.post('/', authorize('orders:*'), validate(createPaymentSchema), auditLog('payments', 'create'), createPayment);
router.delete('/:id', authorize('orders:*'), auditLog('payments', 'delete'), deletePayment);

export default router;
