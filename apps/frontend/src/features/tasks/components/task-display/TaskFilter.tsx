import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../../../../components/UI/button';
import { Input } from '../../../../components/UI/input';
import { Badge } from '../../../../components/UI/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/UI/select';

interface TaskFilterProps {
  onFilterChange: (filters: TaskFilters) => void;
  className?: string;
}

export interface TaskFilters {
  filter?:
    | 'all'
    | 'due_today'
    | 'due_this_week'
    | 'overdue'
    | 'recurring'
    | 'subtasks';
  sort?: 'due_date' | 'priority' | 'created' | 'name';
  priority?: 'low' | 'medium' | 'high';
  tags?: string;
}

const filterOptions = [
  { value: 'all', label: 'All tasks' },
  { value: 'due_today', label: 'Due today' },
  { value: 'due_this_week', label: 'Due this week' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'subtasks', label: 'Subtasks' },
];

const sortOptions = [
  { value: 'created', label: 'Created date' },
  { value: 'due_date', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'name', label: 'Name' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', priority: 'low' as const },
  { value: 'medium', label: 'Medium', priority: 'medium' as const },
  { value: 'high', label: 'High', priority: 'high' as const },
];

export function TaskFilter({ onFilterChange, className }: TaskFilterProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = (key: keyof TaskFilters, value: string | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== undefined
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1">
              {Object.values(filters).filter((v) => v !== undefined).length}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Filter by status
              </label>
              <Select
                value={filters.filter || 'all'}
                onValueChange={(value) =>
                  updateFilter('filter', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All tasks" />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Sort by
              </label>
              <Select
                value={filters.sort || 'created'}
                onValueChange={(value) => updateFilter('sort', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Priority
              </label>
              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) =>
                  updateFilter('priority', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tags
              </label>
              <Input
                placeholder="Filter by tags (comma-separated)"
                value={filters.tags || ''}
                onChange={(e) =>
                  updateFilter('tags', e.target.value || undefined)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
