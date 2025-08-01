import { useCallback } from 'react';
import { useCurrentVersions } from '@/features/languages/hooks';
import { audioVersionValidationService } from '@/features/languages/services/audioVersionValidationService';
import { logger } from '@/shared/utils/logger';

export interface UseAudioVersionValidationReturn {
  validateForPlayback: () => Promise<boolean>;
  validateForDownload: (chapterId?: string) => Promise<boolean>;
  getValidationError: () => string | null;
}

/**
 * Hook to validate audio version before media operations
 */
export const useAudioVersionValidation =
  (): UseAudioVersionValidationReturn => {
    const { currentAudioVersion } = useCurrentVersions();

    const validateForPlayback = useCallback(async (): Promise<boolean> => {
      try {
        const validation =
          await audioVersionValidationService.validateForPlayback(
            currentAudioVersion
          );

        if (!validation.isValid) {
          logger.warn(
            'Audio version validation failed for playback:',
            validation.error
          );
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
          if (chapterId) {
            const validation =
              await audioVersionValidationService.validateVersionForChapter(
                currentAudioVersion,
                chapterId
              );

            if (!validation.isValid) {
              logger.warn(
                'Audio version validation failed for download:',
                validation.error
              );
              return false;
            }

            return true;
          } else {
            const validation =
              await audioVersionValidationService.validateForDownload(
                currentAudioVersion
              );

            if (!validation.isValid) {
              logger.warn(
                'Audio version validation failed for download:',
                validation.error
              );
              return false;
            }

            return true;
          }
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
      return null;
    }, [currentAudioVersion]);

    return {
      validateForPlayback,
      validateForDownload,
      getValidationError,
    };
  };
