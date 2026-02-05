import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './chatSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    notification: notificationReducer
  }
});
