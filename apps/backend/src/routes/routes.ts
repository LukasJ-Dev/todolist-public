import { Router } from 'express';

import userRoutes from './userRoutes';
import todolistRoute from './todolistRoutes';
import taskRoute from './taskRoutes';
import aiRoutes from './aiRoutes';

const router: Router = Router();

router.use('/auth', userRoutes);
router.use('/todolists', todolistRoute);
router.use('/tasks', taskRoute);
router.use('/ai', aiRoutes);

export default router;
