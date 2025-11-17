import { TaskType } from '../../types';

export interface DateGroup {
  label: string;
  dateRange: string;
  tasks: TaskType[];
  sortOrder: number;
}

export function groupTasksByDate(tasks: TaskType[]): DateGroup[] {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(today.getDate() + 2);

  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  const nextWeekStart = new Date(endOfWeek);
  nextWeekStart.setDate(endOfWeek.getDate() + 1);

  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

  const twoWeeksFromNow = new Date(today);
  twoWeeksFromNow.setDate(today.getDate() + 14);

  const oneMonthFromNow = new Date(today);
  oneMonthFromNow.setMonth(today.getMonth() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: DateGroup[] = [
    {
      label: 'Yesterday',
      dateRange: formatDate(yesterday),
      tasks: [],
      sortOrder: 1,
    },
    {
      label: 'Today',
      dateRange: formatDate(today),
      tasks: [],
      sortOrder: 2,
    },
    {
      label: 'Tomorrow',
      dateRange: formatDate(tomorrow),
      tasks: [],
      sortOrder: 3,
    },
    {
      label: 'This Week',
      dateRange: `${formatDate(dayAfterTomorrow)} - ${formatDate(endOfWeek)}`,
      tasks: [],
      sortOrder: 4,
    },
    {
      label: 'Next Week',
      dateRange: `${formatDate(nextWeekStart)} - ${formatDate(nextWeekEnd)}`,
      tasks: [],
      sortOrder: 5,
    },
    {
      label: 'In 2 Weeks',
      dateRange: `${formatDate(nextWeekEnd)} - ${formatDate(twoWeeksFromNow)}`,
      tasks: [],
      sortOrder: 6,
    },
    {
      label: 'This Month',
      dateRange: `${formatDate(twoWeeksFromNow)} - ${formatDate(oneMonthFromNow)}`,
      tasks: [],
      sortOrder: 7,
    },
    {
      label: 'Later',
      dateRange: `After ${formatDate(oneMonthFromNow)}`,
      tasks: [],
      sortOrder: 8,
    },
  ];

  // Group tasks by their due dates
  tasks.forEach((task) => {
    if (!task.dueDate) return;

    const dueDate = new Date(new Date(task.dueDate).setHours(0, 0, 0, 0));

    if (dueDate.getTime() === yesterday.getTime()) {
      groups[0].tasks.push(task);
    } else if (dueDate.getTime() === today.getTime()) {
      groups[1].tasks.push(task);
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      groups[2].tasks.push(task);
    } else if (dueDate > tomorrow && dueDate <= endOfWeek) {
      groups[3].tasks.push(task);
    } else if (dueDate >= nextWeekStart && dueDate <= nextWeekEnd) {
      groups[4].tasks.push(task);
    } else if (dueDate > nextWeekEnd && dueDate <= twoWeeksFromNow) {
      groups[5].tasks.push(task);
    } else if (dueDate > twoWeeksFromNow && dueDate <= oneMonthFromNow) {
      groups[6].tasks.push(task);
    } else {
      groups[7].tasks.push(task);
    }
  });

  // Sort tasks within each group by due date
  groups.forEach((group) => {
    group.tasks.sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  });

  // Return only groups that have tasks
  return groups.filter((group) => group.tasks.length > 0);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function getRelativeDateLabel(dueDate: string): string {
  const today = new Date();
  const due = new Date(dueDate);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays <= 14) return 'Next week';
  if (diffDays <= 30) return 'This month';
  return 'Later';
}
