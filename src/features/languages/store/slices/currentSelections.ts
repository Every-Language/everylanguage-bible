import { StateCreator } from 'zustand';
import type { AudioVersion, TextVersion } from '../../types';
import { userVersionsService } from '../../services';
import VerseTextSyncService from '../../../../shared/services/sync/bible/VerseTextSyncService';

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
      .catch(error => {
        console.error('Error auto-persisting audio version:', error);
        set({ persistError: 'Failed to save audio version selection' });
      });
  },

  setCurrentTextVersion: (version: TextVersion | null) => {
    console.log(
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
        console.error('Error auto-persisting text version:', error);
        set({ persistError: 'Failed to save text version selection' });
      });

    // ✅ NEW: Trigger verse text sync for the new version
    if (version) {
      console.log('🏪 Store - Triggering verse text sync for:', version.name);
      get()
        .syncVerseTextsForCurrentVersion()
        .catch(error => {
          console.error('🏪 Store - Error syncing verse texts:', error);
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
      console.error('Error persisting current selections:', error);
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
      console.error('Error restoring current selections:', error);
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
    console.log(
      '🔄 Sync - syncVerseTextsForCurrentVersion called for:',
      currentTextVersion?.name || 'no version'
    );

    if (!currentTextVersion) {
      console.log('🔄 Sync - No current text version, skipping sync');
      return;
    }

    try {
      set({ isSyncingVerseTexts: true, verseTextSyncError: null });
      console.log('🔄 Sync - Starting verse text sync for:', {
        name: currentTextVersion.name,
        id: currentTextVersion.id,
        source: currentTextVersion.source,
      });

      const verseTextSyncService = VerseTextSyncService.getInstance();
      const versionType =
        currentTextVersion.source === 'text_version'
          ? 'text_version'
          : 'project';
      console.log('🔄 Sync - Using version type:', versionType);

      await verseTextSyncService.syncVerseTextsForVersion(
        currentTextVersion.id,
        versionType
      );

      set({
        isSyncingVerseTexts: false,
        lastVerseTextSync: new Date().toISOString(),
        verseTextSyncError: null,
      });

      console.log(
        `🔄 Sync - Successfully synced verse texts for ${currentTextVersion.name}`
      );
    } catch (error) {
      console.error('🔄 Sync - Failed to sync verse texts:', error);
      set({
        isSyncingVerseTexts: false,
        verseTextSyncError: 'Failed to sync verse texts',
      });
    }
  },

  clearVerseTextSyncError: () => {
    set({ verseTextSyncError: null });
  },
});
