import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { syncService } from './SyncService';
import { supabase } from '../api/supabase';

const BACKGROUND_SYNC_TASK = 'background-sync';

export class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private isRegistered = false;

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

    // Define the background task
    TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
      try {
        console.log('Background sync task executing...');

        // Check if there are any changes before syncing
        const hasChanges = await this.checkForChanges();

        if (hasChanges) {
          console.log('Changes detected, starting background sync...');
          await syncService.syncAll({ batchSize: 50 }); // Smaller batch size for background
          console.log('Background sync completed successfully');
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } else {
          console.log('No changes detected, skipping sync');
          return BackgroundFetch.BackgroundFetchResult.NoData;
        }
      } catch (error) {
        console.error('Background sync failed:', error);
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
        minimumInterval: 15 * 60 * 1000, // 15 minutes minimum
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background fetch registered successfully');
    } catch (error) {
      console.error('Failed to register background fetch:', error);
    }
  }

  async unregisterBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
      console.log('Background fetch unregistered');
    } catch (error) {
      console.error('Failed to unregister background fetch:', error);
    }
  }

  async checkForChanges(): Promise<boolean> {
    try {
      // Get the latest sync timestamp from local database
      const lastSync = await syncService.getLastSync('books');

      // Check if there are any records updated since last sync
      const { data, error } = await supabase
        .from('books')
        .select('id')
        .gt('updated_at', lastSync)
        .limit(1);

      if (error) {
        console.error('Error checking for changes:', error);
        return false; // Don't sync if we can't check for changes
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error in checkForChanges:', error);
      return false;
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
}

export const backgroundSyncService = BackgroundSyncService.getInstance();
