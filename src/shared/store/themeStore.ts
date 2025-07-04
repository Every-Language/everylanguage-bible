import React from 'react';
import { create } from 'zustand';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
}

interface ThemeState {
  // Current theme
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;

  // Track if theme was manually set (to prevent auto-override)
  isManuallySet: boolean;

  // Actions
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setSystemTheme: (theme: Theme) => void; // New action for system theme updates
  initializeFromSystem: () => void;
  reset: () => void;
}

const lightColors: ThemeColors = {
  background: '#EBE5D9', // primaryLight - warm cream/beige
  text: '#070707', // secondaryDark - almost black
  primary: '#264854', // primaryAccent - dark blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan
};

const darkColors: ThemeColors = {
  background: '#282827', // primaryDark - very dark gray
  text: '#EBE5D9', // primaryLight - warm cream (for contrast)
  primary: '#92BEC3', // secondaryLight - light blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan (consistent)
};

const getColorsForTheme = (theme: Theme): ThemeColors => {
  return theme === 'dark' ? darkColors : lightColors;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Initial state
  theme: 'light',
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
      isDark: newTheme === 'dark',
      colors: newColors,
      isManuallySet: true, // Mark as manually set
    });
  },

  setTheme: (newTheme: Theme) => {
    const newColors = getColorsForTheme(newTheme);

    set({
      theme: newTheme,
      isDark: newTheme === 'dark',
      colors: newColors,
      isManuallySet: true, // Mark as manually set
    });
  },

  setSystemTheme: (newTheme: Theme) => {
    const newColors = getColorsForTheme(newTheme);

    set({
      theme: newTheme,
      isDark: newTheme === 'dark',
      colors: newColors,
      // Don't mark as manually set - this is system driven
    });
  },

  initializeFromSystem: () => {
    // This should be called once on app startup
    // Note: useColorScheme() hook should be called from a component
    // We'll handle system theme detection in the App component
  },

  reset: () => {
    set({
      theme: 'light',
      isDark: false,
      colors: lightColors,
      isManuallySet: false,
    });
  },
}));

// Helper hook that combines system theme detection with store
export const useTheme = () => {
  const store = useThemeStore();
  const systemColorScheme = useColorScheme();

  // Initialize theme from system on first use and listen for system changes
  React.useEffect(() => {
    // If no manual theme has been set and system theme is available
    if (!store.isManuallySet && systemColorScheme) {
      // Only update if different from current theme
      if (store.theme !== systemColorScheme) {
        store.setSystemTheme(systemColorScheme);
      }
    }
  }, [
    store,
    systemColorScheme,
    store.isManuallySet,
    store.theme,
    store.setSystemTheme,
  ]);

  return store;
};
