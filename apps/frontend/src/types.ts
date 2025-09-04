export interface TodolistType {
  name: string;
  _id: string;
}

export interface TaskType {
  name?: string;
  _id: string;
  checked?: boolean;
  description?: string;
}
