import { TaskType } from '../types';
import { baseApi } from '../../../api/api';
import { ApiSuccessResponse } from '@todolist/types';

type CreateTaskMutation = {
  name: string;
  todolist: string;
  description: string;
  checked: boolean;
};

export const taskApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllTasks: build.query<TaskType[], void>({
      query: () => ({
        url: '/tasks',
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ tasks: TaskType[] }>
      ) => response.data.tasks,
      providesTags: ['Task'],
    }),
    getTasksByTodolist: build.query<TaskType[], string>({
      query: (todolistId) => ({
        url: `/tasks?todolist=${todolistId}`,
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
    updateTask: build.mutation<TaskType, TaskType>({
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
