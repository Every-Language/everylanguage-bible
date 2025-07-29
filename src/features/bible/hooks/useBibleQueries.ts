import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localDataService } from '../../../shared/services/database/LocalDataService';
import type {
  VerseFilters,
  VerseSort,
} from '../../../shared/services/database/LocalDataService';
import { logger } from '../../../shared/utils/logger';
import { useSync } from '@/shared/hooks';

// Query Keys
export const bibleQueryKeys = {
  all: ['bible'] as const,
  books: () => [...bibleQueryKeys.all, 'books'] as const,
  book: (id: string) => [...bibleQueryKeys.books(), id] as const,
  chapters: (bookId: string) =>
    [...bibleQueryKeys.book(bookId), 'chapters'] as const,
  chapter: (id: string) => [...bibleQueryKeys.all, 'chapters', id] as const,
  verses: (chapterId: string) =>
    [...bibleQueryKeys.chapter(chapterId), 'verses'] as const,
  verseTexts: (chapterId: string, textVersionId?: string) =>
    [...bibleQueryKeys.verses(chapterId), 'texts', textVersionId] as const,
  versesWithTexts: (chapterId: string, textVersionId?: string) =>
    [...bibleQueryKeys.verses(chapterId), 'with-texts', textVersionId] as const,
} as const;

/**
 * Hook to fetch all books with enhanced retry logic
 */
