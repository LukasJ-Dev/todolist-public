export interface TodolistType {
  name: string;
  id: string;
}

export interface TaskType {
  name?: string;
  id: string;
  checked?: boolean;
  description?: string;
  todolist?: {
    id: string;
    name: string;
  };
}
