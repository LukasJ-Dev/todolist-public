import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

const authSlice = (state: RootState) => state.auth;

export const selectIsLoggedIn = createSelector(
  [authSlice],
  (authSlice) => authSlice.isLoggedIn
);
