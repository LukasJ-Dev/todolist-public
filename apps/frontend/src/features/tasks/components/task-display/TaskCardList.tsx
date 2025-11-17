import TaskCard from './TaskCard';
import { SubtaskList } from './SubtaskList';
import { TaskType } from '../../types';
import { Separator } from '../../../../components/UI/separator';
import { Fragment } from 'react/jsx-runtime';
import { CheckSquare } from 'lucide-react';

interface TaskCardListProps {
  tasks: TaskType[];
  viewMode?: 'hierarchical' | 'independent';
}

function TaskCardList({ tasks, viewMode = 'hierarchical' }: TaskCardListProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gray-100 p-4">
            <CheckSquare className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">No tasks yet</h3>
            <p className="text-sm text-gray-500">
              Create your first task to get started
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'independent') {
    // Independent view: show all tasks flat, no hierarchy
    return (
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <Fragment key={task.id}>
            <TaskCard task={task} />
            <Separator />
          </Fragment>
        ))}
      </div>
    );
  }

  // Hierarchical view: group tasks by parent-child relationships
  const parentTasks = tasks.filter((task) => !task.parentTask);
  const subtasks = tasks.filter((task) => task.parentTask);

  const getSubtasksForParent = (parentId: string) => {
    return subtasks.filter((subtask) => {
      // Handle both string ID and populated object
      if (typeof subtask.parentTask === 'string') {
        return subtask.parentTask === parentId;
      } else if (subtask.parentTask && typeof subtask.parentTask === 'object') {
        return subtask.parentTask.id === parentId;
      }
      return false;
    });
  };

  // Recursive component for rendering subtasks with proper nesting
  const renderSubtasks = (
    parentTask: TaskType,
    subtasks: TaskType[],
    depth: number = 0
  ) => {
    if (subtasks.length === 0) return null;

    return (
      <SubtaskList
        parentTask={parentTask}
        subtasks={subtasks}
        depth={depth}
        allTasks={tasks}
        className={`ml-${Math.min(depth * 6, 18)}`}
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {parentTasks.map((task) => {
        const taskSubtasks = getSubtasksForParent(task.id);

        return (
          <Fragment key={task.id}>
            <div>
              <TaskCard task={task} />
              {taskSubtasks.length > 0 && (
                <div className="mt-2">{renderSubtasks(task, taskSubtasks)}</div>
              )}
            </div>
            <Separator />
          </Fragment>
        );
      })}
    </div>
  );
}

export default TaskCardList;
