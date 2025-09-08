import { createSelector, Selector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

const uiSlice = (state: RootState) => state.ui;

export const selectShowMenu: Selector<RootState, boolean> = createSelector(
  [uiSlice],
  (uiSlice) => uiSlice.showMenu
);

export const selectSelectedItem: Selector<RootState, string> = createSelector(
  [uiSlice],
  (uiSlice) => uiSlice.selectedItem
);
