import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from '../../../components/UI/form';
import { Input } from '../../../components/UI/input';
import { Textarea } from '../../../components/UI/textarea';
import { TaskType } from '../types';
import { useUpdateTaskMutation } from '../services/taskApi';
import { toast } from 'sonner';

const formSchema = z.object({
  taskName: z.string(),
  taskDescription: z.string(),
});

function EditTaskForm({
  footer,
  task,
  closeDialog,
}: {
  footer: React.ReactNode;
  task: TaskType;
  closeDialog: () => void;
}) {
  const [updateTask, { isLoading }] = useUpdateTaskMutation();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskName: task.name,
      taskDescription: task.description,
    },
    disabled: isLoading,
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      await updateTask({
        ...task,
        name: data.taskName,
        description: data.taskDescription,
      }).unwrap();

      toast.success('Task updated!', {
        description: `Task "${data.taskName}" has been updated successfully.`,
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      closeDialog();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || 'Failed to update task. Please try again.';
      toast.error('Update failed', {
        description: errorMessage,
      });
      // Don't close the dialog on error - let user see the error and try again
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full flex flex-col justify-between"
      >
        <div className="flex flex-col gap-4 h-full p-4">
          <FormField
            control={form.control}
            name="taskName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="taskDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Task Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {footer}
      </form>
    </Form>
  );
}

export default EditTaskForm;
