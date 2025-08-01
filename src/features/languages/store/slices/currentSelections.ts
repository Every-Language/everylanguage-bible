import { StateCreator } from 'zustand';
import { userVersionsService } from '../../services/domain/userVersionsService';
import VerseTextSyncService from '../../../../shared/services/sync/bible/VerseTextSyncService';
import type { AudioVersion, TextVersion } from '../../types/entities';
import { logger } from '../../../../shared/utils/logger';

// Current Selections Slice State
export interface CurrentSelectionsState {
  currentAudioVersion: AudioVersion | null;
  currentTextVersion: TextVersion | null;
  isPersisting: boolean;
  persistError: string | null;
  // ✅ NEW: Verse text sync state
  isSyncingVerseTexts: boolean;
  lastVerseTextSync: string | null;
  verseTextSyncError: string | null;
}

// Current Selections Slice Actions
export interface CurrentSelectionsActions {
  setCurrentAudioVersion: (version: AudioVersion | null) => void;
  setCurrentTextVersion: (version: TextVersion | null) => void;
  persistCurrentSelections: () => Promise<void>;
  restoreCurrentSelections: () => Promise<void>;
  clearPersistError: () => void;
  // ✅ NEW: Verse text sync actions
  syncVerseTextsForCurrentVersion: () => Promise<void>;
  clearVerseTextSyncError: () => void;
}

// Combined slice type
export type CurrentSelectionsSlice = CurrentSelectionsState &
  CurrentSelectionsActions;

// Slice creator function
export const createCurrentSelectionsSlice: StateCreator<
  CurrentSelectionsSlice,
  [],
  [],
  CurrentSelectionsSlice
> = (set, get) => ({
  // Initial state
  currentAudioVersion: null,
  currentTextVersion: null,
  isPersisting: false,
  persistError: null,
  // ✅ NEW: Initialize verse text sync state
  isSyncingVerseTexts: false,
  lastVerseTextSync: null,
  verseTextSyncError: null,

  // Actions
  setCurrentAudioVersion: (version: AudioVersion | null) => {
    set({ currentAudioVersion: version, persistError: null });

    // Auto-persist when version changes
    get()
      .persistCurrentSelections()
      .catch(_error => {
        // logger.error('Error auto-persisting audio version:', _error);
        set({ persistError: 'Failed to save audio version selection' });
      });
  },

  setCurrentTextVersion: (version: TextVersion | null) => {
    logger.log(
      '🏪 Store - setCurrentTextVersion called with:',
      version?.name || 'null'
    );
    set({
      currentTextVersion: version,
      persistError: null,
      verseTextSyncError: null,
    });

    // Auto-persist when version changes
    get()
      .persistCurrentSelections()
      .catch(error => {
        logger.error('Error auto-persisting text version:', error);
        set({ persistError: 'Failed to save text version selection' });
      });

    // ✅ NEW: Trigger verse text sync for the new version
    if (version) {
      logger.log('🏪 Store - Triggering verse text sync for:', version.name);
      get()
        .syncVerseTextsForCurrentVersion()
        .catch(error => {
          logger.error('🏪 Store - Error syncing verse texts:', error);
        });
    }
  },

  persistCurrentSelections: async () => {
    try {
      set({ isPersisting: true, persistError: null });

      const { currentAudioVersion, currentTextVersion } = get();
      await userVersionsService.saveCurrentSelections(
        currentAudioVersion,
        currentTextVersion
      );

      set({ isPersisting: false });
    } catch (error) {
      logger.error('Error persisting current selections:', error);
      set({
        isPersisting: false,
        persistError: 'Failed to save current selections',
      });
      throw error;
    }
  },

  restoreCurrentSelections: async () => {
    try {
      set({ isPersisting: true, persistError: null });

      const selections = await userVersionsService.getCurrentSelections();
      set({
        currentAudioVersion: selections.audio,
        currentTextVersion: selections.text,
        isPersisting: false,
      });
    } catch (error) {
      logger.error('Error restoring current selections:', error);
      set({
        isPersisting: false,
        persistError: 'Failed to restore current selections',
      });
      throw error;
    }
  },

  clearPersistError: () => {
    set({ persistError: null });
  },

  // ✅ NEW: Verse text sync actions
  syncVerseTextsForCurrentVersion: async () => {
    const { currentTextVersion } = get();
    logger.log(
      '🔄 Sync - syncVerseTextsForCurrentVersion called for:',
      currentTextVersion?.name || 'no version'
    );

    if (!currentTextVersion) {
      logger.log('🔄 Sync - No current text version, skipping sync');
      return;
    }

    try {
      set({ isSyncingVerseTexts: true, verseTextSyncError: null });
      logger.log('🔄 Sync - Starting verse text sync for:', {
        name: currentTextVersion.name,
        id: currentTextVersion.id,
        source: currentTextVersion.source,
      });

      const verseTextSyncService = VerseTextSyncService.getInstance();

      await verseTextSyncService.syncVerseTextsForVersion(
        currentTextVersion.id
      );

      set({
        isSyncingVerseTexts: false,
        lastVerseTextSync: new Date().toISOString(),
        verseTextSyncError: null,
      });

      logger.log(
        `🔄 Sync - Successfully synced verse texts for ${currentTextVersion.name}`
      );
    } catch (error) {
      logger.error('🔄 Sync - Failed to sync verse texts:', error);

      // Check if this is a database transaction error that we can fix
      const errorMessage = error instanceof Error ? error.message : '';
      const isTransactionError =
        errorMessage.includes('TRANSACTION_FAILED') ||
        errorMessage.includes('ERR_INTERNAL_SQLITE_ERROR') ||
        errorMessage.includes('SINGLE_QUERY_FAILED');

      if (isTransactionError) {
        logger.warn(
          '🔄 Sync - Detected database transaction error, attempting emergency fix...'
        );

        try {
          const verseTextSyncService = VerseTextSyncService.getInstance();
          const fixResult =
            await verseTextSyncService.emergencyFixTransactionError();

          if (fixResult.success) {
            logger.info('🔄 Sync - Emergency fix successful, retrying sync...');

            // Retry the sync after the fix
            await verseTextSyncService.syncVerseTextsForVersion(
              currentTextVersion.id
            );

            set({
              isSyncingVerseTexts: false,
              lastVerseTextSync: new Date().toISOString(),
              verseTextSyncError: null,
            });

            logger.log(
              `🔄 Sync - Successfully synced verse texts for ${currentTextVersion.name} after emergency fix`
            );
            return;
          } else {
            logger.error('🔄 Sync - Emergency fix failed:', fixResult.message);
            set({
              isSyncingVerseTexts: false,
              verseTextSyncError: `Database error: ${fixResult.message}`,
            });
          }
        } catch (fixError) {
          logger.error('🔄 Sync - Emergency fix attempt failed:', fixError);
          set({
            isSyncingVerseTexts: false,
            verseTextSyncError: 'Database error: Emergency fix failed',
          });
        }
      } else {
        // Regular error handling
        set({
          isSyncingVerseTexts: false,
          verseTextSyncError: 'Failed to sync verse texts',
        });
      }
    }
  },

  clearVerseTextSyncError: () => {
    set({ verseTextSyncError: null });
  },
});
