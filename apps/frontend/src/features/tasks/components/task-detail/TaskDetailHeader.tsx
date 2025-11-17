import { Button } from '../../../../components/UI/button';
import { Badge } from '../../../../components/UI/badge';
import { X, Save, RotateCcw } from 'lucide-react';

interface TaskDetailHeaderProps {
  isEditing: boolean;
  isRecurring: boolean;
  isUpdating: boolean;
  isDirty: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onClose: () => void;
}

export function TaskDetailHeader({
  isEditing,
  isRecurring,
  isUpdating,
  isDirty,
  onEdit,
  onCancel,
  onSave,
  onClose,
}: TaskDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-200">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">
          {isEditing ? 'Edit Task' : 'Task Details'}
        </h2>
        {!isEditing && isRecurring && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <RotateCcw className="h-3 w-3" />
            Recurring
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isUpdating || !isDirty}
              className="gap-1"
            >
              <Save className="h-3 w-3" />
              {isUpdating ? 'Saving...' : 'Save'}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="gap-1"
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default TaskDetailHeader;
