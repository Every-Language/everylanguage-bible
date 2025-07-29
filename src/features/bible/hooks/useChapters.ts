import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bibleService } from '../services/bibleService';
import { useSync } from '@/shared/hooks';
import type { Chapter, ChapterWithMetadata } from '../types';
import { chapterQueueService } from '@/features/media/services/ChapterQueueService';
import { logger } from '@/shared/utils/logger';

// Query Keys
const chapterQueryKeys = {
  all: ['chapters'] as const,
  book: (bookId: string) => [...chapterQueryKeys.all, 'book', bookId] as const,
  versesMarked: (chapterIds: string[]) =>
    [...chapterQueryKeys.all, 'verses-marked', chapterIds] as const,
} as const;

export const useChapters = (bookId: string | null) => {
  const { isInitialized, hasLocalData } = useSync();
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  // Main chapters query
  const {
    data: chapters = [],
    isLoading: chaptersLoading,
    error: chaptersError,
    refetch: fetchChapters,
  } = useQuery({
    queryKey: chapterQueryKeys.book(bookId || ''),
    queryFn: () => bibleService.fetchChaptersByBookId(bookId!),
    enabled: !!isInitialized && !!hasLocalData && !!bookId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Verses marked query for all chapters
  const {
    data: versesMarkedMap = new Map<string, boolean>(),
    isLoading: versesMarkedLoading,
  } = useQuery({
    queryKey: chapterQueryKeys.versesMarked(chapters.map(c => c.id)),
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
      mediaAvailability:
        (chapter as Chapter & { mediaAvailability?: string })
          .mediaAvailability || 'none',
      versesMarked: versesMarkedMap.get(chapter.id) || false,
    })) as ChapterWithMetadata[];
  }, [chapters, versesMarkedMap]);

  // Determine loading state
  const loading = chaptersLoading || versesMarkedLoading || !isInitialized;

  // Determine error state
  const error =
    chaptersError?.message ||
    (!isInitialized
      ? null
      : !hasLocalData
        ? 'No data available. Please check your internet connection and try syncing.'
        : null);

  return {
    chapters: chaptersWithMetadata,
    loading,
    error,
    selectedChapter,

    // Actions
    fetchChapters: () => (bookId ? fetchChapters() : Promise.resolve()),
    selectChapter,
    clearSelection,
  };
};
