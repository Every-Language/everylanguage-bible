import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useSync } from '@/shared/context/SyncContext';
import { useBackgroundSync } from '@/shared/hooks/useBackgroundSync';

interface SyncStatusPillProps {
  onPress?: () => void;
}

export const SyncStatusPill: React.FC<SyncStatusPillProps> = ({ onPress }) => {
  const { theme } = useTheme();
  const {
    isSyncing,
    syncProgress,
    isConnected,
    connectionType,
    hasLocalData,
    isInitialized,
  } = useSync();

  const { hasRemoteChanges } = useBackgroundSync();

  const getConnectionIcon = () => {
    if (!isConnected) return '🔴';

    switch (connectionType) {
      case 'wifi':
        return '📶';
      case 'cellular':
        return '📱';
      case 'bluetooth':
        return '🔵';
      case 'ethernet':
        return '🔌';
      default:
        return '🌐';
    }
  };

  const getStatusText = () => {
    if (!isInitialized) return 'Initializing...';

    if (isSyncing && syncProgress) {
      const { recordsSynced, totalRecords } = syncProgress;
      if (totalRecords && totalRecords > 0) {
        return `${recordsSynced}/${totalRecords}`;
      }
      return `Syncing...`;
    }

    // Only check for remote changes if database is initialized
    if (isInitialized && hasRemoteChanges) {
      return 'Updates available';
    }

    if (!hasLocalData) {
      return 'No data';
    }

    if (!isConnected) {
      return 'Offline';
    }

    return 'Up to date';
  };

  const getStatusColor = () => {
    if (!isInitialized) return theme.colors.textSecondary;

    if (isSyncing) return theme.colors.primary;

    // Only check for remote changes if database is initialized
    if (isInitialized && hasRemoteChanges)
      return theme.colors.warning || '#FF9500';

    if (!hasLocalData) return theme.colors.error || '#FF3B30';

    if (!isConnected) return theme.colors.textSecondary;

    return theme.colors.success || '#34C759';
  };

  const getPillBackgroundColor = () => {
    if (!isInitialized) return theme.colors.surface;

    if (isSyncing) return theme.colors.primary + '10';

    // Only check for remote changes if database is initialized
    if (isInitialized && hasRemoteChanges)
      return (theme.colors.warning || '#FF9500') + '10';

    if (!hasLocalData) return (theme.colors.error || '#FF3B30') + '10';

    if (!isConnected) return theme.colors.surface;

    return (theme.colors.success || '#34C759') + '10';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getPillBackgroundColor(),
          borderColor: getStatusColor() + '20',
        },
      ]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.content}>
        <Text style={styles.connectionIcon}>{getConnectionIcon()}</Text>

        {isSyncing && (
          <ActivityIndicator
            size='small'
            color={theme.colors.primary}
            style={styles.spinner}
          />
        )}

        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectionIcon: {
    fontSize: 12,
  },
  spinner: {
    marginRight: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
