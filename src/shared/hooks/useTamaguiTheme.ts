import { useTheme as useTamaguiTheme, useThemeName } from 'tamagui';
import { useThemeContext } from '@/app/providers/ThemeProvider';
import { getThemeColors } from '@/shared/constants/theme';

export const useTamaguiThemeHook = () => {
  const tamaguiTheme = useTamaguiTheme();
  const themeName = useThemeName();
  const { theme, isDark, setTheme, toggleTheme, isSystemTheme } =
    useThemeContext();

  // Get colors from the existing theme system for backward compatibility
  const colors = getThemeColors(theme);

  return {
    // Tamagui theme values
    ...tamaguiTheme,
    themeName,

    // Custom theme context values
    theme,
    isDark,
    setTheme,
    toggleTheme,
    isSystemTheme,

    // Backward compatibility - include colors from old system
    colors,

    // Convenience methods
    isLight: !isDark,
    isSystem: isSystemTheme,
  };
};

// Re-export for backward compatibility
export const useTheme = useTamaguiThemeHook;
