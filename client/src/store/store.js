import { configureStore } from '@reduxjs/toolkit';
import authReducer from './Slices/authSlice';
import swipeReducer from './Slices/swipeSlice';
import tutorsReducer from "./Slices/tutorSlice";
import chatReducer from './Slices/chatSlice';
import reviewReducer from './Slices/reviewSlice';
import groupReducer from './Slices/groupSlice';
import messageReducer from './Slices/messageSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    swipes: swipeReducer,
    tutors: tutorsReducer,
    chat: chatReducer ,// Changed from 'chats' to 'chat' to match your slice
    reviews: reviewReducer,
    groups: groupReducer,
    messages: messageReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ['meta.arg', 'payload'],
        ignoredPaths: ['auth.user.photo', 'chat.currentChat'] // Combined ignored paths
      },
    }),
});

export default store;