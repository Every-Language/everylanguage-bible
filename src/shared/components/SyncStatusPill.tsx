import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { useSync } from '@/shared/hooks/useSyncFromStore';
import { useBackgroundSync } from '@/shared/hooks/useBackgroundSync';
import { useNetworkState } from '@/shared/hooks/useNetworkState';

interface SyncStatusPillProps {
  onPress?: () => void;
}

export const SyncStatusPill: React.FC<SyncStatusPillProps> = ({ onPress }) => {
  const { theme } = useTheme();
  const { isSyncing, syncProgress, hasLocalData, isInitialized } = useSync();

  const { hasRemoteChanges } = useBackgroundSync();
  const { isConnected, connectionType } = useNetworkState();

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
    if (!isInitialized || isSyncing) return theme.colors.primary;
    if (!hasLocalData) return theme.colors.error;
    if (!isConnected) return theme.colors.error;
    if (hasRemoteChanges) return theme.colors.warning;
    return theme.colors.success;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceVariant,
          borderColor: getStatusColor(),
        },
      ]}
      onPress={onPress}
      disabled={!onPress}>
      <MaterialIcons
        name={getConnectionIcon()}
        size={16}
        color={getStatusColor()}
      />
      <Text style={[styles.text, { color: getStatusColor() }]}>
        {getStatusText()}
      </Text>
      {getStatusIcon() && (
        <MaterialIcons
          name={getStatusIcon()!}
          size={16}
          color={getStatusColor()}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
