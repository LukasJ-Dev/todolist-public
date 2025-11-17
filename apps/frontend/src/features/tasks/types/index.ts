export interface TaskType {
  id: string;
  name: string;
  description: string;
  checked: boolean;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  parentTaskId?: string;
  nextDueDate?: string;
  tags: string[];
  subtasks: string[] | TaskType[];
  parentTask?: string | { id: string; name: string };
  todolist?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
