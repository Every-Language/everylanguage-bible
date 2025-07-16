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
        // Check if there are any changes before syncing
        const hasChanges = await this.checkForChanges();

        if (hasChanges) {
          await syncService.syncAll({ batchSize: 50 }); // Smaller batch size for background
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } else {
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
        return;
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60 * 1000, // 15 minutes minimum
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Failed to register background fetch:', error);
    }
  }

  async unregisterBackgroundFetch(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    } catch (error) {
      console.error('Failed to unregister background fetch:', error);
    }
  }

  async checkForChanges(): Promise<boolean> {
    try {
      // Check for changes in books table
      const booksLastSync = await syncService.getLastSync('books');
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('id')
        .gt('updated_at', booksLastSync)
        .limit(1);

      if (booksError) {
        console.error('Error checking for books changes:', booksError);
        return false; // Don't sync if we can't check for changes
      }

      if (booksData && booksData.length > 0) {
        return true;
      }

      // Check for changes in chapters table
      const chaptersLastSync = await syncService.getLastSync('chapters');
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('id')
        .gt('updated_at', chaptersLastSync)
        .limit(1);

      if (chaptersError) {
        console.error('Error checking for chapters changes:', chaptersError);
        return false; // Don't sync if we can't check for changes
      }

      if (chaptersData && chaptersData.length > 0) {
        return true;
      }

      // Check for changes in verses table
      const versesLastSync = await syncService.getLastSync('verses');
      const { data: versesData, error: versesError } = await supabase
        .from('verses')
        .select('id')
        .gt('updated_at', versesLastSync)
        .limit(1);

      if (versesError) {
        console.error('Error checking for verses changes:', versesError);
        return false; // Don't sync if we can't check for changes
      }

      return versesData && versesData.length > 0;
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
