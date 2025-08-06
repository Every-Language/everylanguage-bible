import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/shared/utils/logger';
import { streamingDownloadService } from '@/features/downloads/services/streamingDownloadService';
import { validatePartialAudioFile } from '@/features/media/utils/streamingAudioUtils';
import { useAudioService } from './useAudioService';
import { MediaTrack } from '../types';

export interface StreamingAudioOptions {
  minBytesForPlayback?: number;
  autoPlayWhenReady?: boolean;
  onDownloadProgress?: (progress: number) => void;
  onPlaybackReady?: () => void;
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

export interface StreamingAudioState {
  isDownloading: boolean;
  isPlaybackReady: boolean;
  downloadProgress: number;
  fileSize: number;
  downloadedBytes: number;
  error?: string;
}

export const useStreamingAudio = (options: StreamingAudioOptions = {}) => {
  const {
    minBytesForPlayback = 1024 * 1024, // 1MB
    autoPlayWhenReady = true,
    onDownloadProgress,
    onPlaybackReady,
    onDownloadComplete,
    onError,
  } = options;

  const [streamingState, setStreamingState] = useState<StreamingAudioState>({
    isDownloading: false,
    isPlaybackReady: false,
    downloadProgress: 0,
    fileSize: 0,
    downloadedBytes: 0,
  });

  const downloadIdRef = useRef<string | null>(null);
  const currentTrackRef = useRef<MediaTrack | null>(null);

  // Use the existing audio service
  const { state: audioState, actions: audioActions } = useAudioService({
    autoPlay: false,
    onError: error => {
      logger.error('Streaming audio error:', error);
      onError?.(error);
    },
  });

  /**
   * Start streaming download and playback
   */
  const startStreamingPlayback = useCallback(
    async (
      signedUrl: string,
      localPath: string,
      fileSize: number,
      track: MediaTrack
    ) => {
      try {
        setStreamingState(prev => ({
          ...prev,
          isDownloading: true,
          fileSize,
        }));

        currentTrackRef.current = track;

        // Start streaming download
        const downloadId =
          await streamingDownloadService.startStreamingDownload(
            signedUrl,
            localPath,
            fileSize,
            {
              minBytesForPlayback,
              onChunkReady: (filePath, bytesDownloaded) => {
                const progress = bytesDownloaded / fileSize;
                setStreamingState(prev => ({
                  ...prev,
                  downloadProgress: progress,
                  downloadedBytes: bytesDownloaded,
                }));
                onDownloadProgress?.(progress);
              },
              onPlaybackReady: async filePath => {
                logger.info('Streaming playback ready:', {
                  filePath,
                  fileSize,
                });

                // Validate the partial file
                const validation = await validatePartialAudioFile(
                  filePath,
                  fileSize
                );
                if (!validation.canPlay) {
                  throw new Error(
                    `Partial file cannot be played: ${validation.error}`
                  );
                }

                setStreamingState(prev => ({
                  ...prev,
                  isPlaybackReady: true,
                }));

                // Update track with partial file info - convert to MediaPlayerTrack format
                const updatedTrack = {
                  id: track.id,
                  title: track.title,
                  subtitle: track.subtitle || '',
                  duration: track.duration,
                  currentTime: track.currentTime,
                  url: filePath,
                };

                // Load and play the audio
                await audioActions.setCurrentTrack(updatedTrack);

                if (autoPlayWhenReady) {
                  await audioActions.play();
                }

                onPlaybackReady?.();
              },
            }
          );

        downloadIdRef.current = downloadId;

        // Monitor download completion
        const checkCompletion = async () => {
          const downloadState =
            streamingDownloadService.getDownloadState(downloadId);
          if (downloadState && !downloadState.isDownloading) {
            if (downloadState.error) {
              throw new Error(downloadState.error);
            }

            setStreamingState(prev => ({
              ...prev,
              isDownloading: false,
              downloadProgress: 1,
              downloadedBytes: fileSize,
            }));

            onDownloadComplete?.();
          } else {
            setTimeout(checkCompletion, 1000);
          }
        };

        checkCompletion();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setStreamingState(prev => ({
          ...prev,
          error: errorMessage,
          isDownloading: false,
        }));
        onError?.(errorMessage);
        logger.error('Streaming playback failed:', error);
      }
    },
    [
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
   * Pause streaming download
   */
  const pauseDownload = useCallback(async () => {
    if (downloadIdRef.current) {
      await streamingDownloadService.pauseDownload(downloadIdRef.current);
      setStreamingState(prev => ({
        ...prev,
        isDownloading: false,
      }));
    }
  }, []);

  /**
   * Resume streaming download
   */
  const resumeDownload = useCallback(async () => {
    if (downloadIdRef.current) {
      await streamingDownloadService.resumeDownload(downloadIdRef.current);
      setStreamingState(prev => ({
        ...prev,
        isDownloading: true,
      }));
    }
  }, []);

  /**
   * Cancel streaming download
   */
  const cancelDownload = useCallback(async () => {
    if (downloadIdRef.current) {
      await streamingDownloadService.cancelDownload(downloadIdRef.current);
      downloadIdRef.current = null;
      setStreamingState({
        isDownloading: false,
        isPlaybackReady: false,
        downloadProgress: 0,
        fileSize: 0,
        downloadedBytes: 0,
      });
    }
  }, []);

  /**
   * Check if playback is ready
   */
  const isPlaybackReady = useCallback(() => {
    return streamingState.isPlaybackReady;
  }, [streamingState.isPlaybackReady]);

  /**
   * Get current download state
   */
  const getDownloadState = useCallback(() => {
    if (downloadIdRef.current) {
      return streamingDownloadService.getDownloadState(downloadIdRef.current);
    }
    return undefined;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (downloadIdRef.current) {
        streamingDownloadService
          .cancelDownload(downloadIdRef.current)
          .catch(error => {
            logger.warn('Failed to cancel download on cleanup:', error);
          });
      }
    };
  }, []);

  return {
    // Streaming state
    streamingState,

    // Audio state (from useAudioService)
    audioState,

    // Actions
    startStreamingPlayback,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    isPlaybackReady,
    getDownloadState,

    // Audio actions (from useAudioService)
    audioActions,
  };
};
