import { useState } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';
import { Check, ChevronDown, X } from 'lucide-react';
import { TaskType } from '../../features/tasks/types';

interface ParentTaskSelectorProps {
  value?: string;
  onChange: (parentTaskId: string | undefined) => void;
  tasks: TaskType[];
  className?: string;
  placeholder?: string;
}

export function ParentTaskSelector({
  value,
  onChange,
  tasks,
  className,
  placeholder = 'Select parent task (optional)',
}: ParentTaskSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter out tasks that already have a parent (no nested subtasks)
  const availableTasks = tasks.filter((task) => !task.parentTask);

  // Filter tasks based on search term
  const filteredTasks = availableTasks.filter((task) =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTask = availableTasks.find((task) => task.id === value);

  const handleSelect = (taskId: string) => {
    if (value === taskId) {
      onChange(undefined); // Deselect if already selected
    } else {
      onChange(taskId);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="outline"
        className={cn(
          'w-full justify-between text-left',
          !selectedTask && 'text-muted-foreground'
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedTask ? selectedTask.name : placeholder}</span>
        <div className="flex items-center gap-1">
          {selectedTask && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="p-2">
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredTasks.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No tasks found' : 'No available parent tasks'}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors',
                    value === task.id && 'bg-blue-50'
                  )}
                  onClick={() => handleSelect(task.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{task.name}</span>
                      {task.priority && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            task.priority === 'high' &&
                              'bg-red-100 text-red-700',
                            task.priority === 'medium' &&
                              'bg-amber-100 text-amber-700',
                            task.priority === 'low' &&
                              'bg-green-100 text-green-700'
                          )}
                        >
                          {task.priority.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {task.description}
                      </p>
                    )}
                  </div>
                  {value === task.id && (
                    <Check className="h-4 w-4 text-blue-600 ml-2 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
