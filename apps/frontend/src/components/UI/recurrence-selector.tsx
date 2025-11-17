import { cn } from '../../lib/utils';

interface RecurrenceSelectorProps {
  isRecurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  onRecurringChange: (isRecurring: boolean) => void;
  onTypeChange: (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => void;
  onIntervalChange: (interval: number) => void;
  className?: string;
}

const recurrenceTypes = [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'weekly' as const, label: 'Weekly' },
  { value: 'monthly' as const, label: 'Monthly' },
  { value: 'yearly' as const, label: 'Yearly' },
];

export function RecurrenceSelector({
  isRecurring,
  recurrenceType = 'daily',
  recurrenceInterval = 1,
  onRecurringChange,
  onTypeChange,
  onIntervalChange,
  className,
}: RecurrenceSelectorProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={isRecurring}
          onChange={(e) => onRecurringChange(e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isRecurring" className="text-sm font-medium">
          Recurring task
        </label>
      </div>

      {isRecurring && (
        <div className="space-y-3 pl-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Repeat every</span>
            <input
              type="number"
              min="1"
              max="99"
              value={recurrenceInterval}
              onChange={(e) => onIntervalChange(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={recurrenceType}
              onChange={(e) => onTypeChange(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {recurrenceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
