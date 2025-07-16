import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { databaseManager } from '../services/database/DatabaseManager';
import { syncService, type SyncResult } from '../services/database/SyncService';
import { localDataService } from '../services/database/LocalDataService';
import { backgroundSyncService } from '../services/database/BackgroundSyncService';

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
  forceFFullSync: () => Promise<void>;
  resetSyncTimestamp: () => Promise<void>;
  clearLocalData: () => Promise<void>;
  getSyncMetadata: () => Promise<any[]>;
}

export interface SyncProgress {
  table: string;
  recordsSynced: number;
  totalRecords?: number;
  isComplete: boolean;
  error?: string;
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
      console.log('Initializing local database...');
      await databaseManager.initialize();

      // Initialize background sync service
      await backgroundSyncService.initialize();

      // Check if we have local data
      const dataAvailable = await localDataService.isDataAvailable();
      setHasLocalData(dataAvailable);

      // Get last sync time
      const lastSync = await localDataService.getLastSyncedAt();
      setLastSyncAt(lastSync);

      setIsInitialized(true);
      console.log('Database initialized successfully');

      // Auto-sync if no local data exists
      if (!dataAvailable) {
        console.log('No local data found, starting initial sync...');
        await syncNow();
      }

      // Register background sync after successful initialization
      try {
        await backgroundSyncService.registerBackgroundFetch();
        console.log('Background sync registered successfully');
      } catch (error) {
        console.warn('Failed to register background sync:', error);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }, [isInitialized]);

  const syncNow = useCallback(async () => {
    if (isSyncing || !isInitialized) return;

    try {
      setIsSyncing(true);

      // Reset progress
      setSyncProgress({
        table: 'Starting sync...',
        recordsSynced: 0,
        totalRecords: 0,
        isComplete: false,
      });

      const results = await syncService.syncAll();

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
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update local state
      const dataAvailable = await localDataService.isDataAvailable();
      setHasLocalData(dataAvailable);

      const lastSync = await localDataService.getLastSyncedAt();
      setLastSyncAt(lastSync);

      console.log('Sync completed:', results);
    } catch (error) {
      console.error('Sync failed:', error);
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

  const forceFFullSync = useCallback(async () => {
    if (isSyncing || !isInitialized) return;

    try {
      setIsSyncing(true);
      setSyncProgress({
        table: 'Force syncing all tables...',
        recordsSynced: 0,
        isComplete: false,
      });

      // Force full sync for all tables
      const tableNames = ['books', 'chapters', 'verses'];
      const results: any[] = [];

      for (const tableName of tableNames) {
        const result = await syncService.forceFullSync(tableName);
        results.push(result);

        const progress: SyncProgress = {
          table: result.tableName,
          recordsSynced: result.recordsSynced,
          isComplete: result.success,
        };
        if (result.error) {
          progress.error = result.error;
        }
        setSyncProgress(progress);

        // Small delay between tables
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Update local state
      const dataAvailable = await localDataService.isDataAvailable();
      setHasLocalData(dataAvailable);

      const lastSync = await localDataService.getLastSyncedAt();
      setLastSyncAt(lastSync);

      console.log('Force sync completed:', results);
    } catch (error) {
      console.error('Force sync failed:', error);
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
      // Reset sync timestamp for all tables
      await syncService.resetAllSyncMetadata();
      setLastSyncAt(null);
      console.log('Sync timestamp reset for all tables');
    } catch (error) {
      console.error('Failed to reset sync timestamp:', error);
    }
  }, [isInitialized]);

  const clearLocalData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      // Clear local data for all tables
      await syncService.clearLocalData('books');
      await syncService.clearLocalData('chapters');
      await syncService.clearLocalData('verses');
      setHasLocalData(false);
      setLastSyncAt(null);
      console.log('Local data cleared for all tables');
    } catch (error) {
      console.error('Failed to clear local data:', error);
    }
  }, [isInitialized]);

  const getSyncMetadata = useCallback(async () => {
    if (!isInitialized) return [];

    try {
      return await syncService.getSyncMetadata();
    } catch (error) {
      console.error('Failed to get sync metadata:', error);
      return [];
    }
  }, [isInitialized]);

  // Initialize database on mount
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, [initializeDatabase]);

  // Listen to sync events
  useEffect(() => {
    const unsubscribe = syncService.onSync((result: SyncResult) => {
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

  const value: SyncContextType = {
    isInitialized,
    isSyncing,
    syncProgress,
    lastSyncAt,
    hasLocalData,
    isConnected,
    connectionType,
    initializeDatabase,
    syncNow,
    forceFFullSync,
    resetSyncTimestamp,
    clearLocalData,
    getSyncMetadata,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
