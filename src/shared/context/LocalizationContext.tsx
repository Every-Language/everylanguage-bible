import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { I18nManager } from 'react-native';
import i18n, {
  SUPPORTED_LOCALES,
  saveLocalePreference,
  getCurrentLocaleInfo,
  isRTLLocale,
  getLocaleDirection,
} from '../services/i18n/config';

// Define types for context
interface LocalizationContextType {
  // Localization functions
  t: (key: string, options?: any) => string;

  // Current locale
  currentLocale: string;
  currentLocaleInfo: (typeof SUPPORTED_LOCALES)[0] | undefined;

  // Available locales
  supportedLocales: typeof SUPPORTED_LOCALES;

  // Locale functions
  changeLocale: (localeCode: string) => Promise<void>;

  // RTL support
  isRTL: boolean;
  direction: 'ltr' | 'rtl';

  // Loading state
  isLoading: boolean;
}

// Create context
const LocalizationContext = createContext<LocalizationContextType | undefined>(
  undefined
);

// Provider component
export function LocalizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocale, setCurrentLocale] = useState(i18n.language);
  const [currentLocaleInfo, setCurrentLocaleInfo] = useState(
    () => getCurrentLocaleInfo() || SUPPORTED_LOCALES[0]
  );
  const [isRTL, setIsRTL] = useState(isRTLLocale());
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(
    getLocaleDirection()
  );

  // Initialize context
  useEffect(() => {
    // Set up language change listener
    const handleLocaleChange = (lng: string) => {
      setCurrentLocale(lng);
      setCurrentLocaleInfo(getCurrentLocaleInfo() || SUPPORTED_LOCALES[0]);
      const newIsRTL = isRTLLocale(lng);
      const newDirection = getLocaleDirection(lng);

      setIsRTL(newIsRTL);
      setDirection(newDirection);

      // Update RTL layout if needed
      if (I18nManager.isRTL !== newIsRTL) {
        I18nManager.allowRTL(newIsRTL);
        I18nManager.forceRTL(newIsRTL);
      }
    };

    // Listen for locale changes
    i18n.on('languageChanged', handleLocaleChange);

    // Set loading to false once initialized
    setIsLoading(false);

    // Cleanup listener on unmount
    return () => {
      i18n.off('languageChanged', handleLocaleChange);
    };
  }, []);

  // ✅ PERFORMANCE FIX: Use useCallback to prevent function recreation
  const changeLocale = useCallback(async (localeCode: string) => {
    try {
      await i18n.changeLanguage(localeCode);
      await saveLocalePreference(localeCode);

      // Update RTL settings
      const isRTL = isRTLLocale(localeCode);
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
      }
    } catch (error) {
      console.error('Failed to change locale:', error);
    }
  }, []);

  // ✅ PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  const contextValue: LocalizationContextType = useMemo(
    () => ({
      t: i18n.t,
      currentLocale,
      currentLocaleInfo,
      supportedLocales: SUPPORTED_LOCALES,
      changeLocale,
      isRTL,
      direction,
      isLoading,
    }),
    [
      currentLocale,
      currentLocaleInfo,
      changeLocale,
      isRTL,
      direction,
      isLoading,
    ]
  );

  return (
    <LocalizationContext.Provider value={contextValue}>
      {children}
    </LocalizationContext.Provider>
  );
}

// Hook to use localization context
export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error(
      'useLocalization must be used within a LocalizationProvider'
    );
  }
  return context;
}

// Convenience hook for translation function
export function useTranslations() {
  const { t } = useLocalization();
  return t;
}

// Convenience hook for current locale info
export function useCurrentLocale() {
  const { currentLocale, currentLocaleInfo } = useLocalization();
  return { currentLocale, currentLocaleInfo };
}

export function useLocaleDirection() {
  const { isRTL, direction } = useLocalization();
  return { isRTL, direction };
}

export function useLocaleChanger() {
  const { changeLocale, supportedLocales } = useLocalization();
  return { changeLocale, supportedLocales };
}
