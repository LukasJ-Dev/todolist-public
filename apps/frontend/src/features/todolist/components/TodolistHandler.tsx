import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch } from '../../../app/store';
import {
  useCreateTodolistMutation,
  useGetAllTodolistsQuery,
} from '../../../services/todolistApi';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../../components/UI/sidebar';

import { Calendar, Home, Inbox, Search } from 'lucide-react';
import { selectSelectedItem } from '../../ui/uiSelector';
import { setSelectedItem } from '../../ui/uiSlice';

const items = [
  {
    title: 'Home',
    url: '#',
    icon: Home,
  },
  {
    title: 'Inbox',
    url: '#',
    icon: Inbox,
  },
  {
    title: 'Incoming',
    url: '#',
    icon: Calendar,
  },
  {
    title: 'Search',
    url: '#',
    icon: Search,
  },
];

function TodolistHandler() {
  const dispatch = useDispatch<AppDispatch>();
  const { data: todolists } = useGetAllTodolistsQuery();

  const selectedItem = useSelector(selectSelectedItem);

  const handleSelectItem = (id: string) => {
    dispatch(setSelectedItem(id));
  };

  const [createTodolist] = useCreateTodolistMutation();

  const handleNewTodolist = (name: string) => {
    createTodolist({ name });
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
                      className={`${selectedItem === item.title ? 'bg-gray-100' : ''}`}
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
          <SidebarGroupLabel>Todolists</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {todolists?.map((item) => (
                <SidebarMenuItem key={item._id}>
                  <SidebarMenuButton asChild>
                    <a
                      onClick={() => handleSelectItem(item._id)}
                      className={` ${
                        selectedItem === item._id ? 'bg-gray-100' : ''
                      }`}
                    >
                      <span>{item.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default TodolistHandler;
