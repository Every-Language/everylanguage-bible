import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { BaseMenu } from './BaseMenu';
import { BaseMenuConfig } from '@/types/menu';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';

// Import utility icons
import settingsIcon from '../../../../assets/images/utility_icons/settings.png';

interface SettingsMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onThemeToggle: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isVisible,
  onClose,
  onThemeToggle,
}) => {
  const { colors, isDark } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(false);
  const [offlineDownloads, setOfflineDownloads] = useState(true);

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
    },
    themeText: {
      fontSize: Fonts.size.base,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
    },
    themeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '15',
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.sm,
      borderRadius: Dimensions.radius.sm,
    },
    themeIcon: {
      fontSize: Fonts.size.lg,
      marginRight: Dimensions.spacing.xs,
    },
    themeButtonText: {
      fontSize: Fonts.size.sm,
      color: colors.primary,
      fontWeight: Fonts.weight.medium,
    },
  });

  const themeSection = (
    <View style={styles.themeCard}>
      <View style={styles.themeRow}>
        <Text style={styles.themeText}>Theme</Text>
        <TouchableOpacity
          style={styles.themeButton}
          onPress={onThemeToggle}
          accessibilityLabel={
            isDark ? 'Switch to light mode' : 'Switch to dark mode'
          }
          accessibilityRole='button'
          testID='settings-theme-toggle'>
          <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          <Text style={styles.themeButtonText}>
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const config: BaseMenuConfig = {
    title: 'Settings',
    fullScreen: true,
    testID: 'settings-menu',
    sections: [
      {
        title: 'Appearance',
        options: [], // Empty because we use custom theme section
      },
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
