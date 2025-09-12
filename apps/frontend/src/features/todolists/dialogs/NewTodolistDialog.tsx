import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/UI/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/UI/form';
import { Input } from '../../../components/UI/input';
import { Button } from '../../../components/UI/button';
import { Spinner } from '../../../components/UI/spinner';
import { useCreateTodolistMutation } from '../services/todolistApi';
import { toast } from 'sonner';
import { FaPlus } from 'react-icons/fa';

const newTodolistSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Todolist name is required' })
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name must be less than 50 characters' }),
});

type NewTodolistFormData = z.infer<typeof newTodolistSchema>;

interface NewTodolistDialogProps {
  children?: React.ReactNode;
}

export default function NewTodolistDialog({
  children,
}: NewTodolistDialogProps) {
  const [open, setOpen] = useState(false);
  const [createTodolist, { isLoading }] = useCreateTodolistMutation();

  const form = useForm<NewTodolistFormData>({
    resolver: zodResolver(newTodolistSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: NewTodolistFormData) => {
    try {
      await createTodolist({ name: values.name }).unwrap();
      toast.success('Todolist created!', {
        description: `"${values.name}" has been created successfully.`,
      });
      form.reset();
      setOpen(false);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || 'Failed to create todolist. Please try again.';
      toast.error('Creation failed', {
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-2">
            <FaPlus className="h-3 w-3" />
            New Todolist
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Todolist</DialogTitle>
          <DialogDescription>
            Create a new todolist to organize your tasks.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Todolist Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter todolist name"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Todolist'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
