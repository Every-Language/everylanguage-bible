import { useState, useEffect, useCallback } from 'react';
import {
  permissionsService,
  PermissionsState,
  PermissionStatus,
} from '@/shared/services/permissions/PermissionsService';
import { logger } from '@/shared/utils/logger';

export interface UsePermissionsReturn {
  permissions: PermissionsState;
  isLoading: boolean;
  requestAllPermissions: () => Promise<PermissionsState>;
  requestNotificationPermissions: () => Promise<PermissionStatus>;
  checkAllPermissions: () => Promise<PermissionsState>;
  areCriticalPermissionsGranted: () => boolean;
  showPermissionExplanation: (permissionType: keyof PermissionsState) => void;
  openAppSettings: () => Promise<void>;
}

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<PermissionsState>({
    notifications: {
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    },
    audio: { granted: false, canAskAgain: true, status: 'undetermined' },
    storage: { granted: false, canAskAgain: true, status: 'undetermined' },
    backgroundSync: {
      granted: false,
      canAskAgain: true,
      status: 'undetermined',
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize permissions on mount
  useEffect(() => {
    const initializePermissions = async () => {
      try {
        setIsLoading(true);
        await permissionsService.initialize();
        const currentPermissions = permissionsService.getPermissionsState();
        setPermissions(currentPermissions);
      } catch (error) {
        logger.error('Failed to initialize permissions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePermissions();
  }, []);

  // Request all permissions
  const requestAllPermissions =
    useCallback(async (): Promise<PermissionsState> => {
      try {
        setIsLoading(true);
        const result = await permissionsService.requestAllPermissions();
        setPermissions(result);
        return result;
      } catch (error) {
        logger.error('Failed to request all permissions:', error);
        return permissions;
      } finally {
        setIsLoading(false);
      }
    }, [permissions]);

  // Request notification permissions specifically
  const requestNotificationPermissions =
    useCallback(async (): Promise<PermissionStatus> => {
      try {
        const result =
          await permissionsService.requestNotificationPermissions();
        setPermissions(prev => ({
          ...prev,
          notifications: result,
        }));
        return result;
      } catch (error) {
        logger.error('Failed to request notification permissions:', error);
        return permissions.notifications;
      }
    }, [permissions.notifications]);

  // Check all permissions
  const checkAllPermissions =
    useCallback(async (): Promise<PermissionsState> => {
      try {
        setIsLoading(true);
        const result = await permissionsService.checkAllPermissions();
        setPermissions(result);
        return result;
      } catch (error) {
        logger.error('Failed to check all permissions:', error);
        return permissions;
      } finally {
        setIsLoading(false);
      }
    }, [permissions]);

  // Check if critical permissions are granted
  const areCriticalPermissionsGranted = useCallback((): boolean => {
    return permissionsService.areCriticalPermissionsGranted();
  }, []);

  // Show permission explanation
  const showPermissionExplanation = useCallback(
    (permissionType: keyof PermissionsState): void => {
      permissionsService.showPermissionExplanation(permissionType);
    },
    []
  );

  // Open app settings
  const openAppSettings = useCallback(async (): Promise<void> => {
    await permissionsService.openAppSettings();
  }, []);

  return {
    permissions,
    isLoading,
    requestAllPermissions,
    requestNotificationPermissions,
    checkAllPermissions,
    areCriticalPermissionsGranted,
    showPermissionExplanation,
    openAppSettings,
  };
};
