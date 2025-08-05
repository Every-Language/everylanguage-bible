import { logger } from '@/shared/utils/logger';
import { AudioVersion } from '../types';

export interface AudioVersionValidationResult {
  isValid: boolean;
  error?: string;
  currentVersion: AudioVersion | null;
  requiresVersionSelection: boolean;
}

export interface AudioVersionValidationOptions {
  requireVersionSelection?: boolean;
  allowNullVersion?: boolean;
  context?: 'download' | 'playback' | 'general';
}

/**
 * Service to validate audio version selection before downloads and playback
 */
export class AudioVersionValidationService {
  private static instance: AudioVersionValidationService;

  private constructor() {}

  static getInstance(): AudioVersionValidationService {
    if (!AudioVersionValidationService.instance) {
      AudioVersionValidationService.instance =
        new AudioVersionValidationService();
    }
    return AudioVersionValidationService.instance;
  }

  /**
   * Validate that an audio version is selected and available
   */
  async validateAudioVersion(
    currentAudioVersion: AudioVersion | null,
    options: AudioVersionValidationOptions = {}
  ): Promise<AudioVersionValidationResult> {
    const { allowNullVersion = false, context = 'general' } = options;

    // If null versions are allowed, return success
    if (allowNullVersion && !currentAudioVersion) {
      return {
        isValid: true,
        currentVersion: null,
        requiresVersionSelection: false,
      };
    }

    // Check if version is selected
    if (!currentAudioVersion) {
      const errorMessage = this.getErrorMessage(context, 'no_version_selected');
      logger.warn('Audio version validation failed:', {
        context,
        error: errorMessage,
      });

      return {
        isValid: false,
        error: errorMessage,
        currentVersion: null,
        requiresVersionSelection: true,
      };
    }

    // Validate version has required properties
    if (!currentAudioVersion.id || !currentAudioVersion.name) {
      const errorMessage = this.getErrorMessage(context, 'invalid_version');
      logger.warn('Audio version validation failed:', {
        context,
        versionId: currentAudioVersion.id,
        error: errorMessage,
      });

      return {
        isValid: false,
        error: errorMessage,
        currentVersion: currentAudioVersion,
        requiresVersionSelection: true,
      };
    }

    // Version is valid
    logger.info('Audio version validation successful:', {
      context,
      versionId: currentAudioVersion.id,
      versionName: currentAudioVersion.name,
    });

    return {
      isValid: true,
      currentVersion: currentAudioVersion,
      requiresVersionSelection: false,
    };
  }

  /**
   * Validate audio version for download operations
   */
  async validateForDownload(
    currentAudioVersion: AudioVersion | null
  ): Promise<AudioVersionValidationResult> {
    return this.validateAudioVersion(currentAudioVersion, {
      requireVersionSelection: true,
      context: 'download',
    });
  }

  /**
   * Validate audio version for playback operations
   */
  async validateForPlayback(
    currentAudioVersion: AudioVersion | null
  ): Promise<AudioVersionValidationResult> {
    return this.validateAudioVersion(currentAudioVersion, {
      requireVersionSelection: true,
      context: 'playback',
    });
  }

  /**
   * Get appropriate error message based on context and error type
   */
  private getErrorMessage(context: string, errorType: string): string {
    const messages = {
      download: {
        no_version_selected:
          'Please select an audio version before downloading audio files.',
        invalid_version:
          'Selected audio version is invalid. Please choose a different version.',
      },
      playback: {
        no_version_selected:
          'Please select an audio version before playing audio.',
        invalid_version:
          'Selected audio version is invalid. Please choose a different version.',
      },
      general: {
        no_version_selected: 'Please select an audio version to continue.',
        invalid_version:
          'Selected audio version is invalid. Please choose a different version.',
      },
    };

    return (
      messages[context as keyof typeof messages]?.[
        errorType as keyof typeof messages.download
      ] ||
      messages.general[errorType as keyof typeof messages.general] ||
      'Audio version validation failed.'
    );
  }

  /**
   * Check if audio version is compatible with a specific chapter
   * This validates version selection but doesn't block if no local files exist
   */
  async validateVersionForChapter(
    currentAudioVersion: AudioVersion | null,
    chapterId: string
  ): Promise<AudioVersionValidationResult & { hasAudioForChapter: boolean }> {
    // First validate the version selection
    const baseValidation = await this.validateForDownload(currentAudioVersion);

    if (!baseValidation.isValid) {
      return {
        ...baseValidation,
        hasAudioForChapter: false,
      };
    }

    // Check if any media files exist for this chapter in local database
    // Note: Local database doesn't have audio version filtering, so we just check for any files
    try {
      const { mediaFilesService } = await import(
        '@/shared/services/database/MediaFilesService'
      );

      const mediaFiles =
        await mediaFilesService.getMediaFilesByChapterId(chapterId);
      const hasAudioForChapter = mediaFiles.length > 0;

      // Don't fail validation if no local files exist - this allows checking online
      return {
        ...baseValidation,
        hasAudioForChapter,
      };
    } catch (error) {
      logger.error(
        'Error checking local audio availability for chapter:',
        error
      );

      // Don't fail validation on error - assume no local files
      return {
        ...baseValidation,
        hasAudioForChapter: false,
      };
    }
  }
}

// Export singleton instance
export const audioVersionValidationService =
  AudioVersionValidationService.getInstance();
