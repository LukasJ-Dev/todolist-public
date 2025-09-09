function NewTask({ callback }: { callback: (value: string) => void }) {
  const onEnter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      callback(event.currentTarget.value);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input className="w-full" placeholder="New Task" onKeyDown={onEnter} />
    </div>
  );
}

export default NewTask;
