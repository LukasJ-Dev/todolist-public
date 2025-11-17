import { useState } from 'react';
import { useGetAllTasksQuery } from '../../services/taskApi';
import { TaskType } from '../../types';
import TaskCardList from './TaskCardList';
import { TaskFilter } from './TaskFilter';
import { Input } from '../../../../components/UI/input';
import { TaskDetailCard } from '../task-detail/TaskDetailCard';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelectedTask } from '../../../ui/uiSelector';
import { setSelectedTask } from '../../../ui/uiSlice';
import { cn } from '../../../../lib/utils';
import { groupTasksByDate } from './dateGroupingUtils';

export default function UpcomingView() {
  const [search, setSearch] = useState('');
  const selectedTask = useSelector(selectSelectedTask);
  const dispatch = useDispatch();

  // Get all tasks without subtask population (independent view)
  const {
    data: tasks,
    isLoading,
    error,
  } = useGetAllTasksQuery({
    // Don't include subtasks for upcoming view
  });

  // Filter tasks for upcoming (due date today or in the future)
  const upcomingTasks =
    tasks?.filter((task: TaskType) => {
      if (!task.dueDate) return false;

      const today = new Date(new Date().setHours(0, 0, 0, 0));
      const dueDate = new Date(task.dueDate);

      // Show tasks that are due today or in the future
      return dueDate >= today;
    }) || [];

  // Apply search filter
  const filteredTasks = upcomingTasks.filter((task) =>
    task.name?.toLowerCase().includes(search.toLowerCase())
  );

  // Group tasks by date sections
  const dateGroups = groupTasksByDate(filteredTasks);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading upcoming tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-600">Error loading upcoming tasks</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Upcoming</h1>
                <p className="text-gray-600">
                  {filteredTasks.length} upcoming task
                  {filteredTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search upcoming tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              <TaskFilter onFilterChange={() => {}} />
            </div>
          </div>

          {/* Task List - Date Grouped */}
          <div className="flex-1 space-y-6">
            {dateGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming tasks found</p>
              </div>
            ) : (
              dateGroups.map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {group.label}
                    </h3>
                    <span className="text-sm text-gray-500">
                      ({group.dateRange})
                    </span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-sm text-gray-500">
                      {group.tasks.length} task
                      {group.tasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <TaskCardList
                    tasks={group.tasks}
                    viewMode="independent" // Independent view - no subtask hierarchy
                  />
                </div>
              ))
            )}
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
