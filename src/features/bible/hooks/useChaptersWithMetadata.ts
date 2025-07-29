import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSync } from '@/shared/hooks';
import { useChaptersQuery } from './useBibleQueries';
import { chapterQueueService } from '@/features/media/services/ChapterQueueService';
import { localDataService } from '@/shared/services/database/LocalDataService';
import { logger } from '@/shared/utils/logger';
import type { Chapter, ChapterWithMetadata } from '../types';

// Query Keys for verses marked status and media availability
const versesMarkedQueryKeys = {
  all: ['verses-marked'] as const,
  chapters: (chapterIds: string[]) =>
    [...versesMarkedQueryKeys.all, 'chapters', chapterIds] as const,
} as const;

const mediaAvailabilityQueryKeys = {
  all: ['media-availability'] as const,
  chapters: (chapterIds: string[]) =>
    [...mediaAvailabilityQueryKeys.all, 'chapters', chapterIds] as const,
} as const;

export const useChaptersWithMetadata = (bookId: string | null) => {
  const { isInitialized } = useSync();
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // Main chapters query using TanStack Query
  const {
    data: chapters = [],
    isLoading: chaptersLoading,
    error: chaptersError,
    refetch: fetchChapters,
    isRefetching,
  } = useChaptersQuery(bookId || '');

  // Verses marked query for all chapters
  const {
    data: versesMarkedMap = new Map<string, boolean>(),
    isLoading: versesMarkedLoading,
  } = useQuery({
    queryKey: versesMarkedQueryKeys.chapters(chapters.map(c => c.id)),
    queryFn: async () => {
      const newVersesMarkedMap = new Map<string, boolean>();

      await Promise.all(
        chapters.map(async chapter => {
          try {
            const versesMarked = await chapterQueueService.checkVersesMarked(
              chapter.id
            );
            newVersesMarkedMap.set(chapter.id, versesMarked);
          } catch (error) {
            logger.error(
              `Failed to check verses marked for chapter ${chapter.id}:`,
              error
            );
            newVersesMarkedMap.set(chapter.id, false);
          }
        })
      );

      return newVersesMarkedMap;
    },
    enabled: chapters.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Media availability query for all chapters
  const {
    data: mediaAvailabilityMap = new Map<string, string>(),
    isLoading: mediaAvailabilityLoading,
  } = useQuery({
    queryKey: mediaAvailabilityQueryKeys.chapters(chapters.map(c => c.id)),
    queryFn: async () => {
      try {
        const chapterIds = chapters.map(c => c.id);
        const availabilityMap =
          await localDataService.getChaptersMediaAvailability(chapterIds);
        return availabilityMap;
      } catch (error) {
        logger.error('Failed to get media availability for chapters:', error);
        return new Map<string, string>();
      }
    },
    enabled: chapters.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter cache for availability checks
  });

  // Select a chapter
  const selectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedChapter(null);
  };

  // Memoized chapters with additional computed properties
  const chaptersWithMetadata = useMemo(() => {
    return chapters.map(chapter => ({
      ...chapter,
      title: `Chapter ${chapter.chapter_number}`,
      verseRange: `1 - ${chapter.total_verses}`,
      mediaAvailability: mediaAvailabilityMap.get(chapter.id) || 'none',
      versesMarked: versesMarkedMap.get(chapter.id) || false,
    })) as ChapterWithMetadata[];
  }, [chapters, versesMarkedMap, mediaAvailabilityMap]);

  // Determine loading state
  const loading =
    chaptersLoading ||
    versesMarkedLoading ||
    mediaAvailabilityLoading ||
    !isInitialized;

  // Determine error state - only show error if there's an actual error, not just empty data
  const error = chaptersError?.message || null;

  return {
    chapters: chaptersWithMetadata,
    loading,
    error,
    selectedChapter,
    isRefetching,

    // Actions
    fetchChapters: () => (bookId ? fetchChapters() : Promise.resolve()),
    selectChapter,
    clearSelection,
  };
};
