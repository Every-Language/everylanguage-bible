import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { SlideUpPanel } from './SlideUpPanel';
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

  const settingsOptions = [
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
    },
    {
      key: 'auto-play',
      icon: settingsIcon,
      label: 'Auto-play Audio',
      description: 'Automatically play next chapter when current ends',
      value: autoPlayEnabled,
      onToggle: () =>
        toggleSetting('Auto-play', autoPlayEnabled, setAutoPlayEnabled),
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
    },
  ];

  const actionOptions = [
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
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: Dimensions.spacing.md,
    },
    sectionHeader: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.md,
      marginTop: Dimensions.spacing.lg,
    },
    settingCard: {
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.sm,
      minHeight: 70,
    },
    themeCard: {
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      marginBottom: Dimensions.spacing.lg,
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
    settingInfo: {
      flex: 1,
      marginRight: Dimensions.spacing.md,
    },
    settingLabel: {
      fontSize: Fonts.size.base,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
      marginBottom: 2,
    },
    settingDescription: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      lineHeight: 18,
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    themeText: {
      fontSize: Fonts.size.base,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
    },
    themeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.xs,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: colors.primary + '20',
    },
    themeIcon: {
      fontSize: Fonts.size.lg,
      marginRight: Dimensions.spacing.xs,
    },
    themeButtonText: {
      fontSize: Fonts.size.sm,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
    },
    actionCard: {
      backgroundColor: isDark ? '#414141' : '#EAE9E7',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.lg,
      paddingVertical: Dimensions.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.sm,
      minHeight: 60,
    },
  });

  return (
    <SlideUpPanel
      isVisible={isVisible}
      onClose={onClose}
      title='Settings'
      fullScreen={true}
      testID='settings-menu'>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Theme Section */}
        <Text style={styles.sectionHeader}>Appearance</Text>
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

        {/* App Settings */}
        <Text style={styles.sectionHeader}>App Settings</Text>
        {settingsOptions.map(setting => (
          <View key={setting.key} style={styles.settingCard}>
            <View style={styles.iconContainer}>
              <Image
                source={setting.icon}
                style={styles.icon}
                resizeMode='contain'
              />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{setting.label}</Text>
              <Text style={styles.settingDescription}>
                {setting.description}
              </Text>
            </View>
            <Switch
              value={setting.value}
              onValueChange={setting.onToggle}
              trackColor={{
                false: colors.secondary + '30',
                true: colors.primary + '60',
              }}
              thumbColor={setting.value ? colors.primary : colors.secondary}
              testID={`settings-${setting.key}-toggle`}
            />
          </View>
        ))}

        {/* Actions */}
        <Text style={styles.sectionHeader}>Data & Storage</Text>
        {actionOptions.map(action => (
          <TouchableOpacity
            key={action.key}
            style={styles.actionCard}
            onPress={action.onPress}
            accessibilityLabel={action.label}
            accessibilityRole='button'
            testID={`settings-${action.key}`}>
            <View style={styles.iconContainer}>
              <Image
                source={action.icon}
                style={styles.icon}
                resizeMode='contain'
              />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{action.label}</Text>
              <Text style={styles.settingDescription}>
                {action.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SlideUpPanel>
  );
};
