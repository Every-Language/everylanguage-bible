import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import { backgroundSyncService } from '../services/sync/BackgroundSyncService';
import { bibleSync } from '../services/sync/bible/BibleSyncService';
import { useSync } from '../context/SyncContext';

export interface BackgroundSyncState {
  isRegistered: boolean;
  status: BackgroundFetch.BackgroundFetchStatus;
  isEnabled: boolean;
  hasRemoteChanges: boolean;
  lastUpdateCheck?: string;
}

export const useBackgroundSync = () => {
  const { isInitialized } = useSync();
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
        const isEnabled = backgroundSyncService.isEnabled;

        setState(prev => ({
          ...prev,
          status,
          isRegistered,
          isEnabled,
        }));

        // Auto-register if available
        if (
          status === BackgroundFetch.BackgroundFetchStatus.Available &&
          !isRegistered
        ) {
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

  // Check for remote changes periodically - optimized for bible content
  useEffect(() => {
    if (!isInitialized) return;

    const checkForChanges = async () => {
      try {
        // Use the optimized needsUpdate method for bible content
        const updateCheck = await bibleSync.needsUpdate();
        setState(prev => ({
          ...prev,
          hasRemoteChanges: updateCheck.needsUpdate,
          lastUpdateCheck: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Failed to check for remote changes:', error);
      }
    };

    // Check immediately
    checkForChanges();

    // For bible content, check less frequently (every 30 minutes when app is active)
    const interval = setInterval(checkForChanges, 30 * 60 * 1000);

    // Listen for app state changes
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        // Check for updates when app becomes active
        setTimeout(checkForChanges, 1000); // Small delay to ensure app is fully active
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
  }, [isInitialized]);

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

      console.warn('Background fetch is not available:', status);
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
      const updateCheck = await bibleSync.needsUpdate();
      setState(prev => ({
        ...prev,
        hasRemoteChanges: updateCheck.needsUpdate,
        lastUpdateCheck: new Date().toISOString(),
      }));
      return updateCheck.needsUpdate;
    } catch (error) {
      console.error('Failed to check for remote changes:', error);
      return false;
    }
  };

  const getChangesSummary = async (): Promise<{
    needsUpdate: boolean;
    tables: string[];
  }> => {
    try {
      return await bibleSync.needsUpdate();
    } catch (error) {
      console.error('Failed to get changes summary:', error);
      return { needsUpdate: false, tables: [] };
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
