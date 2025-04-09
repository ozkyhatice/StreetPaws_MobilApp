import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
      AsyncStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount -= 1;
        AsyncStorage.setItem('notifications', JSON.stringify(state.notifications));
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
        }
      });
      state.unreadCount = 0;
      AsyncStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.read).length;
    },
  },
});

export const { addNotification, markAsRead, markAllAsRead, setNotifications } = notificationSlice.actions;
export default notificationSlice.reducer; 