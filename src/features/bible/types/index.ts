import type { Tables } from '@everylanguage/shared-types';

// Use the existing books table type from shared types
export type Book = Tables<'books'>;

export type BookSortBy = 'name' | 'book_number' | 'global_order';

export interface BooksFilters {
  searchQuery?: string;
  sortBy?: BookSortBy;
  sortOrder?: 'asc' | 'desc';
}

export interface BooksState {
  books: Book[];
  filteredBooks: Book[];
  loading: boolean;
  error: string | null;
  filters: BooksFilters;
  selectedBook: Book | null;
} 