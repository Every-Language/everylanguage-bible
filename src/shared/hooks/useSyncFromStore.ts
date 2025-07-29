import { useSyncStore } from '../store/syncStore';
import type { SyncProgress } from '../services/sync/types';

// Types for backward compatibility
export interface SyncContextType {
  isInitialized: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  lastSyncAt: string | null;
  hasLocalData: boolean;
  initializeDatabase: () => Promise<void>;
  syncNow: () => Promise<void>;
  forceFullSync: () => Promise<void>;
  resetSyncTimestamp: () => void;
  clearLocalData: () => Promise<void>;
  getSyncMetadata: () => Promise<Record<string, unknown>>;
  checkForUpdates: () => Promise<{ needsUpdate: boolean; tables: string[] }>;
  setOnboardingMode: (isOnboarding: boolean) => void;
}

/**
 * Hook that provides the same API as the old SyncContext
 * but uses the new Zustand store instead of React Context
 */
export const useSync = (): SyncContextType => {
  const {
    isInitialized,
    isSyncing,
    syncProgress,
    lastSyncAt,
    hasLocalData,
    initializeDatabase,
    syncNow,
    forceFullSync,
    resetSyncTimestamp,
    clearLocalData,
    getSyncMetadata,
    checkForUpdates,
    setOnboardingMode,
  } = useSyncStore();

  return {
    isInitialized,
    isSyncing,
    syncProgress,
    lastSyncAt,
    hasLocalData,
    initializeDatabase,
    syncNow,
    forceFullSync,
    resetSyncTimestamp,
    clearLocalData,
    getSyncMetadata,
    checkForUpdates,
    setOnboardingMode,
  };
};
