/**
 * LLM setup for Google Gemini
 * TODO: Implement actual LangChain LLM initialization
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ServerEnv } from '../../config/env';
import { AppError } from '../../utils/appError';

export interface LLMConfig {
  apiKey: string;
  model: string;
  temperature: number;
}

/**
 * Get LLM configuration from environment
 */
export function getLLMConfig(env: ServerEnv): LLMConfig {
  const apiKey = env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new AppError(
      'AI service is not configured. Please set GOOGLE_API_KEY in your environment variables.',
      503
    );
  }

  return {
    apiKey,
    model: env.AI_MODEL,
    temperature: env.AI_TEMPERATURE,
  };
}

export function createLLM(_config: LLMConfig) {
  return new ChatGoogleGenerativeAI({
    model: _config.model,
    temperature: _config.temperature,
    apiKey: _config.apiKey,
  });
}
