import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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

  const getConnectionIcon = (): keyof typeof MaterialIcons.glyphMap => {
    if (!isConnected) return 'cloud-off';

    switch (connectionType) {
      case 'wifi':
        return 'wifi';
      case 'cellular':
        return 'signal-cellular-4-bar';
      case 'bluetooth':
        return 'bluetooth';
      case 'ethernet':
        return 'cable';
      default:
        return 'language';
    }
  };

  const getStatusIcon = (): keyof typeof MaterialIcons.glyphMap | null => {
    if (!isInitialized || isSyncing) return null;

    // Only check for remote changes if database is initialized
    if (isInitialized && hasRemoteChanges) return 'update';

    if (!hasLocalData) return 'error';

    if (!isConnected) return 'cloud-off';

    return 'check-circle';
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
    if (isInitialized && hasRemoteChanges) return theme.colors.warning;

    if (!hasLocalData) return theme.colors.error;

    if (!isConnected) return theme.colors.textSecondary;

    return theme.colors.success;
  };

  const getPillBackgroundColor = () => {
    if (!isInitialized) return theme.colors.surface;

    if (isSyncing) return theme.colors.surfaceVariant;

    // Only check for remote changes if database is initialized
    if (isInitialized && hasRemoteChanges) return theme.colors.surfaceVariant;

    if (!hasLocalData) return theme.colors.surfaceVariant;

    if (!isConnected) return theme.colors.surface;

    return theme.colors.surfaceVariant;
  };

  const statusIcon = getStatusIcon();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getPillBackgroundColor(),
        },
      ]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.content}>
        <MaterialIcons
          name={getConnectionIcon()}
          size={12}
          color={getStatusColor()}
        />

        {isSyncing && (
          <ActivityIndicator
            size='small'
            color={theme.colors.primary}
            style={styles.spinner}
          />
        )}

        {statusIcon && !isSyncing && (
          <MaterialIcons
            name={statusIcon}
            size={12}
            color={getStatusColor()}
            style={styles.statusIcon}
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  spinner: {
    marginRight: 2,
  },
  statusIcon: {
    marginRight: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
