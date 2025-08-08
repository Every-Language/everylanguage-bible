import { useState, useEffect, useCallback } from 'react';
import { logger } from '../../../shared/utils/logger';
import { AudioVersion, TextVersion } from '../types/entities';
import { userVersionsService } from '../services/userVersionsService';

export interface UseUserVersionsReturn {
  // State
  savedAudioVersions: AudioVersion[];
  savedTextVersions: TextVersion[];
  currentAudioVersion: AudioVersion | null;
  currentTextVersion: TextVersion | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  addSavedVersion: (
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ) => Promise<void>;
  removeSavedVersion: (
    versionId: string,
    type: 'audio' | 'text'
  ) => Promise<void>;
  setCurrentAudioVersion: (version: AudioVersion | null) => Promise<void>;
  setCurrentTextVersion: (version: TextVersion | null) => Promise<void>;
  isVersionSaved: (versionId: string, type: 'audio' | 'text') => boolean;
  refreshVersions: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing user saved versions and current selections with PowerSync real-time updates
 */
export const useUserVersions = (): UseUserVersionsReturn => {
  const [savedAudioVersions, setSavedAudioVersions] = useState<AudioVersion[]>(
    []
  );
  const [savedTextVersions, setSavedTextVersions] = useState<TextVersion[]>([]);
  const [currentAudioVersion, setCurrentAudioVersionState] =
    useState<AudioVersion | null>(null);
  const [currentTextVersion, setCurrentTextVersionState] =
    useState<TextVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load saved versions and current selections in parallel
      const [savedVersions, currentSelections] = await Promise.all([
        userVersionsService.getSavedVersions(),
        userVersionsService.getCurrentSelections(),
      ]);

      setSavedAudioVersions(savedVersions.audio);
      setSavedTextVersions(savedVersions.text);
      setCurrentAudioVersionState(currentSelections.audio);
      setCurrentTextVersionState(currentSelections.text);

      logger.info('Loaded user versions and selections:', {
        audioSaved: savedVersions.audio.length,
        textSaved: savedVersions.text.length,
        currentAudio: currentSelections.audio?.name,
        currentText: currentSelections.text?.name,
      });
    } catch (error) {
      logger.error('Error loading user versions:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load versions'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up PowerSync watchers for real-time updates
  useEffect(() => {
    let savedVersionsCleanup: (() => void) | null = null;
    let currentSelectionsCleanup: (() => void) | null = null;

    const setupWatchers = async () => {
      try {
        // Watch saved versions for real-time updates
        const savedVersionsWatcher =
          await userVersionsService.watchSavedVersions();
        savedVersionsCleanup = () => {
          // PowerSync watchers are automatically cleaned up when the component unmounts
        };

        // Watch current selections for real-time updates
        const currentSelectionsWatcher =
          await userVersionsService.watchCurrentSelections();
        currentSelectionsCleanup = () => {
          // PowerSync watchers are automatically cleaned up when the component unmounts
        };

        // Set up async iteration for saved versions
        (async () => {
          try {
            for await (const results of savedVersionsWatcher) {
              const audioVersions: AudioVersion[] = [];
              const textVersions: TextVersion[] = [];

              for (const row of results.rows?._array || []) {
                if (row.type === 'audio') {
                  audioVersions.push({
                    id: row.version_id,
                    name: row.name,
                    languageEntityId: row.language_entity_id,
                    languageName: '',
                    mediaFileCount: 0,
                    createdAt: row.version_created_at,
                    updatedAt: row.version_created_at,
                  });
                } else if (row.type === 'text') {
                  textVersions.push({
                    id: row.version_id,
                    name: row.name,
                    languageEntityId: row.language_entity_id,
                    languageName: '',
                    source: 'project' as const,
                    verseCount: 0,
                    createdAt: row.version_created_at,
                    updatedAt: row.version_created_at,
                  });
                }
              }

              setSavedAudioVersions(audioVersions);
              setSavedTextVersions(textVersions);
            }
          } catch (error) {
            logger.error('Error in saved versions watcher:', error);
          }
        })();

        // Set up async iteration for current selections
        (async () => {
          try {
            for await (const results of currentSelectionsWatcher) {
              const rows = results.rows?._array || [];
              const result = rows.length > 0 ? rows[0] : null;

              if (result) {
                const audioVersion = result.selected_audio_version
                  ? {
                      id: result.selected_audio_version,
                      name: result.audio_name || '',
                      languageEntityId: result.audio_language_entity_id || '',
                      languageName: '',
                      mediaFileCount: 0,
                      createdAt: '',
                      updatedAt: '',
                    }
                  : null;

                const textVersion = result.selected_text_version
                  ? {
                      id: result.selected_text_version,
                      name: result.text_name || '',
                      languageEntityId: result.text_language_entity_id || '',
                      languageName: '',
                      source: 'project' as const,
                      verseCount: 0,
                      createdAt: '',
                      updatedAt: '',
                    }
                  : null;

                setCurrentAudioVersionState(audioVersion);
                setCurrentTextVersionState(textVersion);
              } else {
                setCurrentAudioVersionState(null);
                setCurrentTextVersionState(null);
              }
            }
          } catch (error) {
            logger.error('Error in current selections watcher:', error);
          }
        })();
      } catch (error) {
        logger.error('Error setting up PowerSync watchers:', error);
      }
    };

    // Load initial data and setup watchers
    loadInitialData().then(() => {
      setupWatchers();
    });

    // Cleanup function
    return () => {
      savedVersionsCleanup?.();
      currentSelectionsCleanup?.();
    };
  }, [loadInitialData]);

  // Add saved version
  const addSavedVersion = useCallback(
    async (version: AudioVersion | TextVersion, type: 'audio' | 'text') => {
      try {
        setError(null);
        await userVersionsService.addSavedVersion(version, type);
        // The watcher will automatically update the state
      } catch (error) {
        logger.error('Error adding saved version:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to add version'
        );
        throw error;
      }
    },
    []
  );

  // Remove saved version
  const removeSavedVersion = useCallback(
    async (versionId: string, type: 'audio' | 'text') => {
      try {
        setError(null);
        await userVersionsService.removeSavedVersion(versionId, type);
        // The watcher will automatically update the state
      } catch (error) {
        logger.error('Error removing saved version:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to remove version'
        );
        throw error;
      }
    },
    []
  );

  // Set current audio version
  const setCurrentAudioVersion = useCallback(
    async (version: AudioVersion | null) => {
      try {
        setError(null);

        // If the version is not saved yet, save it first
        if (version && !isVersionSavedCheck(version.id, 'audio')) {
          await userVersionsService.addSavedVersion(version, 'audio');
        }

        await userVersionsService.setCurrentAudioVersion(version);
        // The watcher will automatically update the state
      } catch (error) {
        logger.error('Error setting current audio version:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to set current audio version'
        );
        throw error;
      }
    },
    []
  );

  // Set current text version
  const setCurrentTextVersion = useCallback(
    async (version: TextVersion | null) => {
      try {
        setError(null);

        // If the version is not saved yet, save it first
        if (version && !isVersionSavedCheck(version.id, 'text')) {
          await userVersionsService.addSavedVersion(version, 'text');
        }

        await userVersionsService.setCurrentTextVersion(version);
        // The watcher will automatically update the state
      } catch (error) {
        logger.error('Error setting current text version:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to set current text version'
        );
        throw error;
      }
    },
    []
  );

  // Check if version is saved (optimized for UI state)
  const isVersionSavedCheck = useCallback(
    (versionId: string, type: 'audio' | 'text'): boolean => {
      const versions =
        type === 'audio' ? savedAudioVersions : savedTextVersions;
      return versions.some(v => v.id === versionId);
    },
    [savedAudioVersions, savedTextVersions]
  );

  // Refresh versions manually
  const refreshVersions = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    savedAudioVersions,
    savedTextVersions,
    currentAudioVersion,
    currentTextVersion,
    isLoading,
    error,

    // Actions
    addSavedVersion,
    removeSavedVersion,
    setCurrentAudioVersion,
    setCurrentTextVersion,
    isVersionSaved: isVersionSavedCheck,
    refreshVersions,
    clearError,
  };
};
