import TaskCard from './task-card';
import { TaskType } from '../types';
import { Separator } from './UI/separator';
import { Fragment } from 'react/jsx-runtime';

function TaskCardList({ tasks }: { tasks: TaskType[] }) {
  return (
    <div className="flex flex-col gap-2">
      {tasks?.map((task) => (
        <Fragment key={task._id}>
          <TaskCard task={task} />
          <Separator />
        </Fragment>
      ))}
    </div>
  );
}

export default TaskCardList;
