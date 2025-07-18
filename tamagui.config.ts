import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';
import { createMedia } from '@tamagui/react-native-media-driver';
import { createAnimations } from '@tamagui/animations-react-native';
import {
  lightTheme,
  darkTheme,
  lightShadows,
  darkShadows,
} from './src/shared/constants/tamagui-themes';

const config = createTamagui({
  defaultFont: 'body',
  animations: createAnimations({
    fast: {
      type: 'spring',
      damping: 20,
      mass: 1.2,
      stiffness: 250,
    },
    medium: {
      type: 'spring',
      damping: 10,
      mass: 1,
      stiffness: 100,
    },
    slow: {
      type: 'spring',
      damping: 20,
      stiffness: 60,
    },
  }),
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: createInterFont({
      size: {
        6: 15,
        7: 18,
        8: 20,
        9: 23,
        10: 27,
        11: 30,
        12: 35,
        13: 40,
        14: 46,
        15: 55,
        16: 65,
      },
      transform: {
        6: 'uppercase',
        7: 'none',
      },
      weight: {
        6: '400',
        7: '600',
      },
      color: {
        6: '$colorFocus',
        7: '$color',
      },
      letterSpacing: {
        5: 2,
        6: 1,
        7: 0,
        8: -1,
        9: -2,
        10: -3,
        12: -4,
        14: -4,
        15: -10,
      },
      face: {
        700: { normal: 'InterBold' },
        800: { normal: 'InterBold' },
        900: { normal: 'InterBold' },
      },
    }),
    body: createInterFont({
      face: {
        700: { normal: 'InterBold' },
      },
    }),
  },
  tokens,
  themes: {
    ...themes,
    light_omt: lightTheme,
    dark_omt: darkTheme,
  },
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
});

export type AppConfig = typeof config;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
