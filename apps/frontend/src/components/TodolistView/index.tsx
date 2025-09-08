import { useEffect, useState } from 'react';
import TaskCard from '../TaskCard';
import NewTaskCard from '../TaskCard/NewTask';
import * as S from './style';
import { useDispatch, useSelector } from 'react-redux';

import EditTaskModal from '../EditTaskModal';
import { createPortal } from 'react-dom';
import IconButton from '../UI/IconButton';
import { FaPen, FaTrash } from 'react-icons/fa';

import { AppDispatch } from '../../app/store';
import { selectSelectedItem } from '../../features/ui/uiSelector';
import { TaskType, TodolistType } from '../../types';
import {
  useCreateTaskMutation,
  useDeleteTaskMutation,
  useGetTasksByTodolistQuery,
  useUpdateTaskMutation,
} from '../../services/taskApi';
import {
  useGetAllTodolistsQuery,
  useUpdateTodolistMutation,
} from '../../services/todolistApi';
import { useDeleteTodolistMutation } from '../../services/todolistApi';

const TodolistView = ({ todolistId }: { todolistId: string }) => {
  const [editTask, setEditTask] = useState<TaskType | undefined>(undefined);

  const dispatch = useDispatch<AppDispatch>();

  const selectedItem = todolistId;

  const { data: todolist } = useGetAllTodolistsQuery();

  const todolistName = todolist?.find(
    (todolist) => todolist._id === selectedItem
  )?.name;

  const todolistAmount = todolist?.length;

  const { data: tasks } = useGetTasksByTodolistQuery(selectedItem);

  const [createTask] = useCreateTaskMutation();
  const [deleteTodolist] = useDeleteTodolistMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
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

  /*
  const handleChangeName = async () => {
    if (selectedItem === null) return alert('No todolist selected');
    const newName = prompt('New Name');
    if (!newName) return alert('Something went wrong');

    dispatch(updateTodolist({ id: selectedItem, name: newName }));
  };*/

  const handleChangeName = async () => {};

  const handleCheck = async (checked: boolean, _id: string) => {
    updateTask({ _id, checked });
  };

  const handleDeleteTask = async (taskId: string) => {
    deleteTask(taskId);
  };

  const saveEditTask = async (task: TaskType) => {
    updateTask(task);

    setEditTask(undefined);
  };

  const handleEditTask = (taskId: string) => {
    setEditTask(tasks?.find((task) => task._id === taskId));
  };

  return (
    <>
      <S.styledTodolist>
        <S.TodolistHead>
          <S.styledTitle>{todolistName}</S.styledTitle>
          <S.ButtonContainer>
            <IconButton
              icon={FaPen}
              size="32"
              color="black"
              onClick={handleChangeName}
            />
            <IconButton
              icon={FaTrash}
              size="32"
              color="black"
              onClick={handleDeleteTodolist}
            />
          </S.ButtonContainer>
        </S.TodolistHead>

        {tasks?.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onChecked={handleCheck}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        ))}
        <NewTaskCard callback={newTaskInput} />
      </S.styledTodolist>
      {createPortal(
        <EditTaskModal
          task={editTask || null}
          onCancel={() => setEditTask(undefined)}
          onSave={(task) => saveEditTask(task)}
        />,
        document.getElementById('edit-modal-element')!
      )}
    </>
  );
};

export default TodolistView;
