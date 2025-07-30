import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  chapterQueueService,
  ChapterAudioInfo,
  ChapterQueueOptions,
} from '../services/ChapterQueueService';
import { logger } from '@/shared/utils/logger';

export interface UseChapterQueueReturn {
  chapterAudioInfo: ChapterAudioInfo[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getChapterAudioInfo: (
    options?: ChapterQueueOptions
  ) => Promise<ChapterAudioInfo[]>;
  getChaptersWithAudio: (options?: ChapterQueueOptions) => Promise<string[]>;
  getChaptersWithAudioAndVerses: (
    options?: ChapterQueueOptions
  ) => Promise<string[]>;
  getChapterMediaDetails: (chapterId: string) => Promise<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mediaFiles: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mediaFileVerses: any[];
    versesWithTiming: Array<{
      verseId: string;
      startTime: number;
      mediaFileId: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mediaFile: any;
      localPath: string;
    }>;
  }>;
  getAudioAvailabilityStats: (options?: ChapterQueueOptions) => Promise<{
    totalChapters: number;
    chaptersWithAudio: number;
    chaptersWithVerses: number;
    totalAudioFiles: number;
    totalDuration: number;
    totalFileSize: number;
    totalVerses: number;
    totalBooks: number;
    totalChaptersInDatabase: number;
    totalVersesInDatabase: number;
  }>;
}

export function useChapterQueue(
  initialOptions: ChapterQueueOptions = {},
  autoRefresh = false,
  refreshInterval = 30000
): UseChapterQueueReturn {
  const [chapterAudioInfo, setChapterAudioInfo] = useState<ChapterAudioInfo[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the options to prevent infinite re-renders
  const memoizedOptions = useMemo(() => initialOptions, [initialOptions]);

  const fetchChapterAudioInfo = useCallback(
    async (options: ChapterQueueOptions = {}) => {
      try {
        setLoading(true);
        setError(null);
        const data = await chapterQueueService.getChapterAudioInfo(options);
        setChapterAudioInfo(data);
        return data;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch chapter audio info';
        setError(errorMessage);
        logger.error('Error fetching chapter audio info:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    await fetchChapterAudioInfo(memoizedOptions);
  }, [fetchChapterAudioInfo, memoizedOptions]);

  const getChapterAudioInfo = useCallback(
    async (options: ChapterQueueOptions = {}) => {
      return await chapterQueueService.getChapterAudioInfo(options);
    },
    []
  );

  const getChaptersWithAudio = useCallback(
    async (options: ChapterQueueOptions = {}) => {
      return await chapterQueueService.getChaptersWithAudio(options);
    },
    []
  );

  const getChaptersWithAudioAndVerses = useCallback(
    async (options: ChapterQueueOptions = {}) => {
      return await chapterQueueService.getChaptersWithAudioAndVerses(options);
    },
    []
  );

  const getChapterMediaDetails = useCallback(async (chapterId: string) => {
    return await chapterQueueService.getChapterMediaDetails(chapterId);
  }, []);

  const getAudioAvailabilityStats = useCallback(
    async (options: ChapterQueueOptions = {}) => {
      return await chapterQueueService.getAudioAvailabilityStats(options);
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchChapterAudioInfo(memoizedOptions);
  }, [fetchChapterAudioInfo, memoizedOptions]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    chapterAudioInfo,
    loading,
    error,
    refresh,
    getChapterAudioInfo,
    getChaptersWithAudio,
    getChaptersWithAudioAndVerses,
    getChapterMediaDetails,
    getAudioAvailabilityStats,
  };
}

// Hook for a single chapter
export function useChapterAudioInfo(
  chapterId: string,
  autoRefresh = false,
  refreshInterval = 30000
) {
  const [audioInfo, setAudioInfo] = useState<ChapterAudioInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudioInfo = useCallback(async () => {
    if (!chapterId) {
      setAudioInfo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await chapterQueueService.getChapterAudioInfoById(chapterId);
      setAudioInfo(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch chapter audio info';
      setError(errorMessage);
      logger.error(`Error fetching audio info for chapter ${chapterId}:`, err);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  const refresh = useCallback(async () => {
    await fetchAudioInfo();
  }, [fetchAudioInfo]);

  // Initial load
  useEffect(() => {
    fetchAudioInfo();
  }, [fetchAudioInfo]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || !chapterId) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh, chapterId]);

  return {
    audioInfo,
    loading,
    error,
    refresh,
  };
}

// Hook for audio availability stats
export function useAudioAvailabilityStats(
  options: ChapterQueueOptions = {},
  autoRefresh = false,
  refreshInterval = 30000
) {
  const [stats, setStats] = useState<{
    totalChapters: number;
    chaptersWithAudio: number;
    chaptersWithVerses: number;
    totalAudioFiles: number;
    totalDuration: number;
    totalFileSize: number;
    totalVerses: number;
    totalBooks: number;
    totalChaptersInDatabase: number;
    totalVersesInDatabase: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the options to prevent infinite re-renders
  const memoizedOptions = useMemo(() => options, [options]);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data =
        await chapterQueueService.getAudioAvailabilityStats(memoizedOptions);
      setStats(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch audio availability stats';
      setError(errorMessage);
      logger.error('Error fetching audio availability stats:', err);
    } finally {
      setLoading(false);
    }
  }, [memoizedOptions]);

  const refresh = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}
