import { useSyncStore } from '../store/syncStore';
import type { SyncProgress } from '../services/sync/types';

// Types for backward compatibility
export interface SyncContextType {
  isInitialized: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  lastSyncAt: string | null;
  hasLocalData: boolean;
  error: string | null;
  initializeDatabase: () => Promise<void>;
  syncNow: () => Promise<void>;
  forceFullSync: () => Promise<void>;
  resetSyncTimestamp: () => void;
  clearLocalData: () => Promise<void>;
  getSyncMetadata: () => Promise<unknown>;
  checkForUpdates: () => Promise<{ needsUpdate: boolean; tables: string[] }>;
  setOnboardingMode: (isOnboarding: boolean) => void;
  refreshHasLocalData: () => Promise<void>;
  clearError: () => void;
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
    error,
    initializeDatabase,
    syncNow,
    forceFullSync,
    resetSyncTimestamp,
    clearLocalData,
    getSyncMetadata,
    checkForUpdates,
    setOnboardingMode,
    refreshHasLocalData,
    clearError,
  } = useSyncStore();

  return {
    isInitialized,
    isSyncing,
    syncProgress,
    lastSyncAt,
    hasLocalData,
    error,
    initializeDatabase,
    syncNow,
    forceFullSync,
    resetSyncTimestamp,
    clearLocalData,
    getSyncMetadata,
    checkForUpdates,
    setOnboardingMode,
    refreshHasLocalData,
    clearError,
  };
};
