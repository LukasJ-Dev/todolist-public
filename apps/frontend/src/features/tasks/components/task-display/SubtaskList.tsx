import { TaskType } from '../../types';
import { cn } from '../../../../lib/utils';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Button } from '../../../../components/UI/button';
import TaskCard from './TaskCard';
import { useState } from 'react';

interface SubtaskListProps {
  parentTask: TaskType;
  subtasks: TaskType[];
  onAddSubtask?: (parentTaskId: string) => void;
  className?: string;
  depth?: number;
  allTasks?: TaskType[]; // All tasks to find nested subtasks
}

export function SubtaskList({
  parentTask,
  subtasks,
  onAddSubtask,
  className,
  depth = 0,
  allTasks = [],
}: SubtaskListProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (subtasks.length === 0 && !onAddSubtask) {
    return null;
  }

  return (
    <div className={cn('ml-6 border-l-2 border-gray-200 pl-4', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 w-6 p-0"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <span className="text-sm font-medium text-gray-600">
          Subtasks ({subtasks.length})
          {depth > 0 && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
              Level {depth + 1}
            </span>
          )}
        </span>

        {onAddSubtask && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddSubtask(parentTask.id)}
            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-100"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Subtask
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {subtasks.map((subtask) => {
            // Find nested subtasks for this subtask
            const nestedSubtasks = allTasks.filter((task) => {
              if (typeof task.parentTask === 'string') {
                return task.parentTask === subtask.id;
              } else if (
                task.parentTask &&
                typeof task.parentTask === 'object'
              ) {
                return task.parentTask.id === subtask.id;
              }
              return false;
            });

            return (
              <div key={subtask.id} className="relative">
                <div className="absolute -left-6 top-6 w-4 h-0.5 bg-gray-200"></div>
                <div className="ml-2">
                  <TaskCard task={subtask} />
                  {nestedSubtasks.length > 0 && (
                    <SubtaskList
                      parentTask={subtask}
                      subtasks={nestedSubtasks}
                      depth={depth + 1}
                      allTasks={allTasks}
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
