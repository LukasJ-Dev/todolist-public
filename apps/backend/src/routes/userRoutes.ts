import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { AuthController } from '../controllers/authController';
import { requireAuthWithUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { loginBody, signupBody } from '../schemas/authSchemas';
import { authLimiter, registrationLimiter } from '../middlewares/rateLimiting';
import { validateServerEnv } from '../config/env';

const router: Router = Router();

const env = validateServerEnv(process.env);

const userController = new UserController(env);
const authController = new AuthController(env);

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

router.get('/me', requireAuthWithUser, authController.getMe);

router.get('/sessions', requireAuthWithUser, authController.getSessions);

router.get('/', requireAuthWithUser, userController.getAllUsers);

export default router;
