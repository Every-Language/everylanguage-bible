import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as FileSystem from 'expo-file-system';
import * as TaskManager from 'expo-task-manager';
import { Platform, Alert, Linking } from 'react-native';
import { logger } from '@/shared/utils/logger';

export interface PermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined' | 'blocked';
}

export interface PermissionsState {
  notifications: PermissionStatus;
  audio: PermissionStatus;
  storage: PermissionStatus;
  backgroundSync: PermissionStatus;
  location: PermissionStatus;
}

export class PermissionsService {
  private static instance: PermissionsService;
  private permissionsState: PermissionsState = {
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
    location: { granted: false, canAskAgain: true, status: 'undetermined' },
  };

  private constructor() {}

  static getInstance(): PermissionsService {
    if (!PermissionsService.instance) {
      PermissionsService.instance = new PermissionsService();
    }
    return PermissionsService.instance;
  }

  /**
   * Initialize permissions service and check current status
   */
  async initialize(): Promise<void> {
    try {
      logger.info('Initializing permissions service');

      // Check all permissions on startup
      await this.checkAllPermissions();

      logger.info('Permissions service initialized');
    } catch (error) {
      logger.error('Failed to initialize permissions service:', error);
    }
  }

  /**
   * Check all permissions and update state
   */
  async checkAllPermissions(): Promise<PermissionsState> {
    try {
      const [notifications, audio, storage, backgroundSync, location] =
        await Promise.all([
          this.checkNotificationPermissions(),
          this.checkAudioPermissions(),
          this.checkStoragePermissions(),
          this.checkBackgroundSyncPermissions(),
          this.checkLocationPermissions(),
        ]);

      this.permissionsState = {
        notifications,
        audio,
        storage,
        backgroundSync,
        location,
      };

      logger.info('Permissions state updated:', this.permissionsState);
      return this.permissionsState;
    } catch (error) {
      logger.error('Failed to check permissions:', error);
      return this.permissionsState;
    }
  }

