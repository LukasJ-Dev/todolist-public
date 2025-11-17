import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface PrioritySelectorProps {
  value: 'low' | 'medium' | 'high';
  onChange: (priority: 'low' | 'medium' | 'high') => void;
  className?: string;
}

const priorities = [
  {
    value: 'low' as const,
    label: 'Low',
    description: 'Low priority',
    color: 'text-green-700 bg-green-50 hover:bg-green-100 border-green-200',
  },
  {
    value: 'medium' as const,
    label: 'Medium',
    description: 'Medium priority',
    color: 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200',
  },
  {
    value: 'high' as const,
    label: 'High',
    description: 'High priority',
    color: 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200',
  },
];

export function PrioritySelector({
  value,
  onChange,
  className,
}: PrioritySelectorProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {priorities.map((priority) => (
        <button
          key={priority.value}
          onClick={() => onChange(priority.value)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all border',
            priority.color,
            value === priority.value &&
              'ring-2 ring-offset-1 ring-blue-500 shadow-sm'
          )}
          type="button"
          title={priority.description}
        >
          <span className="font-semibold uppercase tracking-wide text-xs">
            {priority.label}
          </span>
          {value === priority.value && <Check className="h-4 w-4 ml-1" />}
        </button>
      ))}
    </div>
  );
}
