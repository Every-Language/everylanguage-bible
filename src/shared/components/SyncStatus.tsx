import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/shared/hooks';
import { useSync } from '@/shared/hooks';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';
import { useBackgroundSync } from '@/shared/hooks/useBackgroundSync';
import { logger } from '@/shared/utils/logger';

interface SyncStatusProps {
  showDetails?: boolean;
  onSyncPress?: () => void;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  showDetails = false,
  onSyncPress,
}) => {
  const { theme } = useTheme();
  const {
    isSyncing,
    syncProgress,
    lastSyncAt,
    hasLocalData,
    isInitialized,
    syncNow,
  } = useSync();

  const {
    hasRemoteChanges,
    isEnabled: isBackgroundSyncEnabled,
    checkForRemoteChanges,
  } = useBackgroundSync();

  const handleSyncPress = async () => {
    if (onSyncPress) {
      onSyncPress();
    } else {
      try {
        await checkForRemoteChanges();
        await syncNow();
      } catch (error) {
        logger.error('Sync failed:', error);
      }
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isInitialized) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <ActivityIndicator size='small' color={theme.colors.primary} />
        <Text style={[styles.statusText, { color: theme.colors.text }]}>
          Initializing...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.statusRow}>
        {isSyncing && (
          <ActivityIndicator size='small' color={theme.colors.primary} />
        )}

        <View style={styles.statusInfo}>
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {isSyncing
              ? 'Syncing...'
              : hasLocalData
                ? hasRemoteChanges
                  ? 'Updates available'
                  : 'Up to date'
                : 'No data'}
          </Text>

          {showDetails && lastSyncAt && (
            <Text
              style={[
                styles.lastSyncText,
                { color: theme.colors.textSecondary },
              ]}>
              Last sync: {formatLastSync(lastSyncAt)}
            </Text>
          )}

          {showDetails && (
            <Text
              style={[
                styles.lastSyncText,
                { color: theme.colors.textSecondary },
              ]}>
              Background sync:{' '}
              {isBackgroundSyncEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.syncButton,
            { backgroundColor: theme.colors.primary },
            isSyncing && styles.disabledOpacity,
          ]}
          onPress={handleSyncPress}
          disabled={isSyncing}>
          <Text
            style={[
              styles.syncButtonText,
              { color: theme.colors.textInverse },
            ]}>
            {isSyncing ? 'Syncing' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      {syncProgress && (
        <View style={styles.progressContainer}>
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.textSecondary },
            ]}>
            {syncProgress.table}: {syncProgress.recordsSynced} records
            {syncProgress.error && ` (Error: ${syncProgress.error})`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastSyncText: {
    fontSize: 12,
    marginTop: 2,
  },
  syncButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLOR_VARIATIONS.BLACK_10,
  },
  progressText: {
    fontSize: 12,
  },
  disabledOpacity: {
    opacity: 0.6,
  },
});
