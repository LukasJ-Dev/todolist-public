import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

interface TagProps {
  tag: string;
  onRemove?: (tag: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function Tag({
  tag,
  onRemove,
  size = 'sm',
  variant = 'default',
  className,
}: TagProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 border-blue-200',
    outline: 'bg-transparent text-blue-600 border-blue-300',
    secondary: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <span>{tag}</span>
      {onRemove && (
        <button
          onClick={() => onRemove(tag)}
          className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
          type="button"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
