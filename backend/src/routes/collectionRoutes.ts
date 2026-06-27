import { Router } from 'express';
import { getDailyCollection } from '../controllers/collectionController';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/rbac';

const router = Router();

router.use(authenticate);
router.get('/daily', authorize('collection:read'), getDailyCollection);

export default router;
