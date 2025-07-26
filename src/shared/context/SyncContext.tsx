import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { initializationService } from '../services/initialization/InitializationService';
import { bibleSync } from '../services/sync/bible/BibleSyncService';
import { localDataService } from '../services/database/LocalDataService';
import { backgroundSyncService } from '../services/sync/BackgroundSyncService';
import type { SyncResult, SyncProgress } from '../services/sync/types';
import { logger } from '../utils/logger';

export interface SyncContextType {
  isInitialized: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  lastSyncAt: string | null;
  hasLocalData: boolean;
  isConnected: boolean;
  connectionType: string | null;
  initializeDatabase: () => Promise<void>;
  syncNow: () => Promise<void>;
  forceFullSync: () => Promise<void>;
  resetSyncTimestamp: () => Promise<void>;
  clearLocalData: () => Promise<void>;
  getSyncMetadata: () => Promise<unknown[]>;
  checkForUpdates: () => Promise<{ needsUpdate: boolean; tables: string[] }>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: React.ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  // Network connectivity monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type);
    });

    return unsubscribe;
  }, []);

  const initializeDatabase = useCallback(async () => {
    if (isInitialized) return;

    try {
      logger.info('Starting app initialization...');

      // Use the centralized initialization service
      await initializationService.initialize();

      // Check if we have local data
      const dataAvailable = await localDataService.isDataAvailable();
      setHasLocalData(dataAvailable);

      // Get last sync time
      const lastSync = await localDataService.getLastSyncedAt();
      setLastSyncAt(lastSync);

      setIsInitialized(true);
      logger.info('App initialization completed successfully');

      // For bible content, we can be more conservative about auto-syncing
      // Only auto-sync if no local data exists or if explicitly needed
      if (!dataAvailable) {
        logger.info('No local data found, starting initial sync...');
        await syncNow();
      } else {
        // Check for updates in background without forcing sync
        logger.info('Checking for bible content updates...');
        await checkForUpdates();
      }

      // Register background sync after successful initialization
      try {
        await backgroundSyncService.registerBackgroundTask();
        logger.info('Background sync registered successfully');
      } catch (error: unknown) {
        logger.warn('Failed to register background sync:', {
          error: error,
          errorType: typeof error,
          errorConstructor: (error as any)?.constructor?.name,
          errorMessage: (error as any)?.message || 'No message',
          errorStack: (error as any)?.stack || 'No stack',
        });
      }
    } catch (error) {
      logger.error('Failed to initialize app:', error);
      throw error;
    }
  }, [isInitialized]);

  const checkForUpdates = useCallback(async (): Promise<{
    needsUpdate: boolean;
    tables: string[];
  }> => {
    if (!isInitialized) {
      return { needsUpdate: false, tables: [] };
    }

    try {
      const updateCheck = await bibleSync.needsUpdate();
      if (updateCheck.needsUpdate) {
        logger.info('Bible content updates available for:', updateCheck.tables);
      } else {
        logger.info('Bible content is up to date');
      }
      return updateCheck;
    } catch (error) {
      logger.error('Failed to check for updates:', error);
      return { needsUpdate: false, tables: [] };
    }
  }, [isInitialized]);

  const syncNow = useCallback(async () => {
    if (isSyncing || !isInitialized) return;

    try {
      setIsSyncing(true);

      // Reset progress
      setSyncProgress({
        table: 'Checking for updates...',
        recordsSynced: 0,
        totalRecords: 0,
        isComplete: false,
      });

      const results = await bibleSync.syncAll();

      // Process results and update progress for each table
      let totalSynced = 0;
      for (const result of results) {
        totalSynced += result.recordsSynced;
        const progress: SyncProgress = {
          table: result.tableName,
          recordsSynced: result.recordsSynced,
          totalRecords: totalSynced,
          isComplete: result.success,
        };
        if (result.error) {
          progress.error = result.error;
        }
        setSyncProgress(progress);

        // Small delay to show progress for each table
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Update local state
      const dataAvailable = await localDataService.isDataAvailable();
      setHasLocalData(dataAvailable);

      const lastSync = await localDataService.getLastSyncedAt();
      setLastSyncAt(lastSync);

      logger.info('Bible sync completed:', results);
    } catch (error) {
      logger.error('Bible sync failed:', error);
      setSyncProgress({
        table: 'Sync failed',
        recordsSynced: 0,
        totalRecords: 0,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSyncing(false);
      // Clear progress after a delay
      setTimeout(() => setSyncProgress(null), 3000);
    }
  }, [isSyncing, isInitialized]);

  const forceFullSync = useCallback(async () => {
    if (isSyncing || !isInitialized) return;

    try {
      setIsSyncing(true);
      setSyncProgress({
        table: 'Force syncing all bible content...',
        recordsSynced: 0,
        isComplete: false,
      });

      const results = await bibleSync.forceFullSync();

      let totalSynced = 0;
      for (const result of results) {
        totalSynced += result.recordsSynced;
        const progress: SyncProgress = {
          table: result.tableName,
          recordsSynced: result.recordsSynced,
          totalRecords: totalSynced,
          isComplete: result.success,
        };
        if (result.error) {
          progress.error = result.error;
        }
        setSyncProgress(progress);

        // Small delay between tables
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Update local state
      const dataAvailable = await localDataService.isDataAvailable();
      setHasLocalData(dataAvailable);

      const lastSync = await localDataService.getLastSyncedAt();
      setLastSyncAt(lastSync);

      logger.info('Force sync completed:', results);
    } catch (error) {
      logger.error('Force sync failed:', error);
      setSyncProgress({
        table: 'Force sync failed',
        recordsSynced: 0,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncProgress(null), 3000);
    }
  }, [isSyncing, isInitialized]);

  const resetSyncTimestamp = useCallback(async () => {
    if (!isInitialized) return;

    try {
      // Reset sync timestamp for all bible tables
      await bibleSync.resetSyncMetadata();
      setLastSyncAt(null);
      logger.info('Sync timestamp reset for all bible tables');
    } catch (error) {
      logger.error('Failed to reset sync timestamp:', error);
    }
  }, [isInitialized]);

  const clearLocalData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      // Clear local data for all bible tables
      await bibleSync.clearLocalData();
      setHasLocalData(false);
      setLastSyncAt(null);
      logger.info('Local bible data cleared');
    } catch (error) {
      logger.error('Failed to clear local data:', error);
    }
  }, [isInitialized]);

  const getSyncMetadata = useCallback(async () => {
    if (!isInitialized) return [];

    try {
      return await bibleSync.getSyncMetadata();
    } catch (error) {
      logger.error('Failed to get sync metadata:', error);
      return [];
    }
  }, [isInitialized]);

  // Initialize database on mount
  useEffect(() => {
    initializeDatabase().catch(error => {
      logger.error('Failed to initialize database:', error);
    });
  }, [initializeDatabase]);

  // Listen to sync events
  useEffect(() => {
    const unsubscribe = bibleSync.onSync((result: SyncResult) => {
      const progress: SyncProgress = {
        table: result.tableName,
        recordsSynced: result.recordsSynced,
        isComplete: result.success,
      };
      if (result.error) {
        progress.error = result.error;
      }
      setSyncProgress(progress);
    });

    return unsubscribe;
  }, []);

  // ✅ PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  const value: SyncContextType = useMemo(
    () => ({
      isInitialized,
      isSyncing,
      syncProgress,
      lastSyncAt,
      hasLocalData,
      isConnected,
      connectionType,
      initializeDatabase,
      syncNow,
      forceFullSync,
      resetSyncTimestamp,
      clearLocalData,
      getSyncMetadata,
      checkForUpdates,
    }),
    [
      isInitialized,
      isSyncing,
      syncProgress,
      lastSyncAt,
      hasLocalData,
      isConnected,
      connectionType,
      initializeDatabase,
      syncNow,
      forceFullSync,
      resetSyncTimestamp,
      clearLocalData,
      getSyncMetadata,
      checkForUpdates,
    ]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
