import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import i18n, {
  SUPPORTED_LOCALES,
  saveLocalePreference,
  getCurrentLocaleInfo,
  isRTLLocale,
  getLocaleDirection,
} from '../services/i18n/config';
import { logger } from '../utils/logger';

// Types
export interface LocalizationState {
  currentLocale: string;
  currentLocaleInfo: (typeof SUPPORTED_LOCALES)[0] | undefined;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  isLoading: boolean;
  error: string | null;
}

export interface LocalizationActions {
  changeLocale: (localeCode: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  // Computed getters
  getSupportedLocales: () => typeof SUPPORTED_LOCALES;
  getTranslationFunction: () => typeof i18n.t;
}

export type LocalizationStore = LocalizationState & LocalizationActions;

// Store
export const useLocalizationStore = create<LocalizationStore>()(
  persist(
    set => ({
      // Initial state
      currentLocale: i18n.language,
      currentLocaleInfo: getCurrentLocaleInfo() || SUPPORTED_LOCALES[0],
      isRTL: isRTLLocale(),
      direction: getLocaleDirection(),
      isLoading: true,
      error: null,

      // Actions
      changeLocale: async (localeCode: string) => {
        try {
          set({ isLoading: true, error: null });

          await i18n.changeLanguage(localeCode);
          await saveLocalePreference(localeCode);

          const newIsRTL = isRTLLocale(localeCode);
          const newDirection = getLocaleDirection(localeCode);

          // Update RTL settings
          if (I18nManager.isRTL !== newIsRTL) {
            I18nManager.allowRTL(newIsRTL);
            I18nManager.forceRTL(newIsRTL);
          }

          set({
            currentLocale: localeCode,
            currentLocaleInfo: getCurrentLocaleInfo() || SUPPORTED_LOCALES[0],
            isRTL: newIsRTL,
            direction: newDirection,
            isLoading: false,
          });
        } catch (error) {
          logger.error('Failed to change locale:', error);
          set({
            error: 'Failed to change locale',
            isLoading: false,
          });
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearError: () => {
        set({ error: null });
      },

      // Computed getters
      getSupportedLocales: () => SUPPORTED_LOCALES,

      getTranslationFunction: () => i18n.t,
    }),
    {
      name: 'localization-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the current locale, not loading/error states
      partialize: state => ({
        currentLocale: state.currentLocale,
        isRTL: state.isRTL,
        direction: state.direction,
      }),
    }
  )
);

// Initialize localization store
export const initializeLocalizationStore = async () => {
  const store = useLocalizationStore.getState();

  try {
    store.setLoading(true);

    // Set up language change listener
    const handleLocaleChange = (lng: string) => {
      const newIsRTL = isRTLLocale(lng);

      store.setLoading(false);

      // Update RTL layout if needed
      if (I18nManager.isRTL !== newIsRTL) {
        I18nManager.allowRTL(newIsRTL);
        I18nManager.forceRTL(newIsRTL);
      }
    };

    // Listen for locale changes
    i18n.on('languageChanged', handleLocaleChange);

    // Set loading to false once initialized
    store.setLoading(false);

    // Return cleanup function
    return () => {
      i18n.off('languageChanged', handleLocaleChange);
    };
  } catch (error) {
    logger.error('Failed to initialize localization store:', error);
    store.setLoading(false);
    return () => {}; // Return empty cleanup function
  }
};
