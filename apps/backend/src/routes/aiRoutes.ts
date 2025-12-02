import { Router } from 'express';

import { requireAuthWithUser } from '../middlewares/auth';
import { chatRequestBody } from '../schemas/aiSchemas';
import { validate } from '../middlewares/validate';
import { AIController } from '../controllers/aiController';
import { validateServerEnv } from '../config/env';

const router: Router = Router();

const aiController = new AIController(validateServerEnv(process.env));

router.post(
  '/chat',
  requireAuthWithUser,
  validate({ body: chatRequestBody }),
  aiController.chat
);

router.get(
  '/conversations',
  requireAuthWithUser,
  aiController.listConversations
);

router.get(
  '/conversations/:conversationId',
  requireAuthWithUser,
  aiController.getConversationHistory
);

router.delete(
  '/conversations/:conversationId',
  requireAuthWithUser,
  aiController.deleteConversation
);

router.get('/memories', requireAuthWithUser, aiController.getMemories);

export default router;
