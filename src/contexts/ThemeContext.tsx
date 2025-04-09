import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme } from '@react-navigation/native';
import { colors } from '../config/theme';

type ThemeType = 'light' | 'dark' | 'system';
type FontSizeType = 'small' | 'medium' | 'large';

interface ThemeContextType {
  theme: ThemeType;
  fontSize: FontSizeType;
  setTheme: (theme: ThemeType) => void;
  setFontSize: (size: FontSizeType) => void;
  isDark: boolean;
  paperTheme: typeof MD3LightTheme;
  navigationTheme: typeof NavigationDefaultTheme;
  saveSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Özel tema renkleri
const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: colors.text,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryDark,
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    error: colors.error,
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#DDDDDD',
    outline: '#444444',
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#232323',
      level3: '#282828',
      level4: '#2D2D2D',
      level5: '#323232',
    },
  },
};

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      background: customLightTheme.colors.background,
      card: customLightTheme.colors.surface,
      text: customLightTheme.colors.text,
      border: customLightTheme.colors.surfaceVariant,
      primary: customLightTheme.colors.primary,
    },
  },
  reactNavigationDark: {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      background: customDarkTheme.colors.background,
      card: customDarkTheme.colors.surface,
      text: customDarkTheme.colors.text,
      border: customDarkTheme.colors.surfaceVariant,
      primary: customDarkTheme.colors.primary,
    },
  },
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('system');
  const [fontSize, setFontSize] = useState<FontSizeType>('medium');

  const isDark = theme === 'system' ? systemTheme === 'dark' : theme === 'dark';

  const paperTheme = isDark ? customDarkTheme : customLightTheme;
  const navigationTheme = isDark ? DarkTheme : LightTheme;

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedFontSize = await AsyncStorage.getItem('fontSize');
      
      if (savedTheme) setTheme(savedTheme as ThemeType);
      if (savedFontSize) setFontSize(savedFontSize as FontSizeType);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('theme', theme);
      await AsyncStorage.setItem('fontSize', fontSize);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        fontSize,
        setTheme,
        setFontSize,
        isDark,
        paperTheme,
        navigationTheme,
        saveSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 