import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/UI/dialog';
import { Button } from '../../../components/UI/button';
import { Spinner } from '../../../components/UI/spinner';
import { useDeleteTodolistMutation } from '../services/todolistApi';
import { toast } from 'sonner';
import { FaTrash } from 'react-icons/fa';
import { setSelectedItem } from '../../ui/uiSlice';

interface DeleteTodolistDialogProps {
  todolistId: string;
  todolistName: string;
  todolistCount: number;
  children?: React.ReactNode;
}

export default function DeleteTodolistDialog({
  todolistId,
  todolistName,
  todolistCount,
  children,
}: DeleteTodolistDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteTodolist, { isLoading }] = useDeleteTodolistMutation();
  const dispatch = useDispatch();

  const handleDelete = async () => {
    if (todolistCount <= 1) {
      toast.error('Cannot delete todolist', {
        description: 'You must have at least one todolist.',
      });
      return;
    }

    try {
      await deleteTodolist(todolistId).unwrap();
      toast.success('Todolist deleted', {
        description: `"${todolistName}" and all its tasks have been deleted.`,
      });
      // Switch to Inbox after successful deletion
      dispatch(setSelectedItem('Inbox'));
      setOpen(false);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || 'Failed to delete todolist. Please try again.';
      toast.error('Delete failed', {
        description: errorMessage,
      });
    }
  };

  const canDelete = todolistCount > 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-500 hover:bg-red-50"
            disabled={!canDelete}
          >
            <FaTrash className="h-3 w-3" />
            Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Todolist</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{todolistName}"? This action cannot
            be undone. All tasks in this todolist will also be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || !canDelete}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete Todolist'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
