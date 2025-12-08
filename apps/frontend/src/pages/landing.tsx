import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/UI/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/UI/card';
import {
  CheckCircle2,
  ListTodo,
  Calendar,
  Search,
  Sparkles,
  Repeat,
  Layers,
} from 'lucide-react';
import { useDemoMutation, useMeQuery } from '../features/auth/services/authApi';
import { toast } from 'sonner';
import { Spinner } from '../components/UI/spinner';

export default function LandingPage() {
  const navigate = useNavigate();
  const [demo, { isLoading: isCreatingDemo }] = useDemoMutation();
  const { refetch } = useMeQuery();

  const handleTryDemo = async () => {
    try {
      await demo().unwrap();
      await refetch();
      toast.success('Demo account created!', {
        description: 'Welcome! Your demo account is ready with sample data.',
      });
      navigate('/app');
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'data' in error &&
        error.data &&
        typeof error.data === 'object' &&
        'message' in error.data &&
        typeof error.data.message === 'string'
          ? error.data.message
          : 'Failed to create demo account. Please try again.';
      toast.error('Demo account creation failed', {
        description: errorMessage,
      });
    }
  };
  const features = [
    {
      icon: ListTodo,
      title: 'Organize Your Tasks',
      description:
        'Create and manage multiple todo lists to keep your projects organized and on track.',
    },
    {
      icon: Calendar,
      title: 'Plan Ahead',
      description:
        'Schedule tasks with due dates and track upcoming deadlines with ease.',
    },
    {
      icon: Search,
      title: 'Quick Search',
      description:
        'Find any task or todo list instantly with powerful search capabilities.',
    },
    {
      icon: Sparkles,
      title: 'AI Assistant',
      description:
        'Get intelligent help with task management and organization powered by AI.',
    },
    {
      icon: Repeat,
      title: 'Recurring Tasks',
      description:
        'Set up tasks that repeat daily, weekly, monthly, or yearly with custom intervals.',
    },
    {
      icon: Layers,
      title: 'Hierarchical Tasks',
      description:
        'Break down complex tasks into subtasks with up to 3 levels of nesting for better organization.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Organize Your Life,
            <br />
            <span className="text-primary">One Task at a Time</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl md:text-2xl">
            The modern task management app that helps you stay focused,
            organized, and productive. Manage your tasks, plan your schedule,
            and achieve your goals with ease.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button
              onClick={handleTryDemo}
              disabled={isCreatingDemo}
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {isCreatingDemo ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Creating Demo...
                </>
              ) : (
                'Try Demo'
              )}
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Stay Productive
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Powerful features designed to help you manage your tasks
              efficiently
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl">
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl sm:text-4xl">
                Ready to Get Started?
              </CardTitle>
              <CardDescription className="text-lg mt-4">
                Join thousands of users who are already organizing their lives
                with our task management app.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6">
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to="/signup">Create Free Account</Link>
                </Button>
                <Button
                  onClick={handleTryDemo}
                  disabled={isCreatingDemo}
                  size="lg"
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  {isCreatingDemo ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Creating Demo...
                    </>
                  ) : (
                    'Try Demo'
                  )}
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Link to="/login">Sign In to Existing Account</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
