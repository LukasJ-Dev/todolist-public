import { createSlice, Slice } from '@reduxjs/toolkit';

export interface uiState {
  showMenu: boolean;
  selectedItem: string;
}

const initialState: uiState = {
  showMenu: false,
  selectedItem: '',
};

export const uiSlice: Slice<uiState> = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleMenu(state) {
      state.showMenu = !state.showMenu;
    },
    setSelectedItem(state, action) {
      state.selectedItem = action.payload;
    },
  },
});

export const { toggleMenu, setSelectedItem } = uiSlice.actions;

export default uiSlice.reducer;