  /**
   * Check notification permissions
   */
  async checkNotificationPermissions(): Promise<PermissionStatus> {
    try {
      if (!Device.isDevice) {
        return { granted: false, canAskAgain: false, status: 'denied' };
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      const status: PermissionStatus = {
        granted: existingStatus === 'granted',
        canAskAgain: existingStatus !== 'denied',
        status: existingStatus,
      };

      logger.info('Notification permissions:', status);
      return status;
    } catch (error) {
      logger.error('Failed to check notification permissions:', error);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  }

  /**
   * Request notification permissions
   */
  async requestNotificationPermissions(): Promise<PermissionStatus> {
    try {
      if (!Device.isDevice) {
        logger.warn('Notifications are not supported on simulators');
        return { granted: false, canAskAgain: false, status: 'denied' };
      }

      const { status } = await Notifications.requestPermissionsAsync();

      const permissionStatus: PermissionStatus = {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status,
      };

      this.permissionsState.notifications = permissionStatus;

      logger.info('Notification permission request result:', permissionStatus);
      return permissionStatus;
    } catch (error) {
      logger.error('Failed to request notification permissions:', error);
      return { granted: false, canAskAgain: false, status: 'denied' };
    }
  }

  /**
   * Check audio permissions (mainly for background playback)
   */
  async checkAudioPermissions(): Promise<PermissionStatus> {
    try {
      // Audio permissions are generally granted by default in Expo managed workflow
      // We mainly need to check if background audio is supported
      const isSupported = await this.isBackgroundAudioSupported();

      const status: PermissionStatus = {
        granted: isSupported,
        canAskAgain: true,
        status: isSupported ? 'granted' : 'denied',
      };

      logger.info('Audio permissions:', status);
      return status;
    } catch (error) {
      logger.error('Failed to check audio permissions:', error);
      return { granted: false, canAskAgain: true, status: 'denied' };
    }
  }

  /**
   * Check if background audio is supported
   */
  private async isBackgroundAudioSupported(): Promise<boolean> {
    try {
      // Check if device supports background audio
      if (Platform.OS === 'ios') {
        // iOS generally supports background audio
        return true;
      } else if (Platform.OS === 'android') {
        // Android requires specific permissions and capabilities
        return Device.isDevice;
      }
      return false;
    } catch (error) {
      logger.error('Failed to check background audio support:', error);
      return false;
    }
  }

  /**
   * Check storage permissions
   */
  async checkStoragePermissions(): Promise<PermissionStatus> {
    try {
      // In Expo managed workflow, file system access is generally granted
      // We check if we can access the document directory
      const canAccess = await this.canAccessFileSystem();

      const status: PermissionStatus = {
        granted: canAccess,
        canAskAgain: true,
        status: canAccess ? 'granted' : 'denied',
      };

      logger.info('Storage permissions:', status);
      return status;
    } catch (error) {
      logger.error('Failed to check storage permissions:', error);
      // In development builds, assume storage is available
      return { granted: true, canAskAgain: true, status: 'granted' };
    }
  }

  /**
   * Check if we can access the file system
   */
  private async canAccessFileSystem(): Promise<boolean> {
    try {
      // Try to access the document directory
      const documentDirectory = FileSystem.documentDirectory;
      if (!documentDirectory) {
        return false;
      }
      const dirInfo = await FileSystem.getInfoAsync(documentDirectory);
      return dirInfo.exists;
    } catch (error) {
      logger.error('Failed to check file system access:', error);
      return false;
    }
  }

  /**
   * Check background sync permissions
   */
  async checkBackgroundSyncPermissions(): Promise<PermissionStatus> {
    try {
      // Background sync permissions depend on the platform and app state
      const isSupported = await this.isBackgroundSyncSupported();

      const status: PermissionStatus = {
        granted: isSupported,
        canAskAgain: true,
        status: isSupported ? 'granted' : 'denied',
      };

      logger.info('Background sync permissions:', status);
      return status;
    } catch (error) {
      logger.error('Failed to check background sync permissions:', error);
      return { granted: false, canAskAgain: true, status: 'denied' };
    }
  }

  /**
   * Check location permissions
   */
  async checkLocationPermissions(): Promise<PermissionStatus> {
    try {
      // Import location service dynamically to avoid circular dependencies
      const { locationService } = await import(
        '@/shared/services/location/LocationService'
      );
      const permissionStatus = await locationService.checkPermissionStatus();

      const status: PermissionStatus = {
        granted: permissionStatus.granted,
        canAskAgain: permissionStatus.canAskAgain,
        status: permissionStatus.status === 'granted' ? 'granted' : 'denied',
      };

      logger.info('Location permissions:', status);
      return status;
    } catch (error) {
      logger.error('Failed to check location permissions:', error);
      // In development builds, assume location is not critical
      return { granted: false, canAskAgain: true, status: 'denied' };
    }
  }

  /**
   * Check if background sync is supported
   */
  private async isBackgroundSyncSupported(): Promise<boolean> {
    try {
      // Background sync is not supported in development/Expo Go
      if (__DEV__) {
        logger.info('Background sync not supported in development mode');
        return false;
      }

      // Check if TaskManager is available
      await TaskManager.getRegisteredTasksAsync();

      // Background sync is supported if we can register tasks
      return true;
    } catch (error) {
      logger.error('Failed to check background sync support:', error);
      return false;
    }
  }

  /**
   * Request all necessary permissions
   */
  async requestAllPermissions(): Promise<PermissionsState> {
    try {
      logger.info('Requesting all permissions');

      const [notifications, audio, storage, backgroundSync, location] =
        await Promise.all([
          this.requestNotificationPermissions(),
          this.checkAudioPermissions(), // Audio permissions are generally granted
          this.checkStoragePermissions(), // Storage permissions are generally granted
          this.checkBackgroundSyncPermissions(), // Background sync depends on build type
          this.checkLocationPermissions(), // Location permissions
        ]);

      this.permissionsState = {
        notifications,
        audio,
        storage,
        backgroundSync,
        location,
      };

      logger.info('All permissions requested:', this.permissionsState);
      return this.permissionsState;
    } catch (error) {
      logger.error('Failed to request all permissions:', error);
      return this.permissionsState;
    }
  }

  /**
   * Get current permissions state
   */
  getPermissionsState(): PermissionsState {
    return { ...this.permissionsState };
  }

  /**
   * Check if all critical permissions are granted
   */
  areCriticalPermissionsGranted(): boolean {
    const { notifications, audio, storage } = this.permissionsState;
    return notifications.granted && audio.granted && storage.granted;
  }

  /**
   * Show permission explanation dialog
   */
  showPermissionExplanation(permissionType: keyof PermissionsState): void {
    const explanations = {
      notifications: {
        title: 'Enable Notifications',
        message:
          'Get notified about new Bible content, reading reminders, and app updates.',
        settingsKey: 'notifications',
      },
      audio: {
        title: 'Audio Playback',
        message:
          'Listen to Bible audio in the background while using other apps.',
        settingsKey: 'audio',
      },
      storage: {
        title: 'Storage Access',
        message: 'Download and store Bible content for offline use.',
        settingsKey: 'storage',
      },
      backgroundSync: {
        title: 'Background Sync',
        message: 'Keep your Bible content up to date automatically.',
        settingsKey: 'backgroundSync',
      },
      location: {
        title: 'Location Access',
        message:
          'Provide region-specific Bible content and language recommendations.',
        settingsKey: 'location',
      },
    };

    const explanation = explanations[permissionType];

    Alert.alert(explanation.title, explanation.message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Settings',
        onPress: () => this.openAppSettings(),
      },
    ]);
  }

  /**
   * Open app settings
   */
  async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      logger.error('Failed to open app settings:', error);
    }
  }

  /**
   * Check if a specific permission is granted
   */
  isPermissionGranted(permissionType: keyof PermissionsState): boolean {
    return this.permissionsState[permissionType].granted;
  }

  /**
   * Check if a specific permission can be asked again
   */
  canAskPermissionAgain(permissionType: keyof PermissionsState): boolean {
    return this.permissionsState[permissionType].canAskAgain;
  }
}

// Export singleton instance
export const permissionsService = PermissionsService.getInstance();
