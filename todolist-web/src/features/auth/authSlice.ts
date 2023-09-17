import { createSlice } from "@reduxjs/toolkit";
import { RegisterAccount, LogIn } from "./authAPI";

export interface authState {
  status: "idle" | "pending" | "succeeded" | "failed";
  isLoggedIn: boolean;
}

const initialState: authState = {
  status: "idle",
  isLoggedIn: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(RegisterAccount.fulfilled, (state) => {
      state.isLoggedIn = true;
      state.status = "succeeded";
    });
    builder.addCase(RegisterAccount.pending, (state) => {
      state.status = "pending";
    });
    builder.addCase(RegisterAccount.rejected, (state) => {
      state.status = "failed";
    });

    builder.addCase(LogIn.fulfilled, (state) => {
      state.isLoggedIn = true;
      state.status = "succeeded";
    });
    builder.addCase(LogIn.pending, (state) => {
      state.status = "pending";
    });
    builder.addCase(LogIn.rejected, (state) => {
      state.status = "failed";
    });
  },
});

export default authSlice.reducer;
