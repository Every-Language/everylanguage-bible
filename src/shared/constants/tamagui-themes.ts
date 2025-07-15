import { createTheme } from '@tamagui/core';
import { brandColors } from './theme';

// Light theme based on Oral Mother Tongue brand colors
export const lightTheme = createTheme({
  background: brandColors.primaryLight,
  backgroundHover: '#F5F4F0',
  backgroundPress: '#EDE8DC',
  backgroundFocus: '#F5F4F0',
  borderColor: '#D4D0C8',
  borderColorHover: '#E8E4D8',
  borderColorFocus: brandColors.primaryAccent,
  borderColorPress: '#C8C4BC',
  color: brandColors.secondaryDark,
  colorHover: '#4A4A4A',
  colorPress: '#6B6B6B',
  colorFocus: brandColors.primaryAccent,
  placeholderColor: '#6B6B6B',
  outlineColor: brandColors.primaryAccent,

  // Custom brand colors
  primary: brandColors.primaryAccent,
  secondary: brandColors.secondaryAccent,
  tertiary: brandColors.secondaryLight,

  // Text variants
  textPrimary: brandColors.secondaryDark,
  textSecondary: '#4A4A4A',
  textTertiary: '#6B6B6B',
  textInverse: brandColors.primaryLight,

  // Background variants
  backgroundSecondary: '#F5F4F0',
  backgroundTertiary: '#EDE8DC',
  backgroundOverlay: 'rgba(7, 7, 7, 0.1)',

  // Border variants
  borderLight: '#D4D0C8',
  borderMedium: '#E8E4D8',
  borderDark: '#C8C4BC',

  // Interactive states
  interactiveActive: brandColors.primaryAccent,
  interactiveInactive: '#8E8E93',
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
});

// Dark theme based on Oral Mother Tongue brand colors
export const darkTheme = createTheme({
  background: brandColors.primaryDark,
  backgroundHover: '#1F1F1E',
  backgroundPress: '#161615',
  backgroundFocus: '#1F1F1E',
  borderColor: '#404040',
  borderColorHover: '#505050',
  borderColorFocus: brandColors.secondaryLight,
  borderColorPress: '#606060',
  color: brandColors.primaryLight,
  colorHover: '#CCCCCC',
  colorPress: '#AAAAAA',
  colorFocus: brandColors.secondaryLight,
  placeholderColor: '#AAAAAA',
  outlineColor: brandColors.secondaryLight,

  // Custom brand colors
  primary: brandColors.secondaryLight,
  secondary: brandColors.secondaryAccent,
  tertiary: brandColors.primaryAccent,

  // Text variants
  textPrimary: brandColors.primaryLight,
  textSecondary: '#CCCCCC',
  textTertiary: '#AAAAAA',
  textInverse: brandColors.secondaryDark,

  // Background variants
  backgroundSecondary: '#1F1F1E',
  backgroundTertiary: '#161615',
  backgroundOverlay: 'rgba(0, 0, 0, 0.3)',

  // Border variants
  borderLight: '#404040',
  borderMedium: '#505050',
  borderDark: '#606060',

  // Interactive states
  interactiveActive: brandColors.secondaryLight,
  interactiveInactive: '#666666',
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
});

// Shadow configurations
export const lightShadows = {
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

export const darkShadows = {
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
