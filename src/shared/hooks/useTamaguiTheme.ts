import { useTheme as useTamaguiTheme, useThemeName } from 'tamagui';
import { useThemeContext } from '@/app/providers/ThemeProvider';
import { getThemeColors } from '@/shared/constants/theme';
import { lightShadows, darkShadows } from '@/shared/constants/tamagui-themes';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  color: string;
  primary: string;
  secondary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundOverlay: string;
  borderLight: string;
  borderMedium: string;
  borderDark: string;
  interactiveActive: string;
  interactiveInactive: string;
  interactivePressed: string;
  interactiveDisabled: string;
  chapterBackground: string;
  chapterText: string;
  chapterBorder: string;
  audioBackground: string;
  audioBorder: string;
  audioShadow: string;
  feedbackLoading: string;
  feedbackSuccess: string;
  feedbackWarning: string;
  feedbackError: string;
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  glass1: string;
  glass2: string;
  glass3: string;
  glass4: string;
}

export interface ThemeShadows {
  light: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  medium: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  dark: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  accent: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  glass: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

export const useTheme = () => {
  const tamaguiTheme = useTamaguiTheme();
  const themeName = useThemeName();
  const { theme, isDark, setTheme, toggleTheme, isSystemTheme } =
    useThemeContext();

  // Get colors from the existing theme system for backward compatibility
  const colors = getThemeColors(theme);

  // Get shadows based on current theme
  const shadows: ThemeShadows = isDark ? darkShadows : lightShadows;

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

    // Shadow configurations
    shadows,

    // Convenience methods
    isLight: !isDark,
    isSystem: isSystemTheme,

    // Glassy effect utilities
    getGlassStyle: (
      glassType: 'glass1' | 'glass2' | 'glass3' | 'glass4' = 'glass1'
    ) => ({
      backgroundColor: colors[glassType],
      ...shadows.glass,
    }),

    // Shadow utilities
    getShadowStyle: (
      shadowType: 'light' | 'medium' | 'dark' | 'accent' | 'glass' = 'medium'
    ) => ({
      ...shadows[shadowType],
    }),
  };
};

// Export the hook as default for backward compatibility
export default useTheme;
