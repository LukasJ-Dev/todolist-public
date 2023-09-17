import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

const uiSlice = (state: RootState) => state.ui;

export const selectShowMenu = createSelector(
  [uiSlice],
  (uiSlice) => uiSlice.showMenu
);
