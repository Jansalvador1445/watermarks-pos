import { Router } from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createTransactionSchema, updateTransactionSchema } from '../validators/schemas';
import { auditLog } from '../middlewares/auditLog';

const router = Router();

router.use(authenticate);

router.get('/', authorize('transactions:read', 'transactions:*', 'pos:*'), getTransactions);
router.get('/:id', authorize('transactions:read', 'transactions:*', 'pos:*'), getTransaction);
router.post('/', authorize('transactions:*', 'pos:*'), validate(createTransactionSchema), auditLog('transactions', 'create'), createTransaction);
router.put('/:id', authorize('transactions:*', 'pos:*'), validate(updateTransactionSchema), auditLog('transactions', 'update'), updateTransaction);
router.delete('/:id', authorize('transactions:*'), auditLog('transactions', 'delete'), deleteTransaction);

export default router;
