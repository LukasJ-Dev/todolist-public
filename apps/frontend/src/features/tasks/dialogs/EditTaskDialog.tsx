import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../../../components/UI/sheet';
import { FaPen } from 'react-icons/fa';

import { Button } from '../../../components/UI/button';
import EditTaskForm from '../components/TaskEditForm';
import { TaskType } from '../types';
import DeleteDialog from './DeleteTaskDialog';

function EditDialog({ task }: { task: TaskType }) {
  const [open, setOpen] = useState(false);

  const closeDialog = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button>
          <FaPen className="text-blue-400 hover:text-blue-600 cursor-pointer" />
        </button>
      </SheetTrigger>
      <SheetContent className="h-full">
        <SheetHeader>
          <div className="flex flex-row gap-2 items-center">
            <SheetTitle>Edit Task</SheetTitle>
            <DeleteDialog task={task} />
          </div>
        </SheetHeader>
        <EditTaskForm
          closeDialog={closeDialog}
          footer={
            <SheetFooter>
              <Button type="submit">Save changes</Button>
              <Button variant="outline" onClick={closeDialog}>
                Discard Changes
              </Button>
            </SheetFooter>
          }
          task={task}
        />
      </SheetContent>
    </Sheet>
  );
}

export default EditDialog;
