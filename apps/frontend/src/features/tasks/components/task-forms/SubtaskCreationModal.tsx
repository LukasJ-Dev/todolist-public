import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Button } from '../../../../components/UI/button';
import { Input } from '../../../../components/UI/input';
import { Textarea } from '../../../../components/UI/textarea';
import { X } from 'lucide-react';
import { useCreateTaskMutation } from '../../services/taskApi';
import { toast } from 'sonner';
import { PrioritySelector } from '../../../../components/UI/priority-selector';
import { TagInput } from '../../../../components/UI/tag-input';

const formSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string()),
});

type FormData = z.infer<typeof formSchema>;

interface SubtaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentTaskId: string;
  parentTaskName: string;
  todolistId: string;
  depth?: number;
  onSuccess?: () => void;
}

export function SubtaskCreationModal({
  isOpen,
  onClose,
  parentTaskId,
  parentTaskName,
  todolistId,
  depth = 0,
  onSuccess,
}: SubtaskCreationModalProps) {
  const [createTask, { isLoading }] = useCreateTaskMutation();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 'medium',
      tags: [],
    },
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('Resetting form for subtask modal');
      form.reset({
        name: '',
        description: '',
        priority: 'medium',
        tags: [],
      });
    }
  }, [isOpen, form]);

  const onSubmit = async (data: FormData) => {
    console.log('SubtaskCreationModal onSubmit:', {
      data,
      parentTaskId,
      parentTaskName,
      todolistId,
      depth,
    });

    if (!todolistId) {
      toast.error('No todolist selected');
      return;
    }

    // Note: Backend will handle depth validation

    try {
      const result = await createTask({
        name: data.name,
        description: data.description || '',
        todolist: todolistId,
        parentTask: parentTaskId,
        priority: data.priority || 'medium',
        tags: data.tags,
      }).unwrap();

      console.log('Subtask created successfully:', result);
      toast.success('Subtask created successfully');
      form.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error creating subtask:', error);
      toast.error('Failed to create subtask');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold">Add Subtask</h2>
            <p className="text-sm text-gray-600">
              Adding to: <span className="font-medium">{parentTaskName}</span>
              {depth > 0 && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Level {depth + 1}
                </span>
              )}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name *
            </label>
            <Input
              {...form.register('name')}
              placeholder="Enter subtask name"
              className="w-full"
              onChange={(e) => {
                console.log('Name field changed:', e.target.value);
                form.setValue('name', e.target.value);
              }}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              {...form.register('description')}
              placeholder="Enter subtask description"
              className="w-full"
              rows={3}
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <PrioritySelector
              value={form.watch('priority') || 'medium'}
              onChange={(priority) => form.setValue('priority', priority)}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <TagInput
              tags={form.watch('tags')}
              onChange={(tags) => form.setValue('tags', tags)}
              placeholder="Add tags..."
              maxTags={5}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Subtask'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
