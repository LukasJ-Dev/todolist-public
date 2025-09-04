// Shared types across the monorepo
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  todolistId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Todolist {
  id: string;
  title: string;
  description?: string;
  userId: string;
  tasks: Task[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
