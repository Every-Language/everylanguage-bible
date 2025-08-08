import * as TaskManager from 'expo-task-manager';
import { bibleSync } from './bible/BibleSyncService';
// Language sync removed - using PowerSync and server-side fuzzy search instead
import { MediaFilesVersesSyncService } from './media';
import { logger } from '../../utils/logger';

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
          logger.info('Background sync: Too frequent, skipping');
          return { success: false, reason: 'rate_limited' };
        }
        this.lastBackgroundCheck = now;

        // Check for updates in bible and media content
        // Language sync removed - using PowerSync and server-side fuzzy search instead
        const mediaFilesVersesSync = MediaFilesVersesSyncService.getInstance();
        const [bibleUpdateCheck, mediaUpdateCheck] = await Promise.all([
          bibleSync.needsUpdate(),
          mediaFilesVersesSync.needsUpdate(),
        ]);

        let hasNewData = false;

        if (bibleUpdateCheck.needsUpdate) {
          logger.info('Background sync: Bible content updates detected');
          // Use smaller batch size for background sync
          await bibleSync.syncAll({ batchSize: 100 });
          hasNewData = true;
        }

        // Language sync removed - using PowerSync and server-side fuzzy search instead

        if (mediaUpdateCheck.needsUpdate) {
          logger.info('Background sync: Media files verses updates detected');
          // Use smaller batch size for background sync
          await mediaFilesVersesSync.syncAll({ batchSize: 100 });
          hasNewData = true;
        }

        if (hasNewData) {
          logger.info('Background sync: New data synced successfully');
          return { success: true, hasNewData: true };
        } else {
          logger.info('Background sync: All content is up to date');
          return { success: true, hasNewData: false };
        }
      } catch (error: unknown) {
        const err = error as Error;
        logger.error('Background bible sync failed:', {
          error: error,
          errorType: typeof error,
          errorConstructor: err?.constructor?.name,
          errorMessage: err?.message || 'No message',
          errorStack: err?.stack || 'No stack',
        });
        return {
          success: false,
          error: err?.toString() || 'Unknown error',
        };
      }
    });

    this.isRegistered = true;
  }

  async registerBackgroundTask(): Promise<void> {
    try {
      await this.initialize();

      // In Expo Go, background tasks are not supported
      if (__DEV__) {
        logger.info(
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
        logger.info('Background sync task already registered');
        return;
      }

      // Register the task (this will only work in production builds)
      logger.info('Registering background sync task...');
      logger.info('✅ Background content sync registered successfully');
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to register background task:', {
        error: error,
        errorType: typeof error,
        errorConstructor: err?.constructor?.name,
        errorMessage: err?.message || 'No message',
        errorStack: err?.stack || 'No stack',
      });
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
        logger.info('Background sync task unregistered');
      }
      this.isRegistered = false;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Failed to unregister background task:', {
        error: error,
        errorType: typeof error,
        errorConstructor: err?.constructor?.name,
        errorMessage: err?.message || 'No message',
        errorStack: err?.stack || 'No stack',
      });
    }
  }

  /**
   * Check for changes in content (bible and language data)
   */
  async checkForChanges(): Promise<boolean> {
    try {
      // Check for updates in bible content only
      // Language sync removed - using PowerSync and server-side fuzzy search instead
      const bibleUpdateCheck = await bibleSync.needsUpdate();

      return bibleUpdateCheck.needsUpdate;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error in checkForChanges:', {
        error: error,
        errorType: typeof error,
        errorConstructor: err?.constructor?.name,
        errorMessage: err?.message || 'No message',
        errorStack: err?.stack || 'No stack',
      });
      return false;
    }
  }

  /**
   * Check for remote changes in specific tables (legacy method for compatibility)
   */
  async hasRemoteChanges(tableName: string): Promise<boolean> {
    try {
      // Check which service should handle this table
      // Language tables removed - using PowerSync and server-side fuzzy search instead
      // All remaining tables are handled by bible sync
      return await bibleSync.hasRemoteChanges(tableName);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error checking for remote changes in ${tableName}:`, {
        error: error,
        errorType: typeof error,
        errorConstructor: err?.constructor?.name,
        errorMessage: err?.message || 'No message',
        errorStack: err?.stack || 'No stack',
      });
      return false;
    }
  }

  /**
   * Check for remote changes in multiple tables
   */
  async checkForRemoteChanges(): Promise<void> {
    try {
      // Language sync removed - using PowerSync and server-side fuzzy search instead
      const bibleUpdateCheck = await bibleSync.needsUpdate();

      const allChangedTables = [
        ...(bibleUpdateCheck.needsUpdate ? bibleUpdateCheck.tables : []),
      ];

      if (allChangedTables.length > 0) {
        logger.info('Remote changes detected in tables:', allChangedTables);
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error checking for remote changes:', {
        error: error,
        errorType: typeof error,
        errorConstructor: err?.constructor?.name,
        errorMessage: err?.message || 'No message',
        errorStack: err?.stack || 'No stack',
      });
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
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error getting background task status:', {
        error: error,
        errorType: typeof error,
        errorConstructor: err?.constructor?.name,
        errorMessage: err?.message || 'No message',
        errorStack: err?.stack || 'No stack',
      });
      return BackgroundTaskStatus.DENIED;
    }
  }

  async isTaskRegistered(): Promise<boolean> {
    try {
      const registeredTasks = await TaskManager.getRegisteredTasksAsync();
      return registeredTasks.some(
        task => task.taskName === BACKGROUND_SYNC_TASK
      );
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Error checking if task is registered:', {
        error: error,
        errorType: typeof error,
        errorConstructor: err?.constructor?.name,
        errorMessage: err?.message || 'No message',
        errorStack: err?.stack || 'No stack',
      });
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
      logger.info('Starting manual content sync...');

      // Language sync removed - using PowerSync and server-side fuzzy search instead
      const bibleUpdateCheck = await bibleSync.needsUpdate();

      let syncedContent = [];

      if (bibleUpdateCheck.needsUpdate) {
        await bibleSync.syncAll({ batchSize: 200 });
        syncedContent.push('Bible content');
      }

      if (syncedContent.length > 0) {
        const message = `Successfully synced: ${syncedContent.join(', ')}`;
        logger.info(message);

        // Refresh hasLocalData state after successful sync
        try {
          const { useSyncStore } = await import('@/shared/store/syncStore');
          await useSyncStore.getState().refreshHasLocalData();
        } catch (error) {
          logger.warn('Failed to refresh hasLocalData state:', error);
        }

        return { success: true, message };
      } else {
        const message = 'All content is already up to date';
        logger.info(message);
        return { success: true, message };
      }
    } catch (error: unknown) {
      const message = `Manual sync failed: ${error}`;
      logger.error(message);
      return { success: false, message };
    }
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance();