export const useBooksQuery = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: bibleQueryKeys.books(),
    queryFn: async () => {
      const books = await localDataService.getBooksForUI();

      // Always return books, even if empty - let UI handle the empty state
      return books;
    },
    enabled: isInitialized,
    staleTime: 15 * 60 * 1000, // 15 minutes - books rarely change
    retry: (failureCount, _error) => {
      // Retry up to 3 times for any database errors
      if (failureCount >= 3) return false;

      // Always retry for the first 3 attempts
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch a specific book
 */
export const useBookQuery = (bookId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: bibleQueryKeys.book(bookId),
    queryFn: async () => {
      const book = await localDataService.getBookById(bookId);
      if (!book) {
        throw new Error(`Book with ID ${bookId} not found`);
      }
      return book;
    },
    enabled: isInitialized && !!bookId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, _error) => {
      // Retry up to 2 times for book-specific queries
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch chapters for a book with enhanced retry logic
 */
export const useChaptersQuery = (bookId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: bibleQueryKeys.chapters(bookId),
    queryFn: async () => {
      const chapters = await localDataService.getChaptersByBookId(bookId);

      // Always return chapters, even if empty - let UI handle the empty state
      return chapters;
    },
    enabled: isInitialized && !!bookId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, _error) => {
      // Retry up to 3 times for any database errors
      if (failureCount >= 3) return false;

      // Always retry for the first 3 attempts
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch a specific chapter
 */
export const useChapterQuery = (chapterId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: bibleQueryKeys.chapter(chapterId),
    queryFn: async () => {
      const chapter = await localDataService.getChapterById(chapterId);
      if (!chapter) {
        throw new Error(`Chapter with ID ${chapterId} not found`);
      }
      return chapter;
    },
    enabled: isInitialized && !!chapterId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, _error) => {
      // Retry up to 2 times for chapter-specific queries
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch verses for a chapter with enhanced retry logic
 */
export const useVersesQuery = (
  chapterId: string,
  filters?: VerseFilters,
  sort?: VerseSort
) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: [...bibleQueryKeys.verses(chapterId), filters, sort],
    queryFn: async () => {
      const verses = await localDataService.getVersesForUI(
        chapterId,
        filters,
        sort
      );

      // Always return verses, even if empty - let UI handle the empty state
      return verses;
    },
    enabled: isInitialized && !!chapterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      // Retry up to 3 times for any database errors
      if (failureCount >= 3) return false;

      // Always retry for the first 3 attempts
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch verse texts for a chapter and text version
 */
export const useVerseTextsQuery = (
  chapterId: string,
  textVersionId?: string
) => {
  const { isInitialized, hasLocalData } = useSync();

  return useQuery({
    queryKey: bibleQueryKeys.verseTexts(chapterId, textVersionId),
    queryFn: async () => {
      const verseTexts = await localDataService.getVerseTextsForChapter(
        chapterId,
        textVersionId
      );

      // If no verse texts found and we have local data, this might indicate a sync issue
      if (verseTexts.size === 0 && hasLocalData) {
        logger.warn(
          `No verse texts found for chapter ${chapterId} and version ${textVersionId}`
        );
        throw new Error('No verse texts found. Please try syncing again.');
      }

      return verseTexts;
    },
    enabled: isInitialized && !!chapterId && !!textVersionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      // Retry up to 2 times for verse text queries
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch verses with their texts in a single query with enhanced retry logic
 */
export const useVersesWithTextsQuery = (
  chapterId: string,
  textVersionId?: string
) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: bibleQueryKeys.versesWithTexts(chapterId, textVersionId),
    queryFn: async () => {
      const versesWithTexts = await localDataService.getVersesWithTexts(
        chapterId,
        textVersionId
      );

      // Always return verses with texts, even if empty - let UI handle the empty state
      return versesWithTexts;
    },
    enabled: isInitialized && !!chapterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      // Retry up to 3 times for any database errors
      if (failureCount >= 3) return false;

      // Always retry for the first 3 attempts
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch a verse range
 */
export const useVerseRangeQuery = (
  chapterId: string,
  startVerse: number,
  endVerse: number
) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: [
      ...bibleQueryKeys.verses(chapterId),
      'range',
      startVerse,
      endVerse,
    ],
    queryFn: async () => {
      const verses = await localDataService.getVerseRange(
        chapterId,
        startVerse,
        endVerse
      );
      if (verses.length === 0) {
        throw new Error(`No verses found in range ${startVerse}-${endVerse}`);
      }
      return verses;
    },
    enabled:
      isInitialized && !!chapterId && startVerse > 0 && endVerse >= startVerse,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      // Retry up to 2 times for verse range queries
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch a specific verse
 */
export const useVerseQuery = (chapterId: string, verseNumber: number) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: [...bibleQueryKeys.verses(chapterId), 'verse', verseNumber],
    queryFn: async () => {
      const verse = await localDataService.getVerseByChapterAndNumber(
        chapterId,
        verseNumber
      );
      if (!verse) {
        throw new Error(
          `Verse ${verseNumber} not found in chapter ${chapterId}`
        );
      }
      return verse;
    },
    enabled: isInitialized && !!chapterId && verseNumber > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      // Retry up to 2 times for verse-specific queries
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch multiple chapters with verses (bulk operation)
 */
export const useMultipleChaptersWithVersesQuery = (chapterIds: string[]) => {
  const { isInitialized, hasLocalData } = useSync();

  return useQuery({
    queryKey: [...bibleQueryKeys.all, 'multiple-chapters', chapterIds],
    queryFn: async () => {
      const chaptersWithVerses =
        await localDataService.getMultipleChaptersWithVerses(chapterIds);

      // Check if any chapters were found
      const foundChapters = Array.from(chaptersWithVerses.values()).filter(
        item => item.chapter !== null
      );

      if (foundChapters.length === 0 && hasLocalData) {
        logger.warn(
          `No chapters found for IDs ${chapterIds.join(', ')} despite having local data`
        );
        throw new Error('No chapters found. Please try syncing again.');
      }

      return chaptersWithVerses;
    },
    enabled: isInitialized && chapterIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      // Retry up to 2 times for bulk queries
      return failureCount < 2;
    },
  });
};

/**
 * Hook to update verse text
 * Note: This is a placeholder mutation since updateVerseText is not implemented in LocalDataService
 */
export const useUpdateVerseTextMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      verseId,
      textVersionId,
      text,
    }: {
      verseId: string;
      textVersionId: string;
      text: string;
    }) => {
      // TODO: Implement updateVerseText in LocalDataService
      logger.info('Updating verse text:', { verseId, textVersionId, text });
      return { success: true, verseId, textVersionId, text };
    },
    onSuccess: (result, variables) => {
      // Invalidate related queries to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: bibleQueryKeys.verseTexts(
          variables.verseId,
          variables.textVersionId
        ),
      });
      queryClient.invalidateQueries({
        queryKey: bibleQueryKeys.versesWithTexts(
          variables.verseId,
          variables.textVersionId
        ),
      });

      logger.info(`Verse text updated for verse ${variables.verseId}`);
    },
    onError: (error, variables) => {
      logger.error(
        `Failed to update verse text for verse ${variables.verseId}:`,
        error
      );
    },
  });
};

/**
 * Hook to refresh all Bible data
 */
export const useRefreshBibleDataMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // This could trigger a sync operation or clear cache
      logger.info('Refreshing all Bible data');
      return true;
    },
    onSuccess: () => {
      // Invalidate all Bible-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: bibleQueryKeys.all });
      logger.info('Bible data refresh completed');
    },
    onError: error => {
      logger.error('Failed to refresh Bible data:', error);
    },
  });
};
