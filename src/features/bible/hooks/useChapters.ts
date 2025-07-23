import { useState, useEffect, useMemo } from 'react';
import { bibleService } from '../services/bibleService';
import { useSync } from '@/shared/context/SyncContext';
import type { Chapter, ChaptersState, ChapterWithMetadata } from '../types';

export const useChapters = (bookId: string | null) => {
  const { isInitialized, hasLocalData } = useSync();
  const [state, setState] = useState<ChaptersState>({
    chapters: [],
    loading: false,
    error: null,
    selectedChapter: null,
  });

  // Fetch chapters from the service
  const fetchChapters = async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const chapters = await bibleService.fetchChaptersByBookId(id);

      setState(prev => ({
        ...prev,
        chapters,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch chapters',
      }));
    }
  };

  // Select a chapter
  const selectChapter = (chapter: Chapter) => {
    setState(prev => ({ ...prev, selectedChapter: chapter }));
  };

  // Clear selection
  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedChapter: null }));
  };

  // Reset state when bookId changes
  useEffect(() => {
    setState({
      chapters: [],
      loading: false,
      error: null,
      selectedChapter: null,
    });
  }, [bookId]);

  // Fetch chapters when bookId changes and database is ready
  useEffect(() => {
    if (isInitialized && hasLocalData && bookId) {
      fetchChapters(bookId);
    } else if (isInitialized && !hasLocalData) {
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          'No data available. Please check your internet connection and try syncing.',
      }));
    }
  }, [isInitialized, hasLocalData, bookId]);

  // Memoized chapters with additional computed properties
  const chaptersWithMetadata = useMemo(() => {
    return state.chapters.map(chapter => ({
      ...chapter,
      title: `Chapter ${chapter.chapter_number}`,
      verseRange: `1 - ${chapter.total_verses}`,
      isAvailable: (chapter as any).isAvailable || false,
    })) as ChapterWithMetadata[];
  }, [state.chapters]);

  return {
    chapters: chaptersWithMetadata,
    loading: state.loading || !isInitialized,
    error: state.error,
    selectedChapter: state.selectedChapter,

    // Actions
    fetchChapters: () => (bookId ? fetchChapters(bookId) : Promise.resolve()),
    selectChapter,
    clearSelection,
  };
};
