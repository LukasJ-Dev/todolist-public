import { Router } from 'express';
import * as userController from '../controllers/userController';

import * as authController from '../controllers/authController';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { loginBody, signupBody } from '../schemas/authSchemas';

const router: Router = Router();

const limiter = rateLimit({
  max: 50,
  windowMs: 60 * 60 * 100,
  message: 'Rate limit exceeded. Please try again in one hour.',
  legacyHeaders: false,
});

router.post(
  '/signup',
  validate({ body: signupBody }),
  limiter,
  authController.signup
);

router.post(
  '/login',
  validate({ body: loginBody }),
  limiter,
  authController.login
);

router.get('/', requireAuth, userController.getAllUsers);

export default router;
