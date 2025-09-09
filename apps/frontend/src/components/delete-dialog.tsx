import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './UI/dialog';
import { Button } from './UI/button';
import { TaskType } from '../types';
import { useDeleteTaskMutation } from '../services/taskApi';

function DeleteDialog({ task }: { task: TaskType }) {
  const [deleteTask] = useDeleteTaskMutation();

  const handleDelete = () => {
    deleteTask(task._id);
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button
          variant="outline"
          className="border-red-200 text-red-500"
          onClick={() => {}}
          size="sm"
        >
          Delete
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete "
            {task.name}" and remove it from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteDialog;
