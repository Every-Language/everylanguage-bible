import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import { backgroundSyncService } from '../services/database/BackgroundSyncService';
import { syncService } from '../services/database/SyncService';
import { useSync } from '../context/SyncContext';

export interface BackgroundSyncState {
  isRegistered: boolean;
  status: BackgroundFetch.BackgroundFetchStatus;
  isEnabled: boolean;
  hasRemoteChanges: boolean;
}

export const useBackgroundSync = () => {
  const { isInitialized } = useSync(); // Add dependency on database initialization
  const [state, setState] = useState<BackgroundSyncState>({
    isRegistered: false,
    status: BackgroundFetch.BackgroundFetchStatus.Denied,
    isEnabled: false,
    hasRemoteChanges: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Initialize background sync
  useEffect(() => {
    const initializeBackgroundSync = async () => {
      try {
        setIsLoading(true);

        // Initialize the background sync service
        await backgroundSyncService.initialize();

        // Check current status
        const status = await backgroundSyncService.getBackgroundFetchStatus();
        const isRegistered = await backgroundSyncService.isTaskRegistered();
        const isEnabled =
          status === BackgroundFetch.BackgroundFetchStatus.Available;

        setState(prev => ({
          ...prev,
          status,
          isRegistered,
          isEnabled,
        }));

        // Auto-register if available
        if (isEnabled && !isRegistered) {
          await backgroundSyncService.registerBackgroundFetch();
          setState(prev => ({ ...prev, isRegistered: true }));
        }
      } catch (error) {
        console.error('Failed to initialize background sync:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeBackgroundSync();
  }, []);

  // Check for remote changes periodically - only after database is initialized
  useEffect(() => {
    if (!isInitialized) return; // Wait for database to be initialized

    const checkForChanges = async () => {
      try {
        const hasChanges = await syncService.hasRemoteChanges('books');
        setState(prev => ({ ...prev, hasRemoteChanges: hasChanges }));
      } catch (error) {
        console.error('Failed to check for remote changes:', error);
      }
    };

    // Check immediately
    checkForChanges();

    // Set up interval to check periodically (every 5 minutes when app is active)
    const interval = setInterval(checkForChanges, 5 * 60 * 1000);

    // Listen for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        checkForChanges();
      }
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      clearInterval(interval);
      appStateSubscription?.remove();
    };
  }, [isInitialized]); // Add isInitialized as dependency

  const enableBackgroundSync = async (): Promise<boolean> => {
    try {
      const status = await backgroundSyncService.getBackgroundFetchStatus();

      if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
        await backgroundSyncService.registerBackgroundFetch();
        const isRegistered = await backgroundSyncService.isTaskRegistered();

        setState(prev => ({
          ...prev,
          isRegistered,
          isEnabled: true,
        }));

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to enable background sync:', error);
      return false;
    }
  };

  const disableBackgroundSync = async (): Promise<boolean> => {
    try {
      await backgroundSyncService.unregisterBackgroundFetch();

      setState(prev => ({
        ...prev,
        isRegistered: false,
        isEnabled: false,
      }));

      return true;
    } catch (error) {
      console.error('Failed to disable background sync:', error);
      return false;
    }
  };

  const checkForRemoteChanges = async (): Promise<boolean> => {
    try {
      const hasChanges = await syncService.hasRemoteChanges('books');
      setState(prev => ({ ...prev, hasRemoteChanges: hasChanges }));
      return hasChanges;
    } catch (error) {
      console.error('Failed to check for remote changes:', error);
      return false;
    }
  };

  const getChangesSummary = async (): Promise<Record<string, boolean>> => {
    try {
      return await syncService.getRemoteChangesSummary(['books']);
    } catch (error) {
      console.error('Failed to get changes summary:', error);
      return {};
    }
  };

  return {
    ...state,
    isLoading,
    enableBackgroundSync,
    disableBackgroundSync,
    checkForRemoteChanges,
    getChangesSummary,
  };
};
