import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from '@tamagui/core';

// Our custom theme colors that integrate with Tamagui
const lightTheme = {
  ...defaultConfig.themes.light,
  background: '#EBE5D9', // primaryLight - warm cream/beige
  color: '#070707', // secondaryDark - almost black
  primary: '#264854', // primaryAccent - dark blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan
  // New colors for Bible books screen and chapter tiles
  bibleBooksBackground: '#F9F7F4', // Light mode Bible books screen background
  chapterTileBackground: '#EAE9E7', // Light mode chapter tile background
  // Navigation button colors
  navigationSelected: '#AC8F57', // Selected navigation button
  navigationUnselected: '#ECE6DA', // Unselected navigation button
  navigationSelectedText: '#F9F7F4', // Selected navigation text (light mode)
  navigationUnselectedText: '#AC8F57', // Unselected navigation text (light mode)
};

const darkTheme = {
  ...defaultConfig.themes.dark,
  background: '#282827', // primaryDark - very dark gray
  color: '#EBE5D9', // primaryLight - warm cream (for contrast)
  primary: '#92BEC3', // secondaryLight - light blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan (consistent)
  // New colors for Bible books screen and chapter tiles
  bibleBooksBackground: '#070707', // Dark mode Bible books screen background
  chapterTileBackground: '#414141', // Dark mode chapter tile background
  // Navigation button colors
  navigationSelected: '#AC8F57', // Selected navigation button
  navigationUnselected: '#282827', // Unselected navigation button (dark mode)
  navigationSelectedText: '#070707', // Selected navigation text (dark mode)
  navigationUnselectedText: '#FFFFFF', // Unselected navigation text (dark mode)
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
