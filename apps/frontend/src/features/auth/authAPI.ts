import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/api";

export const RegisterAccount = createAsyncThunk(
  "auth/register",
  async (newUser: { name: string; email: string; password: string }) => {
    const res = await api.post("/users/signup", newUser);
    return res.data;
  }
);

export const LogIn = createAsyncThunk(
  "auth/login",
  async (user: { email: string; password: string }) => {
    const res = await api.post("/users/login", user);
    return res.data;
  }
);
