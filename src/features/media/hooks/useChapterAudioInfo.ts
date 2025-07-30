import { useQuery } from '@tanstack/react-query';
import { useSync } from '@/shared/hooks';
import type { ChapterAudioInfo } from '../services/ChapterQueueService';
import type { LocalMediaFile } from '@/shared/services/database/schema';

// Query Keys
export const chapterAudioQueryKeys = {
  all: ['chapter-audio'] as const,
  info: (chapterId: string) =>
    [...chapterAudioQueryKeys.all, 'info', chapterId] as const,
  audioAvailability: (chapterId: string) =>
    [...chapterAudioQueryKeys.all, 'availability', chapterId] as const,
} as const;

/**
 * Hook to get comprehensive audio information for a chapter
 * This combines TanStack Query with the existing ChapterQueueService logic
 */
export const useChapterAudioInfo = (chapterId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: chapterAudioQueryKeys.info(chapterId),
    queryFn: async (): Promise<ChapterAudioInfo> => {
      // Import services dynamically to avoid circular dependencies
      const { ChapterQueueService } = await import(
        '../services/ChapterQueueService'
      );
      const chapterQueueService = new ChapterQueueService();

      return await chapterQueueService.getChapterAudioInfoById(chapterId);
    },
    enabled: isInitialized && !!chapterId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

/**
 * Hook to get media files for a chapter with TanStack Query
 * This is a simpler version that just returns the media files
 */
export const useChapterMediaFiles = (chapterId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: chapterAudioQueryKeys.audioAvailability(chapterId),
    queryFn: async (): Promise<{
      mediaFiles: LocalMediaFile[];
      totalDuration: number;
      totalFileSize: number;
      hasAudioFiles: boolean;
    }> => {
      const { mediaFilesService } = await import(
        '@/shared/services/database/MediaFilesService'
      );
      const mediaFiles =
        await mediaFilesService.getMediaFilesByChapterId(chapterId);

      const totalDuration = mediaFiles.reduce(
        (sum, mf) => sum + (mf.duration_seconds || 0),
        0
      );
      const totalFileSize = mediaFiles.reduce(
        (sum, mf) => sum + (mf.file_size || 0),
        0
      );

      return {
        mediaFiles,
        totalDuration,
        totalFileSize,
        hasAudioFiles: mediaFiles.length > 0,
      };
    },
    enabled: isInitialized && !!chapterId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};
