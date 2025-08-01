import { useQuery } from '@tanstack/react-query';
import {
  mediaFilesService,
  MediaFileFilters,
  MediaFileSort,
} from '@/shared/services/database/MediaFilesService';
import { useSync } from '@/shared/hooks/useSyncFromStore';

// Media Files Query Keys
export const mediaFilesQueryKeys = {
  all: ['media-files'] as const,
  list: (filters?: MediaFileFilters, sort?: MediaFileSort) =>
    [...mediaFilesQueryKeys.all, 'list', filters, sort] as const,
  byId: (id: string) => [...mediaFilesQueryKeys.all, 'id', id] as const,
  byChapter: (chapterId: string) =>
    [...mediaFilesQueryKeys.all, 'chapter', chapterId] as const,
  byLanguage: (languageEntityId: string) =>
    [...mediaFilesQueryKeys.all, 'language', languageEntityId] as const,
  byUploadStatus: (uploadStatus: string) =>
    [...mediaFilesQueryKeys.all, 'upload-status', uploadStatus] as const,
  byPublishStatus: (publishStatus: string) =>
    [...mediaFilesQueryKeys.all, 'publish-status', publishStatus] as const,
  audioAvailability: (chapterId: string) =>
    [...mediaFilesQueryKeys.all, 'audio-availability', chapterId] as const,
} as const;

/**
 * Hook to fetch media files with optional filtering
 */
export const useMediaFilesQuery = (
  filters?: MediaFileFilters,
  sort?: MediaFileSort
) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: mediaFilesQueryKeys.list(filters, sort),
    queryFn: async () => {
      const files = await mediaFilesService.getMediaFiles(filters, sort);
      return files;
    },
    enabled: isInitialized,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch a specific media file by ID
 */
export const useMediaFileQuery = (id: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: mediaFilesQueryKeys.byId(id),
    queryFn: async () => {
      const file = await mediaFilesService.getMediaFileById(id);
      if (!file) {
        throw new Error(`Media file with ID ${id} not found`);
      }
      return file;
    },
    enabled: isInitialized && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch media files by chapter ID
 */
export const useMediaFilesByChapterQuery = (chapterId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: mediaFilesQueryKeys.byChapter(chapterId),
    queryFn: async () => {
      const files = await mediaFilesService.getMediaFilesByChapterId(chapterId);
      return files;
    },
    enabled: isInitialized && !!chapterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch media files by language entity ID
 */
export const useMediaFilesByLanguageQuery = (languageEntityId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: mediaFilesQueryKeys.byLanguage(languageEntityId),
    queryFn: async () => {
      const files =
        await mediaFilesService.getMediaFilesByLanguageEntityId(
          languageEntityId
        );
      return files;
    },
    enabled: isInitialized && !!languageEntityId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch media files by upload status
 */
export const useMediaFilesByUploadStatusQuery = (uploadStatus: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: mediaFilesQueryKeys.byUploadStatus(uploadStatus),
    queryFn: async () => {
      const files =
        await mediaFilesService.getMediaFilesByUploadStatus(uploadStatus);
      return files;
    },
    enabled: isInitialized && !!uploadStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch media files by publish status
 */
export const useMediaFilesByPublishStatusQuery = (publishStatus: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: mediaFilesQueryKeys.byPublishStatus(publishStatus),
    queryFn: async () => {
      const files =
        await mediaFilesService.getMediaFilesByPublishStatus(publishStatus);
      return files;
    },
    enabled: isInitialized && !!publishStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to check audio availability for a chapter
 */
export const useChapterAudioAvailabilityQuery = (chapterId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: mediaFilesQueryKeys.audioAvailability(chapterId),
    queryFn: async () => {
      const files = await mediaFilesService.getMediaFilesByChapterId(chapterId);
      const hasAudioFiles = files.length > 0;

      return {
        chapterId,
        hasAudioFiles,
        audioFileCount: files.length,
        mediaFiles: files,
        totalDuration: files.reduce(
          (sum, file) => sum + (file.duration_seconds || 0),
          0
        ),
        totalFileSize: files.reduce(
          (sum, file) => sum + (file.file_size || 0),
          0
        ),
      };
    },
    enabled: isInitialized && !!chapterId,
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter cache for availability checks
    retry: (failureCount, _error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};
