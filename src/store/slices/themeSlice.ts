import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';
type FontSizeType = 'small' | 'medium' | 'large';

interface ThemeState {
  theme: ThemeType;
  fontSize: FontSizeType;
  isDark: boolean;
}

const initialState: ThemeState = {
  theme: 'system',
  fontSize: 'medium',
  isDark: false,
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeType>) => {
      state.theme = action.payload;
      AsyncStorage.setItem('theme', action.payload);
    },
    setFontSize: (state, action: PayloadAction<FontSizeType>) => {
      state.fontSize = action.payload;
      AsyncStorage.setItem('fontSize', action.payload);
    },
    setIsDark: (state, action: PayloadAction<boolean>) => {
      state.isDark = action.payload;
    },
  },
});

export const { setTheme, setFontSize, setIsDark } = themeSlice.actions;
export default themeSlice.reducer; 