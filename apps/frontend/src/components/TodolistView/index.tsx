import { FaPen, FaTrash } from 'react-icons/fa';

import { Separator } from '../UI/separator';
import {
  useCreateTaskMutation,
  useGetTasksByTodolistQuery,
} from '../../services/taskApi';
import {
  useGetAllTodolistsQuery,
  useUpdateTodolistMutation,
} from '../../services/todolistApi';
import { useDeleteTodolistMutation } from '../../services/todolistApi';
import TaskCardList from '../task-card-list';
import NewTask from '../new-task';

const TodolistView = ({ todolistId }: { todolistId: string }) => {
  const selectedItem = todolistId;

  const { data: todolist } = useGetAllTodolistsQuery();

  const todolistName = todolist?.find(
    (todolist) => todolist._id === selectedItem
  )?.name;

  const todolistAmount = todolist?.length;

  const { data: tasks } = useGetTasksByTodolistQuery(selectedItem);

  const [createTask] = useCreateTaskMutation();
  const [deleteTodolist] = useDeleteTodolistMutation();
  const [updateTodolist] = useUpdateTodolistMutation();
  const newTaskInput = async (name: string) => {
    if (!selectedItem) return alert('no selected todolist');
    createTask({
      name: name,
      todolist: selectedItem,
      description: '',
      checked: false,
    });
  };
  const handleDeleteTodolist = async () => {
    if (selectedItem === null) return alert('No todolist selected');
    if (todolistAmount === 1)
      return alert('You cant have less than one todolist');
    const deleteConfirm = confirm(
      'Are you sure you want to delete this todolist and all of its tasks? (This todolist will be GONE FOREVER)'
    );
    if (deleteConfirm) deleteTodolist(selectedItem);
  };

  const handleChangeName = async () => {
    if (selectedItem === null) return alert('No todolist selected');
    const newName = prompt('New Name');
    if (!newName) return alert('Something went wrong');

    updateTodolist({ _id: selectedItem, name: newName });
  };

  return (
    <div className="flex flex-row gap-2 w-full justify-center p-6 pt-10">
      <div className="flex flex-col gap-2 p-2 w-full max-w-5xl">
        <div className="flex flex-row justify-between group">
          <p className="text-2xl">{todolistName}</p>
          <div className="flex flex-row gap-4 items-center group-hover:visible invisible">
            <FaPen
              onClick={handleChangeName}
              className="cursor-pointer text-gray-400 h-5 w-5 hover:text-gray-500"
            />
            <FaTrash
              onClick={handleDeleteTodolist}
              className="cursor-pointer text-gray-400 h-5 w-5 hover:text-gray-500"
            />
          </div>
        </div>

        <TaskCardList tasks={tasks || []} />
        <NewTask callback={newTaskInput} />
        <Separator />
      </div>
    </div>
  );
};

export default TodolistView;
