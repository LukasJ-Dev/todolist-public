import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

const taskSlice = (state: RootState) => state.task;

export const selectTasks = createSelector(
  [taskSlice],
  (taskSlice) => taskSlice.tasks
);
