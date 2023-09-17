import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import uiSlice from "../features/ui/uiSlice";
import todolistSlice from "../features/todolist/todolistSlice";
import taskSlice from "../features/task/taskSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiSlice,
    task: taskSlice,
    todolist: todolistSlice,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;
