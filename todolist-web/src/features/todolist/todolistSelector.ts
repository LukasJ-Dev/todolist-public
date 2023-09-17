import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

const todolistSlice = (state: RootState) => state.todolist;

export const selectAllTodolists = createSelector(
  [todolistSlice],
  (todolistSlice) => todolistSlice.todolists
);

export const selectTodolistName = createSelector(
  [todolistSlice],
  (todolistSlice) =>
    todolistSlice.todolists.find(
      (todolist) => todolist._id === todolistSlice.selectedItem
    )?.name
);

export const selectAmountOfTodolists = createSelector(
  [todolistSlice],
  (todolistSlice) => todolistSlice.todolists.length
);

export const selectFetchTodolistStatus = createSelector(
  [todolistSlice],
  (todolistSlice) => todolistSlice.status
);

export const selectFetchTodolistError = createSelector(
  [todolistSlice],
  (todolistSlice) => todolistSlice.error
);

export const selectSelectedItem = createSelector(
  [todolistSlice],
  (todolistSlice) => todolistSlice.selectedItem
);
