import { create } from 'zustand';
import { type Book } from '@/shared/utils';

interface ChapterViewState {
  isOpen: boolean;
  selectedBook: Book | null;
  openChapterView: (book: Book) => void;
  closeChapterView: () => void;
}

export const useChapterViewStore = create<ChapterViewState>(set => ({
  isOpen: false,
  selectedBook: null,

  openChapterView: (book: Book) => {
    set({
      isOpen: true,
      selectedBook: book,
    });
  },

  closeChapterView: () => {
    set({
      isOpen: false,
      selectedBook: null,
    });
  },
}));
