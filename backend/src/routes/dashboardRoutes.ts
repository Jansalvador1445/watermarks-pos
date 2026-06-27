import { Router } from 'express';
import {
  getStats,
  getSales,
  getDeliveries,
  getInventory,
  getActivity,
  getTopCustomers,
  getRecentDeliveries,
  getRecentTransactions,
  getSystemSummary,
} from '../controllers/dashboardController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.use(authenticate);
router.use(authorize('dashboard:read'));

router.get('/stats', getStats);
router.get('/sales', getSales);
router.get('/deliveries', getDeliveries);
router.get('/inventory', getInventory);
router.get('/activity', getActivity);
router.get('/top-customers', getTopCustomers);
router.get('/recent-deliveries', getRecentDeliveries);
router.get('/recent-transactions', getRecentTransactions);
router.get('/system-summary', getSystemSummary);

export default router;
