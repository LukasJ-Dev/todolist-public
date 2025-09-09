function TaskCheckbox({
  checked,
  onChecked,
}: {
  checked: boolean;
  onChecked: (checked: boolean) => void;
}) {
  return (
    <div className="w-6 h-6 relative">
      <label
        className={`
          ${
            checked
              ? 'bg-green-500 border-green-500'
              : 'bg-white border-gray-300'
          } 
          border-2 rounded-full cursor-pointer h-6 w-6 left-0 absolute
          after:border-2 after:border-white after:border-t-0 after:border-r-0 
          after:content-[''] after:h-1.5 after:left-1 after:top-2 
          after:absolute after:rotate-[-45deg] after:w-2.5
          ${checked ? 'after:opacity-100' : 'after:opacity-0'}
        `}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChecked(e.target.checked)}
          className="invisible w-6 h-6"
        />
      </label>
    </div>
  );
}

export default TaskCheckbox;
