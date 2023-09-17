import { Router } from "express";

import userRoutes from "./userRoutes";
import todolistRoute from "./todolistRoutes";
import taskRoute from "./taskRoutes";

const router : Router = Router();

router.use("/users", userRoutes);
router.use("/todolists", todolistRoute);
router.use("/tasks", taskRoute);

export default router;