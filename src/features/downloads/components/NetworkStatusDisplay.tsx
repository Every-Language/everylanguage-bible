import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { NetworkService } from '@/shared/services/network';

interface NetworkStatusDisplayProps {
  isOnline: boolean;
  isCheckingOnline: boolean;
  hasCheckedOnline: boolean;
  isConnected: boolean | null;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  onRetry: () => void;
  disabled?: boolean;
}

export const NetworkStatusDisplay: React.FC<NetworkStatusDisplayProps> = ({
  isOnline,
  isCheckingOnline,
  hasCheckedOnline,
  isConnected,
  connectionType,
  isInternetReachable,
  onRetry,
  disabled = false,
}) => {
  const { theme } = useTheme();

  const getNetworkStatusText = () => {
    if (isOnline) {
      return 'Online - Ready to download';
    }
    if (isCheckingOnline) {
      return 'Checking internet connection...';
    }
    return NetworkService.getNetworkStatusText({
      isConnected: isConnected ?? false,
      connectionType: connectionType ?? 'unknown',
      isInternetReachable: isInternetReachable ?? false,
    });
  };

  const getNetworkIcon = (): keyof typeof MaterialIcons.glyphMap => {
    if (isOnline) {
      return 'check-circle';
    }
    if (isCheckingOnline) {
      return 'hourglass-empty';
    }
    return NetworkService.getNetworkIcon({
      isConnected: isConnected ?? false,
      connectionType: connectionType ?? 'unknown',
      isInternetReachable: isInternetReachable ?? false,
    });
  };

  const getNetworkStatusColor = () => {
    if (isOnline) {
      return theme.colors.success;
    }
    if (isCheckingOnline) {
      return theme.colors.primary;
    }
    return NetworkService.getNetworkStatusColor(
      {
        isConnected: isConnected ?? false,
        connectionType: connectionType ?? 'unknown',
        isInternetReachable: isInternetReachable ?? false,
      },
      theme
    );
  };

  if (!hasCheckedOnline) {
    return null;
  }

  return (
    <View
      style={[
        styles.networkStatusContainer,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}>
      <View style={styles.networkStatusRow}>
        <MaterialIcons
          name={getNetworkIcon()}
          size={20}
          color={getNetworkStatusColor()}
        />
        <Text style={[styles.networkStatusText, { color: theme.colors.text }]}>
          {getNetworkStatusText()}
        </Text>
        {!isOnline && (
          <TouchableOpacity
            style={[
              styles.retryIconButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onRetry}
            disabled={disabled || isCheckingOnline}>
            {isCheckingOnline ? (
              <ActivityIndicator
                size='small'
                color={theme.colors.textInverse}
              />
            ) : (
              <MaterialIcons
                name='refresh'
                size={16}
                color={theme.colors.textInverse}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
      {!isOnline && (
        <>
          <Text
            style={[
              styles.networkExplanationText,
              { color: theme.colors.textSecondary },
            ]}>
            Network connection is required to download media files
          </Text>
          <TouchableOpacity
            style={[styles.refreshButton, { borderColor: theme.colors.border }]}
            onPress={onRetry}
            disabled={disabled || isCheckingOnline}>
            {isCheckingOnline ? (
              <ActivityIndicator size='small' color={theme.colors.primary} />
            ) : (
              <MaterialIcons
                name='refresh'
                size={16}
                color={theme.colors.primary}
              />
            )}
            <Text
              style={[
                styles.refreshButtonText,
                { color: theme.colors.primary },
              ]}>
              {isCheckingOnline ? 'Checking...' : 'Retry Internet Check'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = {
  networkStatusContainer: {
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 32,
    gap: 12,
  },
  networkStatusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  networkStatusText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  networkExplanationText: {
    fontSize: 12,
    fontWeight: '400' as const,
    textAlign: 'center' as const,
    lineHeight: 16,
  },
  retryIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginLeft: 8,
  },
  refreshButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
};
