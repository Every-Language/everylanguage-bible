import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from '@/shared/hooks';
import { useTheme } from '@/shared/store/themeStore';

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingVertical: 48,
      justifyContent: 'space-between',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
    },
    subtitle: {
      fontSize: 18,
      color: colors.secondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 24,
    },
    description: {
      fontSize: 16,
      color: colors.secondary,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 300,
      opacity: 0.8,
    },
    button: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    buttonText: {
      color: colors.background,
      fontSize: 18,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('welcome.title')}</Text>
        <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        <Text style={styles.description}>{t('welcome.description')}</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={onGetStarted}
        accessibilityRole='button'
        accessibilityLabel={t('welcome.getStartedAccessibility')}>
        <Text style={styles.buttonText}>{t('welcome.getStarted')}</Text>
      </TouchableOpacity>
    </View>
  );
};
