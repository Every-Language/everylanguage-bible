import { bookRepository, BookData } from '../data/bookRepository';

export class BookService {
  // Find book with smart matching (exact, case-insensitive, partial)
  findBookWithFallback(
    bookName: string,
    availableBooks?: BookData[]
  ): BookData | null {
    if (!bookName) return null;

    // First try the repository
    let book = bookRepository.findBookByName(bookName);
    if (book) return book;

    // If we have a list of available books (from store), try smart matching
    if (availableBooks && availableBooks.length > 0) {
      // Try exact match first
      book = availableBooks.find(b => b.name === bookName) || null;
      if (book) return book;

      // Try case-insensitive match
      book =
        availableBooks.find(
          b => b.name.toLowerCase() === bookName.toLowerCase()
        ) || null;
      if (book) return book;

      // Try partial match
      book =
        availableBooks.find(
          b =>
            b.name.toLowerCase().includes(bookName.toLowerCase()) ||
            bookName.toLowerCase().includes(b.name.toLowerCase())
        ) || null;
      if (book) return book;
    }

    // Final fallback: try to generate basic data from repository
    return bookRepository.findBookByName(bookName);
  }

  // Get image path for a book
  getImagePath(bookName: string): string | null {
    return bookRepository.getImagePathFromBookName(bookName);
  }

  // Get all books
  getAllBooks(): BookData[] {
    return bookRepository.getAllBooks();
  }
}

// Export singleton instance
export const bookService = new BookService();
