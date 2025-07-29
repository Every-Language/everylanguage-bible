import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializationService } from '../services/initialization/InitializationService';
import { bibleSync } from '../services/sync/bible/BibleSyncService';
import { localDataService } from '../services/database/LocalDataService';

import type { SyncProgress } from '../services/sync/types';
import { logger } from '../utils/logger';

// Types
export interface SyncState {
  isInitialized: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  lastSyncAt: string | null;
  hasLocalData: boolean;
  isOnboardingMode: boolean;
  error: string | null;
}

export interface SyncStore extends SyncState {
  // State setters
  setInitialized: (initialized: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: SyncProgress | null) => void;
  setLastSyncAt: (timestamp: string | null) => void;
  setHasLocalData: (hasData: boolean) => void;
  setOnboardingMode: (isOnboarding: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Actions
  initializeDatabase: () => Promise<void>;
  syncNow: () => Promise<void>;
  forceFullSync: () => Promise<void>;
  resetSyncTimestamp: () => void;
  clearLocalData: () => Promise<void>;
  getSyncMetadata: () => Promise<unknown>;
  checkForUpdates: () => Promise<{ needsUpdate: boolean; tables: string[] }>;
}

// Store
export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isInitialized: false,
      isSyncing: false,
      syncProgress: null,
      lastSyncAt: null,
      hasLocalData: false,
      isOnboardingMode: false,
      error: null,

      // State setters
      setInitialized: initialized => {
        set({ isInitialized: initialized, error: null });
      },

      setSyncing: syncing => {
        set({ isSyncing: syncing });
      },

      setSyncProgress: progress => {
        set({ syncProgress: progress });
      },

      setLastSyncAt: timestamp => {
        set({ lastSyncAt: timestamp });
      },

      setHasLocalData: hasData => {
        set({ hasLocalData: hasData });
      },

      setOnboardingMode: isOnboarding => {
        logger.info(`Setting onboarding mode: ${isOnboarding}`);
        set({ isOnboardingMode: isOnboarding });
      },

      setError: error => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Actions
      initializeDatabase: async () => {
        const { setInitialized, setError } = get();

        try {
          logger.info('SyncStore: Initializing database...');
          setError(null);

          await initializationService.initialize();

          // Check if we have local data
          const hasData = await localDataService.isDataAvailable();
          get().setHasLocalData(hasData);

          setInitialized(true);
          logger.info('SyncStore: Database initialized successfully');
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          logger.error('SyncStore: Database initialization failed:', error);
          setError(errorMessage);
          throw error;
        }
      },

      syncNow: async () => {
        const { setSyncing, setSyncProgress, setError, isInitialized } = get();

        if (!isInitialized) {
          throw new Error('Database not initialized');
        }

        try {
          logger.info('SyncStore: Starting sync...');
          setError(null);
          setSyncing(true);
          setSyncProgress({
            table: 'books',
            recordsSynced: 0,
            totalRecords: 0,
            isComplete: false,
          });

          await bibleSync.syncAll();

          // Update last sync time
          const lastSync = await localDataService.getLastSyncedAt();
          set({ lastSyncAt: lastSync });

          logger.info('SyncStore: Sync completed successfully');
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          logger.error('SyncStore: Sync failed:', error);
          setError(errorMessage);
          throw error;
        } finally {
          setSyncing(false);
          setSyncProgress(null);
        }
      },

      forceFullSync: async () => {
        const { setSyncing, setSyncProgress, setError, isInitialized } = get();

        if (!isInitialized) {
          throw new Error('Database not initialized');
        }

        try {
          logger.info('SyncStore: Starting force full sync...');
          setError(null);
          setSyncing(true);
          setSyncProgress({
            table: 'books',
            recordsSynced: 0,
            totalRecords: 0,
            isComplete: false,
          });

          await bibleSync.forceFullSync();

          // Update last sync time
          const lastSync = await localDataService.getLastSyncedAt();
          set({ lastSyncAt: lastSync });

          logger.info('SyncStore: Force full sync completed successfully');
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          logger.error('SyncStore: Force full sync failed:', error);
          setError(errorMessage);
          throw error;
        } finally {
          setSyncing(false);
          setSyncProgress(null);
        }
      },

      resetSyncTimestamp: () => {
        set({ lastSyncAt: null });
        logger.info('SyncStore: Sync timestamp reset');
      },

      clearLocalData: async () => {
        const { setHasLocalData, setInitialized } = get();

        try {
          logger.info('SyncStore: Clearing local data...');
          await bibleSync.clearLocalData();
          setHasLocalData(false);
          setInitialized(false);
          logger.info('SyncStore: Local data cleared successfully');
        } catch (error) {
          logger.error('SyncStore: Failed to clear local data:', error);
          throw error;
        }
      },

      getSyncMetadata: async () => {
        try {
          return await bibleSync.getSyncMetadata();
        } catch (error) {
          logger.error('SyncStore: Failed to get sync metadata:', error);
          throw error;
        }
      },

      checkForUpdates: async () => {
        const { isInitialized } = get();

        if (!isInitialized) {
          return { needsUpdate: false, tables: [] };
        }

        try {
          return await bibleSync.needsUpdate();
        } catch (error) {
          logger.error('SyncStore: Failed to check for updates:', error);
          return { needsUpdate: false, tables: [] };
        }
      },
    }),
    {
      name: 'sync-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential state, not loading/error states
      partialize: state => ({
        isInitialized: state.isInitialized,
        lastSyncAt: state.lastSyncAt,
        hasLocalData: state.hasLocalData,
        isOnboardingMode: state.isOnboardingMode,
      }),
    }
  )
);

// Initialize sync store
export const initializeSyncStore = async () => {
  const store = useSyncStore.getState();

  try {
    // Subscribe to network changes
    // const unsubscribe = store.subscribeToNetworkChanges(); // This line is removed

    // Initialize database if not already initialized
    if (!store.isInitialized) {
      await store.initializeDatabase();
    }

    // Return cleanup function
    return () => {}; // Return empty cleanup function
  } catch (error) {
    logger.error('Failed to initialize sync store:', error);
    return () => {}; // Return empty cleanup function
  }
};
