import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { bibleSync } from './bible/BibleSyncService';

const BACKGROUND_SYNC_TASK = 'background-bible-sync';

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
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }
        this.lastBackgroundCheck = now;

        // For bible content, we can be more conservative
        // First check if there are any changes before syncing
        const updateCheck = await bibleSync.needsUpdate();

        if (updateCheck.needsUpdate) {
          console.log('Background sync: Bible content updates detected');
          // Use smaller batch size for background sync
          await bibleSync.syncAll({ batchSize: 100 });
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } else {
          console.log('Background sync: Bible content is up to date');
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }
      } catch (error) {
        console.error('Background bible sync failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    this.isRegistered = true;
  }

  async registerBackgroundFetch(): Promise<void> {
    try {
      await this.initialize();

      const status = await BackgroundFetch.getStatusAsync();

      if (
        status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
        status === BackgroundFetch.BackgroundFetchStatus.Denied
      ) {
        console.warn('Background fetch is restricted or denied');
        return;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 4 * 60 * 60 * 1000, // Check every 4 hours for bible content (less frequent)
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background bible sync registered successfully');
    } catch (error) {
      console.error('Failed to register background fetch:', error);
    }
  }

  async unregisterBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      this.isRegistered = false;
    } catch (error) {
      console.error('Failed to unregister background fetch:', error);
    }
  }

  /**
   * Check for changes in bible content (optimized for rarely changing data)
   */
  async checkForChanges(): Promise<boolean> {
    try {
      // Use the optimized needsUpdate method from BibleSyncService
      const updateCheck = await bibleSync.needsUpdate();
      return updateCheck.needsUpdate;
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
      return await bibleSync.hasRemoteChanges(tableName);
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
      const updateCheck = await bibleSync.needsUpdate();
      if (updateCheck.needsUpdate) {
        console.log('Remote changes detected in tables:', updateCheck.tables);
      }
    } catch (error) {
      console.error('Error checking for remote changes:', error);
    }
  }

  async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus> {
    const status = await BackgroundFetch.getStatusAsync();
    return status ?? BackgroundFetch.BackgroundFetchStatus.Denied;
  }

  async isTaskRegistered(): Promise<boolean> {
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();
    return registeredTasks.some(task => task.taskName === BACKGROUND_SYNC_TASK);
  }

  /**
   * Get enabled status for use in UI
   */
  get isEnabled(): boolean {
    return this.isRegistered;
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance();
