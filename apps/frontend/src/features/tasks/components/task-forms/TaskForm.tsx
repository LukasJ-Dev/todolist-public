import { useState } from 'react';
import { Input } from '../../../../components/UI/input';
import { Spinner } from '../../../../components/UI/spinner';
import { Button } from '../../../../components/UI/button';
import { Plus, Settings, X } from 'lucide-react';
import { EnhancedTaskForm } from './EnhancedTaskForm';

function NewTask({
  callback,
  todolistId,
  disabled = false,
}: {
  callback: (value: string) => void;
  todolistId: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const [showEnhancedForm, setShowEnhancedForm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const onEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && value.trim() && !disabled) {
      if (event.shiftKey) {
        // Shift+Enter opens enhanced form
        setShowEnhancedForm(true);
      } else {
        // Regular Enter does quick add
        callback(value.trim());
        setValue('');
      }
    }
  };

  const handleQuickCreate = () => {
    if (value.trim() && !disabled) {
      callback(value.trim());
      setValue('');
    }
  };

  const handleInputFocus = () => {
    setIsExpanded(true);
  };

  const handleInputBlur = () => {
    // Delay to allow clicking on buttons
    setTimeout(() => setIsExpanded(false), 200);
  };

  if (showEnhancedForm) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create Task</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEnhancedForm(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <EnhancedTaskForm
          todolistId={todolistId}
          onSuccess={() => {
            setShowEnhancedForm(false);
          }}
          onCancel={() => setShowEnhancedForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            className="w-full"
            placeholder={disabled ? 'Creating task...' : 'Add a task...'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onEnter}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            disabled={disabled}
          />
          {disabled && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Spinner size="sm" />
            </div>
          )}
        </div>

        {/* Show buttons only when input is focused or has content */}
        {(isExpanded || value.trim()) && (
          <div className="flex gap-1">
            <Button
              onClick={handleQuickCreate}
              disabled={disabled || !value.trim()}
              size="sm"
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
            <Button
              onClick={() => setShowEnhancedForm(true)}
              variant="outline"
              size="sm"
              disabled={disabled}
              className="gap-1"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Subtle hint for power users */}
      {isExpanded && !value.trim() && (
        <div className="mt-1 text-xs text-gray-500">
          Press Enter to add quickly, or Shift+Enter for more options
        </div>
      )}
    </div>
  );
}

export default NewTask;
