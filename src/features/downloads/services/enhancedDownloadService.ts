import { downloadService } from './downloadService';
import { streamingDownloadService } from './streamingDownloadService';
import { logger } from '@/shared/utils/logger';
import { MediaTrack } from '@/features/media/types';
import * as FileSystem from 'expo-file-system';
import { downloadServiceConfig } from './config';
import { urlSigningService } from './urlSigningService';

export interface StreamingDownloadOptions {
  enableStreaming?: boolean;
  minBytesForPlayback?: number;
  autoPlayWhenReady?: boolean;
  onStreamingProgress?: (progress: number) => void;
  onPlaybackReady?: (track: MediaTrack) => void;
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

export interface EnhancedDownloadResult {
  downloadId: string;
  streamingDownloadId?: string;
  success: boolean;
  error?: string;
  mediaFileId?: string;
}

export class EnhancedDownloadService {
  private static instance: EnhancedDownloadService;
  private streamingDownloads = new Map<string, string>(); // downloadId -> streamingDownloadId

  private constructor() {}

  static getInstance(): EnhancedDownloadService {
    if (!EnhancedDownloadService.instance) {
      EnhancedDownloadService.instance = new EnhancedDownloadService();
    }
    return EnhancedDownloadService.instance;
  }

  /**
   * Download a single file with optional streaming playback
   */
  async downloadFileWithStreaming(
    filePath: string,
    fileName: string,
    fileSize: number,
    track: MediaTrack,
    options: StreamingDownloadOptions = {}
  ): Promise<EnhancedDownloadResult> {
    const {
      enableStreaming = true,
      minBytesForPlayback = 1024 * 1024, // 1MB
      onStreamingProgress,
      onPlaybackReady,
      onDownloadComplete,
      onError,
    } = options;

    try {
      logger.info('Starting enhanced download with streaming:', {
        filePath,
        fileName,
        fileSize,
        enableStreaming,
      });

      // Get signed URL first
      const signedUrl = await this.getSignedUrl(filePath);
      if (!signedUrl) {
        throw new Error('Failed to get signed URL for download');
      }

      logger.info('Got signed URL for streaming download:', {
        filePath,
        signedUrlLength: signedUrl.length,
      });

      // Generate local path
      const localPath = await this.generateLocalPath(fileName);

      logger.info('Generated local path for streaming download:', {
        fileName,
        localPath,
        downloadsDirectory: downloadServiceConfig.downloadsDirectory,
      });

      if (enableStreaming) {
        logger.info('Starting streaming download service:', {
          signedUrl: signedUrl.substring(0, 50) + '...',
          localPath,
          fileSize,
        });

        // Start streaming download
        const streamingDownloadId =
          await streamingDownloadService.startStreamingDownload(
            signedUrl,
            localPath,
            fileSize,
            {
              minBytesForPlayback,
              onChunkReady: (filePath, bytesDownloaded) => {
                const progress = bytesDownloaded / fileSize;
                onStreamingProgress?.(progress);
              },
              onPlaybackReady: async () => {
                logger.info('Streaming playback ready for:', fileName);

                // Update track with local file path
                const updatedTrack: MediaTrack = {
                  ...track,
                  url: localPath,
                  subtitle: track.subtitle || '',
                };

                logger.info('Updated track for playback:', {
                  trackId: updatedTrack.id,
                  trackUrl: updatedTrack.url,
                  localPath,
                });

                // Trigger playback ready callback with the updated track
                onPlaybackReady?.(updatedTrack);
              },
            }
          );

        logger.info('Streaming download service started successfully:', {
          streamingDownloadId,
          fileName,
        });

        // Also add to regular download queue for completion tracking and media database integration
        logger.info(
          'Adding to regular download queue for completion tracking:',
          {
            filePath,
            fileName,
          }
        );

        const downloadId = await downloadService.addToQueue(
          filePath,
          fileName,
          {
            fileSize,
            addToMediaFiles: true, // Ensure it's added to media database
            onComplete: () => {
              logger.info(
                'Regular download completed and added to media database:',
                fileName
              );
              onDownloadComplete?.();
            },
            onError: error => {
              logger.error('Regular download error:', error);
              onError?.(error);
            },
          }
        );

        logger.info('Added to regular download queue:', {
          downloadId,
          fileName,
        });

        // Track the relationship
        this.streamingDownloads.set(downloadId, streamingDownloadId);

        return {
          downloadId,
          streamingDownloadId,
          success: true,
        };
      } else {
        // Regular download without streaming
        logger.info('Starting regular download without streaming:', {
          filePath,
          fileName,
        });

        const downloadId = await downloadService.addToQueue(
          filePath,
          fileName,
          {
            fileSize,
            onComplete: () => {
              logger.info('Regular download completed:', fileName);
              onDownloadComplete?.();
            },
            onError: error => {
              logger.error('Regular download error:', error);
              onError?.(error);
            },
          }
        );

        logger.info('Regular download added to queue:', {
          downloadId,
          fileName,
        });

        return {
          downloadId,
          success: true,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Enhanced download failed:', {
        filePath,
        fileName,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      onError?.(errorMessage);

      return {
        downloadId: '',
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Download a batch of files with streaming for the first file
   */
  async downloadBatchWithStreaming(
    files: Array<{
      filePath: string;
      fileName: string;
      fileSize: number;
      track?: MediaTrack;
    }>,
    options: StreamingDownloadOptions & {
      streamFirstFile?: boolean;
    } = {}
  ): Promise<EnhancedDownloadResult[]> {
    const { streamFirstFile = true, ...streamingOptions } = options;

    const results: EnhancedDownloadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const isFirstFile = i === 0;
      const shouldStream = streamFirstFile && isFirstFile && file.track;

      if (shouldStream && file.track) {
        // Stream the first file
        const result = await this.downloadFileWithStreaming(
          file.filePath,
          file.fileName,
          file.fileSize,
          file.track,
          streamingOptions
        );
        results.push(result);
      } else {
        // Regular download for other files
        const downloadId = await downloadService.addToQueue(
          file.filePath,
          file.fileName,
          {
            fileSize: file.fileSize,
          }
        );

        results.push({
          downloadId,
          success: true,
        });
      }
    }

    return results;
  }

  /**
   * Get signed URL for a file
   */
  private async getSignedUrl(filePath: string): Promise<string | null> {
    try {
      // Use the existing URL signing service
      const signedUrls = await urlSigningService.getSignedUrlsForExternalUrls([
        filePath,
      ]);
      const signedUrl = signedUrls.urls[filePath];

      if (!signedUrl) {
        throw new Error('Failed to get signed URL for file');
      }

      return signedUrl;
    } catch (error) {
      logger.error('Failed to get signed URL:', error);
      return null;
    }
  }

  /**
   * Generate local file path
   */
  private async generateLocalPath(fileName: string): Promise<string> {
    // Use the existing download service config for consistency
    const downloadsDir = downloadServiceConfig.downloadsDirectory;

    // Ensure the downloads directory exists
    try {
      const dirInfo = await FileSystem.getInfoAsync(downloadsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadsDir, {
          intermediates: true,
        });
      }
    } catch (error) {
      logger.warn('Failed to ensure downloads directory exists:', error);
    }

    return `${downloadsDir}${fileName}`;
  }

  /**
   * Cancel a streaming download
   */
  async cancelStreamingDownload(downloadId: string): Promise<void> {
    const streamingDownloadId = this.streamingDownloads.get(downloadId);
    if (streamingDownloadId) {
      await streamingDownloadService.cancelDownload(streamingDownloadId);
      this.streamingDownloads.delete(downloadId);
    }

    // Also cancel the regular download
    await downloadService.cancelDownload(downloadId);
  }

  /**
   * Pause a streaming download
   */
  async pauseStreamingDownload(downloadId: string): Promise<void> {
    const streamingDownloadId = this.streamingDownloads.get(downloadId);
    if (streamingDownloadId) {
      await streamingDownloadService.pauseDownload(streamingDownloadId);
    }

    // Also pause the regular download
    await downloadService.pauseDownload(downloadId);
  }

  /**
   * Resume a streaming download
   */
  async resumeStreamingDownload(downloadId: string): Promise<void> {
    const streamingDownloadId = this.streamingDownloads.get(downloadId);
    if (streamingDownloadId) {
      await streamingDownloadService.resumeDownload(streamingDownloadId);
    }

    // Also resume the regular download
    await downloadService.resumeDownload(downloadId);
  }

  /**
   * Get streaming download state
   */
  getStreamingDownloadState(downloadId: string) {
    const streamingDownloadId = this.streamingDownloads.get(downloadId);
    if (streamingDownloadId) {
      return streamingDownloadService.getDownloadState(streamingDownloadId);
    }
    return undefined;
  }

  /**
   * Check if a download is ready for streaming playback
   */
  isStreamingPlaybackReady(downloadId: string): boolean {
    const streamingDownloadId = this.streamingDownloads.get(downloadId);
    if (streamingDownloadId) {
      return streamingDownloadService.isPlaybackReady(streamingDownloadId);
    }
    return false;
  }
}

export const enhancedDownloadService = EnhancedDownloadService.getInstance();
