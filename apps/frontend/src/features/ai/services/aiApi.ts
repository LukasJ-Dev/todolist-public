import { baseApi } from '../../../api/api';
import { ApiSuccessResponse } from '@todolist/types';

export interface ToolCall {
  tool: string;
  input: Record<string, unknown>;
  result: unknown;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  timestamp?: string;
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatResponse {
  response: string;
  toolCalls?: ToolCall[];
  conversationId: string;
}

export interface Conversation {
  conversationId: string;
  messageCount: number;
  lastMessageAt: string | null;
  preview: string | null;
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface UserMemory {
  id: string;
  category: 'preference' | 'fact' | 'pattern' | 'context';
  key: string;
  value: string;
  confidence: number;
  source: string;
  lastUpdated: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MemoriesResponse {
  memories: UserMemory[];
}

export const aiApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    chat: build.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: '/ai/chat',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<ChatResponse>) =>
        response.data,
      invalidatesTags: ['Task', 'Todolist', 'Conversation'], // Invalidate tasks/todolists when AI creates/updates them
    }),
    listConversations: build.query<ConversationsResponse, void>({
      query: () => ({
        url: '/ai/conversations',
        method: 'GET',
      }),
      transformResponse: (
        response: ApiSuccessResponse<ConversationsResponse>
      ) => response.data,
      providesTags: ['Conversation'],
    }),
    getConversationHistory: build.query<
      { messages: ChatMessage[] },
      { conversationId: string }
    >({
      query: ({ conversationId }) => ({
        url: `/ai/conversations/${conversationId}`,
        method: 'GET',
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ messages: ChatMessage[] }>
      ) => response.data,
      providesTags: ['Conversation'],
    }),
    deleteConversation: build.mutation<
      { message: string },
      { conversationId: string }
    >({
      query: ({ conversationId }) => ({
        url: `/ai/conversations/${conversationId}`,
        method: 'DELETE',
      }),
      transformResponse: (response: ApiSuccessResponse<{ message: string }>) =>
        response.data,
      invalidatesTags: ['Conversation'],
    }),
    getMemories: build.query<
      MemoriesResponse,
      { category?: 'preference' | 'fact' | 'pattern' | 'context' }
    >({
      query: ({ category }) => ({
        url: '/ai/memories',
        method: 'GET',
        params: category ? { category } : {},
      }),
      transformResponse: (response: ApiSuccessResponse<MemoriesResponse>) =>
        response.data,
      providesTags: ['Memory'],
    }),
  }),
});

export const {
  useChatMutation,
  useListConversationsQuery,
  useGetConversationHistoryQuery,
  useDeleteConversationMutation,
  useGetMemoriesQuery,
} = aiApi;
