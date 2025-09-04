import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import {
  deleteTodolist,
  fetchTodolists,
  postTodolist,
  updateTodolist,
} from "./todolistAPI";

import { TodolistType } from "../../types";

export interface todolistState {
  todolists: TodolistType[];
  status: "idle" | "pending" | "succeeded" | "failed";
  error: {
    status: number;
    statusText: string;
  } | null;
  selectedItem: string | null;
}

const initialState: todolistState = {
  todolists: [],
  status: "idle",
  error: null,
  selectedItem: null,
};

export const todolistSlice = createSlice({
  name: "todolist",
  initialState,
  reducers: {
    setSelectItem(state, action) {
      state.selectedItem = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTodolists.rejected, (state, action: any) => {
      state.status = "failed";
      state.error = action.payload;
    });
    builder.addCase(fetchTodolists.pending, (state) => {
      state.status = "pending";
    });
    builder.addCase(fetchTodolists.fulfilled, (state, action) => {
      state.status = "succeeded";
      state.error = null;
      state.todolists = action.payload.data.todolists;
      if (!state.selectedItem)
        state.selectedItem = action.payload.data.todolists[0]._id;
    });

    builder.addCase(postTodolist.fulfilled, (state, action) => {
      state.todolists.push(action.payload.data.todolist);
    });

    builder.addCase(deleteTodolist.fulfilled, (state, action) => {
      const todolistIndex = state.todolists.findIndex(
        (todolist) => todolist._id === action.payload
      );

      if (todolistIndex > -1) {
        if (state.todolists[todolistIndex - 1] != null)
          state.selectedItem = state.todolists[todolistIndex - 1]._id;
        else if (state.todolists[todolistIndex + 1] != null)
          state.selectedItem = state.todolists[todolistIndex + 1]._id;
        state.todolists.splice(todolistIndex, 1);
      }
    });

    builder.addCase(
      updateTodolist.fulfilled,
      (state, action: PayloadAction<TodolistType>) => {
        const index = state.todolists.findIndex(
          (todolist) => todolist._id === action.payload._id
        );

        if (index !== -1) {
          state.todolists[index] = action.payload;
        }
      }
    );
  },
});

export const { setSelectItem } = todolistSlice.actions;

export default todolistSlice.reducer;
