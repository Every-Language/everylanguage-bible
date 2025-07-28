import { MediaFilesService } from '@/shared/services/database/MediaFilesService';
import { LocalMediaFile } from '@/shared/services/database/schema';
import { logger } from '@/shared/utils/logger';
import { FileDownloadProgress } from '../hooks/useDownloadProgress';
import MediaFilesVersesSyncService from '@/shared/services/sync/media/MediaFilesVersesSyncService';

export interface DownloadToMediaOptions {
  languageEntityId?: string;
  mediaType?: string;
  uploadStatus?: string;
  publishStatus?: string;
  checkStatus?: string;
  version?: number;
  chapterId?: string;
  verses?: string; // JSON string of verse IDs
  syncVersesData?: boolean; // Whether to automatically sync media file verses data after completion
}

export interface MediaFileCreationResult {
  success: boolean;
  mediaFileId?: string;
  error?: string;
}

/**
 * Service to handle adding completed downloads to the local media file table
 */
export class DownloadToMediaService {
  private static instance: DownloadToMediaService;
  private mediaFilesService: MediaFilesService;
  private mediaFilesVersesSyncService: MediaFilesVersesSyncService;

  private constructor() {
    this.mediaFilesService = MediaFilesService.getInstance();
    this.mediaFilesVersesSyncService =
      MediaFilesVersesSyncService.getInstance();
  }

  static getInstance(): DownloadToMediaService {
    if (!DownloadToMediaService.instance) {
      DownloadToMediaService.instance = new DownloadToMediaService();
    }
    return DownloadToMediaService.instance;
  }

