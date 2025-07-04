import { create } from 'zustand';
import { type Book } from '@/shared/utils';

interface VerseViewState {
  isOpen: boolean;
  selectedBook: Book | null;
  selectedChapter: number | null;
  openVerseView: (book: Book, chapter: number) => void;
  closeVerseView: () => void;
}

export const useVerseViewStore = create<VerseViewState>(set => ({
  isOpen: false,
  selectedBook: null,
  selectedChapter: null,

  openVerseView: (book: Book, chapter: number) => {
    set({
      isOpen: true,
      selectedBook: book,
      selectedChapter: chapter,
    });
  },

  closeVerseView: () => {
    set({
      isOpen: false,
      selectedBook: null,
      selectedChapter: null,
    });
  },
}));
