import { Label } from '../../../../components/UI/label';
import { Input } from '../../../../components/UI/input';
import { Textarea } from '../../../../components/UI/textarea';
import { EnhancedDatePicker } from '../../../../components/UI/enhanced-date-picker';
import { RecurrenceSelector } from '../../../../components/UI/recurrence-selector';
import { TagInput } from '../../../../components/UI/tag-input';
import { Button } from '../../../../components/UI/button';
import { cn } from '../../../../lib/utils';

interface EditContentProps {
  nameError?: string;
  nameValue: string;
  descriptionValue?: string;
  priorityValue: 'low' | 'medium' | 'high';
  startDateValue?: string | null;
  dueDateValue?: string | null;
  isRecurringValue: boolean;
  recurrenceTypeValue?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
  recurrenceIntervalValue?: number | null;
  tagsValue: string[];
  onChangeName: (value: string) => void;
  onChangeDescription: (value: string) => void;
  onChangePriority: (value: 'low' | 'medium' | 'high') => void;
  onChangeStartDate: (value: string | null) => void;
  onChangeDueDate: (value: string | null) => void;
  onChangeIsRecurring: (value: boolean) => void;
  onChangeRecurrenceType: (
    value: 'daily' | 'weekly' | 'monthly' | 'yearly'
  ) => void;
  onChangeRecurrenceInterval: (value: number) => void;
  onChangeTags: (value: string[]) => void;
}

export default function TaskDetailEditContent({
  nameError,
  nameValue,
  descriptionValue,
  priorityValue,
  startDateValue,
  dueDateValue,
  isRecurringValue,
  recurrenceTypeValue,
  recurrenceIntervalValue,
  tagsValue,
  onChangeName,
  onChangeDescription,
  onChangePriority,
  onChangeStartDate,
  onChangeDueDate,
  onChangeIsRecurring,
  onChangeRecurrenceType,
  onChangeRecurrenceInterval,
  onChangeTags,
}: EditContentProps) {
  return (
    <div className="space-y-4">
      {/* Title & Notes */}
      <div className="rounded-lg border bg-gray-50 p-3 space-y-3">
        <div className="space-y-2">
          <Label htmlFor="name">Title</Label>
          <Input
            id="name"
            value={nameValue}
            onChange={(e) => onChangeName(e.target.value)}
            className={cn('text-base', nameError && 'border-red-500')}
            placeholder="What do you want to get done?"
          />
          {nameError && <p className="text-sm text-red-500">{nameError}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Notes</Label>
          <Textarea
            id="description"
            value={descriptionValue || ''}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder="Add more context, links, or steps"
            rows={4}
          />
        </div>
      </div>

      {/* Priority & Dates */}
      <div className="rounded-lg border bg-gray-50 p-3 space-y-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={priorityValue === 'low' ? 'default' : 'outline'}
              className={cn(
                'rounded-full px-3',
                priorityValue === 'low' &&
                  'bg-green-600 text-white hover:bg-green-600'
              )}
              onClick={() => onChangePriority('low')}
            >
              Low
            </Button>
            <Button
              type="button"
              size="sm"
              variant={priorityValue === 'medium' ? 'default' : 'outline'}
              className={cn(
                'rounded-full px-3',
                priorityValue === 'medium' &&
                  'bg-amber-600 text-white hover:bg-amber-600'
              )}
              onClick={() => onChangePriority('medium')}
            >
              Medium
            </Button>
            <Button
              type="button"
              size="sm"
              variant={priorityValue === 'high' ? 'default' : 'outline'}
              className={cn(
                'rounded-full px-3',
                priorityValue === 'high' &&
                  'bg-red-600 text-white hover:bg-red-600'
              )}
              onClick={() => onChangePriority('high')}
            >
              High
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <EnhancedDatePicker
              value={startDateValue || null}
              onChange={(date) => onChangeStartDate(date)}
              placeholder="Select start date"
            />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <EnhancedDatePicker
              value={dueDateValue || null}
              onChange={(date) => onChangeDueDate(date)}
              placeholder="Select due date"
            />
          </div>
        </div>
      </div>

      {/* Recurrence */}
      <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
        <Label>Recurrence</Label>
        <RecurrenceSelector
          isRecurring={isRecurringValue}
          recurrenceType={recurrenceTypeValue || 'daily'}
          recurrenceInterval={recurrenceIntervalValue || 1}
          onRecurringChange={onChangeIsRecurring}
          onTypeChange={onChangeRecurrenceType}
          onIntervalChange={onChangeRecurrenceInterval}
        />
      </div>

      {/* Tags */}
      <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
        <Label>Tags</Label>
        <TagInput
          tags={tagsValue}
          onChange={onChangeTags}
          placeholder="Add tags"
        />
      </div>
    </div>
  );
}
