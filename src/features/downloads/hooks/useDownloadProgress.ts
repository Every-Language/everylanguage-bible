import { useState, useCallback } from 'react';
import { DownloadProgress } from '../services/types';
import { logger } from '@/shared/utils/logger';

export interface FileDownloadProgress {
  filePath: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
  fileSize?: number;
}

interface SearchResult {
  remote_path: string;
  file_size: number;
}

interface DownloadProgressState {
  downloadProgress: FileDownloadProgress[];
  overallProgress: number;
  completedFiles: number;
  failedFiles: number;
  downloadError: string | null;
}

// Download completion callback type
export type DownloadCompletionCallback = (
  completedFiles: FileDownloadProgress[],
  failedFiles: FileDownloadProgress[],
  totalFiles: number
) => Promise<void>;

export const useDownloadProgress = () => {
  const [state, setState] = useState<DownloadProgressState>({
    downloadProgress: [],
    overallProgress: 0,
    completedFiles: 0,
    failedFiles: 0,
    downloadError: null,
  });

  const [completionCallback, setCompletionCallback] =
    useState<DownloadCompletionCallback | null>(null);

  const initializeDownloadProgress = useCallback(
    (searchResults: SearchResult[], chapterId: string) => {
      logger.debug('Initializing download progress:', {
        searchResultsLength: searchResults.length,
        chapterId,
        searchResults: searchResults.map(f => ({
          remote_path: f.remote_path,
          file_size: f.file_size,
        })),
      });

      const progress: FileDownloadProgress[] = searchResults.map(
        (file, index) => ({
          filePath: file.remote_path,
          fileName: `${chapterId}_${index + 1}.mp3`,
          progress: 0,
          status: 'pending',
          fileSize: file.file_size,
        })
      );

      logger.debug('Created progress items:', progress);

      setState(prev => ({
        ...prev,
        downloadProgress: progress,
        overallProgress: 0,
        completedFiles: 0,
        failedFiles: 0,
        downloadError: null,
      }));
    },
    []
  );

  const updateFileProgress = useCallback(
    (
      filePath: string,
      progress: DownloadProgress,
      status: 'downloading' | 'completed' | 'failed',
      error?: string
    ) => {
      setState(prev => {
        const updatedProgress = prev.downloadProgress.map(file =>
          file.filePath === filePath
            ? {
                ...file,
                progress: progress.progress,
                status,
                ...(error && { error }),
              }
            : file
        );

        // Calculate overall progress
        const totalProgress = updatedProgress.reduce(
          (sum, file) => sum + file.progress,
          0
        );
        const overall =
          updatedProgress.length > 0
            ? totalProgress / updatedProgress.length
            : 0;

        // Count completed and failed files
        const completed = updatedProgress.filter(
          f => f.status === 'completed'
        ).length;
        const failed = updatedProgress.filter(
          f => f.status === 'failed'
        ).length;

        const newState = {
          ...prev,
          downloadProgress: updatedProgress,
          overallProgress: overall,
          completedFiles: completed,
          failedFiles: failed,
        };

        // Check if all downloads are complete
        const totalFiles = updatedProgress.length;
        const totalCompleted = completed + failed;

        if (totalCompleted === totalFiles && totalFiles > 0) {
          logger.info('All downloads completed', {
            completed,
            failed,
            totalFiles,
            overallProgress: overall,
          });

          // Execute completion callback if provided
          if (completionCallback) {
            const completedFiles = updatedProgress.filter(
              f => f.status === 'completed'
            );
            const failedFiles = updatedProgress.filter(
              f => f.status === 'failed'
            );
            // Execute callback asynchronously to avoid blocking state updates
            completionCallback(completedFiles, failedFiles, totalFiles).catch(
              error => {
                logger.error('Error in download completion callback:', error);
              }
            );
          }
        }

        return newState;
      });
    },
    [completionCallback]
  );

  const setDownloadError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      downloadError: error,
    }));
  }, []);

  const resetDownloadProgress = useCallback(() => {
    setState({
      downloadProgress: [],
      overallProgress: 0,
      completedFiles: 0,
      failedFiles: 0,
      downloadError: null,
    });
  }, []);

  // Set completion callback
  const setDownloadCompletionCallback = useCallback(
    (callback: DownloadCompletionCallback | null) => {
      setCompletionCallback(() => callback);
    },
    []
  );

  // Get current progress state
  const getCurrentProgress = useCallback(() => {
    return state;
  }, [state]);

  // Check if all downloads are complete
  const isAllDownloadsComplete = useCallback(() => {
    const totalFiles = state.downloadProgress.length;
    const totalCompleted = state.completedFiles + state.failedFiles;
    return totalCompleted === totalFiles && totalFiles > 0;
  }, [state.downloadProgress.length, state.completedFiles, state.failedFiles]);

  return {
    ...state,
    initializeDownloadProgress,
    updateFileProgress,
    setDownloadError,
    resetDownloadProgress,
    setDownloadCompletionCallback,
    getCurrentProgress,
    isAllDownloadsComplete,
  };
};
