import { createTokens } from '@tamagui/core';

// Brand colors from the Oral Mother Tongue style guide
const brandColors = {
  // Primary colors
  primaryDark: '#282827', // Dark gray/black
  primaryLight: '#EBE5D9', // Light cream/off-white
  primaryAccent: '#264854', // Dark teal/blue
  secondaryLight: '#928EC3', // Light blue/teal
  secondaryAccent: '#AD915A', // Muted gold/brown
  secondaryDark: '#070707', // Almost black
} as const;

// Create color tokens for Tamagui
export const colorTokens = createTokens({
  color: {
    // Core brand colors
    primary: brandColors.primaryAccent,
    secondary: brandColors.secondaryAccent,
    tertiary: brandColors.secondaryLight,

    // Background colors
    background: brandColors.primaryLight,
    backgroundSecondary: '#F5F4F0',
    backgroundTertiary: '#EDE8DC',
    backgroundOverlay: 'rgba(7, 7, 7, 0.1)',

    // Text colors
    text: brandColors.secondaryDark,
    textSecondary: '#4A4A4A',
    textTertiary: '#6B6B6B',
    textInverse: brandColors.primaryLight,

    // Border colors
    border: '#D4D0C8',
    borderSecondary: '#E8E4D8',
    borderTertiary: '#C8C4BC',

    // Interactive states
    interactive: brandColors.primaryAccent,
    interactiveSecondary: brandColors.secondaryLight,
    interactivePressed: 'rgba(38, 72, 84, 0.1)',
    interactiveDisabled: '#B8B4AC',

    // Accent colors
    accent1: brandColors.secondaryLight,
    accent2: brandColors.secondaryAccent,
    accent3: brandColors.primaryDark,
    accent4: '#E3F2FD',

    // Glassy effects
    glass1: 'rgba(146, 142, 195, 0.7)',
    glass2: 'rgba(38, 72, 84, 0.7)',
    glass3: 'rgba(237, 229, 217, 0.7)',
    glass4: 'rgba(173, 145, 90, 0.7)',

    // Feedback colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: brandColors.primaryAccent,

    // Shadow colors
    shadowLight: 'rgba(7, 7, 7, 0.05)',
    shadowMedium: 'rgba(7, 7, 7, 0.1)',
    shadowDark: 'rgba(7, 7, 7, 0.2)',
    shadowAccent: 'rgba(38, 72, 84, 0.15)',
  },
});

// Dark theme color tokens
export const darkColorTokens = createTokens({
  color: {
    // Core brand colors (adjusted for dark theme)
    primary: brandColors.secondaryLight,
    secondary: brandColors.secondaryAccent,
    tertiary: brandColors.primaryAccent,

    // Background colors
    background: brandColors.primaryDark,
    backgroundSecondary: '#1F1F1E',
    backgroundTertiary: '#161615',
    backgroundOverlay: 'rgba(0, 0, 0, 0.3)',

    // Text colors
    text: brandColors.primaryLight,
    textSecondary: '#CCCCCC',
    textTertiary: '#AAAAAA',
    textInverse: brandColors.secondaryDark,

    // Border colors
    border: '#404040',
    borderSecondary: '#505050',
    borderTertiary: '#606060',

    // Interactive states
    interactive: brandColors.secondaryLight,
    interactiveSecondary: brandColors.primaryAccent,
    interactivePressed: 'rgba(146, 142, 195, 0.1)',
    interactiveDisabled: '#404040',

    // Accent colors
    accent1: brandColors.primaryAccent,
    accent2: brandColors.secondaryAccent,
    accent3: brandColors.primaryLight,
    accent4: brandColors.secondaryDark,

    // Glassy effects
    glass1: 'rgba(38, 72, 84, 0.7)',
    glass2: 'rgba(146, 142, 195, 0.7)',
    glass3: 'rgba(40, 40, 39, 0.7)',
    glass4: 'rgba(173, 145, 90, 0.7)',

    // Feedback colors
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: brandColors.secondaryLight,

    // Shadow colors
    shadowLight: 'rgba(0, 0, 0, 0.1)',
    shadowMedium: 'rgba(0, 0, 0, 0.2)',
    shadowDark: 'rgba(0, 0, 0, 0.4)',
    shadowAccent: 'rgba(146, 142, 195, 0.2)',
  },
});

// Size tokens
export const sizeTokens = createTokens({
  size: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
  },
  radius: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    24: 96,
    28: 112,
    32: 128,
  },
});

// Font tokens
export const fontTokens = createTokens({
  font: {
    heading: 'Indivisible Black',
    body: 'GT Flexa Var',
  },
});

