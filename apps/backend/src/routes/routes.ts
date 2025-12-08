import { Router } from 'express';

import userRoutes from './userRoutes';
import todolistRoute from './todolistRoutes';
import taskRoute from './taskRoutes';
import aiRoutes from './aiRoutes';
import adminRoutes from './adminRoutes';

const router: Router = Router();

router.use('/auth', userRoutes);
router.use('/todolists', todolistRoute);
router.use('/tasks', taskRoute);
router.use('/ai', aiRoutes);
router.use('/admin', adminRoutes);

export default router;
