import { TaskType } from '../../types';
import { useDispatch } from 'react-redux';
import { setSelectedTask } from '../../../ui/uiSlice';
import { Badge } from '../../../../components/UI/badge';
import { ChevronDown, Layers } from 'lucide-react';

interface Props {
  task: TaskType;
}

import { useUpdateTaskMutation } from '../../services/taskApi';
import TaskCheckbox from '../../../../components/UI/task-checkbox';
import { PriorityIndicator } from '../../../../components/UI/priority-indicator';
import { DateDisplay } from '../../../../components/UI/date-display';
import { Tag } from '../../../../components/UI/tag';
import { cn } from '../../../../lib/utils';

function TaskCard({ task }: Props) {
  const [updateTask] = useUpdateTaskMutation();
  const dispatch = useDispatch();

  const handleCheck = (checked: boolean) => {
    updateTask({
      id: task.id,
      checked,
      ...(checked && { completedAt: new Date().toISOString() }),
      ...(!checked && { completedAt: null }),
    });
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !task.checked;
  const isDueToday =
    task.dueDate &&
    new Date(task.dueDate).toDateString() === new Date().toDateString();

  const handleTaskClick = () => {
    dispatch(setSelectedTask(task));
  };

  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-lg flex gap-2 w-full justify-between group p-4 cursor-pointer hover:bg-gray-50 transition-colors',
        isOverdue && 'border-l-4 border-red-400',
        isDueToday && !isOverdue && 'border-l-4 border-orange-400'
      )}
      onClick={handleTaskClick}
    >
      <div className="flex items-start gap-3 flex-1">
        <div onClick={(e) => e.stopPropagation()}>
          <TaskCheckbox
            onChecked={(checked: boolean) => handleCheck(checked)}
            checked={task.checked || false}
          />
        </div>
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                'font-medium text-gray-900',
                task.checked && 'line-through text-gray-500'
              )}
            >
              {task.name}
            </span>
            {task.isRecurring && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                Recurring
              </span>
            )}
            {task.parentTask && (
              <Badge variant="outline" className="text-xs gap-1">
                <Layers className="h-3 w-3" />
                Subtask
              </Badge>
            )}
            {task.subtasks && task.subtasks.length > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <ChevronDown className="h-3 w-3" />
                {task.subtasks.length} subtask
                {task.subtasks.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {task.description && (
            <span className="text-sm text-gray-600">{task.description}</span>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <PriorityIndicator priority={task.priority} size="sm" />
            {task.dueDate && (
              <DateDisplay
                date={task.dueDate}
                type="due"
                className={cn(
                  isOverdue && 'text-red-600 bg-red-100',
                  isDueToday && !isOverdue && 'text-orange-600 bg-orange-100'
                )}
              />
            )}
            {task.startDate && (
              <DateDisplay date={task.startDate} type="start" />
            )}
            {task.completedAt && (
              <DateDisplay date={task.completedAt} type="completed" />
            )}
          </div>

          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 3).map((tag) => (
                <Tag key={tag} tag={tag} size="sm" variant="secondary" />
              ))}
              {task.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{task.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit drawer removed; editing now happens in TaskDetailCard */}
    </div>
  );
}

export default TaskCard;
