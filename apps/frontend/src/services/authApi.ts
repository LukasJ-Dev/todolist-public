import { LoginBody, SignupBody } from '@todolist/types';
import { baseApi } from './api';
import { ApiSuccessResponse } from '@todolist/types';

type User = {
  id: string;
  name: string;
  email: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signup: builder.mutation<User, SignupBody>({
      query: (body: SignupBody) => ({
        url: '/auth/signup',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<{ user: User }>) =>
        response.data.user,
      invalidatesTags: ['User'],
    }),
    login: builder.mutation<User, LoginBody>({
      query: (body: LoginBody) => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
      transformResponse: (response: ApiSuccessResponse<{ user: User }>) =>
        response.data.user,
      invalidatesTags: ['User'],
    }),
    me: builder.query<User, void>({
      query: () => ({
        url: '/auth/me',
        method: 'GET',
      }),
      transformResponse: (response: ApiSuccessResponse<{ user: User }>) =>
        response.data.user,
      providesTags: ['User'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { queryFulfilled, dispatch }) {
        try {
          await queryFulfilled;
        } finally {
          dispatch(baseApi.util.resetApiState());
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useSignupMutation,
  useLoginMutation,
  useMeQuery,
  useLogoutMutation,
} = authApi;
