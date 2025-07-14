import { create } from 'zustand';
import { type Book } from '@/shared/utils';

export type ViewMode = 'chapters' | 'verses';

interface ChapterCardState {
  isOpen: boolean;
  selectedBook: Book | null;
  selectedChapter: number | null;
  viewMode: ViewMode;
  openChapterCard: (book: Book) => void;
  openVerseView: (book: Book, chapter: number) => void;
  setViewMode: (mode: ViewMode) => void;
  closeChapterCard: () => void;
}

export const useChapterCardStore = create<ChapterCardState>(set => ({
  isOpen: false,
  selectedBook: null,
  selectedChapter: null,
  viewMode: 'chapters',

  openChapterCard: (book: Book) => {
    set({
      isOpen: true,
      selectedBook: book,
      selectedChapter: null,
      viewMode: 'chapters',
    });
  },

  openVerseView: (book: Book, chapter: number) => {
    set({
      isOpen: true,
      selectedBook: book,
      selectedChapter: chapter,
      viewMode: 'verses',
    });
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  closeChapterCard: () => {
    set({
      isOpen: false,
      selectedBook: null,
      selectedChapter: null,
      viewMode: 'chapters',
    });
  },
}));
