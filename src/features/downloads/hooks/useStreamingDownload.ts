import { useState, useCallback, useRef } from 'react';
import { logger } from '@/shared/utils/logger';
import { enhancedDownloadService } from '../services/enhancedDownloadService';
import { useStreamingAudio } from '@/features/media/hooks/useStreamingAudio';
import { MediaTrack } from '@/features/media/types';
import * as FileSystem from 'expo-file-system';
import { ensureOfflineAvailability } from '../utils/offlineAvailabilityUtils';

export interface StreamingDownloadOptions {
  enableStreaming?: boolean;
  minBytesForPlayback?: number;
  autoPlayWhenReady?: boolean;
  onDownloadProgress?: (progress: number) => void;
  onPlaybackReady?: (track: MediaTrack) => void;
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

export interface StreamingDownloadState {
  isDownloading: boolean;
  isStreaming: boolean;
  isPlaybackReady: boolean;
  downloadProgress: number;
  streamingProgress: number;
  currentFileIndex: number;
  totalFiles: number;
  error?: string;
}

export const useStreamingDownload = (
  options: StreamingDownloadOptions = {}
) => {
  const {
    enableStreaming = true,
    minBytesForPlayback = 1024 * 1024, // 1MB
    autoPlayWhenReady = true,
    onDownloadProgress,
    onPlaybackReady,
    onDownloadComplete,
    onError,
  } = options;

  const [state, setState] = useState<StreamingDownloadState>({
    isDownloading: false,
    isStreaming: false,
    isPlaybackReady: false,
    downloadProgress: 0,
    streamingProgress: 0,
    currentFileIndex: 0,
    totalFiles: 0,
  });

  const downloadIdsRef = useRef<string[]>([]);
  const currentTrackRef = useRef<MediaTrack | null>(null);

  // Use streaming audio hook for playback
  const { audioActions } = useStreamingAudio({
    minBytesForPlayback,
    autoPlayWhenReady,
    onPlaybackReady: () => {
      setState(prev => ({ ...prev, isPlaybackReady: true }));
      onPlaybackReady?.(currentTrackRef.current!);
    },
    onError: error => {
      setState(prev => ({ ...prev, error }));
      onError?.(error);
    },
  });

  /**
   * Start streaming download for a batch of files
   */
  const startStreamingDownload = useCallback(
    async (
      files: Array<{
        filePath: string;
        fileName: string;
        fileSize: number;
        track?: MediaTrack;
      }>,
      batchOptions?: {
        streamFirstFile?: boolean;
        batchId?: string;
        metadata?: Record<string, unknown>;
      }
    ) => {
      if (files.length === 0) return;

      logger.info('useStreamingDownload.startStreamingDownload called with:', {
        filesCount: files.length,
        files: files.map(f => ({
          filePath: f.filePath,
          fileName: f.fileName,
          fileSize: f.fileSize,
        })),
        batchOptions,
      });

      try {
        setState(prev => ({
          ...prev,
          isDownloading: true,
          isStreaming: enableStreaming,
          isPlaybackReady: false,
          downloadProgress: 0,
          streamingProgress: 0,
          currentFileIndex: 0,
          totalFiles: files.length,
        }));

        const { streamFirstFile = true } = batchOptions || {};

        if (enableStreaming && streamFirstFile && files[0]?.track) {
          logger.info('Starting streaming download for first file');

          // Start streaming download for the first file
          const firstFile = files[0];
          if (!firstFile.track) {
            throw new Error('Track is required for streaming download');
          }
          currentTrackRef.current = firstFile.track;

          logger.info(
            'Calling enhancedDownloadService.downloadFileWithStreaming'
          );

          const result =
            await enhancedDownloadService.downloadFileWithStreaming(
              firstFile.filePath,
              firstFile.fileName,
              firstFile.fileSize,
              firstFile.track,
              {
                enableStreaming: true,
                minBytesForPlayback,
                autoPlayWhenReady,
                onStreamingProgress: progress => {
                  setState(prev => ({ ...prev, streamingProgress: progress }));
                  onDownloadProgress?.(progress);
                },
                onPlaybackReady: async (updatedTrack: MediaTrack) => {
                  logger.info('Streaming playback ready for first file');

                  // Verify the file actually exists before trying to play it
                  if (!updatedTrack.url) {
                    logger.error('No URL provided for track:', updatedTrack.id);
                    return;
                  }

                  // Wait for file to exist with retry mechanism
                  let fileExists = false;
                  let attempts = 0;
                  const maxAttempts = 10;
                  const delayMs = 500;

                  while (!fileExists && attempts < maxAttempts) {
                    try {
                      const fileInfo = await FileSystem.getInfoAsync(
                        updatedTrack.url
                      );
                      if (
                        fileInfo.exists &&
                        'size' in fileInfo &&
                        fileInfo.size > 0
                      ) {
                        fileExists = true;
                        logger.info('File exists and is ready for playback:', {
                          filePath: updatedTrack.url,
                          fileSize: fileInfo.size,
                          attempts,
                        });
                      } else {
                        logger.debug('File not ready yet, waiting...', {
                          filePath: updatedTrack.url,
                          attempts: attempts + 1,
                          exists: fileInfo.exists,
                        });
                        await new Promise(resolve =>
                          setTimeout(resolve, delayMs)
                        );
                        attempts++;
                      }
                    } catch (error) {
                      logger.warn(
                        'Error checking file existence, retrying:',
                        error
                      );
                      await new Promise(resolve =>
                        setTimeout(resolve, delayMs)
                      );
                      attempts++;
                    }
                  }

                  if (!fileExists) {
                    logger.error(
                      'File never became available for playback:',
                      updatedTrack.url
                    );
                    return;
                  }

                  // Verify offline availability
                  const isOfflineAvailable = await ensureOfflineAvailability(
                    updatedTrack.url
                  );
                  if (!isOfflineAvailable) {
                    logger.warn(
                      'File not properly available offline, but continuing with playback:',
                      updatedTrack.url
                    );
                  } else {
                    logger.info(
                      'File confirmed available for offline playback:',
                      updatedTrack.url
                    );
                  }

                  // Convert to MediaPlayerTrack format
                  const playerTrack = {
                    id: updatedTrack.id,
                    title: updatedTrack.title,
                    subtitle: updatedTrack.subtitle || '',
                    duration: updatedTrack.duration,
                    currentTime: updatedTrack.currentTime,
                    url: updatedTrack.url,
                  };

                  // Set the track and start playing
                  await audioActions.setCurrentTrack(playerTrack);
                  if (autoPlayWhenReady) {
                    await audioActions.play();
                  }
                },
                onDownloadComplete: async () => {
                  logger.info('First file download completed');

                  // Verify offline availability after download completion
                  if (currentTrackRef.current?.url) {
                    const isOfflineAvailable = await ensureOfflineAvailability(
                      currentTrackRef.current.url
                    );
                    if (isOfflineAvailable) {
                      logger.info(
                        'Download completed and file is available offline:',
                        currentTrackRef.current.url
                      );
                    } else {
                      logger.warn(
                        'Download completed but file may not be properly available offline:',
                        currentTrackRef.current.url
                      );
                    }
                  }

                  setState(prev => ({
                    ...prev,
                    currentFileIndex: 1,
                    downloadProgress: 1 / files.length,
                  }));
                },
                onError: error => {
                  setState(prev => ({ ...prev, error }));
                  onError?.(error);
                },
              }
            );

          logger.info('Enhanced download service result:', result);
          downloadIdsRef.current = [result.downloadId];

          // Download remaining files normally
          if (files.length > 1) {
            const remainingFiles = files.slice(1);
            const remainingResults =
              await enhancedDownloadService.downloadBatchWithStreaming(
                remainingFiles,
                {
                  streamFirstFile: false, // Don't stream remaining files
                }
              );

            downloadIdsRef.current.push(
              ...remainingResults.map(r => r.downloadId)
            );
          }
        } else {
          // Regular batch download without streaming
          const results =
            await enhancedDownloadService.downloadBatchWithStreaming(files, {
              streamFirstFile: false,
            });

          downloadIdsRef.current = results.map(r => r.downloadId);
        }

        logger.info('Streaming download started:', {
          totalFiles: files.length,
          enableStreaming,
          streamFirstFile,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isDownloading: false,
          isStreaming: false,
        }));
        onError?.(errorMessage);
        logger.error('Streaming download failed:', error);
      }
    },
    [
      enableStreaming,
      minBytesForPlayback,
      autoPlayWhenReady,
      onDownloadProgress,
      onPlaybackReady,
      onDownloadComplete,
      onError,
      audioActions,
    ]
  );

