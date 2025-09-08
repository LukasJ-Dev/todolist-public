import { Router } from 'express';
import * as todolistController from '../controllers/todolistController';

import { requireAuthWithUser } from '../middlewares/auth';
import {
  createTodolistBody,
  deleteTodolistParams,
  updateTodolistBody,
} from '../schemas/todolistSchemas';
import { validate } from '../middlewares/validate';

const router: Router = Router();

router.get('/', requireAuthWithUser, todolistController.getMyTodolists);

router.post(
  '/',
  requireAuthWithUser,
  validate({ body: createTodolistBody }),
  todolistController.createTodolist
);

router.patch(
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
