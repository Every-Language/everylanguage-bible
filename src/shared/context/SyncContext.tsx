import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { databaseManager } from '../services/database/DatabaseManager';
import { syncService, type SyncResult } from '../services/database/SyncService';
import { localDataService } from '../services/database/LocalDataService';

export interface SyncContextType {
  isInitialized: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  lastSyncAt: string | null;
  hasLocalData: boolean;
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

  const initializeDatabase = useCallback(async () => {
    if (isInitialized) return;

    try {
      console.log('Initializing local database...');
      await databaseManager.initialize();
      
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
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }, [isInitialized]);

  const syncNow = useCallback(async () => {
    if (isSyncing || !isInitialized) return;

    try {
      setIsSyncing(true);
      setSyncProgress({ table: 'books', recordsSynced: 0, isComplete: false });

      const results = await syncService.syncAll();
      
      for (const result of results) {
        const progress: SyncProgress = {
          table: result.tableName,
          recordsSynced: result.recordsSynced,
          isComplete: result.success,
        };
        if (result.error) {
          progress.error = result.error;
        }
        setSyncProgress(progress);
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
        table: 'unknown',
        recordsSynced: 0,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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
      setSyncProgress({ table: 'books', recordsSynced: 0, isComplete: false });

      const result = await syncService.forceFullSync('books');
      
      const progress: SyncProgress = {
        table: result.tableName,
        recordsSynced: result.recordsSynced,
        isComplete: result.success,
      };
      if (result.error) {
        progress.error = result.error;
      }
      setSyncProgress(progress);

      // Update local state
      const dataAvailable = await localDataService.isDataAvailable();
      setHasLocalData(dataAvailable);
      
      const lastSync = await localDataService.getLastSyncedAt();
      setLastSyncAt(lastSync);

    } catch (error) {
      console.error('Force sync failed:', error);
      setSyncProgress({
        table: 'books',
        recordsSynced: 0,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncProgress(null), 3000);
    }
  }, [isSyncing, isInitialized]);

  const resetSyncTimestamp = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await syncService.resetSyncTimestamp('books');
      setLastSyncAt(null);
      console.log('Sync timestamp reset');
    } catch (error) {
      console.error('Failed to reset sync timestamp:', error);
    }
  }, [isInitialized]);

  const clearLocalData = useCallback(async () => {
    if (!isInitialized) return;

    try {
      await syncService.clearLocalData('books');
      setHasLocalData(false);
      setLastSyncAt(null);
      console.log('Local data cleared');
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
    initializeDatabase,
    syncNow,
    forceFFullSync,
    resetSyncTimestamp,
    clearLocalData,
    getSyncMetadata
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}; 