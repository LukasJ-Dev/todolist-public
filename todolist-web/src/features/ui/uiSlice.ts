import { createSlice } from "@reduxjs/toolkit";

export interface uiState {
  showMenu: boolean;
}

const initialState: uiState = {
  showMenu: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleMenu(state) {
      state.showMenu = !state.showMenu;
    },
  },
});

export const { toggleMenu } = uiSlice.actions;

export default uiSlice.reducer;
