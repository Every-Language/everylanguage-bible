import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { powerSyncBibleService } from '../services/powerSyncBibleService';
import type {
  BookFilters,
  BookSort,
  VerseFilters,
  VerseSort,
} from '../services/powerSyncBibleService';
import { logger } from '../../../shared/utils/logger';
import { useSync } from '@/shared/hooks';

// Enhanced Query Keys for PowerSync
export const powerSyncBibleQueryKeys = {
  // Root
  all: ['powersync-bible'] as const,

  // Bible Versions
  bibleVersions: () =>
    [...powerSyncBibleQueryKeys.all, 'bible-versions'] as const,

  // Books
  books: () => [...powerSyncBibleQueryKeys.all, 'books'] as const,
  booksWithFilters: (filters?: BookFilters, sort?: BookSort) =>
    [...powerSyncBibleQueryKeys.books(), 'filtered', filters, sort] as const,
  booksWithMetadata: (filters?: BookFilters) =>
    [...powerSyncBibleQueryKeys.books(), 'with-metadata', filters] as const,
  book: (id: string) =>
    [...powerSyncBibleQueryKeys.books(), 'detail', id] as const,
  bookByNumber: (bookNumber: number, bibleVersionId?: string) =>
    [
      ...powerSyncBibleQueryKeys.books(),
      'by-number',
      bookNumber,
      bibleVersionId,
    ] as const,
  bookSearch: (searchTerm: string, limit?: number) =>
    [...powerSyncBibleQueryKeys.books(), 'search', searchTerm, limit] as const,

  // Chapters
  chapters: () => [...powerSyncBibleQueryKeys.all, 'chapters'] as const,
  chaptersByBook: (bookId: string) =>
    [...powerSyncBibleQueryKeys.chapters(), 'by-book', bookId] as const,
  chaptersWithMetadata: (bookId: string) =>
    [...powerSyncBibleQueryKeys.chapters(), 'with-metadata', bookId] as const,
  chapter: (id: string) =>
    [...powerSyncBibleQueryKeys.chapters(), 'detail', id] as const,

  // Verses
  verses: () => [...powerSyncBibleQueryKeys.all, 'verses'] as const,
  versesByChapter: (
    chapterId: string,
    filters?: VerseFilters,
    sort?: VerseSort
  ) =>
    [
      ...powerSyncBibleQueryKeys.verses(),
      'by-chapter',
      chapterId,
      filters,
      sort,
    ] as const,
  versesWithText: (chapterId: string, textVersionId?: string) =>
    [
      ...powerSyncBibleQueryKeys.verses(),
      'with-text',
      chapterId,
      textVersionId,
    ] as const,
  verse: (chapterId: string, verseNumber: number) =>
    [
      ...powerSyncBibleQueryKeys.verses(),
      'detail',
      chapterId,
      verseNumber,
    ] as const,
  verseRange: (chapterId: string, startVerse: number, endVerse: number) =>
    [
      ...powerSyncBibleQueryKeys.verses(),
      'range',
      chapterId,
      startVerse,
      endVerse,
    ] as const,
  adjacentVerse: (
    chapterId: string,
    currentVerse: number,
    direction: 'prev' | 'next'
  ) =>
    [
      ...powerSyncBibleQueryKeys.verses(),
      'adjacent',
      chapterId,
      currentVerse,
      direction,
    ] as const,

  // Text Versions
  textVersions: () =>
    [...powerSyncBibleQueryKeys.all, 'text-versions'] as const,
  textVersionsByLanguage: (languageEntityId?: string) =>
    [
      ...powerSyncBibleQueryKeys.textVersions(),
      'by-language',
      languageEntityId,
    ] as const,

  // Audio Versions
  audioVersions: () =>
    [...powerSyncBibleQueryKeys.all, 'audio-versions'] as const,
  audioVersionsByLanguage: (languageEntityId?: string) =>
    [
      ...powerSyncBibleQueryKeys.audioVersions(),
      'by-language',
      languageEntityId,
    ] as const,

  // Media Files
  mediaFiles: () => [...powerSyncBibleQueryKeys.all, 'media-files'] as const,
  mediaFilesByChapter: (chapterId: string) =>
    [...powerSyncBibleQueryKeys.mediaFiles(), 'by-chapter', chapterId] as const,

  // Stats
  stats: () => [...powerSyncBibleQueryKeys.all, 'stats'] as const,
} as const;

// ==================== BIBLE VERSIONS ====================

/**
 * Hook to fetch all bible versions using PowerSync
 */
export const usePowerSyncBibleVersions = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.bibleVersions(),
    queryFn: async () => {
      const versions = await powerSyncBibleService.getBibleVersions();
      return versions;
    },
    enabled: isInitialized,
    staleTime: 30 * 60 * 1000, // 30 minutes - versions rarely change
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

// ==================== BOOKS ====================

/**
 * Hook to fetch books with optional filtering and sorting using PowerSync
 */
export const usePowerSyncBooks = (filters?: BookFilters, sort?: BookSort) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.booksWithFilters(filters, sort),
    queryFn: async () => {
      const books = await powerSyncBibleService.getBooks(filters, sort);
      return books;
    },
    enabled: isInitialized,
    staleTime: 15 * 60 * 1000, // 15 minutes - books rarely change
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch books with metadata (chapter counts, media availability) using PowerSync
 */
export const usePowerSyncBooksWithMetadata = (filters?: BookFilters) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.booksWithMetadata(filters),
    queryFn: async () => {
      const books = await powerSyncBibleService.getBooksWithMetadata(filters);
      return books;
    },
    enabled: isInitialized,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch a specific book by ID using PowerSync
 */
