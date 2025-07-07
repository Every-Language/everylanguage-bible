import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import React, { useState } from 'react';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';

interface BasicSetupProps {
  scrollForward?: () => void;
}

const BasicSetup: React.FC<BasicSetupProps> = ({ scrollForward }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState({
    audioEnabled: true,
    autoPlay: false,
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    theme: 'auto' as 'light' | 'dark' | 'auto',
    notifications: true,
  });

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setPreferences(prev => ({
      ...prev,
      fontSize: size,
    }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setPreferences(prev => ({
      ...prev,
      theme,
    }));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 30,
      paddingVertical: 40,
      paddingBottom: 60,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    icon: {
      width: 80,
      height: 80,
      marginBottom: 20,
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
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      textAlign: 'center',
      opacity: 0.8,
      lineHeight: 24,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.background,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.6,
    },
    optionContainer: {
      flexDirection: 'row',
      gap: 10,
    },
    optionButton: {
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    optionButtonActive: {
      backgroundColor: colors.primary,
    },
    optionButtonText: {
      fontSize: 14,
      fontWeight: '500',
    },
    optionButtonTextActive: {
      color: colors.background,
    },
    optionButtonTextInactive: {
      color: colors.primary,
    },
    skipButton: {
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 25,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      marginTop: 20,
    },
    skipButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={true}
      bounces={true}
      alwaysBounceVertical={false}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>⚙️</Text>
        </View>
        <Text style={styles.title}>{t('onboarding.basicSetup.title')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.basicSetup.subtitle')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('onboarding.basicSetup.audioSettings')}
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              {t('onboarding.basicSetup.audioEnabled')}
            </Text>
            <Text style={styles.settingDescription}>
              {t('onboarding.basicSetup.audioEnabledDesc')}
            </Text>
          </View>
          <Switch
            value={preferences.audioEnabled}
            onValueChange={() => handleToggle('audioEnabled')}
            trackColor={{ false: colors.background, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              {t('onboarding.basicSetup.autoPlay')}
            </Text>
            <Text style={styles.settingDescription}>
              {t('onboarding.basicSetup.autoPlayDesc')}
            </Text>
          </View>
          <Switch
            value={preferences.autoPlay}
            onValueChange={() => handleToggle('autoPlay')}
            trackColor={{ false: colors.background, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('onboarding.basicSetup.displaySettings')}
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              {t('onboarding.basicSetup.fontSize')}
            </Text>
            <Text style={styles.settingDescription}>
              {t('onboarding.basicSetup.fontSizeDesc')}
            </Text>
          </View>
          <View style={styles.optionContainer}>
            {(['small', 'medium', 'large'] as const).map(size => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.optionButton,
                  preferences.fontSize === size && styles.optionButtonActive,
                ]}
                onPress={() => handleFontSizeChange(size)}>
                <Text
                  style={[
                    styles.optionButtonText,
                    preferences.fontSize === size
                      ? styles.optionButtonTextActive
                      : styles.optionButtonTextInactive,
                  ]}>
                  {t(
                    `onboarding.basicSetup.fontSize${size.charAt(0).toUpperCase() + size.slice(1)}`
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              {t('onboarding.basicSetup.theme')}
            </Text>
            <Text style={styles.settingDescription}>
              {t('onboarding.basicSetup.themeDesc')}
            </Text>
          </View>
          <View style={styles.optionContainer}>
            {(['light', 'dark', 'auto'] as const).map(theme => (
              <TouchableOpacity
                key={theme}
                style={[
                  styles.optionButton,
                  preferences.theme === theme && styles.optionButtonActive,
                ]}
                onPress={() => handleThemeChange(theme)}>
                <Text
                  style={[
                    styles.optionButtonText,
                    preferences.theme === theme
                      ? styles.optionButtonTextActive
                      : styles.optionButtonTextInactive,
                  ]}>
                  {t(
                    `onboarding.basicSetup.theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`
                  )}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('onboarding.basicSetup.notifications')}
        </Text>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>
              {t('onboarding.basicSetup.dailyReminders')}
            </Text>
            <Text style={styles.settingDescription}>
              {t('onboarding.basicSetup.dailyRemindersDesc')}
            </Text>
          </View>
          <Switch
            value={preferences.notifications}
            onValueChange={() => handleToggle('notifications')}
            trackColor={{ false: colors.background, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.skipButton} onPress={scrollForward}>
        <Text style={styles.skipButtonText}>
          {t('onboarding.basicSetup.skipForNow')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default BasicSetup;
