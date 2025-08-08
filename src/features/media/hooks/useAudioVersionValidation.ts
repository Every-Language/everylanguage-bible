import { useCallback } from 'react';
import { useCurrentVersions } from '@/features/languages/hooks';
import { logger } from '@/shared/utils/logger';

export interface UseAudioVersionValidationReturn {
  validateForPlayback: () => Promise<boolean>;
  validateForDownload: (chapterId?: string) => Promise<boolean>;
  getValidationError: () => string | null;
}

/**
 * Hook to validate audio version before media operations
 * Simplified validation - just checks if an audio version is selected
 */
export const useAudioVersionValidation =
  (): UseAudioVersionValidationReturn => {
    const { currentAudioVersion } = useCurrentVersions();

    const validateForPlayback = useCallback(async (): Promise<boolean> => {
      try {
        if (!currentAudioVersion) {
          logger.warn('No audio version selected for playback');
          return false;
        }

        // Basic validation - check if version has required fields
        if (!currentAudioVersion.id || !currentAudioVersion.name) {
          logger.warn('Invalid audio version - missing required fields');
          return false;
        }

        return true;
      } catch (error) {
        logger.error('Error validating audio version for playback:', error);
        return false;
      }
    }, [currentAudioVersion]);

    const validateForDownload = useCallback(
      async (chapterId?: string): Promise<boolean> => {
        try {
          if (!currentAudioVersion) {
            logger.warn('No audio version selected for download');
            return false;
          }

          // Basic validation - check if version has required fields
          if (!currentAudioVersion.id || !currentAudioVersion.name) {
            logger.warn('Invalid audio version - missing required fields');
            return false;
          }

          // If a specific chapter is provided, we could add more validation here
          // For now, just log it
          if (chapterId) {
            logger.info(`Validating audio version for chapter: ${chapterId}`);
          }

          return true;
        } catch (error) {
          logger.error('Error validating audio version for download:', error);
          return false;
        }
      },
      [currentAudioVersion]
    );

    const getValidationError = useCallback((): string | null => {
      if (!currentAudioVersion) {
        return 'Please select an audio version before playing audio.';
      }

      if (!currentAudioVersion.id || !currentAudioVersion.name) {
        return 'Selected audio version is invalid. Please select a different version.';
      }

      return null;
    }, [currentAudioVersion]);

    return {
      validateForPlayback,
      validateForDownload,
      getValidationError,
    };
  };
