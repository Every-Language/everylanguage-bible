import { useCallback } from 'react';
import { useLanguageSelectionStore } from '../store/languageSelectionStore';
import {
  UseLanguageSelectionReturn,
  UseCurrentVersionsReturn,
  UseSavedVersionsReturn,
  AudioVersion,
  TextVersion,
  LanguageEntity,
} from '../types';

/**
 * Main hook for language selection functionality
 * Provides access to the complete language selection state and actions
 */
export const useLanguageSelection = (): UseLanguageSelectionReturn => {
  const store = useLanguageSelectionStore();

  const selectAudioVersion = useCallback(
    (version: AudioVersion) => {
      store.setCurrentAudioVersion(version);
    },
    [store]
  );

  const selectTextVersion = useCallback(
    (version: TextVersion) => {
      store.setCurrentTextVersion(version);
    },
    [store]
  );

  const addToSavedVersions = useCallback(
    async (version: AudioVersion | TextVersion, type: 'audio' | 'text') => {
      await store.addSavedVersion(version, type);
    },
    [store]
  );

  const removeFromSavedVersions = useCallback(
    async (versionId: string, type: 'audio' | 'text') => {
      await store.removeSavedVersion(versionId, type);
    },
    [store]
  );

  const navigateToLanguage = useCallback(
    (language: LanguageEntity) => {
      store.navigateToLanguage(language);
    },
    [store]
  );

  const searchLanguages = useCallback(
    (query: string) => {
      store.searchLanguages(query);
    },
    [store]
  );

  const loadLanguageHierarchy = useCallback(async () => {
    await store.loadLanguageHierarchy();
  }, [store]);

  const loadAvailableVersions = useCallback(
    async (languageId: string) => {
      await store.loadAvailableVersions(languageId);
    },
    [store]
  );

  const syncWithCloud = useCallback(async () => {
    await store.syncWithCloud();
  }, [store]);

  return {
    state: store,
    selectAudioVersion,
    selectTextVersion,
    addToSavedVersions,
    removeFromSavedVersions,
    navigateToLanguage,
    searchLanguages,
    loadLanguageHierarchy,
    loadAvailableVersions,
    syncWithCloud,
  };
};

/**
 * Hook for current version selections only
 * Lightweight hook for components that only need current selections
 */
export const useCurrentVersions = (): UseCurrentVersionsReturn => {
  const {
    currentAudioVersion,
    currentTextVersion,
    isLoadingHierarchy,
    isLoadingVersions,
    error,
    setCurrentAudioVersion,
    setCurrentTextVersion,
  } = useLanguageSelectionStore();

  const setAudioVersion = useCallback(
    (version: AudioVersion | null) => {
      setCurrentAudioVersion(version);
    },
    [setCurrentAudioVersion]
  );

  const setTextVersion = useCallback(
    (version: TextVersion | null) => {
      setCurrentTextVersion(version);
    },
    [setCurrentTextVersion]
  );

  return {
    currentAudioVersion,
    currentTextVersion,
    isLoading: isLoadingHierarchy || isLoadingVersions,
    error,
    setAudioVersion,
    setTextVersion,
  };
};

/**
 * Hook for saved versions management
 * Focused hook for managing user's saved version lists
 */
export const useSavedVersions = (): UseSavedVersionsReturn => {
  const {
    savedAudioVersions,
    savedTextVersions,
    isLoadingVersions,
    error,
    addSavedVersion,
    removeSavedVersion,
    loadSavedVersions,
  } = useLanguageSelectionStore();

  const addVersion = useCallback(
    async (version: AudioVersion | TextVersion, type: 'audio' | 'text') => {
      await addSavedVersion(version, type);
    },
    [addSavedVersion]
  );

  const removeVersion = useCallback(
    async (versionId: string, type: 'audio' | 'text') => {
      await removeSavedVersion(versionId, type);
    },
    [removeSavedVersion]
  );

  const isVersionSaved = useCallback(
    (versionId: string, type: 'audio' | 'text'): boolean => {
      if (type === 'audio') {
        return savedAudioVersions.some(v => v.id === versionId);
      } else {
        return savedTextVersions.some(v => v.id === versionId);
      }
    },
    [savedAudioVersions, savedTextVersions]
  );

  const refresh = useCallback(async () => {
    await loadSavedVersions();
  }, [loadSavedVersions]);

  return {
    savedAudioVersions,
    savedTextVersions,
    isLoading: isLoadingVersions,
    error,
    addVersion,
    removeVersion,
    isVersionSaved,
    refresh,
  };
};

/**
 * Hook for language hierarchy navigation
 * Specialized hook for browsing the language hierarchy
 */
export const useLanguageHierarchy = () => {
  const {
    languageHierarchy,
    currentLanguagePath,
    expandedNodes,
    searchQuery,
    searchResults,
    isLoadingHierarchy,
    isSearching,
    error,
    loadLanguageHierarchy,
    expandLanguageNode,
    collapseLanguageNode,
    navigateToLanguage,
    navigateBack,
    resetNavigation,
    searchLanguages,
    clearSearch,
  } = useLanguageSelectionStore();

  const toggleNodeExpansion = useCallback(
    (nodeId: string) => {
      const nodes = expandedNodes || new Set();
      if (nodes.has(nodeId)) {
        collapseLanguageNode(nodeId);
      } else {
        expandLanguageNode(nodeId);
      }
    },
    [expandedNodes, expandLanguageNode, collapseLanguageNode]
  );

  const isNodeExpanded = useCallback(
    (nodeId: string): boolean => {
      return (expandedNodes || new Set()).has(nodeId);
    },
    [expandedNodes]
  );

  return {
    languageHierarchy,
    currentLanguagePath,
    searchQuery,
    searchResults,
    isLoadingHierarchy,
    isSearching,
    error,
    loadLanguageHierarchy,
    toggleNodeExpansion,
    isNodeExpanded,
    navigateToLanguage,
    navigateBack,
    resetNavigation,
    searchLanguages,
    clearSearch,
  };
};

/**
 * Hook for available versions in a specific language
 * Used when showing versions available for a selected language
 */
export const useAvailableVersions = (languageEntityId?: string) => {
  const {
    availableAudioVersions,
    availableTextVersions,
    isLoadingVersions,
    error,
    loadAvailableVersions,
  } = useLanguageSelectionStore();

  const loadVersions = useCallback(
    async (langId?: string) => {
      const targetLanguageId = langId || languageEntityId;
      if (targetLanguageId) {
        await loadAvailableVersions(targetLanguageId);
      }
    },
    [languageEntityId, loadAvailableVersions]
  );

  return {
    availableAudioVersions,
    availableTextVersions,
    isLoading: isLoadingVersions,
    error,
    loadVersions,
  };
};

/**
 * Hook for sync operations
 * Handles cloud synchronization functionality
 */
export const useLanguageSync = () => {
  const { lastSyncAt, syncInProgress, error, syncWithCloud, clearError } =
    useLanguageSelectionStore();

  const performSync = useCallback(async () => {
    await syncWithCloud();
  }, [syncWithCloud]);

  return {
    lastSyncAt,
    syncInProgress,
    error,
    performSync,
    clearError,
  };
};
