import { useTranslation as useI18nTranslation } from 'react-i18next';

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  // Check if i18n is properly initialized
  const isInitialized = i18n && i18n.isInitialized;

  return {
    t: isInitialized
      ? t
      : (key: string, params?: any) => {
          // Return the key as fallback if translation fails
          if (params && typeof params === 'object') {
            let result = key;
            Object.keys(params).forEach(param => {
              result = result.replace(`{{${param}}}`, params[param]);
            });
            return result;
          }
          return key;
        },
    language: isInitialized ? i18n.language : 'en',
    changeLanguage: isInitialized
      ? i18n.changeLanguage
      : () => Promise.resolve(),
  };
};
