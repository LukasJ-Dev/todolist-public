import { useEffect, useState } from "react";
import TaskCard from "../TaskCard";
import NewTaskCard from "../TaskCard/NewTask";
import * as S from "./style";
import { useDispatch, useSelector } from "react-redux";

import EditTaskModal from "../EditTaskModal";
import { createPortal } from "react-dom";
import IconButton from "../UI/IconButton";
import { FaCheckDouble, FaMinus, FaPen, FaTrash } from "react-icons/fa";

import {
  selectTodolistName,
  selectAmountOfTodolists,
  selectSelectedItem,
} from "../../features/todolist/todolistSelector";
import {
  deleteTodolist,
  updateTodolist,
} from "../../features/todolist/todolistAPI";
import { AppDispatch } from "../../app/store";
import { selectTasks } from "../../features/task/taskSelector";
import {
  deleteTask,
  fetchTasksByTodolist,
  postTask,
  updateTask,
} from "../../features/task/taskAPI";
import { TaskType } from "../../types";

const Todolist = () => {
  const [editTask, setEditTask] = useState<TaskType | undefined>(undefined);

  const dispatch = useDispatch<AppDispatch>();

  const todolistName = useSelector(selectTodolistName);

  const todolistAmount = useSelector(selectAmountOfTodolists);

  const selectedItem = useSelector(selectSelectedItem);

  const tasks = useSelector(selectTasks);

  useEffect(() => {
    if (selectedItem) dispatch(fetchTasksByTodolist(selectedItem));
  }, [selectedItem]);

  const newTaskInput = async (name: string) => {
    if (!selectedItem) return alert("no selected todolist");
    dispatch(postTask({ name: name, todolist: selectedItem }));
  };

  const handleDeleteTodolist = async () => {
    if (selectedItem === null) return alert("No todolist selected");
    if (todolistAmount === 1)
      return alert("You cant have less than one todolist");
    const deleteConfirm = confirm(
      "Are you sure you want to delete this todolist and all of its tasks? (This todolist will be GONE FOREVER)"
    );
    if (deleteConfirm) dispatch(deleteTodolist(selectedItem));
  };

  const handleChangeName = async () => {
    if (selectedItem === null) return alert("No todolist selected");
    const newName = prompt("New Name");
    if (!newName) return alert("Something went wrong");

    dispatch(updateTodolist({ id: selectedItem, name: newName }));
  };
  const handleCheck = async (checked: boolean, _id: string) => {
    dispatch(updateTask({ _id, checked }));
  };

  const handleDeleteTask = async (taskId: string) => {
    dispatch(deleteTask(taskId));
  };

  const saveEditTask = async (task: TaskType) => {
    dispatch(updateTask(task));

    setEditTask(undefined);
  };

  const handleEditTask = (taskId: string) => {
    setEditTask(tasks.find((task) => task._id === taskId));
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
        document.getElementById("edit-modal-element")!
      )}
    </>
  );
};

export default Todolist;
