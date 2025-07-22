import { useState, useEffect, useMemo, useCallback } from 'react';
import { bibleService } from '../services/bibleService';
import { useSync } from '@/shared/context/SyncContext';
import type { Book, BooksState, BooksFilters } from '../types';

export const useBibleBooks = () => {
  const { isInitialized, hasLocalData, isSyncing, lastSyncAt } = useSync();
  const [state, setState] = useState<BooksState>({
    books: [],
    filteredBooks: [],
    loading: false,
    error: null,
    filters: {
      searchQuery: '',
      sortBy: 'global_order',
      sortOrder: 'asc',
    },
    selectedBook: null,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch books from the service
  const fetchBooks = useCallback(
    async (forceRefresh: boolean = false) => {
      if (!isInitialized) {
        setState(prev => ({
          ...prev,
          loading: false,
          error:
            'Database not initialized. Please wait for the app to finish loading.',
        }));
        return;
      }

      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const books = await bibleService.fetchBooks();

        if (books.length === 0 && !forceRefresh) {
          // If no books found, provide a helpful message
          setState(prev => ({
            ...prev,
            books: [],
            filteredBooks: [],
            loading: false,
            error: hasLocalData
              ? 'No books found in database. Try refreshing or syncing again.'
              : 'No data available. Please check your internet connection and sync.',
          }));
          return;
        }

        setState(prev => ({
          ...prev,
          books,
          filteredBooks: books,
          loading: false,
          error: null,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch books';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [isInitialized, hasLocalData]
  );

  // Manual refresh function that can be called from UI
  const refreshBooks = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    return fetchBooks(true);
  }, [fetchBooks]);

  // Filter and sort books based on current filters
  const filteredBooks = useMemo(() => {
    let filtered = [...state.books];

    // Apply search filter
    if (state.filters.searchQuery) {
      const query = state.filters.searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const { sortBy, sortOrder } = state.filters;
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'book_number':
          aValue = a.book_number;
          bValue = b.book_number;
          break;
        case 'global_order':
        default:
          aValue = a.global_order || 0;
          bValue = b.global_order || 0;
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [state.books, state.filters]);

  // Update filtered books when filters change
  useEffect(() => {
    setState(prev => ({ ...prev, filteredBooks }));
  }, [filteredBooks]);

  // Update search query
  const setSearchQuery = (searchQuery: string) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, searchQuery },
    }));
  };

  // Update sort options
  const setSortOptions = (
    sortBy?: BooksFilters['sortBy'],
    sortOrder?: BooksFilters['sortOrder']
  ) => {
    setState(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        sortBy: sortBy || prev.filters.sortBy || 'global_order',
        sortOrder: sortOrder || prev.filters.sortOrder || 'asc',
      },
    }));
  };

  // Select a book
  const selectBook = (book: Book) => {
    setState(prev => ({ ...prev, selectedBook: book }));
  };

  // Clear selection
  const clearSelection = () => {
    setState(prev => ({ ...prev, selectedBook: null }));
  };

  // Fetch books when database is initialized - improved logic
  useEffect(() => {
    if (isInitialized) {
      fetchBooks();
    }
  }, [isInitialized, hasLocalData, refreshTrigger, fetchBooks]);

  // Also refresh when sync completes (lastSyncAt changes and syncing stops)
  useEffect(() => {
    if (isInitialized && !isSyncing && lastSyncAt) {
      // Small delay to ensure database operations are complete
      const timeoutId = setTimeout(() => {
        fetchBooks(true);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [lastSyncAt, isSyncing, isInitialized, fetchBooks]);

  // Auto-refresh when coming back from background sync
  useEffect(() => {
    if (
      isInitialized &&
      hasLocalData &&
      state.books.length === 0 &&
      !state.loading
    ) {
      // If we should have data but don't, try refreshing
      const timeoutId = setTimeout(() => {
        fetchBooks(true);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    isInitialized,
    hasLocalData,
    state.books.length,
    state.loading,
    fetchBooks,
  ]);

  return {
    books: state.filteredBooks,
    allBooks: state.books,
    loading: state.loading || !isInitialized,
    error: state.error,
    selectedBook: state.selectedBook,
    filters: state.filters,

    // Actions
    fetchBooks: refreshBooks, // Export the manual refresh function
    refreshBooks, // Explicit refresh function
    setSearchQuery,
    setSortOptions,
    selectBook,
    clearSelection,
  };
};
