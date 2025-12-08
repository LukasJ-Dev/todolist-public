import { useState } from 'react';
import { UserWithStats } from '../services/adminApi';
import { Button } from '../../../components/UI/button';
import { Input } from '../../../components/UI/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/UI/card';
import { Trash2, Search, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { Spinner } from '../../../components/UI/spinner';
import { UserSettingsDialog } from './UserSettingsDialog';

interface UserTableProps {
  users: UserWithStats[];
  isLoading: boolean;
  onDeleteUser: (userId: string) => void;
  isDeleting?: boolean;
  onSearch: (search: string) => void;
  searchQuery: string;
  password: string;
}

export function UserTable({
  users,
  isLoading,
  onDeleteUser,
  isDeleting = false,
  onSearch,
  searchQuery,
  password,
}: UserTableProps) {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [settingsUserId, setSettingsUserId] = useState<string | null>(null);

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return format(date, 'MMM d, yyyy');
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    setDeletingUserId(userId);
    try {
      await onDeleteUser(userId);
    } finally {
      setDeletingUserId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View and manage all users</CardDescription>
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No users found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Name</th>
                  <th className="text-left p-2 font-medium">Email</th>
                  <th className="text-left p-2 font-medium">Signup Date</th>
                  <th className="text-left p-2 font-medium">Last Login</th>
                  <th className="text-left p-2 font-medium">Todolists</th>
                  <th className="text-left p-2 font-medium">Tasks</th>
                  <th className="text-left p-2 font-medium">Type</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    <td className="p-2">{user.todolistCount}</td>
                    <td className="p-2">{user.taskCount}</td>
                    <td className="p-2">
                      {user.isDemo ? (
                        <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded">
                          Demo
                        </span>
                      ) : (
                        <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded">
                          User
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSettingsUserId(user.id)}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          disabled={isDeleting || deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <>
                              <Spinner size="sm" className="mr-2" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {settingsUserId && (
        <UserSettingsDialog
          open={!!settingsUserId}
          onOpenChange={(open) => !open && setSettingsUserId(null)}
          user={users.find((u) => u.id === settingsUserId)!}
          password={password}
        />
      )}
    </Card>
  );
}

