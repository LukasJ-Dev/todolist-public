import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { catchAsync } from '../utils/catchAsync';
import { randomUUID } from 'crypto';
import { processChatMessage } from '../services/ai';
import { memoryService } from '../services/ai/memory';
import { TodolistModel } from '../models/todolistModel';
import { AppError } from '../utils/appError';

/**
 * AI Controller for handling chat interactions
 */
export class AIController extends BaseController {
  /**
   * Handle chat messages
   * POST /api/v1/ai/chat
   */
  chat = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);
    const { message, conversationId } = req.body;

    // Check restrictions and limits
    const { userModel } = await import('../models/userModel');
    const { globalSettingsService } = await import('../services/admin/globalSettingsService');
    const { checkRestriction, checkLimit, getEffectiveLimit } = await import('../utils/userRestrictions');
    const { ConversationMessageModel } = await import('../models/conversationMessageModel');

    const user = await userModel.findById(userId);
    const globalSettings = await globalSettingsService.getGlobalSettings();

    // Check restriction
    if (checkRestriction(user, 'aiDisabled', globalSettings.restrictions)) {
      throw new AppError(
        'AI features are currently disabled for your account',
        403
      );
    }

    // Check limit - count user's AI messages
    const aiMessageCount = await ConversationMessageModel.countDocuments({
      userId,
      role: 'user', // Count user messages as AI interactions
    });
    if (checkLimit(user, 'maxAIMessages', aiMessageCount, globalSettings.limits)) {
      const effectiveLimit = getEffectiveLimit(user, 'maxAIMessages', globalSettings.limits);
      throw new AppError(
        `You have reached the maximum limit of ${effectiveLimit} AI messages`,
        403
      );
    }

    // Generate or use existing conversation ID (must be before processing for memory)
    const convId = conversationId || `conv_${randomUUID()}`;

    this.logOperation(req, 'ai.chat', {
      userId,
      messageLength: message.length,
      conversationId: convId,
    });

    const todolists = await TodolistModel.find({ owner: userId });
    const todolistsList = todolists.map((todolist) => ({
      id: todolist._id.toString(),
      name: todolist.name,
    }));

    // Process message with AI agent (includes memory loading and saving)
    const aiResponse = await processChatMessage(
      message,
      convId,
      userId,
      todolistsList,
      this.env
    );

    this.sendSuccess(res, {
      response: aiResponse.response,
      conversationId: convId,
      toolCalls: aiResponse.toolCalls,
    });
  });

  /**
   * List all conversations for the user
   * GET /api/v1/ai/conversations
   */
  listConversations = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);

    this.logOperation(req, 'ai.listConversations', { userId });

    const conversations = await memoryService.listConversations(userId);

    this.sendSuccess(res, { conversations });
  });

  /**
   * Delete a conversation
   * DELETE /api/v1/ai/conversations/:conversationId
   */
  deleteConversation = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);
    const { conversationId } = req.params;

    this.logOperation(req, 'ai.deleteConversation', {
      userId,
      conversationId,
    });

    await memoryService.deleteConversation(conversationId, userId);

    this.sendSuccess(res, { message: 'Conversation deleted successfully' });
  });

  /**
   * Get conversation history
   * GET /api/v1/ai/conversations/:conversationId
   */
  getConversationHistory = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);
    const { conversationId } = req.params;

    this.logOperation(req, 'ai.getConversationHistory', {
      userId,
      conversationId,
    });

    const messages = await memoryService.loadFullConversationHistory(
      conversationId,
      userId
    );

    this.sendSuccess(res, { messages });
  });

  /**
   * Get user memories
   * GET /api/v1/ai/memories
   */
  getMemories = catchAsync(async (req: Request, res: Response) => {
    const userId = this.validateUser(req);
    const category = req.query.category as
      | 'preference'
      | 'fact'
      | 'pattern'
      | 'context'
      | undefined;

    this.logOperation(req, 'ai.getMemories', { userId, category });

    const memories = await memoryService.getUserMemories(userId, {
      category,
      limit: 100,
      sortBy: 'recent',
    });

    this.sendSuccess(res, { memories });
  });
}
