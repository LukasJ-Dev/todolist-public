import { useSelector } from 'react-redux';
import { selectSelectedItem } from '../features/ui/uiSelector';
import TodolistHandler from '../features/todolist/components/TodolistHandler';
import { SidebarProvider } from '../components/UI/sidebar';
import TodolistView from '../components/TodolistView';
import AllTasks from '../components/all-tasks';

export default function Dashboard() {
  const selectedItem = useSelector(selectSelectedItem);

  return (
    <SidebarProvider>
      <div className="flex flex-row h-full w-full">
        <TodolistHandler />
        <div className="flex flex-col w-full h-full">
          {selectedItem === 'Inbox' ? (
            <AllTasks />
          ) : selectedItem === 'Search' ? (
            <AllTasks />
          ) : (
            <TodolistView todolistId={selectedItem} />
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
