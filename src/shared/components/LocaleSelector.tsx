import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  useLocalization,
  useTranslations,
} from '../context/LocalizationContext';

interface LocaleSelectorProps {
  onLocaleChange?: (localeCode: string) => void;
}

export function LocaleSelector({ onLocaleChange }: LocaleSelectorProps) {
  const { supportedLocales, currentLocale, changeLocale } = useLocalization();
  const t = useTranslations();

  const handleLocaleChange = async (localeCode: string) => {
    await changeLocale(localeCode);
    onLocaleChange?.(localeCode);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.locale')}</Text>

      <View style={styles.localeList}>
        {supportedLocales.map(locale => (
          <TouchableOpacity
            key={locale.code}
            style={[
              styles.localeItem,
              {
                backgroundColor:
                  currentLocale === locale.code ? '#007AFF' : 'transparent',
              },
            ]}
            onPress={() => handleLocaleChange(locale.code)}>
            <View style={styles.localeInfo}>
              <Text
                style={[
                  styles.localeName,
                  {
                    color:
                      currentLocale === locale.code ? '#FFFFFF' : '#000000',
                  },
                ]}>
                {locale.nativeName}
              </Text>
              <Text
                style={[
                  styles.localeCode,
                  {
                    color:
                      currentLocale === locale.code ? '#FFFFFF' : '#666666',
                  },
                ]}>
                {locale.name}
              </Text>
            </View>
            {currentLocale === locale.code && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  localeList: {
    gap: 8,
  },
  localeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  localeInfo: {
    flex: 1,
  },
  localeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  localeCode: {
    fontSize: 14,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
