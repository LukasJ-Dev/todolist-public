import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";
import { TaskType } from "../../types";

export const fetchTasksByTodolist = createAsyncThunk(
  "tasks/fetchTasksByTodolist",
  async (todolistId: string, thunkApi) => {
    try {
      const res = await api.get(`/tasks?todolist=${todolistId}`);
      return res.data.data.tasks;
    } catch (err: any) {
      return thunkApi.rejectWithValue(err.response);
    }
  }
);

export const postTask = createAsyncThunk(
  "tasks/postTask",
  async ({ name, todolist }: { name: string; todolist: string }) => {
    const res = await api.post("/tasks", { name, todolist });
    return res.data.data.task;
  }
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async (task: TaskType) => {
    const res = await api.patch(`/tasks/${task._id}`, task);
    return res.data.data.task;
  }
);

export const deleteTask = createAsyncThunk(
  "todolists/deleteTask",
  async (id: string) => {
    await api.delete(`tasks/${id}`);
    return id;
  }
);
