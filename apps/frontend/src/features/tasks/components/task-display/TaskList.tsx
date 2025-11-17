import TaskCardList from './TaskCardList';
import { useGetAllTasksQuery } from '../../services/taskApi';
import { Input } from '../../../../components/UI/input';
import { TaskDetailCard } from '../task-detail/TaskDetailCard';
import { useSelector, useDispatch } from 'react-redux';
import { selectSelectedTask } from '../../../ui/uiSelector';
import { setSelectedTask } from '../../../ui/uiSlice';
import { cn } from '../../../../lib/utils';
import { useState } from 'react';
import { TaskFilter, TaskFilters } from './TaskFilter';

const AllTasks = () => {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TaskFilters>({});
  const selectedTask = useSelector(selectSelectedTask);
  const dispatch = useDispatch();

  const { data: tasks } = useGetAllTasksQuery({
    ...filters,
    // No subtask population needed for independent view
  });

  const filteredTasks = tasks?.filter((task) =>
    task.name?.toLowerCase().includes(search.toLowerCase())
  );

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
        <div
          className={cn(
            'flex flex-col gap-4 w-full',
            selectedTask ? 'p-1' : 'p-2 max-w-4xl'
          )}
        >
          <div className="bg-blue-50/30 rounded-lg p-4 border border-blue-100/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
              <p className="text-2xl font-semibold text-blue-900">Inbox</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-4">
              <Input
                placeholder="Search tasks..."
                className="w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <TaskFilter onFilterChange={setFilters} />
          </div>

          <TaskCardList tasks={filteredTasks || []} viewMode="independent" />
        </div>

        {/* Task Detail Card - Desktop */}
        {selectedTask && (
          <div className="hidden lg:block p-1 min-w-0 task-detail-sidebar">
            <TaskDetailCard
              task={selectedTask}
              onClose={() => dispatch(setSelectedTask(null))}
              className="h-full max-h-[calc(100vh-8rem)]"
            />
          </div>
        )}
      </div>

      {/* Task Detail Card - Mobile/Tablet */}
      {selectedTask && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="w-full max-h-[80vh] bg-white rounded-t-lg">
            <TaskDetailCard
              task={selectedTask}
              onClose={() => dispatch(setSelectedTask(null))}
              className="h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllTasks;
