import { Button } from '../../../components/UI/button';
import { Input } from '../../../components/UI/input';
import { Spinner } from '../../../components/UI/spinner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../../../components/UI/form';
import { useLoginMutation, useMeQuery } from '../services/authApi';
import { useNavigate } from 'react-router-dom';
import { signinSchema, type SigninFormData } from '../schemas/authSchemas';
import { toast } from 'sonner';
export default function SigninForm() {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const { refetch } = useMeQuery();

  const form = useForm<SigninFormData>({
    resolver: zodResolver(signinSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: SigninFormData) => {
    try {
      await login(values).unwrap();
      await refetch();
      toast.success('Welcome back!', {
        description: 'You have been successfully signed in.',
      });
      navigate('/');
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        'Failed to sign in. Please try again.';
      toast.error('Sign in failed', {
        description: errorMessage,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...field}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage className="text-red-500 text-sm" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  {...field}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage className="text-red-500 text-sm" />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>
    </Form>
  );
}
