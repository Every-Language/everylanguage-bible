import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { useTheme } from '@/shared/context/ThemeContext';
import { logger } from '@/shared/utils/logger';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

interface PermissionsManagerProps {
  showOnlyMissing?: boolean;
  onPermissionsGranted?: () => void;
  onPermissionsDenied?: () => void;
}

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({
  showOnlyMissing = false,
  onPermissionsGranted,
  onPermissionsDenied,
}) => {
  const { theme } = useTheme();
  const {
    permissions,
    isLoading,
    requestAllPermissions,
    requestNotificationPermissions,
    areCriticalPermissionsGranted,
    showPermissionExplanation,
    openAppSettings,
  } = usePermissions();
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestAllPermissions = async () => {
    try {
      setIsRequesting(true);
      await requestAllPermissions();

      if (areCriticalPermissionsGranted()) {
        onPermissionsGranted?.();
        Alert.alert(
          'Permissions Granted',
          'All necessary permissions have been granted. You can now use all app features.',
          [{ text: 'OK' }]
        );
      } else {
        onPermissionsDenied?.();
        Alert.alert(
          'Some Permissions Denied',
          'Some permissions were denied. You can still use basic features, but some functionality may be limited.',
          [
            { text: 'Continue', style: 'default' },
            { text: 'Settings', onPress: openAppSettings },
          ]
        );
      }
    } catch (error) {
      logger.error('Failed to request permissions:', error);
      Alert.alert(
        'Error',
        'Failed to request permissions. Please try again or check your device settings.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestNotifications = async () => {
    try {
      const result = await requestNotificationPermissions();
      if (result.granted) {
        Alert.alert(
          'Notifications Enabled',
          'You will now receive notifications for new content and updates.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('Failed to request notification permissions:', error);
    }
  };

  const getPermissionIcon = (granted: boolean, canAskAgain: boolean) => {
    if (granted) return '✅';
    if (!canAskAgain) return '❌';
    return '⚠️';
  };

  const getPermissionStatusText = (granted: boolean, canAskAgain: boolean) => {
    if (granted) return 'Granted';
    if (!canAskAgain) return 'Denied';
    return 'Not Requested';
  };

  const getPermissionDescription = (type: keyof typeof permissions) => {
    const descriptions = {
      notifications: 'Receive notifications for new content and updates',
      audio: 'Play Bible audio in the background',
      storage: 'Download and store content for offline use',
      backgroundSync: 'Keep content updated automatically',
      location: 'Provide region-specific content and language recommendations',
    };
    return descriptions[type];
  };

  const shouldShowPermission = (permission: {
    granted: boolean;
    canAskAgain: boolean;
  }) => {
    if (!showOnlyMissing) return true;
    return !permission.granted;
  };

  const filteredPermissions = Object.entries(permissions).filter(
    ([_, permission]) => shouldShowPermission(permission)
  );

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}>
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Checking permissions...
        </Text>
      </View>
    );
  }

  if (filteredPermissions.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}>
        <Text
          style={[
            styles.allGrantedText,
            { color: theme.colors.textSecondary },
          ]}>
          All permissions are granted! 🎉
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          App Permissions
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Grant permissions to use all app features
        </Text>
      </View>

      <View style={styles.permissionsList}>
        {filteredPermissions.map(([type, permission]) => (
          <View
            key={type}
            style={[
              styles.permissionItem,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}>
            <View style={styles.permissionHeader}>
              <Text style={[styles.permissionIcon, styles.permissionIconLarge]}>
                {getPermissionIcon(permission.granted, permission.canAskAgain)}
              </Text>
              <View style={styles.permissionInfo}>
                <Text
                  style={[
                    styles.permissionTitle,
                    { color: theme.colors.text },
                  ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                <Text
                  style={[
                    styles.permissionStatus,
                    { color: theme.colors.textSecondary },
                  ]}>
                  {getPermissionStatusText(
                    permission.granted,
                    permission.canAskAgain
                  )}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.permissionDescription,
                { color: theme.colors.textSecondary },
              ]}>
              {getPermissionDescription(type as keyof typeof permissions)}
            </Text>

            {!permission.granted && (
              <View style={styles.permissionActions}>
                {permission.canAskAgain ? (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.colors.primary },
                    ]}
                    onPress={() => {
                      if (type === 'notifications') {
                        handleRequestNotifications();
                      } else {
                        showPermissionExplanation(
                          type as keyof typeof permissions
                        );
                      }
                    }}>
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: COLOR_VARIATIONS.WHITE_PURE },
                      ]}>
                      {type === 'notifications' ? 'Enable' : 'Learn More'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: theme.colors.secondary },
                    ]}
                    onPress={openAppSettings}>
                    <Text
                      style={[
                        styles.actionButtonText,
                        { color: COLOR_VARIATIONS.WHITE_PURE },
                      ]}>
                      Open Settings
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.requestAllButton,
            { backgroundColor: theme.colors.primary },
            isRequesting && styles.disabledButton,
          ]}
          onPress={handleRequestAllPermissions}
          disabled={isRequesting}>
          <Text
            style={[
              styles.requestAllButtonText,
              { color: COLOR_VARIATIONS.WHITE_PURE },
            ]}>
            {isRequesting ? 'Requesting...' : 'Request All Permissions'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingsButton, { borderColor: theme.colors.border }]}
          onPress={openAppSettings}>
          <Text
            style={[
              styles.settingsButtonText,
              { color: theme.colors.textSecondary },
            ]}>
            Open App Settings
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  allGrantedText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  permissionsList: {
    marginBottom: 24,
  },
  permissionItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionIcon: {
    marginRight: 12,
  },
  permissionIconLarge: {
    fontSize: 20,
  },
  permissionInfo: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  permissionStatus: {
    fontSize: 14,
  },
  permissionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  permissionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    gap: 12,
  },
  requestAllButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  requestAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  settingsButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
