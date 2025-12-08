import { UserWithStats } from '../services/adminApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/UI/card';
import { Button } from '../../../components/UI/button';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Spinner } from '../../../components/UI/spinner';

interface DemoAccountListProps {
  demoAccounts: UserWithStats[];
  isLoading: boolean;
  onDeleteAll: () => void;
  isDeleting: boolean;
}

export function DemoAccountList({
  demoAccounts,
  isLoading,
  onDeleteAll,
  isDeleting,
}: DemoAccountListProps) {
  const handleDeleteAll = () => {
    if (
      !confirm(
        `Are you sure you want to delete all ${demoAccounts.length} demo accounts? This action cannot be undone.`
      )
    ) {
      return;
    }
    onDeleteAll();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Demo Accounts</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Demo Accounts</CardTitle>
            <CardDescription>
              {demoAccounts.length} demo account{demoAccounts.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          {demoAccounts.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {demoAccounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No demo accounts found
          </div>
        ) : (
          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{account.email}</div>
                  <div className="text-sm text-muted-foreground">
                    {account.todolistCount} todolists, {account.taskCount} tasks
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-2 py-1 rounded">
                    Demo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

