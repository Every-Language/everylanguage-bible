import { logger } from '@/shared/utils/logger';
import { FileDownloadProgress } from '../hooks/useDownloadProgress';
import {
  downloadToMediaService,
  DownloadToMediaOptions,
} from '../services/downloadToMediaService';

// interface SearchResult {
//   remote_path: string;
//   file_size: number;
// }

export interface DownloadCompletionOptions {
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  autoCloseModal?: boolean;
  refreshDownloads?: boolean;
  // Media file integration options
  addToMediaFiles?: boolean;
  originalSearchResults?: Record<string, unknown>[]; // Original search results from the download (can be SearchResult[] or MediaFile[])
  mediaFileOptions?: DownloadToMediaOptions;
  onSuccess?: () => void;
  onError?: (failedFiles: FileDownloadProgress[]) => void;
  onComplete?: (
    completedFiles: FileDownloadProgress[],
    failedFiles: FileDownloadProgress[],
    totalFiles: number
  ) => void;
  onMediaFileAdded?: (mediaFileId: string, fileName: string) => void;
  onMediaFileError?: (fileName: string, error: string) => void;
}

export interface DownloadCompletionResult {
  success: boolean;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  failedFiles: FileDownloadProgress[];
  completedFiles: FileDownloadProgress[];
}

/**
 * Comprehensive download completion handler
 * This function can be used as a callback for download completion
 */
export const handleDownloadCompletion = async (
  completedFiles: FileDownloadProgress[],
  failedFiles: FileDownloadProgress[],
  totalFiles: number,
  options: DownloadCompletionOptions = {}
): Promise<DownloadCompletionResult> => {
  const {
    showSuccessNotification = true,
    showErrorNotification = true,
    autoCloseModal = false,
    refreshDownloads = true,
    addToMediaFiles = false,
    originalSearchResults = [],
    mediaFileOptions = {},
    onSuccess,
    onError,
    onComplete,
    onMediaFileAdded,
    onMediaFileError,
  } = options;

  const result: DownloadCompletionResult = {
    success: failedFiles.length === 0,
    completedCount: completedFiles.length,
    failedCount: failedFiles.length,
    totalCount: totalFiles,
    failedFiles,
    completedFiles,
  };

  logger.info('Download completion handler executed', {
    completedCount: completedFiles.length,
    failedCount: failedFiles.length,
    totalCount: totalFiles,
    success: result.success,
  });

  // Handle successful downloads
  if (completedFiles.length > 0) {
    logger.info('Downloads completed successfully', {
      count: completedFiles.length,
      files: completedFiles.map(f => f.fileName),
    });

    if (showSuccessNotification) {
      // You can integrate with your notification system here
      logger.info(`Successfully downloaded ${completedFiles.length} files`);
    }

    // Add completed downloads to media files table if requested
    if (addToMediaFiles && originalSearchResults.length > 0) {
      logger.info('Adding completed downloads to media files table');

      try {
        const mediaResult =
          await downloadToMediaService.addCompletedDownloadsToMedia(
            completedFiles,
            originalSearchResults,
            mediaFileOptions
          );

        if (mediaResult.success) {
          logger.info('Successfully added all downloads to media files table', {
            count: mediaResult.successfulCount,
          });
        } else {
          logger.warn(
            'Some downloads failed to be added to media files table',
            {
              successful: mediaResult.successfulCount,
              failed: mediaResult.failedCount,
            }
          );
        }

        // Call individual callbacks for each media file result
        mediaResult.results.forEach((result, index) => {
          const completedFile = completedFiles[index];
          if (completedFile) {
            if (result.success && result.mediaFileId && onMediaFileAdded) {
              onMediaFileAdded(result.mediaFileId, completedFile.fileName);
            } else if (!result.success && onMediaFileError) {
              onMediaFileError(
                completedFile.fileName,
                result.error || 'Unknown error'
              );
            }
          }
        });
      } catch (error) {
        logger.error('Failed to add downloads to media files table:', error);
        // Call error callbacks for all files
        completedFiles.forEach(file => {
          if (onMediaFileError) {
            onMediaFileError(
              file.fileName,
              (error as Error).message || 'Unknown error'
            );
          }
        });
      }
    }

    if (onSuccess) {
      onSuccess();
    }
  }

  // Handle failed downloads
  if (failedFiles.length > 0) {
    logger.warn('Some downloads failed', {
      count: failedFiles.length,
      files: failedFiles.map(f => ({ fileName: f.fileName, error: f.error })),
    });

    if (showErrorNotification) {
      // You can integrate with your notification system here
      logger.warn(`${failedFiles.length} downloads failed`);
    }

    if (onError) {
      onError(failedFiles);
    }
  }

  // Handle overall completion
  if (onComplete) {
    onComplete(completedFiles, failedFiles, totalFiles);
  }

  // Auto-close modal if all downloads succeeded
  if (autoCloseModal && result.success) {
    logger.info('Auto-closing modal due to successful downloads');
    // You can trigger modal close here if needed
  }

  // Refresh downloads list
  if (refreshDownloads) {
    logger.info('Refreshing downloads list');
    // You can trigger a refresh of the downloads list here
  }

  return result;
};

/**
 * Create a download completion callback with specific options
 */
export const createDownloadCompletionCallback = (
  options: DownloadCompletionOptions = {}
) => {
  return async (
    completedFiles: FileDownloadProgress[],
    failedFiles: FileDownloadProgress[],
    totalFiles: number
  ): Promise<void> => {
    await handleDownloadCompletion(
      completedFiles,
      failedFiles,
      totalFiles,
      options
    );
  };
};

/**
 * Get download statistics from progress data
 */
export const getDownloadStats = (downloadProgress: FileDownloadProgress[]) => {
  const totalFiles = downloadProgress.length;
  const completedFiles = downloadProgress.filter(f => f.status === 'completed');
  const failedFiles = downloadProgress.filter(f => f.status === 'failed');
  const downloadingFiles = downloadProgress.filter(
    f => f.status === 'downloading'
  );
  const pendingFiles = downloadProgress.filter(f => f.status === 'pending');

  const totalSize = downloadProgress.reduce(
    (sum, file) => sum + (file.fileSize || 0),
    0
  );
  const downloadedSize = completedFiles.reduce(
    (sum, file) => sum + (file.fileSize || 0),
    0
  );

  return {
    totalFiles,
    completedFiles: completedFiles.length,
    failedFiles: failedFiles.length,
    downloadingFiles: downloadingFiles.length,
    pendingFiles: pendingFiles.length,
    totalSize,
    downloadedSize,
    progress:
      totalFiles > 0
        ? (completedFiles.length + failedFiles.length) / totalFiles
        : 0,
  };
};

/**
 * Format download progress for display
 */
export const formatDownloadProgress = (progress: number): string => {
  return `${Math.round(progress * 100)}%`;
};

/**
 * Check if all downloads are complete
 */
export const isAllDownloadsComplete = (
  downloadProgress: FileDownloadProgress[]
): boolean => {
  if (downloadProgress.length === 0) return false;

  return downloadProgress.every(
    file => file.status === 'completed' || file.status === 'failed'
  );
};

/**
 * Get files that need to be retried
 */
export const getFailedFilesForRetry = (
  downloadProgress: FileDownloadProgress[]
): FileDownloadProgress[] => {
  return downloadProgress.filter(file => file.status === 'failed');
};
