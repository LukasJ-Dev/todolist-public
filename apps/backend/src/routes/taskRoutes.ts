import { Router } from 'express';
import * as taskController from '../controllers/taskController';

import { requireAuth } from '../middlewares/auth';
import {
  createTaskBody,
  deleteTaskParams,
  updateTaskBody,
} from '../schemas/taskSchemas';
import { validate } from '../middlewares/validate';

const router: Router = Router();

router.get('/', requireAuth, taskController.getMyTasks);

router.post(
  '/',
  requireAuth,
  validate({ body: createTaskBody }),
  taskController.createTask
);

router.patch(
  '/:task',
  requireAuth,
  validate({ body: updateTaskBody }),
  taskController.updateTask
);

router.delete(
  '/:task',
  requireAuth,
  validate({ params: deleteTaskParams }),
  taskController.deleteTask
);

export default router;
