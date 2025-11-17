import { cn } from '../../lib/utils';
import { Calendar, Clock } from 'lucide-react';

interface DateDisplayProps {
  date: string;
  type?: 'due' | 'start' | 'completed';
  showIcon?: boolean;
  className?: string;
}

export function DateDisplay({
  date,
  type = 'due',
  showIcon = true,
  className,
}: DateDisplayProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format for display
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });

    return { formatted, diffDays };
  };

  const { formatted, diffDays } = formatDate(date);

  const getTypeConfig = () => {
    switch (type) {
      case 'due':
        if (diffDays < 0)
          return { color: 'text-red-600 bg-red-50', label: 'Overdue' };
        if (diffDays === 0)
          return { color: 'text-orange-600 bg-orange-50', label: 'Due today' };
        if (diffDays === 1)
          return {
            color: 'text-yellow-600 bg-yellow-50',
            label: 'Due tomorrow',
          };
        return { color: 'text-gray-600 bg-gray-50', label: 'Due' };
      case 'start':
        return { color: 'text-blue-600 bg-blue-50', label: 'Starts' };
      case 'completed':
        return { color: 'text-green-600 bg-green-50', label: 'Completed' };
      default:
        return { color: 'text-gray-600 bg-gray-50', label: '' };
    }
  };

  const config = getTypeConfig();
  const Icon = type === 'completed' ? Clock : Calendar;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium',
        config.color,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{formatted}</span>
      {config.label && (
        <span className="text-xs opacity-75">({config.label})</span>
      )}
    </div>
  );
}