  /**
   * Add a completed download to the local media file table
   */
  async addCompletedDownloadToMedia(
    completedFile: FileDownloadProgress,
    originalSearchResult: any,
    options: DownloadToMediaOptions = {}
  ): Promise<MediaFileCreationResult> {
    try {
      logger.info('Adding completed download to media files table:', {
        fileName: completedFile.fileName,
        filePath: completedFile.filePath,
        fileSize: completedFile.fileSize,
      });

      // Run debug check first
      const debugResult = await this.debugMediaFileCreation(
        completedFile,
        originalSearchResult,
        options
      );
      if (!debugResult.isValid) {
        logger.error('Media file creation validation failed:', {
          issues: debugResult.issues,
          extractedData: debugResult.extractedData,
          mediaFileData: debugResult.mediaFileData,
        });
        throw new Error(
          `Media file creation validation failed: ${debugResult.issues.join('; ')}`
        );
      }

      // Validate that we have a valid search result
      if (!originalSearchResult || typeof originalSearchResult !== 'object') {
        throw new Error('Invalid original search result provided');
      }

      // Log the complete search result for debugging
      logger.info(
        'Original search result:',
        JSON.stringify(originalSearchResult, null, 2)
      );

      // Log the search result keys for debugging
      logger.info(
        'Search result keys:',
        Object.keys(originalSearchResult || {})
      );

      // Check if database is initialized
      try {
        const db =
          await this.mediaFilesService['databaseManager'].getDatabase();
        // Test database connection
        await db.getFirstAsync('SELECT 1');

        // Check if media_files table exists
        const tableExists = await db.getFirstAsync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='media_files'"
        );
        if (!tableExists) {
          logger.error('Media files table does not exist');
          throw new Error('Media files table not found');
        }
      } catch (dbError) {
        logger.error('Database not initialized or connection failed:', {
          error: (dbError as Error).message,
        });
        throw new Error('Database not available');
      }

      // Extract data from the original search result with fallbacks
      const extractDataWithFallbacks = (searchResult: any) => {
        // Generate a unique ID if none exists
        const fallbackId =
          searchResult.id ||
          searchResult.remote_id ||
          searchResult.file_id ||
          `generated_${completedFile.fileName}_${Date.now()}`;

        // Extract chapter ID from start_verse_id if available
        const chapterId =
          searchResult.chapter_id ||
          searchResult.chapter ||
          (searchResult.start_verse_id
            ? searchResult.start_verse_id.split('_')[0]
            : null);

        return {
          id: fallbackId,
          language_entity_id:
            searchResult.language_entity_id ||
            searchResult.language_id ||
            searchResult.audio_version_id || // Try audio_version_id as fallback
            'unknown',
          sequence_id:
            searchResult.sequence_id ||
            searchResult.sequence ||
            `seq_${fallbackId}_${Date.now()}`,
          media_type: searchResult.media_type || searchResult.type || 'audio',
          file_size:
            searchResult.file_size ||
            searchResult.size ||
            completedFile.fileSize ||
            0,
          duration_seconds:
            searchResult.duration_seconds || searchResult.duration || 0,
          upload_status:
            searchResult.upload_status || searchResult.status || 'completed',
          publish_status: searchResult.publish_status || 'published',
          check_status: searchResult.check_status || 'checked',
          version: searchResult.version || 1,
          chapter_id: chapterId,
          verses: searchResult.verses || '[]',
          start_verse_id:
            searchResult.start_verse_id || searchResult.start_verse || null,
          end_verse_id:
            searchResult.end_verse_id || searchResult.end_verse || null,
        };
      };

      const extractedData = extractDataWithFallbacks(originalSearchResult);

      // Log the extracted data for debugging
      logger.info('Extracted data from original search result:', extractedData);

      // Generate a fallback sequence_id if it's missing
      const fallbackSequenceId =
        extractedData.sequence_id ||
        `generated_${extractedData.id || completedFile.fileName}_${Date.now()}`;

      // Validate that we have the minimum required data
      if (!extractedData.id) {
        throw new Error('Remote ID is required from search result');
      }
      // Allow 'unknown' language_entity_id and generate a fallback
      if (
        !extractedData.language_entity_id ||
        extractedData.language_entity_id === 'unknown'
      ) {
        logger.warn(
          'Language entity ID not found in search result, using fallback'
        );
        extractedData.language_entity_id = `fallback_${extractedData.id}_${Date.now()}`;
      }

      // Create media file record
      const mediaFile: Omit<LocalMediaFile, 'created_at' | 'updated_at'> = {
        id: extractedData.id, // Use the remote ID as local ID for consistency
        language_entity_id:
          options.languageEntityId || extractedData.language_entity_id,
        sequence_id: fallbackSequenceId,
        media_type: options.mediaType || extractedData.media_type || 'audio',
        local_path: completedFile.fileName, // Use the downloaded file name
        remote_path: completedFile.filePath, // Original remote path
        file_size: extractedData.file_size || 0,
        duration_seconds: extractedData.duration_seconds || 0,
        upload_status:
          options.uploadStatus || extractedData.upload_status || 'completed',
        publish_status:
          options.publishStatus || extractedData.publish_status || 'published',
        check_status:
          options.checkStatus || extractedData.check_status || 'checked',
        version: options.version || extractedData.version || 1,
        deleted_at: null,
        chapter_id: options.chapterId || extractedData.chapter_id,
        verses:
          options.verses ||
          extractedData.verses ||
          this.buildVersesJson(
            extractedData.start_verse_id,
            extractedData.end_verse_id
          ),
      };

      // Log the final media file data for debugging
      logger.info('Created media file record:', {
        id: mediaFile.id,
        language_entity_id: mediaFile.language_entity_id,
        sequence_id: mediaFile.sequence_id,
        media_type: mediaFile.media_type,
        local_path: mediaFile.local_path,
        remote_path: mediaFile.remote_path,
        file_size: mediaFile.file_size,
        chapter_id: mediaFile.chapter_id,
        verses: mediaFile.verses,
      });

      // Validate the media file data with detailed error reporting
      try {
        this.validateMediaFileData(mediaFile);
      } catch (validationError) {
        logger.error('Media file validation failed:', {
          error: (validationError as Error).message,
          mediaFile: {
            id: mediaFile.id,
            language_entity_id: mediaFile.language_entity_id,
            sequence_id: mediaFile.sequence_id,
            media_type: mediaFile.media_type,
            local_path: mediaFile.local_path,
            remote_path: mediaFile.remote_path,
            file_size: mediaFile.file_size,
            duration_seconds: mediaFile.duration_seconds,
            version: mediaFile.version,
          },
        });
        throw validationError;
      }

      // Check if media file already exists
      const existingFile = await this.mediaFilesService.getMediaFileById(
        mediaFile.id
      );
      if (existingFile) {
        logger.info('Media file already exists, updating instead:', {
          mediaFileId: mediaFile.id,
          fileName: completedFile.fileName,
        });

        // Update existing file with new local path and file size
        await this.mediaFilesService.updateLocalPath(
          mediaFile.id,
          mediaFile.local_path
        );
        await this.mediaFilesService.updateFileSize(
          mediaFile.id,
          mediaFile.file_size
        );

        // Automatically search for media file verses data after updating existing media file
        if (options.syncVersesData !== false) {
          // Default to true if not specified
          try {
            logger.info(
              'Searching for media file verses data for updated media file:',
              {
                mediaFileId: mediaFile.id,
              }
            );

            const syncResult =
              await this.mediaFilesVersesSyncService.syncForMediaFile(
                mediaFile.id
              );

            if (syncResult && syncResult.length > 0) {
              const versesResult = syncResult.find(
                result => result.tableName === 'media_files_verses'
              );
              if (versesResult && versesResult.success) {
                logger.info(
                  'Successfully synced media file verses data for updated file:',
                  {
                    mediaFileId: mediaFile.id,
                    recordsSynced: versesResult.recordsSynced,
                  }
                );
              } else {
                logger.warn(
                  'Media file verses sync completed but may have had issues for updated file:',
                  {
                    mediaFileId: mediaFile.id,
                    syncResult,
                  }
                );
              }
            } else {
              logger.info(
                'No media file verses data found for updated media file:',
                {
                  mediaFileId: mediaFile.id,
                }
              );
            }
          } catch (syncError) {
            logger.error(
              'Failed to sync media file verses data after updating existing media file:',
              {
                mediaFileId: mediaFile.id,
                error: (syncError as Error).message,
              }
            );
            // Don't fail the download completion if verses sync fails
          }
        }

        return {
          success: true,
          mediaFileId: mediaFile.id,
        };
      }

      // Validate foreign key references before saving
      try {
        const db =
          await this.mediaFilesService['databaseManager'].getDatabase();

        // Temporarily disable foreign key constraints for this operation
        await db.execAsync('PRAGMA foreign_keys = OFF');

        try {
          // Save to local database
          await this.mediaFilesService.saveMediaFile(mediaFile);
        } finally {
          // Re-enable foreign key constraints
          await db.execAsync('PRAGMA foreign_keys = ON');
        }
      } catch (dbError) {
        logger.error('Database operation failed:', {
          error: (dbError as Error).message,
          stack: (dbError as Error).stack,
        });
        throw dbError;
      }

      logger.info('Successfully added download to media files table:', {
        mediaFileId: mediaFile.id,
        fileName: completedFile.fileName,
        localPath: mediaFile.local_path,
        remotePath: mediaFile.remote_path,
        fileSize: mediaFile.file_size,
        chapterId: mediaFile.chapter_id,
      });

      // Automatically search for media file verses data after successful media file creation
      if (options.syncVersesData !== false) {
        // Default to true if not specified
        try {
          logger.info(
            'Searching for media file verses data for newly created media file:',
            {
              mediaFileId: mediaFile.id,
            }
          );

          const syncResult =
            await this.mediaFilesVersesSyncService.syncForMediaFile(
              mediaFile.id
            );

          if (syncResult && syncResult.length > 0) {
            const versesResult = syncResult.find(
              result => result.tableName === 'media_files_verses'
            );
            if (versesResult && versesResult.success) {
              logger.info('Successfully synced media file verses data:', {
                mediaFileId: mediaFile.id,
                recordsSynced: versesResult.recordsSynced,
              });
            } else {
              logger.warn(
                'Media file verses sync completed but may have had issues:',
                {
                  mediaFileId: mediaFile.id,
                  syncResult,
                }
              );
            }
          } else {
            logger.info('No media file verses data found for media file:', {
              mediaFileId: mediaFile.id,
            });
          }
        } catch (syncError) {
          logger.error(
            'Failed to sync media file verses data after download completion:',
            {
              mediaFileId: mediaFile.id,
              error: (syncError as Error).message,
            }
          );
          // Don't fail the download completion if verses sync fails
        }
      }

      return {
        success: true,
        mediaFileId: mediaFile.id,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Unknown error';
      logger.error('Failed to add download to media files table:', {
        fileName: completedFile.fileName,
        error: errorMessage,
        stack: (error as Error).stack,
        originalSearchResult: originalSearchResult
          ? JSON.stringify(originalSearchResult)
          : 'null',
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Add multiple completed downloads to the local media file table
   */
  async addCompletedDownloadsToMedia(
    completedFiles: FileDownloadProgress[],
    originalSearchResults: any[],
    options: DownloadToMediaOptions = {}
  ): Promise<{
    success: boolean;
    results: MediaFileCreationResult[];
    successfulCount: number;
    failedCount: number;
  }> {
    logger.info('Adding multiple completed downloads to media files table:', {
      count: completedFiles.length,
    });

    const results: MediaFileCreationResult[] = [];
    let successfulCount = 0;
    let failedCount = 0;

    for (let i = 0; i < completedFiles.length; i++) {
      const completedFile = completedFiles[i];
      const originalSearchResult = originalSearchResults[i];

      if (!originalSearchResult) {
        logger.warn('No original search result found for completed file:', {
          fileName: completedFile?.fileName,
          index: i,
        });
        results.push({
          success: false,
          error: 'No original search result found',
        });
        failedCount++;
        continue;
      }
      if (!completedFile) {
        logger.warn('Completed file is undefined:', {
          index: i,
        });
        results.push({
          success: false,
          error: 'Completed file is undefined',
        });
        failedCount++;
        continue;
      }

      const result = await this.addCompletedDownloadToMedia(
        completedFile,
        originalSearchResult,
        options
      );

      results.push(result);
      if (result.success) {
        successfulCount++;
      } else {
        failedCount++;
      }
    }

    logger.info('Completed adding downloads to media files table:', {
      total: completedFiles.length,
      successful: successfulCount,
      failed: failedCount,
    });

    return {
      success: failedCount === 0,
      results,
      successfulCount,
      failedCount,
    };
  }

  /**
   * Check if a media file already exists in the local database
   */
  async checkMediaFileExists(remoteId: string): Promise<boolean> {
    try {
      const existingFile =
        await this.mediaFilesService.getMediaFileById(remoteId);
      return existingFile !== null;
    } catch (error) {
      logger.error('Error checking if media file exists:', error);
      return false;
    }
  }

  /**
   * Update existing media file with new local path and file size
   */
  async updateExistingMediaFile(
    remoteId: string,
    localPath: string,
    fileSize: number
  ): Promise<boolean> {
    try {
      await this.mediaFilesService.updateLocalPath(remoteId, localPath);
      await this.mediaFilesService.updateFileSize(remoteId, fileSize);

      logger.info('Updated existing media file:', {
        remoteId,
        localPath,
        fileSize,
      });

      return true;
    } catch (error) {
      logger.error('Failed to update existing media file:', {
        remoteId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Debug method to help troubleshoot media file creation issues
   */
  async debugMediaFileCreation(
    completedFile: FileDownloadProgress,
    originalSearchResult: any,
    options: DownloadToMediaOptions = {}
  ): Promise<{
    isValid: boolean;
    issues: string[];
    extractedData: any;
    mediaFileData: any;
  }> {
    const issues: string[] = [];
    let extractedData: any = null;
    let mediaFileData: any = null;

    try {
      // Check search result
      if (!originalSearchResult || typeof originalSearchResult !== 'object') {
        issues.push('Invalid original search result provided');
        return { isValid: false, issues, extractedData, mediaFileData };
      }

      // Extract data
      const extractDataWithFallbacks = (searchResult: any) => {
        // Generate a unique ID if none exists
        const fallbackId =
          searchResult.id ||
          searchResult.remote_id ||
          searchResult.file_id ||
          `generated_${completedFile.fileName}_${Date.now()}`;

        // Extract chapter ID from start_verse_id if available
        const chapterId =
          searchResult.chapter_id ||
          searchResult.chapter ||
          (searchResult.start_verse_id
            ? searchResult.start_verse_id.split('_')[0]
            : null);

        return {
          id: fallbackId,
          language_entity_id:
            searchResult.language_entity_id ||
            searchResult.language_id ||
            searchResult.audio_version_id || // Try audio_version_id as fallback
            'unknown',
          sequence_id:
            searchResult.sequence_id ||
            searchResult.sequence ||
            `seq_${fallbackId}_${Date.now()}`,
          media_type: searchResult.media_type || searchResult.type || 'audio',
          file_size:
            searchResult.file_size ||
            searchResult.size ||
            completedFile.fileSize ||
            0,
          duration_seconds:
            searchResult.duration_seconds || searchResult.duration || 0,
          upload_status:
            searchResult.upload_status || searchResult.status || 'completed',
          publish_status: searchResult.publish_status || 'published',
          check_status: searchResult.check_status || 'checked',
          version: searchResult.version || 1,
          chapter_id: chapterId,
          verses: searchResult.verses || '[]',
          start_verse_id:
            searchResult.start_verse_id || searchResult.start_verse || null,
          end_verse_id:
            searchResult.end_verse_id || searchResult.end_verse || null,
        };
      };

      extractedData = extractDataWithFallbacks(originalSearchResult);

      // Validate extracted data
      if (!extractedData.id) {
        issues.push('Remote ID is required from search result');
      }
      // Allow 'unknown' language_entity_id and generate a fallback
      if (
        !extractedData.language_entity_id ||
        extractedData.language_entity_id === 'unknown'
      ) {
        logger.warn(
          'Language entity ID not found in search result, using fallback'
        );
        extractedData.language_entity_id = `fallback_${extractedData.id}_${Date.now()}`;
      }

      // Create media file data
      const fallbackSequenceId =
        extractedData.sequence_id ||
        `generated_${extractedData.id || completedFile.fileName}_${Date.now()}`;

      mediaFileData = {
        id: extractedData.id,
        language_entity_id:
          options.languageEntityId || extractedData.language_entity_id,
        sequence_id: fallbackSequenceId,
        media_type: options.mediaType || extractedData.media_type || 'audio',
        local_path: completedFile.fileName,
        remote_path: completedFile.filePath,
        file_size: extractedData.file_size || 0,
        duration_seconds: extractedData.duration_seconds || 0,
        upload_status:
          options.uploadStatus || extractedData.upload_status || 'completed',
        publish_status:
          options.publishStatus || extractedData.publish_status || 'published',
        check_status:
          options.checkStatus || extractedData.check_status || 'checked',
        version: options.version || extractedData.version || 1,
        deleted_at: null,
        chapter_id: options.chapterId || extractedData.chapter_id,
        verses:
          options.verses ||
          extractedData.verses ||
          this.buildVersesJson(
            extractedData.start_verse_id,
            extractedData.end_verse_id
          ),
      };

      // Validate media file data
      try {
        this.validateMediaFileData(mediaFileData);
      } catch (validationError) {
        issues.push(`Validation failed: ${(validationError as Error).message}`);
      }

      // Check database
      try {
        const db =
          await this.mediaFilesService['databaseManager'].getDatabase();
        await db.getFirstAsync('SELECT 1');

        const tableExists = await db.getFirstAsync(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='media_files'"
        );
        if (!tableExists) {
          issues.push('Media files table does not exist');
        }
      } catch (dbError) {
        issues.push(`Database error: ${(dbError as Error).message}`);
      }
    } catch (error) {
      issues.push(`Unexpected error: ${(error as Error).message}`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      extractedData,
      mediaFileData,
    };
  }

  /**
   * Static method to test media file creation with sample data
   */
  static async testMediaFileCreation(): Promise<void> {
    const service = DownloadToMediaService.getInstance();

    const testCompletedFile: FileDownloadProgress = {
      filePath: 'https://example.com/test.mp3',
      fileName: 'gen-1_7.mp3',
      progress: 1,
      status: 'completed',
      fileSize: 1024000,
    };

    const testSearchResult = {
      id: 'test_media_file_123',
      language_entity_id: 'lang_123',
      sequence_id: 'seq_123',
      media_type: 'audio',
      file_size: 1024000,
      duration_seconds: 120,
      upload_status: 'completed',
      publish_status: 'published',
      check_status: 'checked',
      version: 1,
      chapter_id: 'chapter_123',
      verses: '["verse_1", "verse_2"]',
    };

    const testOptions: DownloadToMediaOptions = {
      chapterId: 'chapter_123',
      mediaType: 'audio',
    };

    try {
      logger.info('Testing media file creation...');
      const debugResult = await service.debugMediaFileCreation(
        testCompletedFile,
        testSearchResult,
        testOptions
      );

      logger.info('Debug result:', {
        isValid: debugResult.isValid,
        issues: debugResult.issues,
        extractedData: debugResult.extractedData,
        mediaFileData: debugResult.mediaFileData,
      });

      if (debugResult.isValid) {
        const result = await service.addCompletedDownloadToMedia(
          testCompletedFile,
          testSearchResult,
          testOptions
        );
        logger.info('Test result:', result);
      }
    } catch (error) {
      logger.error('Test failed:', error);
    }
  }

  /**
   * Build verses JSON string from start and end verse IDs
   */
  private buildVersesJson(startVerseId?: string, endVerseId?: string): string {
    if (!startVerseId && !endVerseId) {
      return '[]';
    }

    const verses = [];
    if (startVerseId) {
      verses.push(startVerseId);
    }
    if (endVerseId && endVerseId !== startVerseId) {
      verses.push(endVerseId);
    }

    return JSON.stringify(verses);
  }

  /**
   * Validate media file data before saving
   */
  private validateMediaFileData(
    mediaFile: Omit<LocalMediaFile, 'created_at' | 'updated_at'>
  ): void {
    const errors: string[] = [];

    if (!mediaFile.id || mediaFile.id.trim() === '') {
      errors.push('Media file ID is required and cannot be empty');
    }
    if (
      !mediaFile.language_entity_id ||
      mediaFile.language_entity_id.trim() === ''
    ) {
      errors.push('Language entity ID is required and cannot be empty');
    }
    if (!mediaFile.sequence_id || mediaFile.sequence_id.trim() === '') {
      errors.push('Sequence ID is required and cannot be empty');
    }
    if (!mediaFile.media_type || mediaFile.media_type.trim() === '') {
      errors.push('Media type is required and cannot be empty');
    }
    if (!mediaFile.local_path || mediaFile.local_path.trim() === '') {
      errors.push('Local path is required and cannot be empty');
    }
    if (!mediaFile.remote_path || mediaFile.remote_path.trim() === '') {
      errors.push('Remote path is required and cannot be empty');
    }
    if (typeof mediaFile.file_size !== 'number' || mediaFile.file_size < 0) {
      errors.push('File size must be a non-negative number');
    }
    if (
      typeof mediaFile.duration_seconds !== 'number' ||
      mediaFile.duration_seconds < 0
    ) {
      errors.push('Duration must be a non-negative number');
    }
    if (typeof mediaFile.version !== 'number' || mediaFile.version < 1) {
      errors.push('Version must be at least 1');
    }
    if (!mediaFile.verses || typeof mediaFile.verses !== 'string') {
      errors.push('Verses must be a valid JSON string');
    }

    if (errors.length > 0) {
      throw new Error(`Media file validation failed: ${errors.join('; ')}`);
    }
  }
}

export const downloadToMediaService = DownloadToMediaService.getInstance();
