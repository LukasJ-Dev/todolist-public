import { Router } from 'express';
import * as taskController from '../controllers/taskController';

import { requireAuthWithUser } from '../middlewares/auth';
import {
  createTaskBody,
  deleteTaskParams,
  updateTaskBody,
} from '../schemas/taskSchemas';
import { validate } from '../middlewares/validate';

const router: Router = Router();

router.get('/', requireAuthWithUser, taskController.getMyTasks);

router.post(
  '/',
  requireAuthWithUser,
  validate({ body: createTaskBody }),
  taskController.createTask
);

router.put(
  '/:task',
  requireAuthWithUser,
  validate({ body: updateTaskBody }),
  taskController.updateTask
);

router.delete(
  '/:task',
  requireAuthWithUser,
  validate({ params: deleteTaskParams }),
  taskController.deleteTask
);

export default router;
