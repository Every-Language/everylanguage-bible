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

export default i18n;
