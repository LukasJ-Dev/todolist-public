import { useState } from 'react';
import { CleanupCounts } from '../services/adminApi';
import {
  useDeleteTodolistsByAgeMutation,
  useDeleteTasksByAgeMutation,
  useDeleteConversationsByAgeMutation,
  useDeleteMemoriesByAgeMutation,
} from '../services/adminApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/UI/card';
import { Button } from '../../../components/UI/button';
import { Spinner } from '../../../components/UI/spinner';
import { CleanupConfirmDialog } from './CleanupConfirmDialog';
import { Trash2, Database } from 'lucide-react';
import { toast } from 'sonner';

interface CleanupSectionProps {
  counts: CleanupCounts;
  isLoading: boolean;
  password: string;
  onRefetch: () => void;
}

// Helper function to format bytes to human-readable format
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Estimate space based on collection type and count
function estimateSpace(collectionName: string, count: number): number {
  const estimates: Record<string, number> = {
    Todolists: 200,
    Tasks: 500,
    Conversations: 300,
    Memories: 200,
  };
  return (estimates[collectionName] || 300) * count;
}

export function CleanupSection({
  counts,
  isLoading,
  password,
  onRefetch,
}: CleanupSectionProps) {
  const [deleteTodolists, { isLoading: isDeletingTodolists }] =
    useDeleteTodolistsByAgeMutation();
  const [deleteTasks, { isLoading: isDeletingTasks }] =
    useDeleteTasksByAgeMutation();
  const [deleteConversations, { isLoading: isDeletingConversations }] =
    useDeleteConversationsByAgeMutation();
  const [deleteMemories, { isLoading: isDeletingMemories }] =
    useDeleteMemoriesByAgeMutation();

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    collection: string;
    ageDays: number;
    count: number;
    collectionKey: 'todolists' | 'tasks' | 'conversations' | 'memories';
  } | null>(null);

  const collections = [
    { name: 'Todolists', key: 'todolists' as const, icon: Database },
    { name: 'Tasks', key: 'tasks' as const, icon: Database },
    { name: 'Conversations', key: 'conversations' as const, icon: Database },
    { name: 'Memories', key: 'memories' as const, icon: Database },
  ];

  const handleDelete = (
    collection: string,
    collectionKey: 'todolists' | 'tasks' | 'conversations' | 'memories',
    ageDays: number,
    count: number
  ) => {
    setConfirmDialog({
      open: true,
      collection,
      collectionKey,
      ageDays,
      count,
    });
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;

    try {
      let result;
      switch (confirmDialog.collectionKey) {
        case 'todolists':
          result = await deleteTodolists({
            password,
            ageDays: confirmDialog.ageDays,
          }).unwrap();
          break;
        case 'tasks':
          result = await deleteTasks({
            password,
            ageDays: confirmDialog.ageDays,
          }).unwrap();
          break;
        case 'conversations':
          result = await deleteConversations({
            password,
            ageDays: confirmDialog.ageDays,
          }).unwrap();
          break;
        case 'memories':
          result = await deleteMemories({
            password,
            ageDays: confirmDialog.ageDays,
          }).unwrap();
          break;
      }

      toast.success('Cleanup completed', {
        description: `Deleted ${result.deletedCount.toLocaleString()} items. Estimated space freed: ${formatBytes(result.estimatedSpaceFreed)}`,
      });
      setConfirmDialog(null);
      onRefetch();
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
          : 'Failed to delete items. Please try again.';
      toast.error('Deletion failed', {
        description: errorMessage,
      });
    }
  };

  const isDeleting =
    isDeletingTodolists ||
    isDeletingTasks ||
    isDeletingConversations ||
    isDeletingMemories;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Database Cleanup</CardTitle>
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Database Cleanup</CardTitle>
          <CardDescription>
            Delete old documents to free up database space. Counts show how many
            items are older than each age threshold.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {collections.map((collection) => {
              const collectionCounts = counts[collection.key];
              return (
                <div key={collection.key}>
                  <h3 className="text-lg font-semibold mb-3">
                    {collection.name}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">
                            Age (days)
                          </th>
                          <th className="text-left p-2 font-medium">Count</th>
                          <th className="text-left p-2 font-medium">
                            Est. Space
                          </th>
                          <th className="text-left p-2 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collectionCounts.map((ageCount) => {
                          const estimatedSpace = estimateSpace(
                            collection.name,
                            ageCount.count
                          );
                          return (
                            <tr
                              key={ageCount.ageDays}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="p-2">{ageCount.ageDays}</td>
                              <td className="p-2">
                                {ageCount.count.toLocaleString()}
                              </td>
                              <td className="p-2 text-sm text-muted-foreground">
                                {formatBytes(estimatedSpace)}
                              </td>
                              <td className="p-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    handleDelete(
                                      collection.name,
                                      collection.key,
                                      ageCount.ageDays,
                                      ageCount.count
                                    )
                                  }
                                  disabled={ageCount.count === 0 || isDeleting}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {confirmDialog && (
        <CleanupConfirmDialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog(null)}
          onConfirm={handleConfirm}
          collectionName={confirmDialog.collection}
          ageDays={confirmDialog.ageDays}
          count={confirmDialog.count}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
