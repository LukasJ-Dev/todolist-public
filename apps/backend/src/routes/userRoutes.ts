import { Router } from 'express';
import * as userController from '../controllers/userController';
import * as authController from '../controllers/authController';
import { requireAuthWithUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { loginBody, signupBody } from '../schemas/authSchemas';
import { authLimiter, registrationLimiter } from '../middlewares/rateLimiting';

const router: Router = Router();

// Registration with strict rate limiting
router.post(
  '/signup',
  validate({ body: signupBody }),
  registrationLimiter,
  authController.signup
);

// Login with authentication rate limiting
router.post(
  '/login',
  validate({ body: loginBody }),
  authLimiter,
  authController.login
);

// Logout (protected route)
router.post('/logout', requireAuthWithUser, authController.logout);

// Token refresh with authentication rate limiting
router.post('/refresh', authController.refresh);

router.get('/me', requireAuthWithUser, authController.me);

router.get('/', requireAuthWithUser, userController.getAllUsers);

export default router;
