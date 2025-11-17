import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../../components/UI/form';
import { Input } from '../../../../components/UI/input';
import { Textarea } from '../../../../components/UI/textarea';
import { Button } from '../../../../components/UI/button';
import { EnhancedDatePicker } from '../../../../components/UI/enhanced-date-picker';
import { PrioritySelector } from '../../../../components/UI/priority-selector';
import { TagInput } from '../../../../components/UI/tag-input';
import { RecurrenceSelector } from '../../../../components/UI/recurrence-selector';
import { ParentTaskSelector } from '../../../../components/UI/parent-task-selector';
import {
  useCreateTaskMutation,
  useGetAllTasksQuery,
} from '../../services/taskApi';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z
    .string()
    .min(1, 'Task name is required')
    .max(200, 'Task name is too long'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  isRecurring: z.boolean(),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  recurrenceInterval: z.number().min(1).max(99).optional(),
  tags: z.array(z.string()),
  parentTask: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EnhancedTaskFormProps {
  todolistId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function EnhancedTaskForm({
  todolistId,
  onSuccess,
  onCancel,
  className,
}: EnhancedTaskFormProps) {
  const [createTask, { isLoading }] = useCreateTaskMutation();
  const { data: allTasks = [] } = useGetAllTasksQuery();
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<
    'daily' | 'weekly' | 'monthly' | 'yearly'
  >('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [tags, setTags] = useState<string[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      priority: 'medium',
      isRecurring: false,
      tags: [],
    },
    disabled: isLoading,
  });

  const onSubmit = async (data: FormData) => {
    if (!todolistId) {
      toast.error('No todolist selected');
      return;
    }

    try {
      await createTask({
        name: data.name,
        todolist: todolistId,
        description: data.description,
        dueDate: data.dueDate,
        startDate: data.startDate,
        priority: data.priority,
        isRecurring: data.isRecurring,
        recurrenceType: data.isRecurring ? data.recurrenceType : undefined,
        recurrenceInterval: data.isRecurring
          ? data.recurrenceInterval
          : undefined,
        tags: data.tags,
        parentTask: data.parentTask || undefined,
      }).unwrap();

      toast.success('Task created!', {
        description: `Task "${data.name}" has been created successfully.`,
      });

      form.reset();
      setTags([]);
      setIsRecurring(false);
      onSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || 'Failed to create task. Please try again.';
      toast.error('Creation failed', {
        description: errorMessage,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={className}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter task name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter task description (optional)"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <EnhancedDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select start date"
                      allowPast={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <EnhancedDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Select due date"
                      allowPast={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <FormControl>
                  <PrioritySelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagInput
                    tags={tags}
                    onChange={(newTags) => {
                      setTags(newTags);
                      field.onChange(newTags);
                    }}
                    placeholder="Add tags..."
                    maxTags={10}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentTask"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Task (Optional)</FormLabel>
                <FormControl>
                  <ParentTaskSelector
                    value={field.value}
                    onChange={field.onChange}
                    tasks={allTasks}
                    placeholder="Select a parent task to make this a subtask"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <RecurrenceSelector
            isRecurring={isRecurring}
            recurrenceType={recurrenceType}
            recurrenceInterval={recurrenceInterval}
            onRecurringChange={(recurring) => {
              setIsRecurring(recurring);
              form.setValue('isRecurring', recurring);
            }}
            onTypeChange={(type) => {
              setRecurrenceType(type);
              form.setValue('recurrenceType', type);
            }}
            onIntervalChange={(interval) => {
              setRecurrenceInterval(interval);
              form.setValue('recurrenceInterval', interval);
            }}
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
