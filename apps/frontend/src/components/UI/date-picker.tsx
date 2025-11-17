import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DatePickerProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  className?: string;
  allowPast?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className,
  allowPast = false,
}: DatePickerProps) {
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      const date = new Date(dateValue);
      if (!allowPast && date < new Date()) {
        return; // Don't allow past dates
      }
      onChange(date.toISOString());
    } else {
      onChange(undefined);
    }
  };

  const clearDate = () => {
    onChange(undefined);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="date"
            value={formatDateForInput(value)}
            onChange={handleDateChange}
            min={allowPast ? undefined : new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={placeholder}
          />
          <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {value && (
          <button
            onClick={clearDate}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            type="button"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
