import { useState, useCallback } from 'react';
import { DownloadProgress } from '../types';

interface FileDownloadProgress {
  filePath: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
  fileSize?: number;
}

interface DownloadProgressState {
  downloadProgress: FileDownloadProgress[];
  overallProgress: number;
  completedFiles: number;
  failedFiles: number;
  downloadError: string | null;
}

export const useDownloadProgress = () => {
  const [state, setState] = useState<DownloadProgressState>({
    downloadProgress: [],
    overallProgress: 0,
    completedFiles: 0,
    failedFiles: 0,
    downloadError: null,
  });

  const initializeDownloadProgress = useCallback(
    (searchResults: any[], chapterId: string) => {
      const progress: FileDownloadProgress[] = searchResults.map(
        (file, index) => ({
          filePath: file.file_path,
          fileName: `${chapterId}_${index + 1}.mp3`,
          progress: 0,
          status: 'pending',
          fileSize: file.file_size,
        })
      );

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

        return {
          ...prev,
          downloadProgress: updatedProgress,
          overallProgress: overall,
          completedFiles: completed,
          failedFiles: failed,
        };
      });
    },
    []
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

  return {
    ...state,
    initializeDownloadProgress,
    updateFileProgress,
    setDownloadError,
    resetDownloadProgress,
  };
};
