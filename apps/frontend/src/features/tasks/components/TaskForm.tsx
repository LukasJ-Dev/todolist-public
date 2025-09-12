import { useState } from 'react';
import { Input } from '../../../components/UI/input';
import { Spinner } from '../../../components/UI/spinner';

function NewTask({
  callback,
  disabled = false,
}: {
  callback: (value: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');

  const onEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && value.trim() && !disabled) {
      callback(value.trim());
      setValue(''); // Clear input after submission
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          className="w-full"
          placeholder={disabled ? 'Creating task...' : 'New Task'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onEnter}
          disabled={disabled}
        />
        {disabled && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Spinner size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}

export default NewTask;
