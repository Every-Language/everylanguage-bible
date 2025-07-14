import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from '@tamagui/core';

// Our custom theme colors that integrate with Tamagui
const lightTheme = {
  ...defaultConfig.themes.light,
  background: '#EBE5D9', // primaryLight - warm cream/beige
  color: '#070707', // secondaryDark - almost black
  primary: '#264854', // primaryAccent - dark blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan
  // Accent and glassy colors
  accent1: '#92BEC3', // light blue-green
  accent2: '#AD915A', // gold/brown
  accent3: '#282827', // dark gray (for contrast)
  accent4: '#E3F2FD', // very light blue (for highlights)
  glass1: 'rgba(146, 190, 195, 0.7)', // glassy blue-green
  glass2: 'rgba(38, 72, 84, 0.7)', // glassy dark blue-green
  glass3: 'rgba(237, 229, 217, 0.7)', // glassy cream
};

const darkTheme = {
  ...defaultConfig.themes.dark,
  background: '#282827', // primaryDark - very dark gray
  color: '#EBE5D9', // primaryLight - warm cream (for contrast)
  primary: '#92BEC3', // secondaryLight - light blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan (consistent)
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
