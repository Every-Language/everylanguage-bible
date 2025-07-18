import { useState, useEffect, useMemo } from 'react';
import { bibleService } from '../services/bibleService';
import { useSync } from '@/shared/context/SyncContext';
import type { Book, BooksState, BooksFilters } from '../types';

export const useBibleBooks = () => {
  const { isInitialized, hasLocalData } = useSync();
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

  // Fetch books from the service
  const fetchBooks = async () => {
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
      setState(prev => ({
        ...prev,
        books,
        filteredBooks: books,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch books',
      }));
    }
  };

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

  // Fetch books only when database is initialized and has data
  useEffect(() => {
    if (isInitialized && hasLocalData) {
      fetchBooks();
    } else if (isInitialized && !hasLocalData) {
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          'No data available. Please check your internet connection and try syncing.',
      }));
    }
  }, [isInitialized, hasLocalData]);

  return {
    books: state.filteredBooks,
    allBooks: state.books,
    loading: state.loading || !isInitialized,
    error: state.error,
    selectedBook: state.selectedBook,
    filters: state.filters,

    // Actions
    fetchBooks,
    setSearchQuery,
    setSortOptions,
    selectBook,
    clearSelection,
  };
};
