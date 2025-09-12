import TaskCard from './TaskCard';
import { TaskType } from '../types';
import { Separator } from '../../../components/UI/separator';
import { Fragment } from 'react/jsx-runtime';
import { CheckSquare } from 'lucide-react';

function TaskCardList({ tasks }: { tasks: TaskType[] }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gray-100 p-4">
            <CheckSquare className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
            <p className="text-sm text-gray-500">
              Create your first task to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <Fragment key={task.id}>
          <TaskCard task={task} />
          <Separator />
        </Fragment>
      ))}
    </div>
  );
}

export default TaskCardList;
