import { Router } from 'express';

import { requireAuthWithUser } from '../middlewares/auth';
import {
  createTaskBody,
  deleteTaskParams,
  updateTaskBody,
} from '../schemas/taskSchemas';
import { validate } from '../middlewares/validate';
import { TaskController } from '../controllers/taskController';
import { validateServerEnv } from '../config/env';

const router: Router = Router();

const taskController = new TaskController(validateServerEnv(process.env));

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
