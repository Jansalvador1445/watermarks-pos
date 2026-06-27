import { Router } from 'express';
import { login, refresh, logout, getMe, completeOnboarding } from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { loginSchema, onboardingSchema } from '../validators/schemas';
import { authenticate } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/onboarding', authenticate, validate(onboardingSchema), completeOnboarding);

export default router;
