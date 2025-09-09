import { createSelector, Selector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import { TaskType } from '../../types';

const uiSlice = (state: RootState) => state.ui;

export const selectShowMenu: Selector<RootState, boolean> = createSelector(
  [uiSlice],
  (uiSlice) => uiSlice.showMenu
);

export const selectSelectedItem: Selector<RootState, string> = createSelector(
  [uiSlice],
  (uiSlice) => uiSlice.selectedItem
);

export const selectSelectedTask: Selector<RootState, TaskType | null> =
  createSelector([uiSlice], (uiSlice) => uiSlice.selectedTask);
