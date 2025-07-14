import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Switch } from 'react-native';
import { useColorScheme } from 'react-native';
import { BaseMenu } from './BaseMenu';
import { BaseMenuConfig } from '@/types/menu';
import { useTheme, useThemeStore } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';

// Import utility icons
import settingsIcon from '../../../../assets/images/utility_icons/settings.png';

interface SettingsMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isVisible,
  onClose,
}) => {
  const { colors, isDark, themeMode, setThemeMode, toggleTheme } = useTheme();
  const systemColorScheme = useColorScheme(); // Only used when user toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [offlineDownloads, setOfflineDownloads] = useState(true);

  const isSystemMode = themeMode === 'system';

  const handleSystemThemeToggle = () => {
    if (isSystemMode) {
      // Switching from system to manual - use current theme
      setThemeMode(isDark ? 'dark' : 'light');
    } else {
      // Switching from manual to system - check system theme NOW
      setThemeMode('system');
      // If system theme is available, apply it immediately
      if (systemColorScheme) {
        useThemeStore.getState().setSystemTheme(systemColorScheme);
      }
    }
  };

  const handleManualThemeToggle = () => {
    if (!isSystemMode) {
      toggleTheme();
    }
  };

  const toggleSetting = (
    setting: string,
    currentValue: boolean,
    setter: (value: boolean) => void
  ) => {
    const newValue = !currentValue;
    setter(newValue);
    console.log(`${setting} ${newValue ? 'enabled' : 'disabled'}`);
  };

  const styles = StyleSheet.create({
    // Theme section styles
    sectionHeader: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.md,
      marginTop: Dimensions.spacing.lg,
    },
    themeCard: {
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      marginBottom: Dimensions.spacing.lg,
    },
    themeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.md,
    },
    themeRowLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    themeText: {
      fontSize: Fonts.size.base,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
    },
    themeTextDisabled: {
      fontSize: Fonts.size.base,
      color: colors.text + '60', // 60% opacity for disabled state
      fontWeight: Fonts.weight.medium,
    },
    lightDarkContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isSystemMode
        ? colors.primary + '10'
        : colors.primary + '15',
      borderRadius: 50, // Very rounded/circular
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.sm,
    },
    lightDarkText: {
      fontSize: Fonts.size.sm,
      color: isSystemMode ? colors.text + '60' : colors.primary,
      fontWeight: Fonts.weight.medium,
      marginHorizontal: Dimensions.spacing.sm,
    },
  });

  const themeSection = (
    <View>
      {/* Appearance Section Header */}
      <Text style={styles.sectionHeader}>Appearance</Text>

      {/* Theme Controls */}
      <View style={styles.themeCard}>
        {/* Use System Theme Toggle */}
        <View style={styles.themeRow}>
          <Text style={styles.themeText}>Use System Theme</Text>
          <Switch
            value={isSystemMode}
            onValueChange={handleSystemThemeToggle}
            trackColor={{
              false: colors.secondary + '30',
              true: colors.primary + '80',
            }}
            thumbColor='#FFFFFF' // White thumb to match other settings
            ios_backgroundColor={colors.secondary + '30'}
            accessibilityLabel='Toggle system theme'
          />
        </View>

        {/* Light/Dark Manual Toggle */}
        <View style={styles.themeRowLast}>
          <Text
            style={isSystemMode ? styles.themeTextDisabled : styles.themeText}>
            Theme
          </Text>
          <TouchableOpacity
            style={styles.lightDarkContainer}
            onPress={handleManualThemeToggle}
            disabled={isSystemMode}
            accessibilityLabel={
              isSystemMode
                ? 'Theme selection disabled - using system theme'
                : isDark
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
            }
            accessibilityRole='button'
            testID='settings-theme-toggle'>
            <Text style={styles.lightDarkText}>Light</Text>
            <Switch
              value={isDark}
              onValueChange={handleManualThemeToggle}
              disabled={isSystemMode}
              trackColor={{
                false: isSystemMode
                  ? colors.secondary + '20'
                  : colors.secondary + '30',
                true: isSystemMode
                  ? colors.primary + '40'
                  : colors.primary + '80',
              }}
              thumbColor='#FFFFFF' // White thumb to match other settings
              ios_backgroundColor={colors.secondary + '30'}
              accessibilityLabel={
                isSystemMode ? 'Theme toggle disabled' : 'Toggle theme'
              }
            />
            <Text style={styles.lightDarkText}>Dark</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const config: BaseMenuConfig = {
    title: 'Settings',
    fullScreen: true,
    testID: 'settings-menu',
    sections: [
      {
        title: 'App Settings',
        options: [
          {
            key: 'notifications',
            icon: settingsIcon,
            label: 'Push Notifications',
            description: 'Receive daily verse reminders and reading plans',
            value: notificationsEnabled,
            onToggle: () =>
              toggleSetting(
                'Notifications',
                notificationsEnabled,
                setNotificationsEnabled
              ),
            onPress: () => {}, // Required by interface but not used for toggles
          },
          {
            key: 'auto-play',
            icon: settingsIcon,
            label: 'Auto-play Audio',
            description: 'Automatically play next chapter when current ends',
            value: autoPlayEnabled,
            onToggle: () =>
              toggleSetting('Auto-play', autoPlayEnabled, setAutoPlayEnabled),
            onPress: () => {}, // Required by interface but not used for toggles
          },
          {
            key: 'offline-downloads',
            icon: settingsIcon,
            label: 'Offline Downloads',
            description: 'Download content for offline reading',
            value: offlineDownloads,
            onToggle: () =>
              toggleSetting(
                'Offline Downloads',
                offlineDownloads,
                setOfflineDownloads
              ),
            onPress: () => {}, // Required by interface but not used for toggles
          },
        ],
      },
      {
        title: 'Actions',
        options: [
          {
            key: 'clear-cache',
            icon: settingsIcon,
            label: 'Clear Cache',
            description: 'Free up storage space',
            onPress: () => console.log('Clear cache pressed'),
          },
          {
            key: 'export-data',
            icon: settingsIcon,
            label: 'Export Data',
            description: 'Export bookmarks and notes',
            onPress: () => console.log('Export data pressed'),
          },
          {
            key: 'reset-settings',
            icon: settingsIcon,
            label: 'Reset Settings',
            description: 'Reset all settings to default',
            onPress: () => console.log('Reset settings pressed'),
          },
        ],
      },
    ],
  };

  return (
    <BaseMenu
      isVisible={isVisible}
      onClose={onClose}
      config={config}
      customContent={themeSection}
    />
  );
};
