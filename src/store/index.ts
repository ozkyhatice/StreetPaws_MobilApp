import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

// Slices
import authReducer from './auth/authSlice';
import petsReducer from './pets/petsSlice';
import themeReducer from './theme/themeSlice';
import notificationsReducer from './notifications/notificationSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['notifications'], // Sadece bu state'ler persist edilecek
};

const rootReducer = combineReducers({
  auth: authReducer,
  pets: petsReducer,
  theme: themeReducer,
  notifications: notificationsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Redux Toolkit'in serializability kontrolünü devre dışı bırak
        // Bu, tarih ve Timestamp nesneleri için gerekli
        ignoredActionPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: [
          'notifications.items.timestamp',
        ],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 