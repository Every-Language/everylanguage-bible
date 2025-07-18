import React from 'react';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  bibleBooksBackground: string;
  chapterTileBackground: string;
  // Navigation button colors
  navigationSelected: string;
  navigationUnselected: string;
  navigationSelectedText: string;
  navigationUnselectedText: string;
}

interface ThemeState {
  // Current theme
  theme: Theme;
  themeMode: ThemeMode; // New: tracks user preference (light/dark/system)
  isDark: boolean;
  colors: ThemeColors;

  // Track if theme was manually set (to prevent auto-override)
  isManuallySet: boolean;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: ThemeMode) => void; // New: set user preference
  setSystemTheme: (theme: Theme) => void; // For system theme updates
  initializeFromSystem: () => void;
  reset: () => void;
}

const lightColors: ThemeColors = {
  background: '#D8D2C6', // Slightly darker than chapterTileBackground for chapter items
  text: '#070707', // secondaryDark - almost black
  primary: '#264854', // primaryAccent - dark blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan
  bibleBooksBackground: '#F9F7F4', // Light mode Bible books screen background
  chapterTileBackground: '#EAE9E7', // Light mode chapter tile background
  // Navigation button colors
  navigationSelected: '#AC8F57', // Selected navigation button
  navigationUnselected: '#ECE6DA', // Unselected navigation button
  navigationSelectedText: '#F9F7F4', // Selected navigation text (light mode)
  navigationUnselectedText: '#AC8F57', // Unselected navigation text (light mode)
};

const darkColors: ThemeColors = {
  background: '#414141', // Dark mode chapter items
  text: '#EBE5D9', // primaryLight - warm cream (for contrast)
  primary: '#92BEC3', // secondaryLight - light blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan (consistent)
  bibleBooksBackground: '#070707', // Dark mode Bible books screen background
  chapterTileBackground: '#282827', // Dark mode chapter card background
  // Navigation button colors
  navigationSelected: '#AC8F57', // Selected navigation button
  navigationUnselected: '#282827', // Unselected navigation button (dark mode)
  navigationSelectedText: '#070707', // Selected navigation text (dark mode)
  navigationUnselectedText: '#FFFFFF', // Unselected navigation text (dark mode)
};

const getColorsForTheme = (theme: Theme): ThemeColors => {
  return theme === 'dark' ? darkColors : lightColors;
};

const THEME_MODE_KEY = '@theme_mode';
const MANUAL_THEME_KEY = '@manual_theme';

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Initial state
  theme: 'light',
  themeMode: 'system', // Default to system theme
  isDark: false,
  colors: lightColors,
  isManuallySet: false,

  // Actions
  toggleTheme: () => {
    const { theme } = get();
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    const newColors = getColorsForTheme(newTheme);

    set({
      theme: newTheme,
      themeMode: newTheme, // Set mode to the selected theme
      isDark: newTheme === 'dark',
      colors: newColors,
      isManuallySet: true, // Mark as manually set
    });

    // Save to AsyncStorage
    AsyncStorage.setItem(THEME_MODE_KEY, newTheme);
    AsyncStorage.setItem(MANUAL_THEME_KEY, 'true');
  },

  setTheme: (newTheme: Theme) => {
    const newColors = getColorsForTheme(newTheme);

    set({
      theme: newTheme,
      themeMode: newTheme, // Set mode to the selected theme
      isDark: newTheme === 'dark',
      colors: newColors,
      isManuallySet: true, // Mark as manually set
    });

    // Save to AsyncStorage
    AsyncStorage.setItem(THEME_MODE_KEY, newTheme);
    AsyncStorage.setItem(MANUAL_THEME_KEY, 'true');
  },

  setThemeMode: (newMode: ThemeMode) => {
    const newColors = getColorsForTheme(
      newMode === 'system' ? get().theme : newMode
    );
    const isManual = newMode !== 'system';

    set({
      themeMode: newMode,
      theme: newMode === 'system' ? get().theme : newMode,
      isDark: (newMode === 'system' ? get().theme : newMode) === 'dark',
      colors: newColors,
      isManuallySet: isManual,
    });

    // Save to AsyncStorage
    AsyncStorage.setItem(THEME_MODE_KEY, newMode);
    AsyncStorage.setItem(MANUAL_THEME_KEY, isManual.toString());
  },

  setSystemTheme: (newTheme: Theme) => {
    const { themeMode } = get();

    // Only update if we're in system mode
    if (themeMode === 'system') {
      const newColors = getColorsForTheme(newTheme);

      set({
        theme: newTheme,
        isDark: newTheme === 'dark',
        colors: newColors,
        // Don't mark as manually set - this is system driven
      });
    }
  },

  initializeFromSystem: async () => {
    try {
      const savedThemeMode = await AsyncStorage.getItem(THEME_MODE_KEY);
      const savedManualFlag = await AsyncStorage.getItem(MANUAL_THEME_KEY);

      if (savedThemeMode) {
        const isManual = savedManualFlag === 'true';
        const mode = savedThemeMode as ThemeMode;

        set({
          themeMode: mode,
          isManuallySet: isManual,
        });
      }
    } catch (error) {
      console.warn('Failed to load theme preferences from storage:', error);
    }
  },

  reset: () => {
    set({
      theme: 'light',
      themeMode: 'system',
      isDark: false,
      colors: lightColors,
      isManuallySet: false,
    });

    // Clear AsyncStorage
    AsyncStorage.removeItem(THEME_MODE_KEY);
    AsyncStorage.removeItem(MANUAL_THEME_KEY);
  },
}));

// Helper hook that combines system theme detection with store
export const useTheme = () => {
  const store = useThemeStore();

  // Initialize from storage on first mount ONLY
  React.useEffect(() => {
    store.initializeFromSystem();
  }, []); // Empty dependency array - only run once

  // NO automatic system theme monitoring here!
  // System theme will only be checked when user toggles "Use System Theme"

  return store;
};
