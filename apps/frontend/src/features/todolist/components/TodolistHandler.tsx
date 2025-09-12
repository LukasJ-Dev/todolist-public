import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch } from '../../../app/store';
import { useGetAllTodolistsQuery } from '../../todolists/services/todolistApi';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../../components/UI/sidebar';
import NewTodolistDialog from '../../todolists/dialogs/NewTodolistDialog';
import { Skeleton } from '../../../components/UI/skeleton';
import { Button } from '../../../components/UI/button';

import { Inbox, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { selectSelectedItem } from '../../ui/uiSelector';
import { setSelectedItem } from '../../ui/uiSlice';
import { FaPlus } from 'react-icons/fa';
import { useTouch } from '../../../hooks/useTouch';
import AccountSection from '../../ui/components/AccountSection';

const items = [
  {
    title: 'Inbox',
    icon: Inbox,
  },
  {
    title: 'Search',
    icon: Search,
  },
];

function TodolistHandler() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    data: todolists,
    isLoading: todolistsLoading,
    error: todolistsError,
    refetch: refetchTodolists,
  } = useGetAllTodolistsQuery();

  const selectedItem = useSelector(selectSelectedItem);
  const isTouch = useTouch();

  const handleSelectItem = (id: string) => {
    dispatch(setSelectedItem(id));
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      onClick={() => handleSelectItem(item.title)}
                      className={`${selectedItem === item.title ? 'bg-blue-100 text-blue-700' : ''}`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex flex-row justify-between group">
            <span>Todolists</span>
            <div
              className={`flex flex-row gap-4 items-center ${isTouch ? 'visible' : 'group-hover:visible invisible'}`}
            >
              <NewTodolistDialog>
                <button className="text-blue-400 hover:text-blue-600">
                  <FaPlus className="h-5 w-5" />
                </button>
              </NewTodolistDialog>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {todolistsError ? (
              <div className="flex flex-col items-center gap-2 p-4">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-xs text-gray-600 text-center">
                  Failed to load
                </p>
                <Button
                  onClick={() => refetchTodolists()}
                  variant="outline"
                  size="sm"
                  className="gap-1 h-6 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </Button>
              </div>
            ) : todolistsLoading ? (
              <div className="flex flex-col gap-1 p-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <SidebarMenu>
                {todolists?.map((item: any) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <a
                        onClick={() => {
                          handleSelectItem(item.id);
                          console.log('selectedItem', item);
                        }}
                        className={` ${
                          selectedItem === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : ''
                        }`}
                      >
                        <span>{item.name}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <AccountSection />
      </SidebarFooter>
    </Sidebar>
  );
}

export default TodolistHandler;
