import React, { useMemo } from 'react';
import { useAudioStore } from '@/shared/store';
import { bookService } from '@/features/bible/services/domain/bookService';
import { getBookImageSource } from '@/shared/services';

export interface UseBookImageReturn {
  imageSource: any;
  bookData: any;
}

export const useBookImage = (bookName?: string): UseBookImageReturn => {
  const { bibleBooks, initializeBibleBooks } = useAudioStore();

  // Ensure Bible books are initialized
  React.useEffect(() => {
    if (bibleBooks.length === 0) {
      initializeBibleBooks();
    }
  }, [bibleBooks.length, initializeBibleBooks]);

  const bookData = useMemo(() => {
    if (!bookName) return null;

    // Convert store books to the format expected by bookService
    const availableBooks = bibleBooks.map(book => ({
      name: book.name,
      order: typeof book.id === 'string' ? parseInt(book.id, 10) : book.id,
      testament: book.testament,
      imagePath: book.imagePath,
    }));

    return bookService.findBookWithFallback(bookName, availableBooks);
  }, [bookName, bibleBooks]);

  const imageSource = useMemo(() => {
    if (bookData?.imagePath) {
      return getBookImageSource(bookData.imagePath);
    }
    return null;
  }, [bookData]);

  return {
    imageSource,
    bookData,
  };
};