  /**
   * Cancel all downloads
   */
  const cancelDownloads = useCallback(async () => {
    try {
      for (const downloadId of downloadIdsRef.current) {
        await enhancedDownloadService.cancelStreamingDownload(downloadId);
      }

      setState(prev => ({
        ...prev,
        isDownloading: false,
        isStreaming: false,
        isPlaybackReady: false,
        downloadProgress: 0,
        streamingProgress: 0,
        currentFileIndex: 0,
        totalFiles: 0,
      }));

      downloadIdsRef.current = [];
      currentTrackRef.current = null;

      logger.info('All streaming downloads cancelled');
    } catch (error) {
      logger.error('Failed to cancel downloads:', error);
    }
  }, []);

  /**
   * Pause all downloads
   */
  const pauseDownloads = useCallback(async () => {
    try {
      for (const downloadId of downloadIdsRef.current) {
        await enhancedDownloadService.pauseStreamingDownload(downloadId);
      }

      setState(prev => ({
        ...prev,
        isDownloading: false,
      }));

      logger.info('All streaming downloads paused');
    } catch (error) {
      logger.error('Failed to pause downloads:', error);
    }
  }, []);

  /**
   * Resume all downloads
   */
  const resumeDownloads = useCallback(async () => {
    try {
      for (const downloadId of downloadIdsRef.current) {
        await enhancedDownloadService.resumeStreamingDownload(downloadId);
      }

      setState(prev => ({
        ...prev,
        isDownloading: true,
      }));

      logger.info('All streaming downloads resumed');
    } catch (error) {
      logger.error('Failed to resume downloads:', error);
    }
  }, []);

  /**
   * Check if any download is ready for streaming playback
   */
  const isAnyDownloadReadyForPlayback = useCallback(() => {
    return downloadIdsRef.current.some(downloadId =>
      enhancedDownloadService.isStreamingPlaybackReady(downloadId)
    );
  }, []);

  /**
   * Get current streaming download state
   */
  const getStreamingDownloadState = useCallback((downloadId: string) => {
    return enhancedDownloadService.getStreamingDownloadState(downloadId);
  }, []);

  return {
    // State
    state,

    // Actions
    startStreamingDownload,
    cancelDownloads,
    pauseDownloads,
    resumeDownloads,
    isAnyDownloadReadyForPlayback,
    getStreamingDownloadState,

    // Audio actions
    audioActions,
  };
};
