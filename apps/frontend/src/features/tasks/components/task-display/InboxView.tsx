import { useState } from 'react';
import { useGetAllTasksQuery } from '../../services/taskApi';
// TaskType is used in the filter function
import TaskCardList from './TaskCardList';
import { TaskFilter } from './TaskFilter';
import { Input } from '../../../../components/UI/input';
import { TaskDetailCard } from '../task-detail/TaskDetailCard';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelectedTask } from '../../../ui/uiSelector';
import { setSelectedTask } from '../../../ui/uiSlice';
import { cn } from '../../../../lib/utils';

export default function InboxView() {
  const [search, setSearch] = useState('');
  const [filters] = useState({});
  const selectedTask = useSelector(selectSelectedTask);
  const dispatch = useDispatch();

  // Get all tasks with subtask population (hierarchical view)
  const {
    data: tasks,
    isLoading,
    error,
  } = useGetAllTasksQuery({
    ...filters,
    include: 'subtasks', // Include subtasks for hierarchical view
  });

  // Apply search filter
  const filteredTasks =
    tasks?.filter((task) =>
      task.name?.toLowerCase().includes(search.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading inbox...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600">Error loading inbox</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-row gap-2 w-full justify-center overflow-x-hidden',
        selectedTask ? 'p-4 pt-2 md:pt-4' : 'p-6 pt-4 md:pt-10'
      )}
    >
      <div
        className={cn(
          'flex gap-4 w-full',
          selectedTask
            ? 'max-w-7xl lg:grid lg:grid-cols-[2fr_1fr]'
            : 'max-w-6xl'
        )}
      >
        {/* Task List */}
        <div className="flex flex-col gap-4 w-full">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
                <p className="text-gray-600">
                  {filteredTasks.length} task
                  {filteredTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search inbox..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <TaskFilter onFilterChange={() => {}} />
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1">
            <TaskCardList
              tasks={filteredTasks}
              viewMode="hierarchical" // Hierarchical view - subtasks under parents
            />
          </div>
        </div>

        {/* Task Detail */}
        {selectedTask && (
          <div className="hidden lg:block">
            <TaskDetailCard
              task={selectedTask}
              onClose={() => dispatch(setSelectedTask(null))}
              className="sticky top-4"
            />
          </div>
        )}
      </div>

      {/* Mobile Task Detail Overlay */}
      {selectedTask && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[80vh] rounded-t-lg overflow-hidden">
            <TaskDetailCard
              task={selectedTask}
              onClose={() => dispatch(setSelectedTask(null))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
