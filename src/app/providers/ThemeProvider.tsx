import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, ThemeColors, getThemeColors } from '@/shared/constants/theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isSystemTheme: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [currentTheme, setCurrentTheme] = useState<Theme>('light');
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Initialize theme from system preference
  useEffect(() => {
    if (systemColorScheme && isSystemTheme) {
      setCurrentTheme(systemColorScheme);
    }
  }, [systemColorScheme, isSystemTheme]);

  const setTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    setIsSystemTheme(false);
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  const colors = getThemeColors(currentTheme);

  const value: ThemeContextType = {
    theme: currentTheme,
    isDark: currentTheme === 'dark',
    colors,
    setTheme,
    toggleTheme,
    isSystemTheme,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }
  return context;
};
