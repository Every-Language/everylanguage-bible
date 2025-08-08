import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { SyncStatusPill } from './SyncStatusPill';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';
import { useCurrentVersions } from '@/features/languages/hooks';

interface TopBarProps {
  title?: string;
  showProfile?: boolean;
  showSyncStatus?: boolean;
  showLanguageSelection?: boolean;
  onMenuPress?: () => void;
  onSyncPress?: () => void;
  onAudioVersionPress?: () => void;
  onTextVersionPress?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  showProfile = true,
  showSyncStatus = true,
  showLanguageSelection = false,
  onMenuPress,
  onSyncPress,
  onAudioVersionPress,
  onTextVersionPress,
}) => {
  const { theme } = useTheme();
  const { currentAudioVersion, currentTextVersion } = useCurrentVersions();

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
          {showLanguageSelection && (
            <>
              {/* Audio Version Button */}
              <TouchableOpacity
                style={[
                  styles.versionButton,
                  { borderColor: theme.colors.border },
                ]}
                onPress={onAudioVersionPress || (() => {})}>
                <Ionicons
                  name='volume-high'
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.versionText, { color: theme.colors.text }]}>
                  {currentAudioVersion?.name || 'Audio'}
                </Text>
                <Ionicons
                  name='chevron-down'
                  size={14}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Text Version Button */}
              <TouchableOpacity
                style={[
                  styles.versionButton,
                  { borderColor: theme.colors.border },
                ]}
                onPress={onTextVersionPress || (() => {})}>
                <Ionicons
                  name='document-text'
                  size={16}
                  color={theme.colors.primary}
                />
                <Text
                  style={[styles.versionText, { color: theme.colors.text }]}>
                  {currentTextVersion?.name || 'Text'}
                </Text>
                <Ionicons
                  name='chevron-down'
                  size={14}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </>
          )}

          {showSyncStatus && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={onSyncPress}
              activeOpacity={0.7}>
              <SyncStatusPill />
            </TouchableOpacity>
          )}

          {showProfile && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onMenuPress}
              activeOpacity={0.7}>
              <Ionicons name='menu' size={24} color={theme.colors.text} />
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
    borderBottomColor: COLOR_VARIATIONS.BLACK_10,
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
  versionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  versionText: {
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  syncButton: {
    padding: 8,
  },
  menuButton: {
    padding: 8,
  },
});
