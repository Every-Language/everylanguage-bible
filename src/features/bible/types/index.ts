import type { Tables } from '@everylanguage/shared-types';
import type { LocalVerseText } from '../../../shared/services/database/schema';

// Use the existing books table type from shared types
export type Book = Tables<'books'>;
export type Chapter = Tables<'chapters'>;
export type Verse = Tables<'verses'>;

// Extended chapter type with additional metadata
export interface ChapterWithMetadata extends Chapter {
  title: string;
  verseRange: string;
  isAvailable: boolean;
}

// ✅ NEW: Interface for verse with associated text
export interface VerseWithText {
  verse: Verse;
  verseText: LocalVerseText | null;
}

export interface BooksFilters {
  testament?: 'OT' | 'NT';
  search?: string;
  searchQuery?: string;
  sortBy?: 'name' | 'book_number' | 'global_order';
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

// ✅ NEW: Enhanced verses state with text support
export interface VersesWithTextState {
  versesWithTexts: VerseWithText[];
  loading: boolean;
  error: string | null;
  selectedVerse: Verse | null;
  currentTextVersion: unknown; // Will be properly typed when we use it
}

export interface BibleNavigationState {
  currentScreen: 'books' | 'chapters';
  selectedBook: Book | null;
  selectedChapter: Chapter | null;
  selectedVerse: Verse | null;
}

export type BookSortBy = 'name' | 'book_number' | 'global_order';
