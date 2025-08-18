import { configureStore } from '@reduxjs/toolkit';
// Slices will be added incrementally during migration

import navigationReducer from './navigationSlice';

export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
  },
  // Keep defaults; can add middleware like logger or RTK Query if needed
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;