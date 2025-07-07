import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';

interface LanguageDetectionProps {
  scrollForward?: () => void;
}

const LanguageDetection: React.FC<LanguageDetectionProps> = ({
  scrollForward,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [detectedLanguage, setDetectedLanguage] = useState('English');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showLanguageList, setShowLanguageList] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  ];

  useEffect(() => {
    // Simulate language detection based on device settings
    // In a real app, this would use device locale and location
    const deviceLanguage = 'English'; // This would be detected
    setDetectedLanguage(deviceLanguage);
    setSelectedLanguage(deviceLanguage);
  }, []);

  const handleLanguageConfirm = () => {
    // Language confirmed, proceed to next step
    console.log('Language confirmed:', selectedLanguage);
    scrollForward?.();
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setShowLanguageList(false);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 30,
      paddingVertical: 40,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: 80,
      height: 80,
      marginBottom: 40,
      backgroundColor: colors.primary,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    iconText: {
      fontSize: 32,
      color: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 20,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 40,
      opacity: 0.8,
      lineHeight: 24,
    },
    detectedLanguage: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 30,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 15,
      marginBottom: 30,
    },
    button: {
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: 25,
      minWidth: 120,
      alignItems: 'center',
    },
    confirmButton: {
      backgroundColor: colors.primary,
    },
    changeButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    confirmButtonText: {
      color: colors.background,
    },
    changeButtonText: {
      color: colors.primary,
    },
    languageList: {
      maxHeight: 200,
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    languageItem: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
    },
    languageItemText: {
      fontSize: 16,
      color: colors.text,
    },
    selectedLanguageItem: {
      backgroundColor: colors.primary,
    },
    selectedLanguageItemText: {
      color: colors.background,
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>🌍</Text>
      </View>

      <Text style={styles.title}>
        {t('onboarding.languageDetection.title')}
      </Text>
      <Text style={styles.detectedLanguage}>{detectedLanguage}</Text>
      <Text style={styles.subtitle}>
        {t('onboarding.languageDetection.subtitle')}
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.confirmButton]}
          onPress={handleLanguageConfirm}>
          <Text style={[styles.buttonText, styles.confirmButtonText]}>
            {t('onboarding.languageDetection.confirm')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.changeButton]}
          onPress={() => setShowLanguageList(!showLanguageList)}>
          <Text style={[styles.buttonText, styles.changeButtonText]}>
            {t('onboarding.languageDetection.change')}
          </Text>
        </TouchableOpacity>
      </View>

      {showLanguageList && (
        <View style={styles.languageList}>
          {languages.map(language => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                selectedLanguage === language.name &&
                  styles.selectedLanguageItem,
              ]}
              onPress={() => handleLanguageChange(language.name)}>
              <Text
                style={[
                  styles.languageItemText,
                  selectedLanguage === language.name &&
                    styles.selectedLanguageItemText,
                ]}>
                {language.nativeName} ({language.name})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default LanguageDetection;
