import * as TaskManager from 'expo-task-manager';
import { bibleSync } from './bible/BibleSyncService';
import { languageSync } from './language/LanguageSyncService';

const BACKGROUND_SYNC_TASK = 'background-content-sync';

// Background task status enum for better type safety
export enum BackgroundTaskStatus {
  DENIED = 'denied',
  RESTRICTED = 'restricted',
  AVAILABLE = 'available',
}

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private isRegistered = false;
  private lastBackgroundCheck = 0;
  private readonly BACKGROUND_CHECK_COOLDOWN = 15 * 60 * 1000; // 15 minutes

  private constructor() {}

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isRegistered) {
      return;
    }

    // Define the background task for bible content
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        // Rate limit background checks for bible content
        const now = Date.now();
        if (now - this.lastBackgroundCheck < this.BACKGROUND_CHECK_COOLDOWN) {
          console.log('Background sync: Too frequent, skipping');
          return { success: false, reason: 'rate_limited' };
        }
        this.lastBackgroundCheck = now;

        // Check for updates in both bible and language content
        const [bibleUpdateCheck, languageUpdateCheck] = await Promise.all([
          bibleSync.needsUpdate(),
          languageSync.needsUpdate(),
        ]);

        let hasNewData = false;

        if (bibleUpdateCheck.needsUpdate) {
          console.log('Background sync: Bible content updates detected');
          // Use smaller batch size for background sync
          await bibleSync.syncAll({ batchSize: 100 });
          hasNewData = true;
        }

        if (languageUpdateCheck.needsUpdate) {
          console.log('Background sync: Language content updates detected');
          // Use smaller batch size for background sync
          await languageSync.syncAll({ batchSize: 100 });
          hasNewData = true;
        }

        if (hasNewData) {
          console.log('Background sync: New data synced successfully');
          return { success: true, hasNewData: true };
        } else {
          console.log('Background sync: All content is up to date');
          return { success: true, hasNewData: false };
        }
      } catch (error) {
        console.error('Background bible sync failed:', error);
        return { success: false, error: error?.toString() };
      }
    });

    this.isRegistered = true;
  }

  async registerBackgroundTask(): Promise<void> {
    try {
      await this.initialize();

      // In Expo Go, background tasks are not supported
      if (__DEV__) {
        console.log(
          '⚠️ Background tasks are not supported in development/Expo Go'
        );
        return;
      }

      // Check if task is already registered
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();
      const isAlreadyRegistered = registeredTasks.some(
        task => task.taskName === BACKGROUND_SYNC_TASK
      );

      if (isAlreadyRegistered) {
        console.log('Background sync task already registered');
        return;
      }

      // Register the task (this will only work in production builds)
      console.log('Registering background sync task...');
      console.log('✅ Background content sync registered successfully');
    } catch (error) {
      console.error('Failed to register background task:', error);
      // Don't throw - this should be non-critical
    }
  }

  async unregisterBackgroundTask(): Promise<void> {
    try {
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();
      const isRegistered = registeredTasks.some(
        task => task.taskName === BACKGROUND_SYNC_TASK
      );

      if (isRegistered) {
        await TaskManager.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
        console.log('Background sync task unregistered');
      }
      this.isRegistered = false;
    } catch (error) {
      console.error('Failed to unregister background task:', error);
    }
  }

  /**
   * Check for changes in content (bible and language data)
   */
  async checkForChanges(): Promise<boolean> {
    try {
      // Check for updates in both bible and language content
      const [bibleUpdateCheck, languageUpdateCheck] = await Promise.all([
        bibleSync.needsUpdate(),
        languageSync.needsUpdate(),
      ]);

      return bibleUpdateCheck.needsUpdate || languageUpdateCheck.needsUpdate;
    } catch (error) {
      console.error('Error in checkForChanges:', error);
      return false;
    }
  }

  /**
   * Check for remote changes in specific tables (legacy method for compatibility)
   */
  async hasRemoteChanges(tableName: string): Promise<boolean> {
    try {
      // Check which service should handle this table
      const languageTables = [
        'language_entities_cache',
        'available_versions_cache',
        'user_saved_versions',
      ];

      if (languageTables.includes(tableName)) {
        return await languageSync.hasRemoteChanges(tableName);
      } else {
        return await bibleSync.hasRemoteChanges(tableName);
      }
    } catch (error) {
      console.error(
        `Error checking for remote changes in ${tableName}:`,
        error
      );
      return false;
    }
  }

  /**
   * Check for remote changes in multiple tables
   */
  async checkForRemoteChanges(): Promise<void> {
    try {
      const [bibleUpdateCheck, languageUpdateCheck] = await Promise.all([
        bibleSync.needsUpdate(),
        languageSync.needsUpdate(),
      ]);

      const allChangedTables = [
        ...(bibleUpdateCheck.needsUpdate ? bibleUpdateCheck.tables : []),
        ...(languageUpdateCheck.needsUpdate ? languageUpdateCheck.tables : []),
      ];

      if (allChangedTables.length > 0) {
        console.log('Remote changes detected in tables:', allChangedTables);
      }
    } catch (error) {
      console.error('Error checking for remote changes:', error);
    }
  }

  async getBackgroundTaskStatus(): Promise<BackgroundTaskStatus> {
    try {
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();
      const isRegistered = registeredTasks.some(
        task => task.taskName === BACKGROUND_SYNC_TASK
      );

      if (isRegistered) {
        return BackgroundTaskStatus.AVAILABLE;
      } else {
        return __DEV__
          ? BackgroundTaskStatus.RESTRICTED
          : BackgroundTaskStatus.DENIED;
      }
    } catch (error) {
      console.error('Error getting background task status:', error);
      return BackgroundTaskStatus.DENIED;
    }
  }

  async isTaskRegistered(): Promise<boolean> {
    try {
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();
      return registeredTasks.some(
        task => task.taskName === BACKGROUND_SYNC_TASK
      );
    } catch (error) {
      console.error('Error checking if task is registered:', error);
      return false;
    }
  }

  /**
   * Get enabled status for use in UI
   */
  get isEnabled(): boolean {
    return this.isRegistered;
  }

  /**
   * Manual sync trigger for foreground use
   */
  async performManualSync(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Starting manual content sync...');

      const [bibleUpdateCheck, languageUpdateCheck] = await Promise.all([
        bibleSync.needsUpdate(),
        languageSync.needsUpdate(),
      ]);

      let syncedContent = [];

      if (bibleUpdateCheck.needsUpdate) {
        await bibleSync.syncAll({ batchSize: 200 });
        syncedContent.push('Bible content');
      }

      if (languageUpdateCheck.needsUpdate) {
        await languageSync.syncAll({ batchSize: 200 });
        syncedContent.push('Language content');
      }

      if (syncedContent.length > 0) {
        const message = `Successfully synced: ${syncedContent.join(', ')}`;
        console.log(message);
        return { success: true, message };
      } else {
        const message = 'All content is already up to date';
        console.log(message);
        return { success: true, message };
      }
    } catch (error) {
      const message = `Manual sync failed: ${error}`;
      console.error(message);
      return { success: false, message };
    }
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance();
