import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { TaskType } from "../../types";
import {
  deleteTask,
  fetchTasksByTodolist,
  postTask,
  updateTask,
} from "./taskAPI";

export interface TaskState {
  tasks: TaskType[];
  status: "idle" | "pending" | "succeeded" | "failed";
  error: {
    status: number;
    statusText: string;
  } | null;
}

const initialState: TaskState = {
  tasks: [],
  status: "idle",
  error: null,
};

export const TaskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTasksByTodolist.rejected, (state, action: any) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(fetchTasksByTodolist.pending, (state) => {
      state.status = "pending";
    });
    builder.addCase(fetchTasksByTodolist.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.tasks = action.payload;
    });
    builder.addCase(
      postTask.fulfilled,
      (state, action: PayloadAction<TaskType>) => {
        state.tasks.push(action.payload);
      }
    );
    builder.addCase(updateTask.fulfilled, (state, action) => {
      const index = state.tasks.findIndex(
        (task) => task._id === action.payload._id
      );

      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    });

    builder.addCase(deleteTask.fulfilled, (state, action) => {
      const taskIndex = state.tasks.findIndex(
        (task) => task._id === action.payload
      );

      if (taskIndex > -1) {
        state.tasks.splice(taskIndex, 1);
      }
    });
  },
});

export default TaskSlice.reducer;
