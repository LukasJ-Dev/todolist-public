import { TaskType } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUpdateTaskMutation } from '../../services/taskApi';
import { useEffect, useState } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/UI/button';
import DeleteDialog from '../../dialogs/DeleteTaskDialog';
import { useDispatch } from 'react-redux';
import { setSelectedTask } from '../../../ui/uiSlice';
import TaskDetailHeader from './TaskDetailHeader';
import TaskDetailEditContent from './TaskDetailEditContent';
import TaskDetailReadOnly from './TaskDetailReadOnly';
import { Plus } from 'lucide-react';
import { SubtaskCreationModal } from '../task-forms/SubtaskCreationModal';

// Make the interface more flexible to handle both old and new TaskType
interface FlexibleTaskType extends Partial<TaskType> {
  id: string;
  name?: string;
  description?: string;
  checked?: boolean;
  todolist?: {
    id: string;
    name: string;
  };
}

// Form validation schema
const taskFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Task name is required')
    .max(100, 'Task name must be less than 100 characters'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurrenceType: z
    .enum(['daily', 'weekly', 'monthly', 'yearly'])
    .optional()
    .nullable(),
  recurrenceInterval: z.number().int().min(1).optional(),
  tags: z.array(z.string()).optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskDetailCardProps {
  task: FlexibleTaskType;
  onClose: () => void;
  className?: string;
}

export function TaskDetailCard({
  task,
  onClose,
  className,
}: TaskDetailCardProps) {
  const [updateTask, { isLoading: isUpdating }] = useUpdateTaskMutation();
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubtaskModalOpen, setIsSubtaskModalOpen] = useState(false);

  // Calculate task depth (0 = top level, 1 = subtask, 2 = sub-subtask)
  const calculateTaskDepth = (task: FlexibleTaskType): number => {
    if (!task.parentTask) return 0;

    // If parentTask is a string ID, we can't calculate depth from here
    // This would require fetching the parent task, which we'll handle in the backend
    if (typeof task.parentTask === 'string') {
      return 1; // Assume it's a subtask if it has a parent
    }

    // If parentTask is populated, we can calculate depth
    if (typeof task.parentTask === 'object' && task.parentTask.id) {
      // This is a simplified calculation - in a real app, you'd need to fetch the full hierarchy
      return 1; // For now, assume subtasks are at depth 1
    }

    return 0;
  };

  const taskDepth = calculateTaskDepth(task);

  // Debug: Log task structure to see todolist info
  console.log('TaskDetailCard task:', {
    id: task.id,
    name: task.name,
    todolist: task.todolist,
    parentTask: task.parentTask,
    depth: taskDepth,
  });

  // Provide default values for enhanced properties
  const priority = task.priority || 'medium';
  const isRecurring = task.isRecurring || false;
  const tags = task.tags || [];
  const recurrenceInterval = task.recurrenceInterval || 1;

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: task.name ?? 'Untitled Task',
      description: task.description || '',
      priority: priority,
      dueDate: task.dueDate || null,
      startDate: task.startDate || null,
      isRecurring: isRecurring,
      recurrenceType: task.recurrenceType || null,
      recurrenceInterval: recurrenceInterval,
      tags: tags,
    },
  });

  const watchedValues = watch();

  const getInitialValues = () => ({
    name: task.name ?? 'Untitled Task',
    description: task.description || '',
    priority: priority as 'low' | 'medium' | 'high',
    dueDate: task.dueDate || null,
    startDate: task.startDate || null,
    isRecurring: isRecurring,
    recurrenceType: task.recurrenceType || null,
    recurrenceInterval: recurrenceInterval,
    tags: tags,
  });

  // Keep form in sync when the task changes or when toggling edit mode
  useEffect(() => {
    reset(getInitialValues());
  }, [task.id, isEditing, reset]);

  const onSubmit = async (data: TaskFormData) => {
    try {
      const edited = await updateTask({
        id: task.id,
        name: data.name,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate,
        startDate: data.startDate,
        isRecurring: data.isRecurring,
        recurrenceType: data.isRecurring ? data.recurrenceType : undefined,
        recurrenceInterval: data.isRecurring
          ? data.recurrenceInterval
          : undefined,
        tags: data.tags,
      }).unwrap();

      // Update the selected task so read-only view reflects latest title/description
      dispatch(setSelectedTask(edited));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form to original values
    setValue('name', task.name || '');
    setValue('description', task.description || '');
    setValue('priority', priority);
    setValue('dueDate', task.dueDate || null);
    setValue('startDate', task.startDate || null);
    setValue('isRecurring', isRecurring);
    setValue('recurrenceType', task.recurrenceType || null);
    setValue('recurrenceInterval', recurrenceInterval);
    setValue('tags', tags);
  };

  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !task.checked;
  const isDueToday =
    task.dueDate &&
    new Date(task.dueDate).toDateString() === new Date().toDateString();

  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col',
        className
      )}
    >
      <TaskDetailHeader
        isEditing={isEditing}
        isRecurring={isRecurring}
        isUpdating={isUpdating}
        isDirty={isDirty}
        onEdit={() => {
          reset(getInitialValues());
          setIsEditing(true);
        }}
        onCancel={handleCancel}
        onSave={handleSubmit(onSubmit)}
        onClose={onClose}
      />

      {/* Content */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TaskDetailEditContent
              nameError={errors.name?.message}
              nameValue={watchedValues.name || ''}
              descriptionValue={watchedValues.description || ''}
              priorityValue={
                (watchedValues.priority as 'low' | 'medium' | 'high') ||
                'medium'
              }
              startDateValue={watchedValues.startDate || null}
              dueDateValue={watchedValues.dueDate || null}
              isRecurringValue={watchedValues.isRecurring || false}
              recurrenceTypeValue={watchedValues.recurrenceType}
              recurrenceIntervalValue={watchedValues.recurrenceInterval || 1}
              tagsValue={watchedValues.tags || []}
              onChangeName={(v) => setValue('name', v, { shouldDirty: true })}
              onChangeDescription={(v) =>
                setValue('description', v, { shouldDirty: true })
              }
              onChangePriority={(v) =>
                setValue('priority', v, { shouldDirty: true })
              }
              onChangeStartDate={(v) =>
                setValue('startDate', v, { shouldDirty: true })
              }
              onChangeDueDate={(v) =>
                setValue('dueDate', v, { shouldDirty: true })
              }
              onChangeIsRecurring={(v) =>
                setValue('isRecurring', v, { shouldDirty: true })
              }
              onChangeRecurrenceType={(v) =>
                setValue('recurrenceType', v, { shouldDirty: true })
              }
              onChangeRecurrenceInterval={(v) =>
                setValue('recurrenceInterval', v, { shouldDirty: true })
              }
              onChangeTags={(v) => setValue('tags', v, { shouldDirty: true })}
            />
          </form>
        ) : (
          <TaskDetailReadOnly
            name={task.name}
            description={task.description}
            checked={task.checked}
            priority={priority}
            isRecurring={isRecurring}
            isOverdue={!!isOverdue}
            isDueToday={!!isDueToday}
            startDate={task.startDate}
            dueDate={task.dueDate}
            completedAt={task.completedAt}
            recurrenceType={task.recurrenceType}
            recurrenceInterval={recurrenceInterval}
            nextDueDate={task.nextDueDate}
            tags={tags}
            todolistName={task.todolist?.name}
            subtasks={
              Array.isArray(task.subtasks) &&
              task.subtasks.length > 0 &&
              typeof task.subtasks[0] === 'object'
                ? (task.subtasks as TaskType[])
                : []
            }
            onAddSubtask={(_parentTaskId) => {
              console.log(
                'Opening subtask modal for parent:',
                task.id,
                task.name
              );
              setIsSubtaskModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DeleteDialog task={task as TaskType} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log(
                  'Opening subtask modal from actions for parent:',
                  task.id,
                  task.name
                );
                setIsSubtaskModalOpen(true);
              }}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Subtask
            </Button>
          </div>
        </div>
      )}

      {/* Subtask Creation Modal */}
      <SubtaskCreationModal
        isOpen={isSubtaskModalOpen}
        onClose={() => setIsSubtaskModalOpen(false)}
        parentTaskId={task.id}
        parentTaskName={task.name || 'Task'}
        todolistId={task.todolist?.id || ''}
        depth={taskDepth}
        onSuccess={() => {
          // Refresh the task data or close the modal
          // The parent component should handle refreshing the task list
        }}
      />
    </div>
  );
}
