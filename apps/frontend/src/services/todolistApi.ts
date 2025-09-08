import { baseApi } from './api';
import { ApiSuccessResponse } from '@todolist/types';
import { TodolistType } from '../types';

type CreateTodolistMutation = {
  name: string;
};

export const todolistApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getAllTodolists: build.query<TodolistType[], void>({
      query: () => ({
        url: '/todolists',
        method: 'GET',
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ todolists: TodolistType[] }>
      ) => response.data.todolists,
      providesTags: ['Todolist'],
    }),
    createTodolist: build.mutation<TodolistType, CreateTodolistMutation>({
      query: (todolist) => ({
        url: '/todolists',
        method: 'POST',
        body: todolist,
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ todolist: TodolistType }>
      ) => response.data.todolist,
      invalidatesTags: ['Todolist'],
    }),
    updateTodolist: build.mutation<TodolistType, TodolistType>({
      query: (todolist) => ({
        url: `/todolists/${todolist._id}`,
        method: 'PUT',
        body: todolist,
      }),
      transformResponse: (
        response: ApiSuccessResponse<{ todolist: TodolistType }>
      ) => response.data.todolist,
      invalidatesTags: ['Todolist'],
    }),
    deleteTodolist: build.mutation<TodolistType, string>({
      query: (todolistId) => ({
        url: `/todolists/${todolistId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Todolist'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllTodolistsQuery,
  useCreateTodolistMutation,
  useUpdateTodolistMutation,
  useDeleteTodolistMutation,
} = todolistApi;
