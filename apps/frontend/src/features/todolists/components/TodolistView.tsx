import { FaPen, FaTrash } from 'react-icons/fa';
import { Separator } from '../../../components/UI/separator';
import { Skeleton } from '../../../components/UI/skeleton';
import { Button } from '../../../components/UI/button';
import {
  useCreateTaskMutation,
  useGetTasksByTodolistQuery,
} from '../../tasks/services/taskApi';
import { useGetAllTodolistsQuery } from '../services/todolistApi';
import TaskCardList from '../../tasks/components/TaskCardList';
import NewTask from '../../tasks/components/TaskForm';
import RenameTodolistDialog from '../dialogs/RenameTodolistDialog';
import DeleteTodolistDialog from '../dialogs/DeleteTodolistDialog';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTouch } from '../../../hooks/useTouch';

const TodolistView = ({ todolistId }: { todolistId: string }) => {
  const selectedItem = todolistId;
  const isTouch = useTouch();

  const {
    data: todolist,
    isLoading: todolistLoading,
    error: todolistError,
    refetch: refetchTodolist,
  } = useGetAllTodolistsQuery();

  const {
    data: tasks,
    isLoading: tasksLoading,
    error: tasksError,
    refetch: refetchTasks,
  } = useGetTasksByTodolistQuery(selectedItem);

  const [createTask, { isLoading: isCreatingTask }] = useCreateTaskMutation();

  // Handle todolist loading state
  if (todolistLoading) {
    return (
      <div className="flex flex-row gap-2 w-full justify-center p-6 pt-10">
        <div className="flex flex-col gap-2 p-2 w-full max-w-5xl">
          <div className="flex flex-row justify-between">
            <Skeleton className="h-8 w-48" />
            <div className="flex flex-row gap-4 items-center">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-5" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-16 w-full" />
                <Separator />
              </div>
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  // Handle todolist error state
  if (todolistError) {
    return (
      <div className="flex flex-row gap-2 w-full justify-center p-6 pt-10">
        <div className="flex flex-col gap-4 p-2 w-full max-w-5xl items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div>
              <h3 className="text-lg font-semibold">
                Failed to load todolists
              </h3>
              <p className="text-gray-600">
                Something went wrong while loading your todolists.
              </p>
            </div>
            <Button
              onClick={() => refetchTodolist()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!todolist) return null;

  const todolistName = todolist?.find(
    (todolist) => todolist.id === selectedItem
  )?.name;

  const todolistAmount = todolist?.length;

  const newTaskInput = async (name: string) => {
    if (!selectedItem) return alert('no selected todolist');
    try {
      await createTask({
        name: name,
        todolist: selectedItem,
        description: '',
        checked: false,
      }).unwrap();
    } catch (error) {
      console.error('Failed to create task:', error);
      // The error will be handled by RTK Query's built-in error handling
      // and the user will see a toast notification from the mutation
    }
  };

  return (
    <div className="flex flex-row gap-2 w-full justify-center p-6 pt-4 md:pt-10">
      <div className="flex flex-col gap-2 p-2 w-full max-w-5xl">
        <div className="flex flex-row justify-between group bg-blue-50/30 rounded-lg p-4 border border-blue-100/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
            <p className="text-2xl font-semibold text-blue-900">
              {todolistName}
            </p>
          </div>
          <div
            className={`flex flex-row gap-4 items-center ${isTouch ? 'visible' : 'group-hover:visible invisible'}`}
          >
            <RenameTodolistDialog
              todolistId={selectedItem}
              currentName={todolistName || ''}
            >
              <button className="text-blue-400 hover:text-blue-600">
                <FaPen className="h-5 w-5" />
              </button>
            </RenameTodolistDialog>
            <DeleteTodolistDialog
              todolistId={selectedItem}
              todolistName={todolistName || ''}
              todolistCount={todolistAmount || 0}
            >
              <button className="text-red-400 hover:text-red-600">
                <FaTrash className="h-5 w-5" />
              </button>
            </DeleteTodolistDialog>
          </div>
        </div>

        {/* Tasks section with loading and error states */}
        {tasksError ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <p className="text-sm text-gray-600">Failed to load tasks</p>
            </div>
            <Button
              onClick={() => refetchTasks()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : tasksLoading ? (
          <div className="flex flex-col gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-16 w-full" />
                <Separator />
              </div>
            ))}
          </div>
        ) : (
          <TaskCardList tasks={tasks || []} />
        )}

        <NewTask callback={newTaskInput} disabled={isCreatingTask} />
        <Separator />
      </div>
    </div>
  );
};

export default TodolistView;
