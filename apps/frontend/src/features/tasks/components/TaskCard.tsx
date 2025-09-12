import { TaskType } from '../types';

interface Props {
  task: TaskType;
}

import EditDialog from '../dialogs/EditTaskDialog';
import { useUpdateTaskMutation } from '../services/taskApi';
import TaskCheckbox from '../../../components/UI/task-checkbox';
import { useTouch } from '../../../hooks/useTouch';

function TaskCard({ task }: Props) {
  const [updateTask] = useUpdateTaskMutation();
  const isTouch = useTouch();

  const handleCheck = (checked: boolean) => {
    updateTask({ ...task, checked });
  };

  return (
    <div className="flex gap-2 w-full justify-between hover:bg-blue-50 group">
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
      <div
        className={`flex flex-row gap-6 items-center p-2 ${isTouch ? 'visible' : 'group-hover:visible invisible'}`}
      >
        {/* When hovering the TaskCard, the pen should be visible on desktop, always visible on touch devices */}
        <EditDialog task={task} />
      </div>
    </div>
  );
}

export default TaskCard;
