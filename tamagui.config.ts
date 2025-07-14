import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from '@tamagui/core';

// Enhanced light theme with all necessary color tokens
const lightTheme = {
  ...defaultConfig.themes.light,
  // Core colors
  background: '#EBE5D9', // primaryLight - warm cream/beige
  color: '#070707', // secondaryDark - almost black
  primary: '#264854', // primaryAccent - dark blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan

  // Text colors
  textPrimary: '#070707',
  textSecondary: '#666666',
  textTertiary: '#888888',
  textInverse: '#ffffff',

  // Background variants
  backgroundSecondary: '#f8f9fa',
  backgroundTertiary: '#f0f0f0',
  backgroundOverlay: 'rgba(0, 0, 0, 0.1)',

  // Border colors
  borderLight: '#e0e0e0',
  borderMedium: '#d0d0d0',
  borderDark: '#c0c0c0',

  // Interactive states
  interactiveActive: '#264854',
  interactiveInactive: '#8E8E93',
  interactivePressed: 'rgba(38, 72, 84, 0.1)',
  interactiveDisabled: '#cccccc',

  // Chapter grid
  chapterBackground: '#f5f5f5',
  chapterText: '#333333',
  chapterBorder: '#e0e0e0',

  // Audio player
  audioBackground: '#ffffff',
  audioBorder: '#e0e0e0',
  audioShadow: '#000000',

  // Feedback colors
  feedbackLoading: '#264854',
  feedbackSuccess: '#4CAF50',
  feedbackWarning: '#FF9800',
  feedbackError: '#F44336',

  // Accent and glassy colors
  accent1: '#92BEC3', // light blue-green
  accent2: '#AD915A', // gold/brown
  accent3: '#282827', // dark gray (for contrast)
  accent4: '#E3F2FD', // very light blue (for highlights)
  glass1: 'rgba(146, 190, 195, 0.7)', // glassy blue-green
  glass2: 'rgba(38, 72, 84, 0.7)', // glassy dark blue-green
  glass3: 'rgba(237, 229, 217, 0.7)', // glassy cream
};

// Enhanced dark theme with all necessary color tokens
const darkTheme = {
  ...defaultConfig.themes.dark,
  // Core colors
  background: '#282827', // primaryDark - very dark gray
  color: '#EBE5D9', // primaryLight - warm cream (for contrast)
  primary: '#92BEC3', // secondaryLight - light blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan (consistent)

  // Text colors
  textPrimary: '#EBE5D9',
  textSecondary: '#cccccc',
  textTertiary: '#aaaaaa',
  textInverse: '#070707',

  // Background variants
  backgroundSecondary: '#1a1a1a',
  backgroundTertiary: '#0f0f0f',
  backgroundOverlay: 'rgba(0, 0, 0, 0.3)',

  // Border colors
  borderLight: '#404040',
  borderMedium: '#505050',
  borderDark: '#606060',

  // Interactive states
  interactiveActive: '#92BEC3',
  interactiveInactive: '#666666',
  interactivePressed: 'rgba(146, 190, 195, 0.1)',
  interactiveDisabled: '#404040',

  // Chapter grid
  chapterBackground: '#1a1a1a',
  chapterText: '#EBE5D9',
  chapterBorder: '#404040',

  // Audio player
  audioBackground: '#282827',
  audioBorder: '#404040',
  audioShadow: '#000000',

  // Feedback colors
  feedbackLoading: '#92BEC3',
  feedbackSuccess: '#4CAF50',
  feedbackWarning: '#FF9800',
  feedbackError: '#F44336',

  // Accent and glassy colors
  accent1: '#264854', // dark blue-green
  accent2: '#AD915A', // gold/brown
  accent3: '#EBE5D9', // cream (for highlights)
  accent4: '#070707', // almost black (for contrast)
  glass1: 'rgba(38, 72, 84, 0.7)', // glassy dark blue-green
  glass2: 'rgba(146, 190, 195, 0.7)', // glassy blue-green
  glass3: 'rgba(40, 40, 39, 0.7)', // glassy dark gray
};

export const config = createTamagui({
  ...defaultConfig,
  themes: {
    ...defaultConfig.themes,
    light: lightTheme,
    dark: darkTheme,
  },
  settings: {
    ...defaultConfig.settings,
    styleCompat: 'react-native', // Recommended for React Native compatibility
  },
});

export type AppConfig = typeof config;

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
