import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all slices
import {
  createCurrentSelectionsSlice,
  type CurrentSelectionsSlice,
} from './slices/currentSelections';
import {
  createSavedVersionsSlice,
  type SavedVersionsSlice,
} from './slices/savedVersions';
import {
  createLanguageHierarchySlice,
  type LanguageHierarchySlice,
} from './slices/languageHierarchy';
import { createSyncSlice, type SyncSlice } from './slices/sync';
import { logger } from '../../../shared/utils/logger';

// Combined store type
export type CombinedLanguageSelectionStore = CurrentSelectionsSlice &
  SavedVersionsSlice &
  LanguageHierarchySlice &
  SyncSlice;

// Create the combined store
export const useCombinedLanguageSelectionStore =
  create<CombinedLanguageSelectionStore>()(
    persist(
      (...a) => ({
        ...createCurrentSelectionsSlice(...a),
        ...createSavedVersionsSlice(...a),
        ...createLanguageHierarchySlice(...a),
        ...createSyncSlice(...a),
      }),
      {
        name: 'language-selection-store-v2',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist current selections and UI state for performance
        partialize: state => ({
          currentAudioVersion: state.currentAudioVersion,
          currentTextVersion: state.currentTextVersion,
          expandedNodes: Array.from(state.expandedNodes || new Set()), // Convert Set to Array for serialization
          searchQuery: state.searchQuery,
          lastSyncAt: state.lastSyncAt,
        }),
        // Ensure proper state restoration
        onRehydrateStorage: () => state => {
          if (state && Array.isArray(state.expandedNodes)) {
            state.expandedNodes = new Set(state.expandedNodes);
          } else if (state && !state.expandedNodes) {
            state.expandedNodes = new Set();
          }
        },
      }
    )
  );

// Initialize store on app start
export const initializeCombinedLanguageSelectionStore = async () => {
  const store = useCombinedLanguageSelectionStore.getState();

  try {
    // Restore current selections
    await store.restoreCurrentSelections();

    // Load saved versions
    await store.loadSavedVersions();

    // Load language hierarchy if not already loaded
    if (store.languageHierarchy.length === 0) {
      await store.loadLanguageHierarchy();
    }

    logger.info('Combined language selection store initialized successfully');
  } catch (error) {
    logger.error(
      'Error initializing combined language selection store:',
      error
    );
    // Set error in appropriate slice
    if (store.clearPersistError) store.clearPersistError();
    if (store.clearVersionsError) store.clearVersionsError();
    if (store.clearHierarchyError) store.clearHierarchyError();
    if (store.clearSyncError) store.clearSyncError();
  }
};

// Backward compatibility wrapper that provides the same interface as the old store
export const useLanguageSelectionStore = useCombinedLanguageSelectionStore;

export default useCombinedLanguageSelectionStore;
