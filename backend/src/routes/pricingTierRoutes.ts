import { Router } from 'express';
import { getPricingTiers, updatePricingTier } from '../controllers/pricingTierController';
import { authenticate } from '../middlewares/auth';
import { authorizeRoles } from '../middlewares/rbac';
import { validate } from '../middlewares/validate';
import { updatePricingTierSchema } from '../validators/schemas';
import { UserRole } from '../types/enums';

const router = Router();

router.use(authenticate);

router.get('/', authorizeRoles(UserRole.ADMIN, UserRole.CASHIER, UserRole.DELIVERY_STAFF), getPricingTiers);
router.put('/:id', authorizeRoles(UserRole.ADMIN), validate(updatePricingTierSchema), updatePricingTier);

export default router;
