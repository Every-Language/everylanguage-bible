import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SlideUpPanel } from './SlideUpPanel';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';

// Import utility icons
import languageIcon from '../../../../assets/images/utility_icons/language.png';

interface LanguageMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

export const LanguageMenu: React.FC<LanguageMenuProps> = ({
  isVisible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  ];

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    console.log(`Language selected: ${languageCode}`);
    // TODO: Implement actual language switching logic
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: Dimensions.spacing.md,
    },
    headerSection: {
      paddingVertical: Dimensions.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary + '20',
      marginBottom: Dimensions.spacing.lg,
    },
    headerText: {
      fontSize: Fonts.size.lg,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 24,
    },
    currentLanguageSection: {
      backgroundColor: colors.secondary + '10',
      borderRadius: Dimensions.radius.md,
      padding: Dimensions.spacing.md,
      marginBottom: Dimensions.spacing.lg,
    },
    currentLanguageLabel: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      fontWeight: Fonts.weight.medium,
      marginBottom: Dimensions.spacing.xs,
    },
    currentLanguageName: {
      fontSize: Fonts.size.lg,
      color: colors.text,
      fontWeight: Fonts.weight.semibold,
    },
    languagesContainer: {
      gap: Dimensions.spacing.xs,
    },
    languageCard: {
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 55,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    languageCardSelected: {
      borderColor: colors.text,
      backgroundColor: colors.primary + '20',
    },
    iconContainer: {
      width: 24,
      height: 24,
      marginRight: Dimensions.spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      width: 20,
      height: 20,
      tintColor: colors.text,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: Fonts.size.base,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
      marginBottom: 2,
    },
    languageNativeName: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
    },
    selectedIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#FFFFFF',
    },
  });

  const currentLanguage = languages.find(
    lang => lang.code === selectedLanguage
  );

  return (
    <SlideUpPanel
      isVisible={isVisible}
      onClose={onClose}
      title='Language'
      fullScreen={true}
      testID='language-menu'>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headerText}>
            Choose your preferred language for the app interface and Bible
            content.
          </Text>
        </View>

        {/* Current Language */}
        {currentLanguage && (
          <View style={styles.currentLanguageSection}>
            <Text style={styles.currentLanguageLabel}>Current Language</Text>
            <Text style={styles.currentLanguageName}>
              {currentLanguage.nativeName} ({currentLanguage.name})
            </Text>
          </View>
        )}

        {/* Available Languages */}
        <View style={styles.languagesContainer}>
          {languages.map(language => {
            const isSelected = language.code === selectedLanguage;
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageCard,
                  isSelected && styles.languageCardSelected,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                accessibilityLabel={`Select ${language.name} language`}
                accessibilityRole='button'
                testID={`language-menu-${language.code}`}>
                <View style={styles.iconContainer}>
                  <Image
                    source={languageIcon}
                    style={styles.icon}
                    resizeMode='contain'
                  />
                </View>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageName}>{language.name}</Text>
                  <Text style={styles.languageNativeName}>
                    {language.nativeName}
                  </Text>
                </View>
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <View style={styles.selectedDot} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SlideUpPanel>
  );
};
