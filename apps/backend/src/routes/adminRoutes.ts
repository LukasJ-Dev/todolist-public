import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import {
  requireAdminIP,
  validateAdminPassword,
} from '../middlewares/adminAuth';
import { strictLimiter } from '../middlewares/rateLimiting';
import { validateServerEnv } from '../config/env';

const router: Router = Router();

const env = validateServerEnv(process.env);
const adminController = new AdminController(env);

// All admin routes require IP whitelist
// Apply strict rate limiting to all admin endpoints
router.use(requireAdminIP);
router.use(strictLimiter);

// Password validation is applied per route to allow GET requests with header

// Statistics
router.get('/stats', validateAdminPassword, adminController.getStats);

// User management
router.get('/users', validateAdminPassword, adminController.getUsers);
router.delete(
  '/users/:userId',
  validateAdminPassword,
  adminController.deleteUser
);

// Demo account management
router.get(
  '/demo-accounts',
  validateAdminPassword,
  adminController.getDemoAccounts
);
router.delete(
  '/demo-accounts',
  validateAdminPassword,
  adminController.deleteDemoAccounts
);

// Activity metrics
router.get('/activity', validateAdminPassword, adminController.getActivity);

// AI statistics
router.get('/ai/stats', validateAdminPassword, adminController.getAIStats);
router.get(
  '/ai/usage-trends',
  validateAdminPassword,
  adminController.getAIUsageTrends
);
router.get(
  '/ai/tool-usage',
  validateAdminPassword,
  adminController.getAIToolUsage
);
router.get(
  '/ai/top-users',
  validateAdminPassword,
  adminController.getTopAIUsers
);

// Database statistics
router.get(
  '/database/stats',
  validateAdminPassword,
  adminController.getDatabaseStats
);

// Cleanup operations
router.get(
  '/cleanup/counts',
  validateAdminPassword,
  adminController.getCleanupCounts
);
router.delete(
  '/cleanup/todolists',
  validateAdminPassword,
  adminController.deleteTodolistsByAge
);
router.delete(
  '/cleanup/tasks',
  validateAdminPassword,
  adminController.deleteTasksByAge
);
router.delete(
  '/cleanup/conversations',
  validateAdminPassword,
  adminController.deleteConversationsByAge
);
router.delete(
  '/cleanup/memories',
  validateAdminPassword,
  adminController.deleteMemoriesByAge
);

// User restrictions and limits
router.get(
  '/users/:userId/restrictions',
  validateAdminPassword,
  adminController.getUserRestrictions
);
router.put(
  '/users/:userId/restrictions',
  validateAdminPassword,
  adminController.updateUserRestrictions
);
router.get(
  '/users/:userId/limits',
  validateAdminPassword,
  adminController.getUserLimits
);
router.put(
  '/users/:userId/limits',
  validateAdminPassword,
  adminController.updateUserLimits
);

// Global settings
router.get(
  '/settings/global',
  validateAdminPassword,
  adminController.getGlobalSettings
);
router.put(
  '/settings/global/restrictions',
  validateAdminPassword,
  adminController.updateGlobalRestrictions
);
router.put(
  '/settings/global/limits',
  validateAdminPassword,
  adminController.updateGlobalLimits
);

export default router;
