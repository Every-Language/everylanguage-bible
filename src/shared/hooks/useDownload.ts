import { useState, useCallback, useRef } from 'react';
import DownloadService, {
  type DownloadProgress,
  type DownloadDetails,
  type DownloadOptions,
  type DownloadResult,
} from '../services/download/DownloadService';

export interface UseDownloadState {
  isDownloading: boolean;
  progress: number;
  currentDownload: string | null;
  error: string | null;
}

export interface UseDownloadReturn extends UseDownloadState {
  downloadFile: (
    url: string,
    fileName?: string,
    options?: Omit<DownloadOptions, 'onProgress'>
  ) => Promise<DownloadResult>;
  pauseDownload: (url: string) => Promise<boolean>;
  resumeDownload: (url: string) => Promise<DownloadResult>;
  cancelDownload: (url: string) => Promise<boolean>;
  getFileInfo: (localUri: string) => Promise<DownloadDetails | null>;
  listDownloadedFiles: () => Promise<DownloadDetails[]>;
  deleteFile: (localUri: string) => Promise<boolean>;
  clearAllDownloads: () => Promise<boolean>;
  getTotalDownloadSize: () => Promise<number>;
  isDownloadActive: (url: string) => boolean;
  getActiveDownloads: () => string[];
  resetError: () => void;
}

export const useDownload = (): UseDownloadReturn => {
  const [state, setState] = useState<UseDownloadState>({
    isDownloading: false,
    progress: 0,
    currentDownload: null,
    error: null,
  });

  const downloadService = useRef(DownloadService.getInstance());

  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const downloadFile = useCallback(
    async (
      url: string,
      fileName?: string,
      options: Omit<DownloadOptions, 'onProgress'> = {}
    ): Promise<DownloadResult> => {
      try {
        setState(prev => ({
          ...prev,
          isDownloading: true,
          currentDownload: url,
          progress: 0,
          error: null,
        }));

        const downloadOptions: DownloadOptions = {
          ...options,
          onProgress: (progress: DownloadProgress) => {
            setState(prev => ({
              ...prev,
              progress: progress.progress,
            }));
          },
        };

        const result = await downloadService.current.downloadFile(
          url,
          fileName,
          downloadOptions
        );

        if (!result.success) {
          setState(prev => ({
            ...prev,
            error: result.error || 'Download failed',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setState(prev => ({
          ...prev,
          isDownloading: false,
          currentDownload: null,
          progress: 0,
        }));
      }
    },
    []
  );

  const pauseDownload = useCallback(async (url: string): Promise<boolean> => {
    try {
      const result = await downloadService.current.pauseDownload(url);
      if (result) {
        setState(prev => ({
          ...prev,
          isDownloading: false,
          currentDownload: null,
        }));
      }
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  const resumeDownload = useCallback(
    async (url: string): Promise<DownloadResult> => {
      try {
        setState(prev => ({
          ...prev,
          isDownloading: true,
          currentDownload: url,
          error: null,
        }));

        const result = await downloadService.current.resumeDownload(url, {
          onProgress: (progress: DownloadProgress) => {
            setState(prev => ({
              ...prev,
              progress: progress.progress,
            }));
          },
        });

        if (!result.success) {
          setState(prev => ({
            ...prev,
            error: result.error || 'Resume failed',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setState(prev => ({
          ...prev,
          isDownloading: false,
          currentDownload: null,
          progress: 0,
        }));
      }
    },
    []
  );

  const cancelDownload = useCallback(async (url: string): Promise<boolean> => {
    try {
      const result = await downloadService.current.cancelDownload(url);
      if (result) {
        setState(prev => ({
          ...prev,
          isDownloading: false,
          currentDownload: null,
          progress: 0,
        }));
      }
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  const getFileInfo = useCallback(
    async (localUri: string): Promise<DownloadDetails | null> => {
      try {
        return await downloadService.current.getFileInfo(localUri);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({ ...prev, error: errorMessage }));
        return null;
      }
    },
    []
  );

  const listDownloadedFiles = useCallback(async (): Promise<
    DownloadDetails[]
  > => {
    try {
      return await downloadService.current.listDownloadedFiles();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      return [];
    }
  }, []);

  const deleteFile = useCallback(async (localUri: string): Promise<boolean> => {
    try {
      return await downloadService.current.deleteFile(localUri);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  const clearAllDownloads = useCallback(async (): Promise<boolean> => {
    try {
      return await downloadService.current.clearAllDownloads();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      return false;
    }
  }, []);

  const getTotalDownloadSize = useCallback(async (): Promise<number> => {
    try {
      return await downloadService.current.getTotalDownloadSize();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, error: errorMessage }));
      return 0;
    }
  }, []);

  const isDownloadActive = useCallback((url: string): boolean => {
    return downloadService.current.isDownloadActive(url);
  }, []);

  const getActiveDownloads = useCallback((): string[] => {
    return downloadService.current.getActiveDownloads();
  }, []);

  return {
    ...state,
    downloadFile,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    getFileInfo,
    listDownloadedFiles,
    deleteFile,
    clearAllDownloads,
    getTotalDownloadSize,
    isDownloadActive,
    getActiveDownloads,
    resetError,
  };
};
