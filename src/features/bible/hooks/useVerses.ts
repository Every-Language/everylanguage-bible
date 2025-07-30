import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { localDataService } from '../../../shared/services/database/LocalDataService';
import { queryClient } from '../../../shared/services/query/queryClient';
import type { Verse } from '../types';
import type {
  VerseFilters,
  VerseSort,
} from '../../../shared/services/database/LocalDataService';
import { useCurrentVersions } from '../../languages/hooks';
import { logger } from '../../../shared/utils/logger';

// Query Keys
const verseQueryKeys = {
  all: ['verses'] as const,
  chapter: (chapterId: string) =>
    [...verseQueryKeys.all, 'chapter', chapterId] as const,
  chapterWithFilters: (
    chapterId: string,
    filters?: VerseFilters,
    sort?: VerseSort
  ) =>
    [...verseQueryKeys.chapter(chapterId), 'filters', filters, sort] as const,
  range: (chapterId: string, startVerse: number, endVerse: number) =>
    [
      ...verseQueryKeys.chapter(chapterId),
      'range',
      startVerse,
      endVerse,
    ] as const,
  adjacent: (
    chapterId: string,
    verseNumber: number,
    direction: 'prev' | 'next'
  ) =>
    [
      ...verseQueryKeys.chapter(chapterId),
      'adjacent',
      verseNumber,
      direction,
    ] as const,
  withTexts: (chapterId: string, textVersionId?: string) =>
    [
      ...verseQueryKeys.chapter(chapterId),
      'with-texts',
      textVersionId,
    ] as const,
} as const;

export const useVerses = (
  chapterId: string,
  filters?: VerseFilters,
  sort?: VerseSort
) => {
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);

  // Main verses query
  const {
    data: verses = [],
    isLoading: loading,
    error,
    refetch: refreshVerses,
  } = useQuery({
    queryKey: verseQueryKeys.chapterWithFilters(chapterId, filters, sort),
    queryFn: () => localDataService.getVersesForUI(chapterId, filters, sort),
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Verse range mutation
  const verseRangeMutation = useMutation({
    mutationFn: async ({
      startVerse,
      endVerse,
    }: {
      startVerse: number;
      endVerse: number;
    }) => {
      const verses = await localDataService.getVerseRange(
        chapterId,
        startVerse,
        endVerse
      );
      return verses.map(verse =>
        localDataService.transformVerseToUIFormat(verse)
      );
    },
    onSuccess: transformedVerses => {
      // Update the cache with the new verse range
      queryClient.setQueryData(
        verseQueryKeys.chapterWithFilters(chapterId, filters, sort),
        transformedVerses
      );
    },
    onError: error => {
      logger.error('Failed to load verse range:', error);
    },
  });

  // Adjacent verse query
  const getAdjacentVerse = useCallback(
    async (currentVerseNumber: number, direction: 'prev' | 'next') => {
      try {
        const verse = await localDataService.getAdjacentVerse(
          chapterId,
          currentVerseNumber,
          direction
        );
        return verse ? localDataService.transformVerseToUIFormat(verse) : null;
      } catch (error) {
        logger.error('Failed to get adjacent verse:', error);
        return null;
      }
    },
    [chapterId]
  );

  const selectVerse = useCallback((verse: Verse | null) => {
    setSelectedVerse(verse);
  }, []);

  const getVerseRange = useCallback(
    async (startVerse: number, endVerse: number) => {
      verseRangeMutation.mutate({ startVerse, endVerse });
    },
    [verseRangeMutation]
  );

  return {
    verses,
    loading: loading || verseRangeMutation.isPending,
    error: error?.message || verseRangeMutation.error?.message || null,
    selectedVerse,
    selectVerse,
    getVerseRange,
    getAdjacentVerse,
    refreshVerses,
  };
};

// Enhanced hook that includes verse texts
export const useVersesWithTexts = (chapterId: string) => {
  const [selectedVerse, setSelectedVerse] = useState<Verse | null>(null);
  const { currentTextVersion } = useCurrentVersions();

  // Verses with texts query
  const {
    data: versesWithTexts = [],
    isLoading: loading,
    error,
    refetch: refreshVerses,
  } = useQuery({
    queryKey: verseQueryKeys.withTexts(chapterId, currentTextVersion?.id),
    queryFn: () =>
      localDataService.getVersesWithTexts(chapterId, currentTextVersion?.id),
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const selectVerse = useCallback((verse: Verse | null) => {
    setSelectedVerse(verse);
  }, []);

  return {
    versesWithTexts,
    loading,
    error: error?.message || null,
    selectedVerse,
    currentTextVersion,
    selectVerse,
    refreshVerses,
  };
};
