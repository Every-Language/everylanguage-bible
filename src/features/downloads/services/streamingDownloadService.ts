import * as FileSystem from 'expo-file-system';
import { logger } from '@/shared/utils/logger';

export interface StreamingDownloadOptions {
  minBytesForPlayback?: number; // Minimum bytes needed to start playback
  chunkSize?: number; // Size of chunks to download before allowing playback
  onChunkReady?: (filePath: string, bytesDownloaded: number) => void;
  onPlaybackReady?: (filePath: string) => void;
}

export interface StreamingDownloadState {
  filePath: string;
  localPath: string;
  bytesDownloaded: number;
  totalBytes: number;
  isPlaybackReady: boolean;
  isDownloading: boolean;
  error?: string;
}

export class StreamingDownloadService {
  private downloads = new Map<string, StreamingDownloadState>();
  private resumables = new Map<string, FileSystem.DownloadResumable>();

  /**
   * Start a streaming download that allows playback before completion
   */
  async startStreamingDownload(
    signedUrl: string,
    localPath: string,
    fileSize: number,
    options: StreamingDownloadOptions = {}
  ): Promise<string> {
    const {
      minBytesForPlayback = 1024 * 1024, // 1MB minimum
      chunkSize = 512 * 1024, // 512KB chunks
      onChunkReady,
      onPlaybackReady,
    } = options;

    const downloadId = `streaming_${Date.now()}_${Math.random()}`;

    const downloadState: StreamingDownloadState = {
      filePath: signedUrl,
      localPath,
      bytesDownloaded: 0,
      totalBytes: fileSize,
      isPlaybackReady: false,
      isDownloading: true,
    };

    this.downloads.set(downloadId, downloadState);

    try {
      // Create resumable download
      const resumable = FileSystem.createDownloadResumable(
        signedUrl,
        localPath,
        {},
        downloadProgress => {
          const { totalBytesWritten, totalBytesExpectedToWrite } =
            downloadProgress;

          // Update state
          downloadState.bytesDownloaded = totalBytesWritten;
          downloadState.totalBytes = totalBytesExpectedToWrite;

          // Check if we have enough data for playback
          if (
            !downloadState.isPlaybackReady &&
            totalBytesWritten >= minBytesForPlayback
          ) {
            downloadState.isPlaybackReady = true;

            // Add a small delay to ensure file is written to disk
            setTimeout(() => {
              onPlaybackReady?.(localPath);
            }, 1000);

            logger.info('Streaming download ready for playback:', {
              downloadId,
              bytesDownloaded: totalBytesWritten,
              minBytesForPlayback,
            });
          }

          // Notify on chunk ready
          if (totalBytesWritten % chunkSize === 0) {
            onChunkReady?.(localPath, totalBytesWritten);
          }

          logger.debug('Streaming download progress:', {
            downloadId,
            progress: totalBytesWritten / totalBytesExpectedToWrite,
            bytesDownloaded: totalBytesWritten,
            isPlaybackReady: downloadState.isPlaybackReady,
          });
        }
      );

      this.resumables.set(downloadId, resumable);

      // Start download in background
      resumable
        .downloadAsync()
        .then(() => {
          downloadState.isDownloading = false;
          logger.info('Streaming download completed:', downloadId);
        })
        .catch(error => {
          downloadState.error = error.message;
          downloadState.isDownloading = false;
          logger.error('Streaming download failed:', { downloadId, error });
        });

      return downloadId;
    } catch (error) {
      downloadState.error =
        error instanceof Error ? error.message : 'Unknown error';
      downloadState.isDownloading = false;
      throw error;
    }
  }

  /**
   * Check if a file is ready for playback
   */
  isPlaybackReady(downloadId: string): boolean {
    const download = this.downloads.get(downloadId);
    return download?.isPlaybackReady ?? false;
  }

  /**
   * Get download state
   */
  getDownloadState(downloadId: string): StreamingDownloadState | undefined {
    return this.downloads.get(downloadId);
  }

  /**
   * Pause a streaming download
   */
  async pauseDownload(downloadId: string): Promise<void> {
    const resumable = this.resumables.get(downloadId);
    if (resumable) {
      await resumable.savable();
      const download = this.downloads.get(downloadId);
      if (download) {
        download.isDownloading = false;
      }
    }
  }

  /**
   * Resume a paused download
   */
  async resumeDownload(downloadId: string): Promise<void> {
    const resumable = this.resumables.get(downloadId);
    if (resumable) {
      await resumable.downloadAsync();
      const download = this.downloads.get(downloadId);
      if (download) {
        download.isDownloading = true;
      }
    }
  }

  /**
   * Cancel a streaming download
   */
  async cancelDownload(downloadId: string): Promise<void> {
    const resumable = this.resumables.get(downloadId);
    if (resumable) {
      // Note: Expo doesn't have a direct cancel method, but we can stop tracking
      this.resumables.delete(downloadId);
      this.downloads.delete(downloadId);

      // Optionally delete the partial file
      const download = this.downloads.get(downloadId);
      if (download) {
        try {
          await FileSystem.deleteAsync(download.localPath);
        } catch (error) {
          logger.warn('Failed to delete partial file:', error);
        }
      }
    }
  }

  /**
   * Validate if a partial file can be played
   */
  async validatePartialFile(localPath: string): Promise<{
    isValid: boolean;
    error?: string;
    fileSize: number;
  }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (!fileInfo.exists) {
        return { isValid: false, error: 'File does not exist', fileSize: 0 };
      }

      if (fileInfo.size === 0) {
        return { isValid: false, error: 'File is empty', fileSize: 0 };
      }

      // Basic validation - file exists and has content
      return { isValid: true, fileSize: fileInfo.size };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        fileSize: 0,
      };
    }
  }
}

export const streamingDownloadService = new StreamingDownloadService();
