import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { bibleSync } from './bible/BibleSyncService';
import { languageSync } from './language/LanguageSyncService';

const BACKGROUND_SYNC_TASK = 'background-content-sync';

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
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } else {
          console.log('Background sync: All content is up to date');
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
        minimumInterval: 4 * 60 * 60 * 1000, // Check every 4 hours for content updates
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background content sync registered successfully');
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
