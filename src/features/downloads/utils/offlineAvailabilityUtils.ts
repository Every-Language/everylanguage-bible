import * as FileSystem from 'expo-file-system';
import { logger } from '@/shared/utils/logger';
import { MediaFilesService } from '@/shared/services/database/MediaFilesService';

export interface OfflineAvailabilityCheck {
  isAvailable: boolean;
  fileExists: boolean;
  inDatabase: boolean;
  fileSize: number;
  localPath: string;
  error?: string;
}

/**
 * Check if a chapter's audio files are available offline
 */
export async function checkChapterOfflineAvailability(
  chapterId: string
): Promise<OfflineAvailabilityCheck[]> {
  try {
    const mediaFilesService = MediaFilesService.getInstance();
    const mediaFiles =
      await mediaFilesService.getMediaFilesByChapterId(chapterId);

    if (mediaFiles.length === 0) {
      logger.info('No media files found in database for chapter:', chapterId);
      return [];
    }

    const availabilityChecks: OfflineAvailabilityCheck[] = [];

    for (const mediaFile of mediaFiles) {
      const check: OfflineAvailabilityCheck = {
        isAvailable: false,
        fileExists: false,
        inDatabase: true,
        fileSize: mediaFile.file_size || 0,
        localPath: mediaFile.local_path,
      };

      try {
        // Check if file actually exists on disk
        const fileInfo = await FileSystem.getInfoAsync(mediaFile.local_path);
        check.fileExists = fileInfo.exists;

        if (fileInfo.exists && 'size' in fileInfo) {
          check.fileSize = fileInfo.size;
          check.isAvailable = fileInfo.size > 0;
        } else {
          check.error = 'File does not exist on disk';
        }
      } catch (error) {
        check.error =
          error instanceof Error
            ? error.message
            : 'Unknown error checking file';
        logger.warn('Error checking file existence:', {
          localPath: mediaFile.local_path,
          error: check.error,
        });
      }

      availabilityChecks.push(check);
    }

    const availableCount = availabilityChecks.filter(
      check => check.isAvailable
    ).length;
    logger.info('Offline availability check completed:', {
      chapterId,
      totalFiles: mediaFiles.length,
      availableFiles: availableCount,
      unavailableFiles: mediaFiles.length - availableCount,
    });

    return availabilityChecks;
  } catch (error) {
    logger.error('Error checking offline availability:', error);
    return [];
  }
}

/**
 * Verify that a specific file is available offline
 */
export async function verifyFileOfflineAvailability(
  localPath: string
): Promise<OfflineAvailabilityCheck> {
  const check: OfflineAvailabilityCheck = {
    isAvailable: false,
    fileExists: false,
    inDatabase: false,
    fileSize: 0,
    localPath,
  };

  try {
    // Check if file exists on disk
    const fileInfo = await FileSystem.getInfoAsync(localPath);
    check.fileExists = fileInfo.exists;

    if (fileInfo.exists && 'size' in fileInfo) {
      check.fileSize = fileInfo.size;
      check.isAvailable = fileInfo.size > 0;
    } else {
      check.error = 'File does not exist on disk';
    }

    // Check if file is in database
    const mediaFilesService = MediaFilesService.getInstance();
    const mediaFiles = await mediaFilesService.getMediaFiles({
      // You might need to adjust this filter based on your schema
    });

    const inDatabase = mediaFiles.some(mf => mf.local_path === localPath);
    check.inDatabase = inDatabase;

    logger.info('File offline availability verified:', {
      localPath,
      fileExists: check.fileExists,
      inDatabase: check.inDatabase,
      fileSize: check.fileSize,
      isAvailable: check.isAvailable,
    });
  } catch (error) {
    check.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error verifying file offline availability:', error);
  }

  return check;
}

/**
 * Ensure a downloaded file is properly accessible offline
 */
export async function ensureOfflineAvailability(
  localPath: string,
  expectedSize?: number
): Promise<boolean> {
  try {
    const check = await verifyFileOfflineAvailability(localPath);

    if (!check.isAvailable) {
      logger.warn('File not available offline:', {
        localPath,
        error: check.error,
        fileExists: check.fileExists,
        fileSize: check.fileSize,
      });
      return false;
    }

    if (expectedSize && check.fileSize < expectedSize) {
      logger.warn('File size mismatch:', {
        localPath,
        expectedSize,
        actualSize: check.fileSize,
      });
      return false;
    }

    logger.info('File confirmed available offline:', {
      localPath,
      fileSize: check.fileSize,
    });

    return true;
  } catch (error) {
    logger.error('Error ensuring offline availability:', error);
    return false;
  }
}

/**
 * Get all offline available chapters
 */
export async function getOfflineAvailableChapters(): Promise<string[]> {
  try {
    const mediaFilesService = MediaFilesService.getInstance();
    const mediaFiles = await mediaFilesService.getMediaFiles();

    const chapterIds = new Set<string>();

    for (const mediaFile of mediaFiles) {
      if (mediaFile.chapter_id) {
        const isAvailable = await ensureOfflineAvailability(
          mediaFile.local_path
        );
        if (isAvailable) {
          chapterIds.add(mediaFile.chapter_id);
        }
      }
    }

    const availableChapters = Array.from(chapterIds);
    logger.info('Offline available chapters:', {
      count: availableChapters.length,
      chapters: availableChapters,
    });

    return availableChapters;
  } catch (error) {
    logger.error('Error getting offline available chapters:', error);
    return [];
  }
}

/**
 * Clean up orphaned files that exist on disk but not in database
 */
export async function cleanupOrphanedFiles(): Promise<{
  cleanedCount: number;
  errors: string[];
}> {
  try {
    const downloadsDir = `${FileSystem.documentDirectory}downloads/`;
    const dirInfo = await FileSystem.getInfoAsync(downloadsDir);

    if (!dirInfo.exists || !dirInfo.isDirectory) {
      return {
        cleanedCount: 0,
        errors: ['Downloads directory does not exist'],
      };
    }

    const mediaFilesService = MediaFilesService.getInstance();
    const mediaFiles = await mediaFilesService.getMediaFiles();
    const databasePaths = new Set(mediaFiles.map(mf => mf.local_path));

    // Get all files in downloads directory
    const files = await FileSystem.readDirectoryAsync(downloadsDir);
    let cleanedCount = 0;
    const errors: string[] = [];

    for (const fileName of files) {
      const filePath = `${downloadsDir}${fileName}`;

      if (!databasePaths.has(filePath)) {
        try {
          await FileSystem.deleteAsync(filePath);
          cleanedCount++;
          logger.info('Cleaned up orphaned file:', filePath);
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to delete ${filePath}: ${errorMsg}`);
          logger.error('Failed to clean up orphaned file:', {
            filePath,
            error,
          });
        }
      }
    }

    logger.info('Cleanup completed:', { cleanedCount, errors: errors.length });
    return { cleanedCount, errors };
  } catch (error) {
    logger.error('Error during cleanup:', error);
    return {
      cleanedCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}
