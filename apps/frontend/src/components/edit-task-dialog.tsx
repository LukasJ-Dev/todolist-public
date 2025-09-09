import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './UI/sheet';
import { FaPen } from 'react-icons/fa';

import { Button } from './UI/button';
import EditTaskForm from './edit-task.form';
import { TaskType } from '../types';
import DeleteDialog from './delete-dialog';

function EditDialog({ task }: { task: TaskType }) {
  return (
    <Sheet>
      <SheetTrigger>
        <FaPen className="text-gray-400 hover:text-gray-600 cursor-pointer" />
      </SheetTrigger>
      <SheetContent className="h-full">
        <SheetHeader>
          <div className="flex flex-row gap-2 items-center">
            <SheetTitle>Edit Task</SheetTitle>
            <DeleteDialog task={task} />
          </div>
        </SheetHeader>
        <EditTaskForm
          closeDialog={() => {}}
          footer={
            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">Save changes</Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="outline">Discard Changes</Button>
              </SheetClose>
            </SheetFooter>
          }
          task={task}
        />
      </SheetContent>
    </Sheet>
  );
}

export default EditDialog;
