import { Router } from "express";
import * as taskController from "../controllers/taskController";

import * as authController from "../controllers/authController";

const router: Router = Router();

router.get("/", authController.auth, taskController.getMyTasks);

router.post("/", authController.auth, taskController.createTask);

router.patch("/:task", authController.auth, taskController.updateTask);

router.delete("/:task", authController.auth, taskController.deleteTask);

export default router;
