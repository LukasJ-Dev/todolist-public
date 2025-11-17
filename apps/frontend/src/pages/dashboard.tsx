import { useSelector } from 'react-redux';
import { selectSelectedItem } from '../features/ui/uiSelector';
import TodolistHandler from '../features/todolist/components/TodolistHandler';
import { SidebarProvider, SidebarTrigger } from '../components/UI/sidebar';
import TodolistView from '../features/todolists/components/TodolistView';
import SearchView from '../features/tasks/components/task-display/SearchView';
import InboxView from '../features/tasks/components/task-display/InboxView';
import UpcomingView from '../features/tasks/components/task-display/UpcomingView';
import ErrorBoundary from '../components/ErrorBoundary';
import { useGetAllTodolistsQuery } from '../features/todolists/services/todolistApi';

export default function Dashboard() {
  const selectedItem = useSelector(selectSelectedItem);
  const { data: todolists } = useGetAllTodolistsQuery();

  // Get the current todolist name for mobile header
  const getCurrentTodolistName = () => {
    if (
      selectedItem === 'Inbox' ||
      selectedItem === 'Search' ||
      selectedItem === 'Upcoming'
    ) {
      return selectedItem;
    }
    const todolist = todolists?.find((t: any) => t.id === selectedItem);
    return todolist?.name || 'Todolist';
  };

  return (
    <SidebarProvider>
      <div className="flex flex-row h-full w-full">
        <ErrorBoundary>
          <TodolistHandler />
        </ErrorBoundary>
        <div className="flex flex-col w-full h-full">
          {/* Mobile Header */}
          <div className="flex items-center gap-2 p-4 border-b md:hidden">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">
              {getCurrentTodolistName()}
            </h1>
          </div>

          <ErrorBoundary>
            {selectedItem === 'Inbox' ? (
              <InboxView />
            ) : selectedItem === 'Search' ? (
              <SearchView />
            ) : selectedItem === 'Upcoming' ? (
              <UpcomingView />
            ) : (
              <TodolistView todolistId={selectedItem} />
            )}
          </ErrorBoundary>
        </div>
      </div>
    </SidebarProvider>
  );
}
