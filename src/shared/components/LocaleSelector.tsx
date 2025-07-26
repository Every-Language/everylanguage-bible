import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  useLocalization,
  useTranslations,
} from '../context/LocalizationContext';
import { useTheme } from '../context/ThemeContext';
import type { Theme } from '../types/theme';

interface LocaleSelectorProps {
  onLocaleChange?: (localeCode: string) => void;
}

const getLocaleItemStyle = (theme: Theme, isSelected: boolean) => ({
  backgroundColor: isSelected ? theme.colors.primary : 'transparent',
  borderColor: theme.colors.border,
});

export function LocaleSelector({ onLocaleChange }: LocaleSelectorProps) {
  const { supportedLocales, currentLocale, changeLocale } = useLocalization();
  const { theme } = useTheme();
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
              getLocaleItemStyle(theme, currentLocale === locale.code),
            ]}
            onPress={() => handleLocaleChange(locale.code)}>
            <View style={styles.localeInfo}>
              <Text
                style={[
                  styles.localeName,
                  {
                    color:
                      currentLocale === locale.code
                        ? theme.colors.textInverse
                        : theme.colors.text,
                  },
                ]}>
                {locale.nativeName}
              </Text>
              <Text
                style={[
                  styles.localeCode,
                  {
                    color:
                      currentLocale === locale.code
                        ? theme.colors.textInverse
                        : theme.colors.textSecondary,
                  },
                ]}>
                {locale.name}
              </Text>
            </View>
            {currentLocale === locale.code && (
              <Text
                style={[styles.checkmark, { color: theme.colors.textInverse }]}>
                ✓
              </Text>
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
    fontWeight: 'bold',
  },
});
