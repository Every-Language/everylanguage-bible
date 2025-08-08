// New PowerSync-based hooks (recommended)
export { useUserVersions } from './useUserVersions';
export type { UseUserVersionsReturn } from './useUserVersions';

export { useLanguageSearch } from './useLanguageSearch';
export type { UseLanguageSearchReturn } from './useLanguageSearch';

// Legacy wrapper hooks for backward compatibility (deprecated)
import { useCallback } from 'react';
import { useUserVersions } from './useUserVersions';
import type { AudioVersion, TextVersion } from '../types/entities';

// Simple wrapper hook for current versions using PowerSync
export const useCurrentVersions = () => {
  const {
    currentAudioVersion,
    currentTextVersion,
    setCurrentAudioVersion,
    setCurrentTextVersion,
    isLoading,
    error,
  } = useUserVersions();

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
    isLoading,
    error,
    setAudioVersion,
    setTextVersion,
  };
};

// Simple wrapper hook for saved versions using PowerSync
export const useSavedVersions = () => {
  const {
    savedAudioVersions,
    savedTextVersions,
    addSavedVersion,
    removeSavedVersion,
    isVersionSaved,
    refreshVersions,
    isLoading,
    error,
  } = useUserVersions();

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

  const refresh = useCallback(async () => {
    await refreshVersions();
  }, [refreshVersions]);

  return {
    savedAudioVersions,
    savedTextVersions,
    isLoading,
    error,
    addVersion,
    removeVersion,
    isVersionSaved,
    refresh,
  };
};

// Note: Legacy hooks have been removed in favor of the new PowerSync-based architecture
// If you need the old functionality, please migrate to useUserVersions and useLanguageSearch
