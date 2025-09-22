import { Router } from 'express';
import { TodolistController } from '../controllers/todolistController';

import { requireAuthWithUser } from '../middlewares/auth';
import {
  createTodolistBody,
  deleteTodolistParams,
  updateTodolistBody,
} from '../schemas/todolistSchemas';
import { validate } from '../middlewares/validate';
import { validateServerEnv } from '../config/env';

const router: Router = Router();

const todolistController = new TodolistController(
  validateServerEnv(process.env)
);

router.get('/', requireAuthWithUser, todolistController.getMyTodolists);

router.post(
  '/',
  requireAuthWithUser,
  validate({ body: createTodolistBody }),
  todolistController.createTodolist
);

router.put(
  '/:todolist',
  requireAuthWithUser,
  validate({ body: updateTodolistBody }),
  todolistController.updateTodolist
);

router.delete(
  '/:todolist',
  requireAuthWithUser,
  validate({ params: deleteTodolistParams }),
  todolistController.deleteTodolist
);

export default router;
