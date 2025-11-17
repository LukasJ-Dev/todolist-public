import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar } from './calendar';

interface EnhancedDatePickerProps {
  value?: string | null;
  onChange: (date: string | null) => void;
  placeholder?: string;
  className?: string;
  allowPast?: boolean;
}

export function EnhancedDatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
  allowPast = false,
}: EnhancedDatePickerProps) {
  const [open, setOpen] = useState(false);

  const selectedDate = value ? new Date(value) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    console.log('Date selected:', date); // Debug log
    if (date) {
      if (!allowPast && date < new Date(new Date().setHours(0, 0, 0, 0))) {
        return; // Don't allow past dates if not allowed
      }
      onChange(date.toISOString());
    } else {
      onChange(null);
    }
    setOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          console.log('Popover state changing:', newOpen); // Debug log
          setOpen(newOpen);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              selectedDate?.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year:
                  selectedDate.getFullYear() !== new Date().getFullYear()
                    ? 'numeric'
                    : undefined,
              })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="mb-4">
            <p className="text-sm text-gray-600">Test popover content</p>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) =>
              !allowPast && date < new Date(new Date().setHours(0, 0, 0, 0))
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
