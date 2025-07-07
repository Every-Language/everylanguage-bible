import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import the same translations used in the app
import en from '../constants/strings/en.json';

const testResources = {
  en: {
    translation: en,
  },
};

// Initialize i18n for testing
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: testResources,
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Note: Tamagui configuration is handled by the TamaguiProvider component in tests
// This avoids duplicate config warnings by using the same config instance

// Polyfill for missing globals in test environment
declare const global: any;

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn: () => void) => setTimeout(fn, 0);
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id: any) => clearTimeout(id);
}

export default i18n;
