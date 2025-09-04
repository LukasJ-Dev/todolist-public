import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SidebarList from "../../../components/UI/SidebarList";
import {
  selectAllTodolists,
  selectFetchTodolistError,
  selectFetchTodolistStatus,
  selectSelectedItem,
} from "../todolistSelector";
import { fetchTodolists, postTodolist } from "../todolistAPI";
import { AppDispatch } from "../../../app/store";
import { useNavigate } from "react-router-dom";
import { setSelectItem } from "../todolistSlice";

function TodolistHandler() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const error = useSelector(selectFetchTodolistError);
  const status = useSelector(selectFetchTodolistStatus);

  useEffect(() => {
    if (status === "failed") {
      if (error?.status === 401) {
        navigate("/signin");
      }
    }
  }, [dispatch, navigate, error, status]);

  useEffect(() => {
    dispatch(fetchTodolists());
  }, [dispatch]);

  const selectedItem = useSelector(selectSelectedItem) || "";

  const todolists = useSelector(selectAllTodolists);

  const handleSelectItem = (id: string) => {
    dispatch(setSelectItem(id));
  };

  const handleNewTodolist = (name: string) => {
    dispatch(postTodolist({ name }));
  };

  return (
    <SidebarList
      title="Todolists"
      itemName="Todolist"
      selectedItem={selectedItem}
      items={todolists}
      callback={(id) => handleSelectItem(id)}
      callbackOnNewItem={handleNewTodolist}
    />
  );
}

export default TodolistHandler;
