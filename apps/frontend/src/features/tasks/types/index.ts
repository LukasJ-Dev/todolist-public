export interface TaskType {
  id: string;
  name: string;
  description: string;
  checked: boolean;
  todolist?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
