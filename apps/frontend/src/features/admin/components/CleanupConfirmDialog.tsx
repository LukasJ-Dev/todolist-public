import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/UI/dialog';
import { Button } from '../../../components/UI/button';
import { AlertTriangle } from 'lucide-react';

interface CleanupConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  collectionName: string;
  ageDays: number;
  count: number;
  isLoading?: boolean;
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

export function CleanupConfirmDialog({
  open,
  onClose,
  onConfirm,
  collectionName,
  ageDays,
  count,
  isLoading = false,
}: CleanupConfirmDialogProps) {
  const estimatedSpace = estimateSpace(collectionName, count);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. All selected items will be permanently
            deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-destructive/10 p-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">
                You are about to delete:
              </div>
              <div className="text-sm">
                <strong>{count.toLocaleString()}</strong> {collectionName} older
                than <strong>{ageDays} days</strong>
              </div>
              <div className="text-sm text-muted-foreground">
                Estimated space to be freed:{' '}
                <strong>{formatBytes(estimatedSpace)}</strong>
              </div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <strong>Warning:</strong> This will permanently delete all selected
            items. If you are deleting todolists, all associated tasks will also
            be deleted.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
