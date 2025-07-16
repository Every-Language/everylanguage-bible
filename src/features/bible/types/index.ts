import type { Tables } from '@everylanguage/shared-types';

// Use the existing books table type from shared types
export type Book = Tables<'books'>;
export type Chapter = Tables<'chapters'>;
export type Verse = Tables<'verses'>;

export interface BooksFilters {
  testament?: 'OT' | 'NT';
  search?: string;
}

export interface BooksState {
  books: Book[];
  filteredBooks: Book[];
  loading: boolean;
  error: string | null;
  filters: BooksFilters;
  selectedBook: Book | null;
}

export interface ChaptersState {
  chapters: Chapter[];
  loading: boolean;
  error: string | null;
  selectedChapter: Chapter | null;
}

export interface VersesState {
  verses: Verse[];
  loading: boolean;
  error: string | null;
  selectedVerse: Verse | null;
}

export interface BibleNavigationState {
  currentScreen: 'books' | 'chapters';
  selectedBook: Book | null;
  selectedChapter: Chapter | null;
  selectedVerse: Verse | null;
}

export type BookSortBy = 'name' | 'book_number' | 'global_order';
