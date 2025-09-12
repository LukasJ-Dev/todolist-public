import {
  createApi,
  fetchBaseQuery,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';

const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
// ---- Bare base query (cookies only; no CSRF) ----
const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: 'include',
});

// ---- 401 → refresh → retry (single-flight) ----
// Single-flight refresh (typed so TS knows it's a Promise)
let refreshPromise: Promise<{ error?: FetchBaseQueryError }> | null = null;

async function doRefresh(
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2]
) {
  const res = await rawBaseQuery(
    { url: '/auth/refresh', method: 'POST' },
    api,
    extraOptions
  );
  // Normalize to { error?: FetchBaseQueryError }
  return res as { error?: FetchBaseQueryError };
}

async function baseQueryWithReauth(
  args: string | FetchArgs,
  api: Parameters<typeof rawBaseQuery>[1],
  extraOptions: Parameters<typeof rawBaseQuery>[2]
) {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && (result.error as FetchBaseQueryError).status === 401) {
    // Ensure only one refresh happens at a time
    if (!refreshPromise) {
      refreshPromise = doRefresh(api, extraOptions);
    }
    const current = refreshPromise;
    const refreshResult = await current;

    // Clear the shared promise only if we're the one who awaited the current instance
    if (refreshPromise === current) refreshPromise = null;

    if (!refreshResult?.error) {
      // Retry the original request once after successful refresh
      result = await rawBaseQuery(args, api, extraOptions);
    }
  }

  return result;
}

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Todolist', 'Task'],
  endpoints: () => ({}),
});
