import { useState } from 'react';
import { Button } from '../components/UI/button';
import { Input } from '../components/UI/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/UI/card';
import { Spinner } from '../components/UI/spinner';
import { StatsCard } from '../features/admin/components/StatsCard';
import { UserTable } from '../features/admin/components/UserTable';
import { DemoAccountList } from '../features/admin/components/DemoAccountList';
import { ActivityChart } from '../features/admin/components/ActivityChart';
import { GlobalSettings } from '../features/admin/components/GlobalSettings';
import { AIStatsCards } from '../features/admin/components/AIStatsCards';
import { AIUsageChart } from '../features/admin/components/AIUsageChart';
import { ToolUsageChart } from '../features/admin/components/ToolUsageChart';
import { TopAIUsers } from '../features/admin/components/TopAIUsers';
import { DatabaseStats } from '../features/admin/components/DatabaseStats';
import { CleanupSection } from '../features/admin/components/CleanupSection';
import {
  useGetStatsQuery,
  useGetUsersQuery,
  useGetDemoAccountsQuery,
  useDeleteUserMutation,
  useDeleteDemoAccountsMutation,
  useGetActivityQuery,
  useGetAIStatsQuery,
  useGetAIUsageTrendsQuery,
  useGetAIToolUsageQuery,
  useGetTopAIUsersQuery,
  useGetDatabaseStatsQuery,
  useGetCleanupCountsQuery,
} from '../features/admin/services/adminApi';
import {
  Users,
  ListTodo,
  CheckSquare,
  UserCog,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPage() {
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userPage, setUserPage] = useState(1);

  // Test password by trying to fetch stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useGetStatsQuery(password, {
    skip: !isAuthenticated || !password,
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useGetUsersQuery(
    { password, page: userPage, limit: 50, search: searchQuery },
    {
      skip: !isAuthenticated || !password,
    }
  );

  const {
    data: demoAccounts,
    isLoading: demoLoading,
    refetch: refetchDemo,
  } = useGetDemoAccountsQuery(password, {
    skip: !isAuthenticated || !password,
  });

  const { data: activity, isLoading: activityLoading } = useGetActivityQuery(
    password,
    {
      skip: !isAuthenticated || !password,
    }
  );

  // AI statistics queries
  const { data: aiStats, isLoading: aiStatsLoading } = useGetAIStatsQuery(
    password,
    {
      skip: !isAuthenticated || !password,
    }
  );

  const { data: aiUsageTrends, isLoading: aiUsageTrendsLoading } =
    useGetAIUsageTrendsQuery(password, {
      skip: !isAuthenticated || !password,
    });

  const { data: toolUsageData, isLoading: toolUsageLoading } =
    useGetAIToolUsageQuery(password, {
      skip: !isAuthenticated || !password,
    });

  const { data: topUsersData, isLoading: topUsersLoading } =
    useGetTopAIUsersQuery(
      { password, limit: 20 },
      {
        skip: !isAuthenticated || !password,
      }
    );

  const { data: databaseStats, isLoading: databaseStatsLoading } =
    useGetDatabaseStatsQuery(password, {
      skip: !isAuthenticated || !password,
    });

  const {
    data: cleanupCounts,
    isLoading: cleanupCountsLoading,
    refetch: refetchCleanupCounts,
  } = useGetCleanupCountsQuery(password, {
    skip: !isAuthenticated || !password,
  });

  const [deleteUser, { isLoading: isDeletingUser }] = useDeleteUserMutation();
  const [deleteDemoAccounts, { isLoading: isDeletingDemo }] =
    useDeleteDemoAccountsMutation();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length === 128) {
      setIsAuthenticated(true);
    } else {
      toast.error('Invalid credentials', {
        description: 'The provided credentials are incorrect.',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser({ userId, password }).unwrap();
      toast.success('User deleted', {
        description: 'User and all their data have been deleted.',
      });
      refetchUsers();
      if (stats) {
        // Refetch stats to update counts
        window.location.reload(); // Simple refresh for now
      }
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
          : 'Failed to delete user. Please try again.';
      toast.error('Delete failed', {
        description: errorMessage,
      });
    }
  };

  const handleDeleteDemoAccounts = async () => {
    try {
      const result = await deleteDemoAccounts(password).unwrap();
      toast.success('Demo accounts deleted', {
        description: `Deleted ${result.deletedCount} demo accounts.`,
      });
      refetchDemo();
      if (stats) {
        window.location.reload();
      }
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
          : 'Failed to delete demo accounts. Please try again.';
      toast.error('Delete failed', {
        description: errorMessage,
      });
    }
  };

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter admin password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin-email"
                  className="text-sm font-medium mb-2 block"
                >
                  Email
                </label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="admin-password"
                  className="text-sm font-medium mb-2 block"
                >
                  Password
                </label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="font-mono text-xs"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={!password || !email}
              >
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if password is invalid
  if (statsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Invalid admin password or IP not whitelisted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                setIsAuthenticated(false);
                setPassword('');
                setEmail('');
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show dashboard
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and monitor your application
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setIsAuthenticated(false);
              setPassword('');
              setEmail('');
            }}
          >
            Logout
          </Button>
        </div>

        {/* Statistics Cards */}
        {statsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : stats ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatsCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<Users className="h-4 w-4" />}
            />
            <StatsCard
              title="Todolists"
              value={stats.totalTodolists}
              icon={<ListTodo className="h-4 w-4" />}
            />
            <StatsCard
              title="Tasks"
              value={stats.totalTasks}
              icon={<CheckSquare className="h-4 w-4" />}
            />
            <StatsCard
              title="Demo Accounts"
              value={stats.demoAccounts}
              description={`${stats.activeUsers7Days} active (7d)`}
              icon={<UserCog className="h-4 w-4" />}
            />
            <StatsCard
              title="Active Users"
              value={stats.activeUsers30Days}
              description="Last 30 days"
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>
        ) : null}

        {/* Activity Chart */}
        {activity && (
          <ActivityChart activity={activity} isLoading={activityLoading} />
        )}

        {/* Global Settings */}
        <GlobalSettings password={password} />

        {/* AI Statistics Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">AI Insights</h2>
            <p className="text-muted-foreground mb-6">
              Analytics and statistics for AI assistant usage
            </p>
          </div>

          {/* AI Stats Cards */}
          {aiStats && (
            <AIStatsCards stats={aiStats} isLoading={aiStatsLoading} />
          )}

          {/* AI Usage Chart */}
          {aiUsageTrends && (
            <AIUsageChart
              trends={aiUsageTrends}
              isLoading={aiUsageTrendsLoading}
            />
          )}

          {/* Tool Usage and Top Users in a grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {toolUsageData && (
              <ToolUsageChart
                toolUsage={toolUsageData.toolUsage}
                isLoading={toolUsageLoading}
              />
            )}
            {topUsersData && (
              <TopAIUsers
                topUsers={topUsersData.topUsers}
                isLoading={topUsersLoading}
              />
            )}
          </div>
        </div>

        {/* Database Statistics */}
        {databaseStats && (
          <DatabaseStats
            stats={databaseStats}
            isLoading={databaseStatsLoading}
          />
        )}

        {/* Database Cleanup */}
        {cleanupCounts && (
          <CleanupSection
            counts={cleanupCounts}
            isLoading={cleanupCountsLoading}
            password={password}
            onRefetch={refetchCleanupCounts}
          />
        )}

        {/* Demo Account Management */}
        <DemoAccountList
          demoAccounts={demoAccounts || []}
          isLoading={demoLoading}
          onDeleteAll={handleDeleteDemoAccounts}
          isDeleting={isDeletingDemo}
        />

        {/* User Management */}
        {usersData && (
          <UserTable
            users={usersData.users}
            isLoading={usersLoading}
            onDeleteUser={handleDeleteUser}
            isDeleting={isDeletingUser}
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
            password={password}
          />
        )}

        {/* Pagination */}
        {usersData && usersData.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              disabled={userPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {usersData.page} of {usersData.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() =>
                setUserPage((p) => Math.min(usersData.totalPages, p + 1))
              }
              disabled={userPage === usersData.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
