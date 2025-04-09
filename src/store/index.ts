import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Slices
import authReducer from './auth/authSlice';
import petsReducer from './pets/petsSlice';
import themeReducer from './theme/themeSlice';
import notificationReducer from './notifications/notificationSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'theme'], // Sadece auth ve theme'i kalıcı hale getir
};

const rootReducer = combineReducers({
  auth: authReducer,
  pets: petsReducer,
  theme: themeReducer,
  notifications: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 