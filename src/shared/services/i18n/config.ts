import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import deTranslations from './locales/de.json';
import ptTranslations from './locales/pt.json';
import arTranslations from './locales/ar.json';
import zhTranslations from './locales/zh.json';
import hiTranslations from './locales/hi.json';
import ruTranslations from './locales/ru.json';
import jaTranslations from './locales/ja.json';

// Storage key for saved locale preference
const LOCALE_STORAGE_KEY = '@app_locale';

// Available locales
export const SUPPORTED_LOCALES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
];

// Translation resources
const resources = {
  en: { translation: enTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  pt: { translation: ptTranslations },
  ar: { translation: arTranslations },
  zh: { translation: zhTranslations },
  hi: { translation: hiTranslations },
  ru: { translation: ruTranslations },
  ja: { translation: jaTranslations },
};

// Get device locale
function getDeviceLocale(): string {
  try {
    const deviceLocales = Localization.getLocales();
    const deviceLocale = deviceLocales[0];

    if (!deviceLocale) {
      return 'en'; // Default fallback
    }

    const supportedCodes = SUPPORTED_LOCALES.map(locale => locale.code);
    const localeCode = deviceLocale.languageCode?.toLowerCase();

    if (localeCode && supportedCodes.includes(localeCode)) {
      return localeCode;
    }

    return 'en'; // Default fallback
  } catch (error) {
    console.error('Error getting device locale:', error);
    return 'en'; // Default fallback
  }
}

// Get saved locale preference
async function getSavedLocale(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  } catch (error) {
    console.error('Error getting saved locale:', error);
    return null;
  }
}

// Save locale preference
export async function saveLocalePreference(localeCode: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, localeCode);
  } catch (error) {
    console.error('Error saving locale preference:', error);
  }
}

// Initialize i18n
const initializeI18n = async () => {
  try {
    const savedLocale = await getSavedLocale();
    const deviceLocale = getDeviceLocale();

    const initialLocale = savedLocale || deviceLocale;

    await i18n.use(initReactI18next).init({
      resources,
      lng: initialLocale,
      fallbackLng: 'en',

      interpolation: {
        escapeValue: false,
      },

      react: {
        useSuspense: false,
      },

      debug: __DEV__,

      // Key separator
      keySeparator: '.',

      // Namespace separator
      nsSeparator: ':',

      // Pluralization
      pluralSeparator: '_',

      // Context separator
      contextSeparator: '_',

      // Missing key handler
      missingKeyHandler: (lng, ns, key, fallbackValue) => {
        if (__DEV__) {
          console.warn(`Missing translation key: ${key} for locale: ${lng}`);
        }
        return fallbackValue || key;
      },

      // Load languages on demand
      load: 'languageOnly',

      // Clean code
      cleanCode: true,

      // Detect language on client side
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });

    console.log('i18n initialized successfully');
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
  }
};

// Initialize i18n on module load
initializeI18n();

// Export the i18n instance
export default i18n;

// Helper function to get current locale info
export function getCurrentLocaleInfo() {
  const currentLocale = i18n.language;
  return (
    SUPPORTED_LOCALES.find(locale => locale.code === currentLocale) ||
    SUPPORTED_LOCALES[0]
  );
}

// Helper function to check if locale is RTL
export function isRTLLocale(localeCode?: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  const locale = localeCode || i18n.language;
  return rtlLocales.includes(locale);
}

// Helper function to get locale direction
export function getLocaleDirection(localeCode?: string): 'ltr' | 'rtl' {
  return isRTLLocale(localeCode) ? 'rtl' : 'ltr';
}
