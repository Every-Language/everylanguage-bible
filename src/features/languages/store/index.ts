// Export the new slice-based combined store
export {
  useCombinedLanguageSelectionStore,
  initializeCombinedLanguageSelectionStore,
  type CombinedLanguageSelectionStore,
} from './combinedStore';

// Export individual slices for direct use if needed
export {
  createCurrentSelectionsSlice,
  type CurrentSelectionsSlice,
  type CurrentSelectionsState,
  type CurrentSelectionsActions,
} from './slices/currentSelections';

export {
  createSavedVersionsSlice,
  type SavedVersionsSlice,
  type SavedVersionsState,
  type SavedVersionsActions,
} from './slices/savedVersions';

export {
  createLanguageHierarchySlice,
  type LanguageHierarchySlice,
  type LanguageHierarchyState,
  type LanguageHierarchyActions,
} from './slices/languageHierarchy';

export {
  createSyncSlice,
  type SyncSlice,
  type SyncState,
  type SyncActions,
} from './slices/sync';

// Export the main store for backward compatibility (mapped to new combined store)
export { useLanguageSelectionStore } from './combinedStore';
