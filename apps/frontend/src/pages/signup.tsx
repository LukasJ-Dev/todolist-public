import styled from 'styled-components';
import { Input } from '../components/UI/input';
import StandardLayout from '../components/StandardLayout';
import { Center } from '../components/UI/styles';
import { colors } from '../styles/colors';
import { Button } from '../components/UI/button';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
//import { RegisterAccount } from '../features/auth/authAPI';
import { AppDispatch } from '../app/store';
//import { selectIsLoggedIn } from '../features/auth/authSelector';
import { useEffect } from 'react';

const SignupCard = styled.form`
  display: flex;
  flex-direction: column;
  width: 250px;
  gap: 12px;

  padding-bottom: 20vh;
`;

const SignUp = () => {
  const dispatch = useDispatch<AppDispatch>();
  //const isLoggedIn = useSelector(selectIsLoggedIn);

  const navigate = useNavigate();

  /*
  useEffect(() => {
    //if (isLoggedIn) navigate('/');
  }, [isLoggedIn, navigate]);*/

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const target = e.target as typeof e.target & {
      name: { value: string };
      email: { value: string };
      password: { value: string };
      passwordAgain: { value: string };
    };
    const name = target.name.value;
    const email = target.email.value;
    const password = target.password.value;

    // dispatch(RegisterAccount({ name, email, password }));
  };

  return (
    <StandardLayout>
      <Center>
        <SignupCard onSubmit={handleSubmit}>
          <Input type="name" id="name" name="name" />
          <Input type="email" id="email" name="email" />
          <Input type="password" id="password" name="password" />
          <Input type="password" id="passwordAgain" name="passwordAgain" />
          <Button type="submit">Sign Up</Button>
          <Link to="/signin">
            <Button color={colors.blue['300']}>Go to Sign In</Button>
          </Link>
        </SignupCard>
      </Center>
    </StandardLayout>
  );
};

//export default SignUp;

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
  }

  return (
    <StandardLayout>
      <Center>
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
      </Center>
    </StandardLayout>
  );
}

export default newSignIn;
