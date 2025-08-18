import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
// Slices will be added incrementally during migration

import navigationReducer from './navigationSlice';

export const store = configureStore({
  reducer: {
    navigation: navigationReducer,
  },
  middleware: getDefaultMiddleware({
    serializableCheck: {
      // Ignore these action types
      ignoredActions: ['navigation/loadState/fulfilled'],
      // Ignore these field paths in all actions
      ignoredActionPaths: ['payload.analytics.generatedAt', 'meta.arg'],
      // Ignore these paths in the state
      ignoredPaths: ['navigation.analytics.generatedAt'],
    },
  }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;