export const usePowerSyncBook = (bookId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.book(bookId),
    queryFn: async () => {
      const book = await powerSyncBibleService.getBookById(bookId);
      if (!book) {
        throw new Error(`Book with ID ${bookId} not found`);
      }
      return book;
    },
    enabled: isInitialized && !!bookId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

/**
 * Hook to search books using PowerSync
 */
export const usePowerSyncBookSearch = (searchTerm: string, limit = 20) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.bookSearch(searchTerm, limit),
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return [];
      }
      const books = await powerSyncBibleService.searchBooks(searchTerm, limit);
      return books;
    },
    enabled: isInitialized && searchTerm.trim().length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes for search results
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

// ==================== CHAPTERS ====================

/**
 * Hook to fetch chapters for a book using PowerSync
 */
export const usePowerSyncChapters = (bookId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.chaptersByBook(bookId),
    queryFn: async () => {
      const chapters = await powerSyncBibleService.getChaptersByBookId(bookId);
      return chapters;
    },
    enabled: isInitialized && !!bookId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to fetch chapters with metadata using PowerSync
 */
export const usePowerSyncChaptersWithMetadata = (bookId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.chaptersWithMetadata(bookId),
    queryFn: async () => {
      const chapters =
        await powerSyncBibleService.getChaptersWithMetadata(bookId);
      return chapters;
    },
    enabled: isInitialized && !!bookId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

/**
 * Hook to fetch a specific chapter by ID using PowerSync
 */
export const usePowerSyncChapter = (chapterId: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.chapter(chapterId),
    queryFn: async () => {
      const chapter = await powerSyncBibleService.getChapterById(chapterId);
      if (!chapter) {
        throw new Error(`Chapter with ID ${chapterId} not found`);
      }
      return chapter;
    },
    enabled: isInitialized && !!chapterId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

// ==================== VERSES ====================

/**
 * Hook to fetch verses for a chapter with optional filtering and sorting using PowerSync
 */
export const usePowerSyncVerses = (
  chapterId: string,
  filters?: VerseFilters,
  sort?: VerseSort
) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.versesByChapter(chapterId, filters, sort),
    queryFn: async () => {
      const verses = await powerSyncBibleService.getVersesByChapterId(
        chapterId,
        filters,
        sort
      );
      return verses;
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
 * Hook to fetch verses with their text content using PowerSync
 */
export const usePowerSyncVersesWithText = (
  chapterId: string,
  textVersionId?: string
) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.versesWithText(chapterId, textVersionId),
    queryFn: async () => {
      const versesWithText = await powerSyncBibleService.getVersesWithText(
        chapterId,
        textVersionId
      );
      return versesWithText;
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
 * Hook to fetch a verse range using PowerSync
 */
export const usePowerSyncVerseRange = (
  chapterId: string,
  startVerse: number,
  endVerse: number
) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.verseRange(
      chapterId,
      startVerse,
      endVerse
    ),
    queryFn: async () => {
      const verses = await powerSyncBibleService.getVerseRange(
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
      return failureCount < 2;
    },
  });
};

// ==================== TEXT VERSIONS ====================

/**
 * Hook to fetch available text versions using PowerSync
 */
export const usePowerSyncTextVersions = (languageEntityId?: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.textVersionsByLanguage(languageEntityId),
    queryFn: async () => {
      const textVersions =
        await powerSyncBibleService.getTextVersions(languageEntityId);
      return textVersions;
    },
    enabled: isInitialized,
    staleTime: 30 * 60 * 1000, // 30 minutes - versions rarely change
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

// ==================== AUDIO VERSIONS ====================

/**
 * Hook to fetch available audio versions using PowerSync
 */
export const usePowerSyncAudioVersions = (languageEntityId?: string) => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.audioVersionsByLanguage(languageEntityId),
    queryFn: async () => {
      const audioVersions =
        await powerSyncBibleService.getAudioVersions(languageEntityId);
      return audioVersions;
    },
    enabled: isInitialized,
    staleTime: 30 * 60 * 1000, // 30 minutes - versions rarely change
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

// ==================== UTILITIES & STATS ====================

/**
 * Hook to get database statistics using PowerSync
 */
export const usePowerSyncDatabaseStats = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: powerSyncBibleQueryKeys.stats(),
    queryFn: async () => {
      const stats = await powerSyncBibleService.getDatabaseStats();
      return stats;
    },
    enabled: isInitialized,
    staleTime: 60 * 1000, // 1 minute - stats can change frequently during sync
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

/**
 * Hook to check if Bible data exists using PowerSync
 */
export const usePowerSyncBibleDataExists = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: [...powerSyncBibleQueryKeys.all, 'data-exists'],
    queryFn: async () => {
      const hasData = await powerSyncBibleService.hasBibleData();
      return hasData;
    },
    enabled: isInitialized,
    staleTime: 30 * 1000, // 30 seconds - check frequently during initial sync
    retry: (failureCount, _error) => {
      return failureCount < 2;
    },
  });
};

// ==================== MUTATIONS ====================

/**
 * Hook to refresh all PowerSync Bible data queries
 */
export const usePowerSyncRefreshBibleData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // This could trigger a sync operation or clear cache
      logger.info('PowerSync Bible: Refreshing all Bible data');
      return true;
    },
    onSuccess: () => {
      // Invalidate all PowerSync Bible-related queries to force refetch
      queryClient.invalidateQueries({ queryKey: powerSyncBibleQueryKeys.all });
      logger.info('PowerSync Bible: Data refresh completed');
    },
    onError: error => {
      logger.error('PowerSync Bible: Failed to refresh Bible data:', error);
    },
  });
};
