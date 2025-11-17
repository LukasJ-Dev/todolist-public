import { cn } from '../../lib/utils';

interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const priorityConfig = {
  low: {
    color: 'text-green-700 bg-green-50 border-green-200',
    label: 'Low',
    description: 'Low priority',
  },
  medium: {
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    label: 'Medium',
    description: 'Medium priority',
  },
  high: {
    color: 'text-red-700 bg-red-50 border-red-200',
    label: 'High',
    description: 'High priority',
  },
};

export function PriorityIndicator({
  priority,
  size = 'sm',
  className,
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority];

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md font-medium border px-2 py-1',
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      <span className="text-xs font-semibold uppercase tracking-wide">
        {config.label}
      </span>
    </div>
  );
}
