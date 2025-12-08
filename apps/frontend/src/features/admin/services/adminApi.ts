import { baseApi } from '../../../api/api';
import { ApiSuccessResponse } from '@todolist/types';

export interface AdminStats {
  totalUsers: number;
  totalTodolists: number;
  totalTasks: number;
  demoAccounts: number;
  activeUsers7Days: number;
  activeUsers30Days: number;
  totalConversations: number;
  totalAIMessages: number;
  usersUsingAI: number;
  totalToolCalls: number;
  totalMemories: number;
}

export interface UserWithStats {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  todolistCount: number;
  taskCount: number;
  lastLogin?: string;
  isDemo: boolean;
}

export interface UsersResponse {
  users: UserWithStats[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityMetrics {
  newUsers7Days: number;
  newUsers30Days: number;
  tasksCreated7Days: number;
  tasksCreated30Days: number;
  todolistsCreated7Days: number;
  todolistsCreated30Days: number;
  growthData: Array<{
    date: string;
    users: number;
    tasks: number;
    todolists: number;
  }>;
}

export interface DeleteDemoAccountsResponse {
  message: string;
  deletedCount: number;
}

export interface AIStats {
  totalConversations: number;
  totalMessages: number;
  uniqueUsers: number;
  totalToolCalls: number;
  totalMemories: number;
  averageMessagesPerConversation: number;
  conversations7Days: number;
  conversations30Days: number;
  messages7Days: number;
  messages30Days: number;
}

export interface AIUsageTrends {
  dailyData: Array<{
    date: string;
    conversations: number;
    messages: number;
    toolCalls: number;
  }>;
}

export interface ToolUsage {
  tool: string;
  count: number;
}

export interface TopAIUser {
  userId: string;
  name: string;
  email: string;
  conversationCount: number;
  messageCount: number;
  toolCallCount: number;
  totalInteractions: number;
}

export interface MemoryStats {
  totalMemories: number;
  byCategory: {
    preference: number;
    fact: number;
    pattern: number;
    context: number;
  };
  averageConfidence: number;
  totalAccessCount: number;
  mostAccessed: Array<{
    key: string;
    value: string;
    category: string;
    accessCount: number;
  }>;
}

export interface CollectionStats {
  name: string;
  displayName: string;
  count: number;
  dataSize: number;
  storageSize: number;
  indexSize: number;
  totalSize: number;
  avgObjSize: number;
}

export interface DatabaseStats {
  dataSize: number;
  storageSize: number;
  indexSize: number;
  totalSize: number;
  collections: number;
  objects: number;
  avgObjSize: number;
  collectionStats: CollectionStats[];
}

export interface UserRestrictions {
  aiDisabled?: boolean;
  createTodolistsDisabled?: boolean;
  createTasksDisabled?: boolean;
  loginDisabled?: boolean;
}

export interface GlobalRestrictions {
  aiDisabled?: boolean;
  createTodolistsDisabled?: boolean;
  createTasksDisabled?: boolean;
  loginDisabled?: boolean;
  registerDisabled?: boolean;
}

export interface UserLimits {
  maxTodolists?: number;
  maxTasks?: number;
  maxAIMessages?: number;
}

export interface GlobalSettings {
  restrictions: GlobalRestrictions;
  limits: UserLimits;
}

export interface AgeRangeCount {
  ageDays: number;
  count: number;
}

export interface CleanupCounts {
  todolists: AgeRangeCount[];
  tasks: AgeRangeCount[];
  conversations: AgeRangeCount[];
  memories: AgeRangeCount[];
}

export interface CleanupResult {
  deletedCount: number;
  estimatedSpaceFreed: number;
  details?: {
    todolistsDeleted?: number;
    tasksDeleted?: number;
    messagesDeleted?: number;
  };
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStats: builder.query<AdminStats, string>({
      query: (password) => ({
        url: '/admin/stats',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<AdminStats>) =>
        response.data,
    }),
    getUsers: builder.query<
      UsersResponse,
      { password: string; page?: number; limit?: number; search?: string }
    >({
      query: ({ password, page = 1, limit = 50, search }) => ({
        url: '/admin/users',
        method: 'GET',
        params: { page, limit, search },
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<UsersResponse>) =>
        response.data,
    }),
    getDemoAccounts: builder.query<UserWithStats[], string>({
      query: (password) => ({
        url: '/admin/demo-accounts',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ demoAccounts: UserWithStats[] }>
      ) => response.data.demoAccounts,
    }),
    deleteUser: builder.mutation<void, { userId: string; password: string }>({
      query: ({ userId, password }) => ({
        url: `/admin/users/${userId}`,
        method: 'DELETE',
        body: { password },
      }),
    }),
    deleteDemoAccounts: builder.mutation<DeleteDemoAccountsResponse, string>({
      query: (password) => ({
        url: '/admin/demo-accounts',
        method: 'DELETE',
        body: { password },
      }),
      transformResponse: (
        response: ApiSuccessResponse<DeleteDemoAccountsResponse>
      ) => response.data,
    }),
    getActivity: builder.query<ActivityMetrics, string>({
      query: (password) => ({
        url: '/admin/activity',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<ActivityMetrics>) =>
        response.data,
    }),
    getAIStats: builder.query<AIStats, string>({
      query: (password) => ({
        url: '/admin/ai/stats',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<AIStats>) =>
        response.data,
    }),
    getAIUsageTrends: builder.query<AIUsageTrends, string>({
      query: (password) => ({
        url: '/admin/ai/usage-trends',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<AIUsageTrends>) =>
        response.data,
    }),
    getAIToolUsage: builder.query<{ toolUsage: ToolUsage[] }, string>({
      query: (password) => ({
        url: '/admin/ai/tool-usage',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ toolUsage: ToolUsage[] }>
      ) => response.data,
    }),
    getTopAIUsers: builder.query<
      { topUsers: TopAIUser[] },
      { password: string; limit?: number }
    >({
      query: ({ password, limit = 20 }) => ({
        url: '/admin/ai/top-users',
        method: 'GET',
        params: { limit },
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ topUsers: TopAIUser[] }>
      ) => response.data,
    }),
    getAIMemoryStats: builder.query<MemoryStats, string>({
      query: (password) => ({
        url: '/admin/ai/memory-stats',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<MemoryStats>) =>
        response.data,
    }),
    getDatabaseStats: builder.query<DatabaseStats, string>({
      query: (password) => ({
        url: '/admin/database/stats',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<DatabaseStats>) =>
        response.data,
    }),
    getCleanupCounts: builder.query<CleanupCounts, string>({
      query: (password) => ({
        url: '/admin/cleanup/counts',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<CleanupCounts>) =>
        response.data,
    }),
    deleteTodolistsByAge: builder.mutation<
      CleanupResult,
      { password: string; ageDays: number }
    >({
      query: ({ password, ageDays }) => ({
        url: '/admin/cleanup/todolists',
        method: 'DELETE',
        params: { ageDays },
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<CleanupResult>) =>
        response.data,
    }),
    deleteTasksByAge: builder.mutation<
      CleanupResult,
      { password: string; ageDays: number }
    >({
      query: ({ password, ageDays }) => ({
        url: '/admin/cleanup/tasks',
        method: 'DELETE',
        params: { ageDays },
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<CleanupResult>) =>
        response.data,
    }),
    deleteConversationsByAge: builder.mutation<
      CleanupResult,
      { password: string; ageDays: number }
    >({
      query: ({ password, ageDays }) => ({
        url: '/admin/cleanup/conversations',
        method: 'DELETE',
        params: { ageDays },
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<CleanupResult>) =>
        response.data,
    }),
    deleteMemoriesByAge: builder.mutation<
      CleanupResult,
      { password: string; ageDays: number }
    >({
      query: ({ password, ageDays }) => ({
        url: '/admin/cleanup/memories',
        method: 'DELETE',
        params: { ageDays },
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<CleanupResult>) =>
        response.data,
    }),
    getUserRestrictions: builder.query<
      UserRestrictions,
      { userId: string; password: string }
    >({
      query: ({ userId, password }) => ({
        url: `/admin/users/${userId}/restrictions`,
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<UserRestrictions>) =>
        response.data,
    }),
    updateUserRestrictions: builder.mutation<
      UserRestrictions,
      { userId: string; restrictions: UserRestrictions; password: string }
    >({
      query: ({ userId, restrictions, password }) => ({
        url: `/admin/users/${userId}/restrictions`,
        method: 'PUT',
        body: restrictions,
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<UserRestrictions>) =>
        response.data,
    }),
    getUserLimits: builder.query<
      UserLimits,
      { userId: string; password: string }
    >({
      query: ({ userId, password }) => ({
        url: `/admin/users/${userId}/limits`,
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<UserLimits>) =>
        response.data,
    }),
    updateUserLimits: builder.mutation<
      UserLimits,
      { userId: string; limits: UserLimits; password: string }
    >({
      query: ({ userId, limits, password }) => ({
        url: `/admin/users/${userId}/limits`,
        method: 'PUT',
        body: limits,
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<UserLimits>) =>
        response.data,
    }),
    getGlobalSettings: builder.query<GlobalSettings, string>({
      query: (password) => ({
        url: '/admin/settings/global',
        method: 'GET',
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<GlobalSettings>) =>
        response.data,
    }),
    updateGlobalRestrictions: builder.mutation<
      GlobalSettings,
      { restrictions: GlobalRestrictions; password: string }
    >({
      query: ({ restrictions, password }) => ({
        url: '/admin/settings/global/restrictions',
        method: 'PUT',
        body: restrictions,
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<GlobalSettings>) =>
        response.data,
    }),
    updateGlobalLimits: builder.mutation<
      GlobalSettings,
      { limits: UserLimits; password: string }
    >({
      query: ({ limits, password }) => ({
        url: '/admin/settings/global/limits',
        method: 'PUT',
        body: limits,
        headers: {
          'x-admin-password': password,
        },
      }),
      transformResponse: (response: ApiSuccessResponse<GlobalSettings>) =>
        response.data,
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStatsQuery,
  useGetUsersQuery,
  useGetDemoAccountsQuery,
  useDeleteUserMutation,
  useDeleteDemoAccountsMutation,
  useGetActivityQuery,
  useGetAIStatsQuery,
  useGetAIUsageTrendsQuery,
  useGetAIToolUsageQuery,
  useGetTopAIUsersQuery,
  useGetAIMemoryStatsQuery,
  useGetDatabaseStatsQuery,
  useGetCleanupCountsQuery,
  useDeleteTodolistsByAgeMutation,
  useDeleteTasksByAgeMutation,
  useDeleteConversationsByAgeMutation,
  useDeleteMemoriesByAgeMutation,
  useGetUserRestrictionsQuery,
  useUpdateUserRestrictionsMutation,
  useGetUserLimitsQuery,
  useUpdateUserLimitsMutation,
  useGetGlobalSettingsQuery,
  useUpdateGlobalRestrictionsMutation,
  useUpdateGlobalLimitsMutation,
} = adminApi;
