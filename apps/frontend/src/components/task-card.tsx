import { TaskType } from '../types';

interface Props {
  task: TaskType;
}

import EditDialog from './edit-task-dialog';
import { useUpdateTaskMutation } from '../services/taskApi';
import TaskCheckbox from './UI/task-checkbox';

function TaskCard({ task }: Props) {
  const [updateTask] = useUpdateTaskMutation();

  const handleCheck = (checked: boolean) => {
    console.log(checked);
    console.log(task._id);
    updateTask({ _id: task._id, checked });
  };

  return (
    <div className="flex gap-2 w-full justify-between hover:bg-gray-200 group">
      <div className="flex items-center gap-2">
        <TaskCheckbox
          onChecked={(checked: boolean) => handleCheck(checked)}
          checked={task.checked || false}
        />
        <div className="flex flex-col">
          <span className="flex items-center gap-2">{task.name}</span>
          <span
            className={`flex items-center gap-2 text-sm   ${task.description ? 'text-gray-700 font-normal' : 'italic text-gray-400'}`}
          >
            {task.description || 'No description'}
          </span>
        </div>
      </div>
      <div className="flex flex-row gap-6 items-center p-2 group-hover:visible invisible">
        {/* When hovering the TaskCard, the pen should be visible */}
        <EditDialog task={task} />
      </div>
    </div>
  );
}

export default TaskCard;
