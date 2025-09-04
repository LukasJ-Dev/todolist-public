import { Router } from "express";
import * as todolistController from "../controllers/todolistController";

import * as authController from "../controllers/authController";

const router: Router = Router();

router.get("/", authController.auth, todolistController.getMyTodolists);

router.post("/", authController.auth, todolistController.createTodolist);

router.patch(
  "/:todolist",
  authController.auth,
  todolistController.updateTodolist
);

router.delete(
  "/:todolist",
  authController.auth,
  todolistController.deleteTodolist
);

export default router;
