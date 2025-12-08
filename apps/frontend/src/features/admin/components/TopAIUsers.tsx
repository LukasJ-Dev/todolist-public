import { TopAIUser } from '../services/adminApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/UI/card';
import { Spinner } from '../../../components/UI/spinner';

interface TopAIUsersProps {
  topUsers: TopAIUser[];
  isLoading: boolean;
}

export function TopAIUsers({ topUsers, isLoading }: TopAIUsersProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top AI Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (topUsers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top AI Users</CardTitle>
          <CardDescription>Users with the most AI interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No AI users found
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top AI Users</CardTitle>
        <CardDescription>Users with the most AI interactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Rank</th>
                <th className="text-left p-2 font-medium">Name</th>
                <th className="text-left p-2 font-medium">Email</th>
                <th className="text-left p-2 font-medium">Conversations</th>
                <th className="text-left p-2 font-medium">Messages</th>
                <th className="text-left p-2 font-medium">Tool Calls</th>
                <th className="text-left p-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((user, index) => (
                <tr key={user.userId} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium">#{index + 1}</td>
                  <td className="p-2">{user.name}</td>
                  <td className="p-2 text-sm text-muted-foreground">
                    {user.email}
                  </td>
                  <td className="p-2">{user.conversationCount}</td>
                  <td className="p-2">{user.messageCount}</td>
                  <td className="p-2">{user.toolCallCount}</td>
                  <td className="p-2 font-semibold">{user.totalInteractions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

