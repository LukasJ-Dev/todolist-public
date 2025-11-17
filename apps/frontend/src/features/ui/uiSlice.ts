import { createSlice, Slice } from '@reduxjs/toolkit';
import { TaskType } from '../tasks/types';

export interface uiState {
  showMenu: boolean;
  selectedItem: string;
  selectedTask: TaskType | null;
}

const initialState: uiState = {
  showMenu: false,
  selectedItem: '',
  selectedTask: null,
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
    setSelectedTask(state, action) {
      state.selectedTask = action.payload;
    },
  },
});

export const { toggleMenu, setSelectedItem, setSelectedTask } = uiSlice.actions;

export default uiSlice.reducer;
