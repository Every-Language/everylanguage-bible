import {
  Theme,
  ThemeColors,
  ThemeSpacing,
  ThemeTypography,
  ThemeBorderRadius,
} from '@/shared/types/theme';

// Brand Colors from Brandkit
export const BRAND_COLORS = {
  CHARCOAL: '#282927',
  CREAM: '#EBE5D9',
  GOLD: '#AF915A',
  BLACK: '#070707',
  WHITE: '#FFFFFF',
};

// Color Variations
export const COLOR_VARIATIONS = {
  // Charcoal variations
  CHARCOAL_LIGHT: '#3D3E3B',
  CHARCOAL_DARK: '#1A1B19',

  // Cream variations
  CREAM_LIGHT: '#F5F3ED',
  CREAM_DARK: '#D4CFC3',

  // Gold variations
  GOLD_LIGHT: '#C4A76A',
  GOLD_DARK: '#8A7143',

  // Neutral variations
  GRAY_50: '#F9FAFB',
  GRAY_100: '#F3F4F6',
  GRAY_200: '#E5E7EB',
  GRAY_300: '#D1D5DB',
  GRAY_400: '#9CA3AF',
  GRAY_500: '#6B7280',
  GRAY_600: '#4B5563',
  GRAY_700: '#374151',
  GRAY_800: '#1F2937',
  GRAY_900: '#111827',

  // Status colors
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',

  // Transparent variations
  OVERLAY_LIGHT: 'rgba(0, 0, 0, 0.1)',
  OVERLAY_DARK: 'rgba(0, 0, 0, 0.6)',
  SHADOW_LIGHT: 'rgba(0, 0, 0, 0.08)',
  SHADOW_DARK: 'rgba(0, 0, 0, 0.25)',
};

// Light Theme Colors
const lightColors: ThemeColors = {
  // Primary brand colors
  primary: BRAND_COLORS.CHARCOAL,
  secondary: BRAND_COLORS.CREAM,
  accent: BRAND_COLORS.GOLD,

  // Background colors
  background: BRAND_COLORS.WHITE,
  surface: BRAND_COLORS.CREAM,
  surfaceVariant: COLOR_VARIATIONS.CREAM_LIGHT,

  // Text colors
  text: BRAND_COLORS.CHARCOAL,
  textSecondary: COLOR_VARIATIONS.CHARCOAL_LIGHT,
  textInverse: BRAND_COLORS.WHITE,

  // UI colors
  border: COLOR_VARIATIONS.CREAM_DARK,
  shadow: COLOR_VARIATIONS.SHADOW_LIGHT,
  overlay: COLOR_VARIATIONS.OVERLAY_LIGHT,

  // Status colors
  success: COLOR_VARIATIONS.SUCCESS,
  warning: COLOR_VARIATIONS.WARNING,
  error: COLOR_VARIATIONS.ERROR,
  info: COLOR_VARIATIONS.INFO,

  // Interactive colors
  interactive: BRAND_COLORS.GOLD,
  interactiveHover: COLOR_VARIATIONS.GOLD_LIGHT,
  interactivePressed: COLOR_VARIATIONS.GOLD_DARK,
  interactiveDisabled: COLOR_VARIATIONS.GRAY_300,
};

// Dark Theme Colors
const darkColors: ThemeColors = {
  // Primary brand colors
  primary: BRAND_COLORS.CREAM,
  secondary: BRAND_COLORS.CHARCOAL,
  accent: BRAND_COLORS.GOLD,

  // Background colors
  background: BRAND_COLORS.BLACK,
  surface: COLOR_VARIATIONS.CHARCOAL_DARK,
  surfaceVariant: BRAND_COLORS.CHARCOAL,

  // Text colors
  text: BRAND_COLORS.CREAM,
  textSecondary: COLOR_VARIATIONS.CREAM_DARK,
  textInverse: BRAND_COLORS.CHARCOAL,

  // UI colors
  border: COLOR_VARIATIONS.CHARCOAL_LIGHT,
  shadow: COLOR_VARIATIONS.SHADOW_DARK,
  overlay: COLOR_VARIATIONS.OVERLAY_DARK,

  // Status colors
  success: COLOR_VARIATIONS.SUCCESS,
  warning: COLOR_VARIATIONS.WARNING,
  error: COLOR_VARIATIONS.ERROR,
  info: COLOR_VARIATIONS.INFO,

  // Interactive colors
  interactive: BRAND_COLORS.GOLD,
  interactiveHover: COLOR_VARIATIONS.GOLD_LIGHT,
  interactivePressed: COLOR_VARIATIONS.GOLD_DARK,
  interactiveDisabled: COLOR_VARIATIONS.GRAY_600,
};

// Spacing system
export const spacing: ThemeSpacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography system
export const typography: ThemeTypography = {
  fontFamily: {
    regular: 'System', // Will use platform default
    medium: 'System', // Will use platform default
    bold: 'System', // Will use platform default
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
  },
};

// Border radius system
export const borderRadius: ThemeBorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// Light Theme
export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  typography,
  borderRadius,
};

// Dark Theme
export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  typography,
  borderRadius,
};

// Theme map for easy access
export const themes = {
  light: lightTheme,
  dark: darkTheme,
};
