import { useState, useEffect } from 'react';
import { localDataService } from '../../../shared/services/database/LocalDataService';
import type { Verse, VersesState } from '../types';
import type {
  VerseFilters,
  VerseSort,
} from '../../../shared/services/database/LocalDataService';

export const useVerses = (
  chapterId: string,
  filters?: VerseFilters,
  sort?: VerseSort
) => {
  const [state, setState] = useState<VersesState>({
    verses: [],
    loading: false,
    error: null,
    selectedVerse: null,
  });

  const loadVerses = async () => {
    if (!chapterId) {
      setState(prev => ({ ...prev, verses: [], loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const verses = await localDataService.getVersesForUI(
        chapterId,
        filters,
        sort
      );
      setState(prev => ({
        ...prev,
        verses,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to load verses:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load verses',
      }));
    }
  };

  const selectVerse = (verse: Verse | null) => {
    setState(prev => ({ ...prev, selectedVerse: verse }));
  };

  const getVerseRange = async (startVerse: number, endVerse: number) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const verses = await localDataService.getVerseRange(
        chapterId,
        startVerse,
        endVerse
      );
      const transformedVerses = verses.map(verse =>
        localDataService.transformVerseToUIFormat(verse)
      );

      setState(prev => ({
        ...prev,
        verses: transformedVerses,
        loading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to load verse range:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to load verse range',
      }));
    }
  };

  const getAdjacentVerse = async (
    currentVerseNumber: number,
    direction: 'prev' | 'next'
  ) => {
    try {
      const verse = await localDataService.getAdjacentVerse(
        chapterId,
        currentVerseNumber,
        direction
      );
      return verse ? localDataService.transformVerseToUIFormat(verse) : null;
    } catch (error) {
      console.error('Failed to get adjacent verse:', error);
      return null;
    }
  };

  const refreshVerses = () => {
    loadVerses();
  };

  // Load verses when chapterId, filters, or sort changes
  useEffect(() => {
    loadVerses();
  }, [chapterId, JSON.stringify(filters), JSON.stringify(sort)]);

  return {
    ...state,
    selectVerse,
    getVerseRange,
    getAdjacentVerse,
    refreshVerses,
  };
};
