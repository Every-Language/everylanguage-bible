import { StateCreator } from 'zustand';
import { languageService, userVersionsService } from '../../services';
import { logger } from '../../../../shared/utils/logger';

// Sync Slice State
export interface SyncState {
  lastSyncAt: string | null;
  syncInProgress: boolean;
  syncError: string | null;
}

// Sync Slice Actions
export interface SyncActions {
  syncWithCloud: () => Promise<void>;
  clearSyncError: () => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

// Combined slice type
export type SyncSlice = SyncState & SyncActions;

// Slice creator function
export const createSyncSlice: StateCreator<SyncSlice, [], [], SyncSlice> = (
  set,
  _get
) => ({
  // Initial state
  lastSyncAt: null,
  syncInProgress: false,
  syncError: null,

  // Actions
  syncWithCloud: async () => {
    try {
      set({ syncInProgress: true, syncError: null });

      // Sync language entities
      await languageService.syncLanguageEntities();

      // Sync saved versions
      await userVersionsService.syncSavedVersions();

      set({
        syncInProgress: false,
        lastSyncAt: new Date().toISOString(),
        syncError: null,
      });

      logger.info('Successfully synced with cloud');
    } catch (error) {
      logger.error('Error syncing with cloud:', error);
      set({
        syncInProgress: false,
        syncError: 'Failed to sync with cloud',
      });
      throw error;
    }
  },

  clearSyncError: () => {
    set({ syncError: null });
  },

  setSyncInProgress: (inProgress: boolean) => {
    set({ syncInProgress: inProgress });
  },
});
