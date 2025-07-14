import { useThemeContext } from '@/app/providers/ThemeProvider';
import { Theme, ThemeColors } from '@/shared/constants/theme';

export type { Theme, ThemeColors };

export const useTheme = () => {
  const { theme, isDark, colors, setTheme, toggleTheme, isSystemTheme } =
    useThemeContext();

  return {
    theme,
    isDark,
    colors,
    setTheme,
    toggleTheme,
    isSystemTheme,
  };
};
