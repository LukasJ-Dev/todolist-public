import { cn } from '../../../../lib/utils';
import { PriorityIndicator } from '../../../../components/UI/priority-indicator';
import { DateDisplay } from '../../../../components/UI/date-display';
import { Badge } from '../../../../components/UI/badge';
import { Tag } from '../../../../components/UI/tag';
import { SubtaskList } from '../task-display/SubtaskList';
import { TaskType } from '../../types';
import { Calendar, Clock, Tag as TagIcon, RotateCcw } from 'lucide-react';

interface ReadOnlyProps {
  name?: string;
  description?: string;
  checked?: boolean;
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  nextDueDate?: string;
  tags: string[];
  todolistName?: string;
  subtasks?: TaskType[];
  onAddSubtask?: (parentTaskId: string) => void;
}

export default function TaskDetailReadOnly({
  name,
  description,
  checked,
  priority,
  isRecurring,
  isOverdue,
  isDueToday,
  startDate,
  dueDate,
  completedAt,
  recurrenceType,
  recurrenceInterval,
  nextDueDate,
  tags,
  todolistName,
  subtasks = [],
  onAddSubtask,
}: ReadOnlyProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3
          className={cn(
            'text-lg font-semibold text-gray-900 mb-1',
            checked && 'line-through text-gray-500'
          )}
        >
          {name || 'Untitled Task'}
        </h3>
        {description && (
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <PriorityIndicator priority={priority} size="md" />
        {checked && (
          <Badge variant="default" className="gap-1">
            <Clock className="h-3 w-3" />
            Completed
          </Badge>
        )}
        {isOverdue && !checked && (
          <Badge variant="destructive" className="gap-1">
            <Calendar className="h-3 w-3" />
            Overdue
          </Badge>
        )}
        {isDueToday && !isOverdue && !checked && (
          <Badge
            variant="secondary"
            className="gap-1 text-orange-600 bg-orange-100"
          >
            <Calendar className="h-3 w-3" />
            Due Today
          </Badge>
        )}
        {isRecurring && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <RotateCcw className="h-3 w-3" />
            Recurring
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {startDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Starts:</span>
            <DateDisplay date={startDate} type="start" />
          </div>
        )}
        {dueDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Due:</span>
            <DateDisplay
              date={dueDate}
              type="due"
              className={cn(
                isOverdue && 'text-red-600 bg-red-100',
                isDueToday && !isOverdue && 'text-orange-600 bg-orange-100'
              )}
            />
          </div>
        )}
        {completedAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Completed:</span>
            <DateDisplay date={completedAt} type="completed" />
          </div>
        )}
      </div>

      {isRecurring && recurrenceType && (
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <RotateCcw className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">
              Recurrence
            </span>
          </div>
          <p className="text-sm text-purple-700">
            Every {recurrenceInterval} {recurrenceType}
            {recurrenceInterval && recurrenceInterval > 1 ? 's' : ''}
          </p>
          {nextDueDate && (
            <p className="text-xs text-purple-600 mt-1">
              Next: {new Date(nextDueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {tags && tags.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TagIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Tags</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Tag key={tag} tag={tag} size="sm" variant="secondary" />
            ))}
          </div>
        </div>
      )}

      {todolistName && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">List:</span>
            <span className="text-sm font-medium text-gray-900">
              {todolistName}
            </span>
          </div>
        </div>
      )}

      {/* Subtasks */}
      {subtasks && subtasks.length > 0 && (
        <div className="mt-4">
          <SubtaskList
            parentTask={{ id: 'current', name: name || 'Task' } as TaskType}
            subtasks={subtasks}
            onAddSubtask={onAddSubtask}
          />
        </div>
      )}
    </div>
  );
}
