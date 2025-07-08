import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from '@tamagui/core';

// Our custom theme colors that integrate with Tamagui
const lightTheme = {
  ...defaultConfig.themes.light,
  background: '#EBE5D9', // primaryLight - warm cream/beige
  color: '#070707', // secondaryDark - almost black
  primary: '#264854', // primaryAccent - dark blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan
};

const darkTheme = {
  ...defaultConfig.themes.dark,
  background: '#282827', // primaryDark - very dark gray
  color: '#EBE5D9', // primaryLight - warm cream (for contrast)
  primary: '#92BEC3', // secondaryLight - light blue-green
  secondary: '#AD915A', // secondaryAccent - warm brown/tan (consistent)
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
