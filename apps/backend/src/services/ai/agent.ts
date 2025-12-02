import { createAgent } from 'langchain';
import { getLLMConfig, createLLM } from './llm';
import { ServerEnv } from '../../config/env';
import { createTaskToolFactory } from './tools/createTask.tool';
import { getTasksToolFactory } from './tools/getTasks.tool';
import { updateTaskToolFactory } from './tools/updateTask.tool';
import { deleteTaskToolFactory } from './tools/deleteTask.tool';
import { createTodolistToolFactory } from './tools/createTodolist.tool';
import { updateTodolistToolFactory } from './tools/updateTodolist.tool';
import { deleteTodolistToolFactory } from './tools/deleteTodolist.tool';
import { getTaskStatisticsToolFactory } from './tools/getTaskStatistics.tool';
import { saveMemoryToolFactory } from './tools/saveMemory.tool';
import { searchMemoryToolFactory } from './tools/searchMemory.tool';
import { memoryService } from './memory';

export interface ChatResponse {
  response: string;
  toolCalls: Array<{
    tool: string;
    input: Record<string, unknown>;
    result: unknown;
  }>;
}

/**
 * Helper to safely check if a message has a property
 */
function hasProperty(obj: unknown, prop: string): boolean {
  return typeof obj === 'object' && obj !== null && prop in obj;
}

/**
 * Helper to safely get a property value
 */
function getProperty<T>(obj: unknown, prop: string): T | undefined {
  if (hasProperty(obj, prop)) {
    return (obj as Record<string, T>)[prop];
  }
  return undefined;
}

/**
 * @param message - User's message
 * @param conversationId - Optional conversation ID for context
 * @param userId - User ID for user-specific operations
 * @param todolists - User's todolists
 * @param env - Server environment configuration
 * @returns AI response with optional tool calls
 */
export async function processChatMessage(
  message: string,
  conversationId: string | undefined,
  userId: string,
  todolists: { id: string; name: string }[],
  env: ServerEnv
): Promise<ChatResponse> {
  const config = getLLMConfig(env);
  const llm = createLLM(config);

  const agent = createAgent({
    model: llm,
    tools: [
      createTaskToolFactory(userId),
      getTasksToolFactory(userId),
      updateTaskToolFactory(userId),
      deleteTaskToolFactory(userId),
      createTodolistToolFactory(userId),
      updateTodolistToolFactory(userId),
      deleteTodolistToolFactory(userId),
      getTaskStatisticsToolFactory(userId),
      saveMemoryToolFactory(userId),
      searchMemoryToolFactory(userId),
    ],
  });

  const now = new Date();
  const currentDateISO = now.toISOString();
  const currentDateFormatted = now.toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const todolistsContext =
    todolists.length > 0
      ? todolists
          .map((todolist) => `- ${todolist.name} (ID: ${todolist.id})`)
          .join('\n')
      : 'No todolists found, you may need to ask the user to create one first';

  // Load user's long-term memories
  const userMemories = await memoryService.getFormattedMemories(userId);

  const systemPrompt = `You are a helpful task management assistant. You help users manage their tasks and todolists.

Current date and time: ${currentDateFormatted} (ISO: ${currentDateISO})

Available todolists:
${todolistsContext}

${userMemories !== 'No user memories found.' ? `\nUser's Long-term Memories:\n${userMemories}\n\nUse these memories to personalize your responses. When the user tells you something about themselves, their preferences, or facts, use the saveMemory tool to remember it for future conversations.` : '\nYou can remember information about the user using the saveMemory tool. When the user tells you something about themselves, their preferences, or facts, save it for future conversations.'}

When creating tasks, you can reference todolists by their name or ID. If the user doesn't specify a todolist, you can ask them which one they'd like to use, or use the first available todolist if appropriate.`;

  // Load conversation history if conversationId exists
  const historyMessages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }> = [];

  if (conversationId) {
    const history = await memoryService.loadConversationHistory(
      conversationId,
      userId
    );
    historyMessages.push(...history);
  }

  // Build messages array: system prompt, history, then current user message
  const messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }> = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: message },
  ];

  const response = await agent.invoke({
    messages,
  });

  // Parse tool calls from the response messages
  const toolCalls: ChatResponse['toolCalls'] = [];
  let finalResponse = '';

  // Iterate through messages to find tool calls and final response
  for (const msg of response.messages) {
    // Check if message has tool_calls (AIMessage with tool invocations)
    const toolCallsArray = getProperty<
      Array<{ id?: string; name?: string; args?: Record<string, unknown> }>
    >(msg, 'tool_calls');

    if (
      toolCallsArray &&
      Array.isArray(toolCallsArray) &&
      toolCallsArray.length > 0
    ) {
      for (const toolCall of toolCallsArray) {
        // Find the corresponding tool result in subsequent messages
        const toolCallId = toolCall.id;
        const toolResult = toolCallId
          ? response.messages.find((m: unknown) => {
              const toolCallIdInMsg = getProperty<string>(m, 'tool_call_id');
              return (
                toolCallIdInMsg === toolCallId && hasProperty(m, 'content')
              );
            })
          : null;

        const toolResultContent = toolResult
          ? getProperty<unknown>(toolResult, 'content')
          : null;

        toolCalls.push({
          tool: toolCall.name || 'unknown',
          input: toolCall.args || {},
          result: toolResultContent,
        });
      }
    }

    // Get the final assistant response (last AIMessage without tool_calls)
    const msgRole = getProperty<string>(msg, 'role');
    const msgContent = getProperty<unknown>(msg, 'content');
    const toolCallsInMsg = getProperty<unknown[]>(msg, 'tool_calls');
    const hasToolCalls =
      hasProperty(msg, 'tool_calls') &&
      toolCallsInMsg !== undefined &&
      toolCallsInMsg.length > 0;

    if (msgRole === 'assistant' && msgContent !== undefined && !hasToolCalls) {
      finalResponse =
        typeof msgContent === 'string' ? msgContent : String(msgContent);
    }
  }

  // Fallback: if no final response found, use the last message
  if (!finalResponse) {
    const lastMsg = response.messages[response.messages.length - 1];
    if (lastMsg && 'content' in lastMsg) {
      finalResponse =
        typeof lastMsg.content === 'string' ? String(lastMsg.content) : '';
    }
  }

  // Save messages to conversation history if conversationId exists
  if (conversationId) {
    // Save user message
    await memoryService.saveUserMessage(conversationId, userId, message);

    // Save assistant response with tool calls
    await memoryService.saveAssistantMessage(
      conversationId,
      userId,
      finalResponse,
      toolCalls.length > 0 ? toolCalls : undefined
    );
  }

  return {
    response: finalResponse,
    toolCalls,
  };
}

export async function initializeAgent() {
  return Promise.resolve();
}
