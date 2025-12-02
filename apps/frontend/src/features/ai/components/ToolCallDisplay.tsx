import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Edit,
  Trash2,
  List,
  FileEdit,
  FileX,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ToolCall } from '../services/aiApi';

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
  className?: string;
}

// Map tool names to icons
const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  createTask: Plus,
  getTasks: Search,
  updateTask: Edit,
  deleteTask: Trash2,
  createTodolist: Plus,
  updateTodolist: FileEdit,
  deleteTodolist: FileX,
};

// Map tool names to friendly display names
const toolDisplayNames: Record<string, string> = {
  createTask: 'Create Task',
  getTasks: 'Get Tasks',
  updateTask: 'Update Task',
  deleteTask: 'Delete Task',
  createTodolist: 'Create Todolist',
  updateTodolist: 'Update Todolist',
  deleteTodolist: 'Delete Todolist',
};

// Helper to check if a tool call was successful
function isToolCallSuccessful(toolCall: ToolCall): boolean {
  if (typeof toolCall.result === 'string') {
    try {
      const parsed = JSON.parse(toolCall.result);
      return parsed.success === true;
    } catch {
      return false;
    }
  }
  return false;
}

// Helper to extract user-friendly summary from tool call
function getToolCallSummary(toolCall: ToolCall): string {
  const tool = toolCall.tool;
  let result: unknown = toolCall.result;

  // Parse result if it's a string
  if (typeof result === 'string') {
    try {
      result = JSON.parse(result);
    } catch {
      // If parsing fails, return the string
    }
  }

  // Extract summary based on tool type
  if (typeof result === 'object' && result !== null) {
    const parsed = result as Record<string, unknown>;

    switch (tool) {
      case 'createTask':
        if (parsed.success && parsed.taskName) {
          const priority = parsed.priority
            ? ` with ${parsed.priority} priority`
            : '';
          return `Created task "${parsed.taskName}"${priority}`;
        }
        if (parsed.error) {
          return `Failed: ${parsed.error}`;
        }
        break;

      case 'getTasks':
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          const count = parsed.tasks.length;
          return `Found ${count} task${count !== 1 ? 's' : ''}`;
        }
        break;

      case 'updateTask':
        if (parsed.success && parsed.taskName) {
          const changes: string[] = [];
          if (parsed.checked !== undefined) {
            changes.push(parsed.checked ? 'completed' : 'incomplete');
          }
          if (parsed.priority) {
            changes.push(`priority: ${parsed.priority}`);
          }
          if (parsed.dueDate) {
            changes.push('due date updated');
          }
          const changeText =
            changes.length > 0 ? ` - ${changes.join(', ')}` : '';
          return `Updated task "${parsed.taskName}"${changeText}`;
        }
        if (parsed.error) {
          return `Failed: ${parsed.error}`;
        }
        break;

      case 'deleteTask':
        if (parsed.success && parsed.taskId) {
          return `Deleted task`;
        }
        if (parsed.error) {
          return `Failed: ${parsed.error}`;
        }
        break;

      case 'createTodolist':
        if (parsed.success && parsed.name) {
          return `Created todolist "${parsed.name}"`;
        }
        if (parsed.error) {
          return `Failed: ${parsed.error}`;
        }
        break;

      case 'updateTodolist':
        if (parsed.success && parsed.name) {
          return `Updated todolist to "${parsed.name}"`;
        }
        if (parsed.error) {
          return `Failed: ${parsed.error}`;
        }
        break;

      case 'deleteTodolist':
        if (parsed.success) {
          return `Deleted todolist`;
        }
        if (parsed.error) {
          return `Failed: ${parsed.error}`;
        }
        break;
    }
  }

  // Fallback to tool name
  return toolDisplayNames[tool] || tool;
}

// Helper to format tool input/output for display
function formatToolData(data: unknown): string {
  if (data === null || data === undefined) {
    return 'null';
  }
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  }
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  }
  return String(data);
}

export default function ToolCallDisplay({
  toolCalls,
  className,
}: ToolCallDisplayProps) {
  const [expandedTool, setExpandedTool] = useState<number | null>(null);

  if (!toolCalls || toolCalls.length === 0) {
    return null;
  }

  return (
    <div className={cn('mt-3 space-y-2', className)}>
      {toolCalls.length > 1 && (
        <div className="text-xs font-medium text-muted-foreground mb-2">
          {toolCalls.length} actions taken
        </div>
      )}
      {toolCalls.map((toolCall, index) => {
        const isExpanded = expandedTool === index;
        const isSuccess = isToolCallSuccessful(toolCall);
        const summary = getToolCallSummary(toolCall);
        const Icon = toolIcons[toolCall.tool] || List;

        return (
          <div
            key={index}
            className={cn(
              'border rounded-lg overflow-hidden transition-colors',
              isSuccess
                ? 'border-green-500/20 bg-green-500/5'
                : 'border-red-500/20 bg-red-500/5'
            )}
          >
            <div className="flex items-center gap-2 px-3 py-2">
              <div
                className={cn(
                  'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
                  isSuccess
                    ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                    : 'bg-red-500/20 text-red-600 dark:text-red-400'
                )}
              >
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-xs',
                    isSuccess
                      ? 'text-foreground'
                      : 'text-red-600 dark:text-red-400'
                  )}
                >
                  {summary}
                </p>
              </div>
              {isSuccess ? (
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
              )}
              <button
                onClick={() => setExpandedTool(isExpanded ? null : index)}
                className="flex-shrink-0 p-1 hover:bg-muted/50 rounded transition-colors"
                aria-label={isExpanded ? 'Hide details' : 'Show details'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 space-y-2 border-t bg-muted/30">
                <div className="text-xs font-medium text-muted-foreground pt-2">
                  Technical Details
                </div>
                {/* Tool Input */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Input:
                  </div>
                  <pre className="text-xs bg-background/50 p-2 rounded border overflow-x-auto max-h-32">
                    {formatToolData(toolCall.input)}
                  </pre>
                </div>

                {/* Tool Result */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Result:
                  </div>
                  <pre className="text-xs bg-background/50 p-2 rounded border overflow-x-auto max-h-32">
                    {formatToolData(toolCall.result)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
