import { Router } from "express";
import * as userController from "../controllers/userController";

import * as authController from "../controllers/authController";
import rateLimit from "express-rate-limit";

const router: Router = Router();

const limiter = rateLimit({
  max: 50,
  windowMs: 60 * 60 * 100,
  message: "Rate limit exceeded. Please try again in one hour.",
  legacyHeaders: false,
});

router.post("/signup", limiter, authController.signup);

router.post("/login", limiter, authController.login);

router.get("/", authController.auth, userController.getAllUsers);

export default router;
