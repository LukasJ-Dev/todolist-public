import { Input } from '../components/UI/input';
import { Button } from '../components/UI/button';
import { useNavigate } from 'react-router-dom';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/UI/card';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../components/UI/form';
import { useSignupMutation, useMeQuery } from '../services/authApi';

const formSchema = z.object({
  name: z.string().min(1, {
    message: 'Name is required',
  }),
  email: z.email().min(1, {
    message: 'Email is required',
  }),
  password: z.string().min(1, {
    message: 'Password is required',
  }),
  passwordAgain: z.string().min(1, {
    message: 'Password Again is required',
  }),
});

function newSignIn() {
  const [signup, { isLoading, error }] = useSignupMutation();
  const { refetch } = useMeQuery();

  const navigate = useNavigate();

  console.log(error);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordAgain: '',
    },
    disabled: isLoading,
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    const { name, email, password } = values;
    await signup({ name, email, password }).unwrap();
    await refetch();
    navigate('/');
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-sm"
        >
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Sign up</CardTitle>
              <CardDescription>
                Enter your email below to sign up
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input type="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <FormField
                    control={form.control}
                    name="passwordAgain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Again</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full">
                Login
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}

export default newSignIn;