// Shadow tokens for light theme
export const shadowTokens = {
  light: {
    shadowColor: 'rgba(7, 7, 7, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: 'rgba(7, 7, 7, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  dark: {
    shadowColor: 'rgba(7, 7, 7, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    shadowColor: 'rgba(38, 72, 84, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  glass: {
    shadowColor: 'rgba(146, 142, 195, 0.2)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
};

// Shadow tokens for dark theme
export const darkShadowTokens = {
  light: {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  dark: {
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  accent: {
    shadowColor: 'rgba(146, 142, 195, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  glass: {
    shadowColor: 'rgba(38, 72, 84, 0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
};

// Theme type definitions
export type Theme = 'light' | 'dark';

export interface ThemeColors {
  // Core colors
  background: string;
  color: string;
  primary: string;
  secondary: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Background variants
  backgroundSecondary: string;
  backgroundTertiary: string;
  backgroundOverlay: string;

  // Border colors
  borderLight: string;
  borderMedium: string;
  borderDark: string;

  // Interactive states
  interactiveActive: string;
  interactiveInactive: string;
  interactivePressed: string;
  interactiveDisabled: string;

  // Chapter grid
  chapterBackground: string;
  chapterText: string;
  chapterBorder: string;

  // Audio player
  audioBackground: string;
  audioBorder: string;
  audioShadow: string;

  // Feedback colors
  feedbackLoading: string;
  feedbackSuccess: string;
  feedbackWarning: string;
  feedbackError: string;

  // Accent and glassy colors
  accent1: string;
  accent2: string;
  accent3: string;
  accent4: string;
  glass1: string;
  glass2: string;
  glass3: string;
  glass4: string;
}

// Light theme colors
export const lightTheme: ThemeColors = {
  // Core colors
  background: brandColors.primaryLight,
  color: brandColors.secondaryDark,
  primary: brandColors.primaryAccent,
  secondary: brandColors.secondaryAccent,

  // Text colors
  textPrimary: brandColors.secondaryDark,
  textSecondary: '#4A4A4A',
  textTertiary: '#6B6B6B',
  textInverse: brandColors.primaryLight,

  // Background variants
  backgroundSecondary: '#F5F4F0',
  backgroundTertiary: '#EDE8DC',
  backgroundOverlay: 'rgba(7, 7, 7, 0.1)',

  // Border colors
  borderLight: '#D4D0C8',
  borderMedium: '#E8E4D8',
  borderDark: '#C8C4BC',

  // Interactive states
  interactiveActive: brandColors.primaryAccent,
  interactiveInactive: '#8E8E93',
  interactivePressed: 'rgba(38, 72, 84, 0.1)',
  interactiveDisabled: '#B8B4AC',

  // Chapter grid
  chapterBackground: '#F5F4F0',
  chapterText: '#333333',
  chapterBorder: '#D4D0C8',

  // Audio player
  audioBackground: '#FFFFFF',
  audioBorder: '#D4D0C8',
  audioShadow: '#000000',

  // Feedback colors
  feedbackLoading: brandColors.primaryAccent,
  feedbackSuccess: '#4CAF50',
  feedbackWarning: '#FF9800',
  feedbackError: '#F44336',

  // Accent and glassy colors
  accent1: brandColors.secondaryLight,
  accent2: brandColors.secondaryAccent,
  accent3: brandColors.primaryDark,
  accent4: '#E3F2FD',
  glass1: 'rgba(146, 142, 195, 0.7)',
  glass2: 'rgba(38, 72, 84, 0.7)',
  glass3: 'rgba(237, 229, 217, 0.7)',
  glass4: 'rgba(173, 145, 90, 0.7)',
};

// Dark theme colors
export const darkTheme: ThemeColors = {
  // Core colors
  background: brandColors.primaryDark,
  color: brandColors.primaryLight,
  primary: brandColors.secondaryLight,
  secondary: brandColors.secondaryAccent,

  // Text colors
  textPrimary: brandColors.primaryLight,
  textSecondary: '#CCCCCC',
  textTertiary: '#AAAAAA',
  textInverse: brandColors.secondaryDark,

  // Background variants
  backgroundSecondary: '#1F1F1E',
  backgroundTertiary: '#161615',
  backgroundOverlay: 'rgba(0, 0, 0, 0.3)',

  // Border colors
  borderLight: '#404040',
  borderMedium: '#505050',
  borderDark: '#606060',

  // Interactive states
  interactiveActive: brandColors.secondaryLight,
  interactiveInactive: '#666666',
  interactivePressed: 'rgba(146, 142, 195, 0.1)',
  interactiveDisabled: '#404040',

  // Chapter grid
  chapterBackground: '#1F1F1E',
  chapterText: brandColors.primaryLight,
  chapterBorder: '#404040',

  // Audio player
  audioBackground: brandColors.primaryDark,
  audioBorder: '#404040',
  audioShadow: '#000000',

  // Feedback colors
  feedbackLoading: brandColors.secondaryLight,
  feedbackSuccess: '#4CAF50',
  feedbackWarning: '#FF9800',
  feedbackError: '#F44336',

  // Accent and glassy colors
  accent1: brandColors.primaryAccent,
  accent2: brandColors.secondaryAccent,
  accent3: brandColors.primaryLight,
  accent4: brandColors.secondaryDark,
  glass1: 'rgba(38, 72, 84, 0.7)',
  glass2: 'rgba(146, 142, 195, 0.7)',
  glass3: 'rgba(40, 40, 39, 0.7)',
  glass4: 'rgba(173, 145, 90, 0.7)',
};

export const getThemeColors = (theme: Theme): ThemeColors => {
  return theme === 'dark' ? darkTheme : lightTheme;
};

// Export brand colors for direct use
export { brandColors };
