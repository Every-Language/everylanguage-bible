import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeMode, ThemeContextType } from '@/shared/types/theme';
import { themes } from '@/shared/constants/theme';
import { logger } from '@/shared/utils/logger';

// Theme storage key
const THEME_STORAGE_KEY = '@theme_mode';

// Create the theme context
const ThemeContext = createContext<ThemeContextType | null>(null);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeMode;
}

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialTheme || 'light');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system color scheme changes (if using system default)
  useEffect(() => {
    if (!initialTheme) {
      const systemMode = systemColorScheme === 'dark' ? 'dark' : 'light';
      setMode(systemMode);
    }
  }, [systemColorScheme, initialTheme]);

  // Load theme preference from storage
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setMode(savedTheme);
      } else {
        // Use system preference if no saved preference
        const systemMode = systemColorScheme === 'dark' ? 'dark' : 'light';
        setMode(systemMode);
      }
    } catch (error) {
      logger.error('Error loading theme preference:', error);
      // Fallback to system preference
      const systemMode = systemColorScheme === 'dark' ? 'dark' : 'light';
      setMode(systemMode);
    } finally {
      setIsLoading(false);
    }
  };

  // Save theme preference to storage
  const saveThemePreference = async (theme: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      logger.error('Error saving theme preference:', error);
    }
  };

  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    saveThemePreference(newMode);
  };

  // Set specific theme
  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    saveThemePreference(newMode);
  };

  // Get current theme object
  const theme: Theme = themes[mode];

  // ✅ PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  const contextValue: ThemeContextType = useMemo(
    () => ({
      theme,
      mode,
      toggleTheme,
      setTheme,
    }),
    [theme, mode, toggleTheme, setTheme]
  );

  // Don't render until theme is loaded
  if (isLoading) {
    return null; // or a loading component
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

// Convenience hooks for specific theme properties
export function useThemeColors() {
  const { theme } = useTheme();
  return theme.colors;
}

export function useThemeSpacing() {
  const { theme } = useTheme();
  return theme.spacing;
}

export function useThemeTypography() {
  const { theme } = useTheme();
  return theme.typography;
}

export function useThemeBorderRadius() {
  const { theme } = useTheme();
  return theme.borderRadius;
}
