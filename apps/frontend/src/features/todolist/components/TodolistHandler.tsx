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

import { Inbox, Search } from 'lucide-react';
import { selectSelectedItem } from '../../ui/uiSelector';
import { setSelectedItem } from '../../ui/uiSlice';
import { FaPlus } from 'react-icons/fa';

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
  const { data: todolists } = useGetAllTodolistsQuery();

  const selectedItem = useSelector(selectSelectedItem);

  const handleSelectItem = (id: string) => {
    dispatch(setSelectedItem(id));
  };

  const [createTodolist] = useCreateTodolistMutation();

  const newTodolistDialog = () => {
    const newTodolistName = prompt('New Todolist Name');
    if (newTodolistName) {
      createTodolist({ name: newTodolistName });
    }
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
          <SidebarGroupLabel className="flex flex-row justify-between group">
            <span>Todolists</span>
            <div className="flex flex-row gap-4 items-center group-hover:visible invisible">
              <FaPlus
                onClick={() => newTodolistDialog()}
                className="cursor-pointer text-gray-300 h-5 w-5 hover:text-gray-400"
              />
            </div>
          </SidebarGroupLabel>
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
