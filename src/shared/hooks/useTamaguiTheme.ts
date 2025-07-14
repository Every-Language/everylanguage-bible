import { useTheme as useTamaguiTheme } from '@tamagui/core';
import { useThemeContext } from '@/app/providers/ThemeProvider';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  // Additional colors as needed
  textSecondary: string;
  textTertiary: string;
  backgroundSecondary: string;
  borderLight: string;
  interactiveActive: string;
  interactiveInactive: string;
  feedbackSuccess: string;
  feedbackWarning: string;
  feedbackError: string;
}

export const useTheme = () => {
  const tamaguiTheme = useTamaguiTheme();
  const { theme, isDark, setTheme, toggleTheme, isSystemTheme } =
    useThemeContext();

  const colors: ThemeColors = {
    background: tamaguiTheme.background?.val || '#EBE5D9',
    text: tamaguiTheme.color?.val || '#070707',
    primary: tamaguiTheme.primary?.val || '#264854',
    secondary: tamaguiTheme.secondary?.val || '#AD915A',
    textSecondary: tamaguiTheme.textSecondary?.val || '#666666',
    textTertiary: tamaguiTheme.textTertiary?.val || '#888888',
    backgroundSecondary: tamaguiTheme.backgroundSecondary?.val || '#f8f9fa',
    borderLight: tamaguiTheme.borderLight?.val || '#e0e0e0',
    interactiveActive: tamaguiTheme.interactiveActive?.val || '#264854',
    interactiveInactive: tamaguiTheme.interactiveInactive?.val || '#8E8E93',
    feedbackSuccess: tamaguiTheme.feedbackSuccess?.val || '#4CAF50',
    feedbackWarning: tamaguiTheme.feedbackWarning?.val || '#FF9800',
    feedbackError: tamaguiTheme.feedbackError?.val || '#F44336',
  };

  return {
    theme,
    isDark,
    colors,
    setTheme,
    toggleTheme,
    isSystemTheme,
  };
};

// Re-export for backward compatibility
export const useThemeToggle = () => {
  const { toggleTheme, setTheme } = useThemeContext();
  return { toggleTheme, setTheme };
};
