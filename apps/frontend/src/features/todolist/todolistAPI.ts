import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/api';

export const fetchTodolists = createAsyncThunk(
  'todolist/fetchTodolist',
  async (_arg, thunkApi) => {
    try {
      const res = await api.get('/todolists');
      return res.data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(err.response);
    }
  }
);

export const postTodolist = createAsyncThunk(
  'todolist/postTodolist',
  async ({ name }: { name: string }) => {
    const res = await api.post('/todolists', { name });
    return res.data;
  }
);

export const updateTodolist = createAsyncThunk(
  'todolists/updateTodolist',
  async ({ id, name }: { id: string; name: string }) => {
    const res = await api.patch(`todolists/${id}`, { name });
    return res.data.data.todolist;
  }
);

export const deleteTodolist = createAsyncThunk(
  'todolists/deleteTodolist',
  async (id: string) => {
    await api.delete(`todolists/${id}`);
    return id;
  }
);
