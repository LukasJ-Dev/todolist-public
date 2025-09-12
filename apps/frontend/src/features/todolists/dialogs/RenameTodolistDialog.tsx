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
import { useUpdateTodolistMutation } from '../services/todolistApi';
import { toast } from 'sonner';
import { FaPen } from 'react-icons/fa';

const renameTodolistSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Todolist name is required' })
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name must be less than 50 characters' }),
});

type RenameTodolistFormData = z.infer<typeof renameTodolistSchema>;

interface RenameTodolistDialogProps {
  todolistId: string;
  currentName: string;
  children?: React.ReactNode;
}

export default function RenameTodolistDialog({
  todolistId,
  currentName,
  children,
}: RenameTodolistDialogProps) {
  const [open, setOpen] = useState(false);
  const [updateTodolist, { isLoading }] = useUpdateTodolistMutation();

  const form = useForm<RenameTodolistFormData>({
    resolver: zodResolver(renameTodolistSchema),
    defaultValues: {
      name: currentName,
    },
  });

  const onSubmit = async (values: RenameTodolistFormData) => {
    try {
      await updateTodolist({
        id: todolistId,
        name: values.name,
        createdAt: '',
        updatedAt: '',
      }).unwrap();
      toast.success('Todolist renamed!', {
        description: `Todolist has been renamed to "${values.name}".`,
      });
      setOpen(false);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || 'Failed to rename todolist. Please try again.';
      toast.error('Rename failed', {
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <FaPen className="h-3 w-3" />
            Rename
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Todolist</DialogTitle>
          <DialogDescription>
            Change the name of your todolist.
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
                      placeholder="Enter new todolist name"
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
                    Renaming...
                  </>
                ) : (
                  'Rename Todolist'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
