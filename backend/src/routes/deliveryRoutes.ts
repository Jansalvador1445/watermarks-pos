import { Router } from 'express';
import {
  getDeliveries,
  getDelivery,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getCalendarEvents,
  getDeliveredHistory,
  resolveDeliveryDecision,
} from '../controllers/deliveryController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { createDeliverySchema, updateDeliverySchema, deliveryDecisionSchema } from '../validators/schemas';
import { auditLog } from '../middlewares/auditLog';

const router = Router();

router.use(authenticate);

router.get('/', authorize('deliveries:read', 'deliveries:*'), getDeliveries);
router.get('/calendar', authorize('deliveries:read', 'deliveries:*'), getCalendarEvents);
router.get('/history', authorize('deliveries:read', 'deliveries:*'), getDeliveredHistory);
router.post('/:id/decision', authorize('deliveries:*'), validate(deliveryDecisionSchema), auditLog('deliveries', 'decision'), resolveDeliveryDecision);
router.get('/:id', authorize('deliveries:read', 'deliveries:*'), getDelivery);
router.post('/', authorize('deliveries:*'), validate(createDeliverySchema), auditLog('deliveries', 'create'), createDelivery);
router.put('/:id', authorize('deliveries:*'), validate(updateDeliverySchema), auditLog('deliveries', 'update'), updateDelivery);
router.delete('/:id', authorize('deliveries:*'), auditLog('deliveries', 'delete'), deleteDelivery);

export default router;
