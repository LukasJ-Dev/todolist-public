import { TaskType } from '../types';
import { baseApi } from '../../../api/api';
import { ApiSuccessResponse } from '@todolist/types';

type CreateTaskMutation = {
  name: string;
  todolist: string;
  description?: string;
  dueDate?: string;
  startDate?: string;
  priority?: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  tags?: string[];
  parentTask?: string;
};

type UpdateTaskMutation = {
  id: string;
  name?: string;
  description?: string;
  checked?: boolean;
  dueDate?: string | null;
  startDate?: string | null;
  priority?: 'low' | 'medium' | 'high';
  isRecurring?: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrenceInterval?: number;
  tags?: string[];
  parentTask?: string;
};

type TaskQueryParams = {
  todolist?: string;
  filter?:
    | 'all'
    | 'due_today'
    | 'due_this_week'
    | 'overdue'
    | 'recurring'
    | 'subtasks';
  sort?: 'due_date' | 'priority' | 'created' | 'name';
  priority?: 'low' | 'medium' | 'high';
  tags?: string;
  include?: 'subtasks';
};

export const taskApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllTasks: build.query<TaskType[], TaskQueryParams | void>({
      query: (params) => ({
        url: '/tasks',
        params: params || {},
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ tasks: TaskType[] }>
      ) => response.data.tasks,
      providesTags: ['Task'],
    }),
    getTasksByTodolist: build.query<
      TaskType[],
      { todolistId: string; params?: TaskQueryParams }
    >({
      query: ({ todolistId, params = {} }) => ({
        url: '/tasks',
        params: { todolist: todolistId, ...params },
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ tasks: TaskType[] }>
      ) => response.data.tasks,
      providesTags: ['Task'],
    }),
    createTask: build.mutation<TaskType, CreateTaskMutation>({
      query: (task) => ({
        url: '/tasks',
        method: 'POST',
        body: task,
      }),
      transformResponse: (response: ApiSuccessResponse<{ task: TaskType }>) =>
        response.data.task,
      invalidatesTags: ['Task'],
    }),
    updateTask: build.mutation<TaskType, UpdateTaskMutation>({
      query: (task) => ({
        url: `/tasks/${task.id}`,
        method: 'PUT',
        body: task,
      }),
      transformResponse: (response: ApiSuccessResponse<{ task: TaskType }>) =>
        response.data.task,
      invalidatesTags: ['Task'],
    }),
    deleteTask: build.mutation<TaskType, string>({
      query: (taskId) => ({
        url: `/tasks/${taskId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Task'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTasksByTodolistQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetAllTasksQuery,
} = taskApi;
