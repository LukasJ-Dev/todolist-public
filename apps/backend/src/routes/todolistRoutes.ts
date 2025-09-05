import { Router } from 'express';
import * as todolistController from '../controllers/todolistController';

import { requireAuth } from '../middlewares/auth';
import {
  createTodolistBody,
  deleteTodolistParams,
  updateTodolistBody,
} from '../schemas/todolistSchemas';
import { validate } from '../middlewares/validate';

const router: Router = Router();

router.get('/', requireAuth, todolistController.getMyTodolists);

router.post(
  '/',
  requireAuth,
  validate({ body: createTodolistBody }),
  todolistController.createTodolist
);

router.patch(
  '/:todolist',
  requireAuth,
  validate({ body: updateTodolistBody }),
  todolistController.updateTodolist
);

router.delete(
  '/:todolist',
  requireAuth,
  validate({ params: deleteTodolistParams }),
  todolistController.deleteTodolist
);

export default router;
