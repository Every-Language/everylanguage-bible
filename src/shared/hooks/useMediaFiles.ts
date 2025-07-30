import { useCallback } from 'react';
import {
  useMediaFilesQuery,
  useMediaFileQuery,
  useMediaFilesByChapterQuery,
  useMediaFilesByLanguageQuery,
  useMediaFilesByUploadStatusQuery,
  useMediaFilesByPublishStatusQuery,
} from '../../features/media/hooks/useMediaFilesQueries';
import {
  MediaFileFilters,
  MediaFileSort,
  mediaFilesService,
} from '../services/database/MediaFilesService';
import { LocalMediaFile } from '../services/database/schema';

/**
 * Hook to fetch media files with optional filtering
 * Now uses TanStack Query for better caching and performance
 */
export const useMediaFiles = (
  filters: MediaFileFilters = {},
  sort?: MediaFileSort
) => {
  const {
    data: mediaFiles = [],
    isLoading: loading,
    error,
    refetch: refresh,
  } = useMediaFilesQuery(filters, sort);

  return {
    mediaFiles,
    loading,
    error: error?.message || null,
    refresh,
  };
};

/**
 * Hook to fetch a specific media file by ID
 * Now uses TanStack Query for better caching and performance
 */
export const useMediaFile = (id: string) => {
  const {
    data: mediaFile,
    isLoading: loading,
    error,
    refetch: refresh,
  } = useMediaFileQuery(id);

  // For mutations, we still use direct service calls since TanStack Query
  // mutations would require more complex cache invalidation
  const updateMediaFile = useCallback(
    async (updates: Partial<LocalMediaFile>) => {
      if (!id) return;

      try {
        await mediaFilesService.updateMediaFile(id, updates);
        // Refresh the query to get updated data
        refresh();
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update media file'
        );
      }
    },
    [id, refresh]
  );

  const deleteMediaFile = useCallback(async () => {
    if (!id) return;

    try {
      await mediaFilesService.deleteMediaFile(id);
      // Refresh the query to get updated data
      refresh();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to delete media file'
      );
    }
  }, [id, refresh]);

  const restoreMediaFile = useCallback(async () => {
    if (!id) return;

    try {
      await mediaFilesService.restoreMediaFile(id);
      // Refresh the query to get updated data
      refresh();
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to restore media file'
      );
    }
  }, [id, refresh]);

  return {
    mediaFile,
    loading,
    error: error?.message || null,
    updateMediaFile,
    deleteMediaFile,
    restoreMediaFile,
    refresh,
  };
};

/**
 * Hook to fetch media files by chapter ID
 * Now uses TanStack Query for better caching and performance
 */
export const useMediaFilesByChapter = (chapterId: string) => {
  const {
    data: mediaFiles = [],
    isLoading: loading,
    error,
    refetch: refresh,
  } = useMediaFilesByChapterQuery(chapterId);

  return {
    mediaFiles,
    loading,
    error: error?.message || null,
    refresh,
  };
};

/**
 * Hook to fetch media files by language entity ID
 * Now uses TanStack Query for better caching and performance
 */
export const useMediaFilesByLanguage = (languageEntityId: string) => {
  const {
    data: mediaFiles = [],
    isLoading: loading,
    error,
    refetch: refresh,
  } = useMediaFilesByLanguageQuery(languageEntityId);

  return {
    mediaFiles,
    loading,
    error: error?.message || null,
    refresh,
  };
};

/**
 * Hook to fetch media files by upload status
 * Now uses TanStack Query for better caching and performance
 */
export const useMediaFilesByUploadStatus = (uploadStatus: string) => {
  const {
    data: mediaFiles = [],
    isLoading: loading,
    error,
    refetch: refresh,
  } = useMediaFilesByUploadStatusQuery(uploadStatus);

  return {
    mediaFiles,
    loading,
    error: error?.message || null,
    refresh,
  };
};

/**
 * Hook to fetch media files by publish status
 * Now uses TanStack Query for better caching and performance
 */
export const useMediaFilesByPublishStatus = (publishStatus: string) => {
  const {
    data: mediaFiles = [],
    isLoading: loading,
    error,
    refetch: refresh,
  } = useMediaFilesByPublishStatusQuery(publishStatus);

  return {
    mediaFiles,
    loading,
    error: error?.message || null,
    refresh,
  };
};
