import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { SyncStatusPill } from './SyncStatusPill';

interface TopBarProps {
  title?: string;
  showProfile?: boolean;
  showThemeToggle?: boolean;
  showSyncStatus?: boolean;
  onProfilePress?: () => void;
  onSyncPress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showProfile = true,
  showThemeToggle = true,
  showSyncStatus = true,
  onProfilePress,
  onSyncPress,
}) => {
  const { theme, mode, toggleTheme } = useTheme();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}>
        <View style={styles.leftSection}>
          {title && (
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          {showSyncStatus && (
            <SyncStatusPill {...(onSyncPress && { onPress: onSyncPress })} />
          )}

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name='search' size={20} color={theme.colors.text} />
          </TouchableOpacity>

          {showThemeToggle && (
            <TouchableOpacity style={styles.iconButton} onPress={toggleTheme}>
              <Ionicons
                name={mode === 'light' ? 'moon' : 'sunny'}
                size={20}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          )}

          {showProfile && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onProfilePress}>
              <Ionicons name='person' size={20} color={theme.colors.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {},
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
