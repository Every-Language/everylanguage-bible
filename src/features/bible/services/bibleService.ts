import { localDataService } from '@/shared/services/database/LocalDataService';
import DatabaseManager from '@/shared/services/database/DatabaseManager';

const databaseManager = DatabaseManager.getInstance();
import type { Book } from '../types';
import type { Tables } from '@everylanguage/shared-types';

export const bibleService = {
  /**
   * Ensure database is ready before performing operations
   */
  async ensureDatabaseReady(): Promise<void> {
    if (!databaseManager.isReady()) {
      throw new Error(
        'Database not initialized. Please wait for the app to finish loading.'
      );
    }
  },

  /**
   * Fetch all books from the local database
   */
  async fetchBooks(): Promise<Book[]> {
    try {
      await this.ensureDatabaseReady();
      const books = await localDataService.getBooksForUI();
      return books;
    } catch (error) {
      throw new Error(
        `Failed to fetch books: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Fetch a specific book by ID
   */
  async fetchBookById(id: string): Promise<Book | null> {
    try {
      await this.ensureDatabaseReady();
      const localBook = await localDataService.getBookById(id);
      if (!localBook) {
        return null;
      }
      return localDataService.transformToUIFormat(localBook);
    } catch (error) {
      throw new Error(
        `Failed to fetch book: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Fetch books by testament (OT/NT) - replacing bible version concept
   */
  async fetchBooksByTestament(testament: 'OT' | 'NT'): Promise<Book[]> {
    try {
      await this.ensureDatabaseReady();
      const books = await localDataService.getBooksForUI({ testament });
      return books;
    } catch (error) {
      throw new Error(
        `Failed to fetch books for testament: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Search books by name
   */
  async searchBooks(query: string): Promise<Book[]> {
    try {
      await this.ensureDatabaseReady();
      const localBooks = await localDataService.searchBooks(query);
      return localBooks.map(book => localDataService.transformToUIFormat(book));
    } catch (error) {
      throw new Error(
        `Failed to search books: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Get books count by testament
   */
  async getBooksCount(testament?: 'OT' | 'NT'): Promise<number> {
    try {
      await this.ensureDatabaseReady();
      return await localDataService.getBooksCount(testament);
    } catch (error) {
      throw new Error(
        `Failed to get books count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Check if local data is available
   */
  async isDataAvailable(): Promise<boolean> {
    try {
      await this.ensureDatabaseReady();
      return await localDataService.isDataAvailable();
    } catch (error) {
      console.error('Failed to check data availability:', error);
      return false;
    }
  },

  /**
   * Fetch chapters for a specific book
   */
  async fetchChaptersByBookId(bookId: string): Promise<Tables<'chapters'>[]> {
    try {
      await this.ensureDatabaseReady();
      const chapters = await localDataService.getChaptersForUI(bookId);
      return chapters;
    } catch (error) {
      throw new Error(
        `Failed to fetch chapters: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Fetch a specific chapter by ID
   */
  async fetchChapterById(
    chapterId: string
  ): Promise<Tables<'chapters'> | null> {
    try {
      await this.ensureDatabaseReady();
      const localChapter = await localDataService.getChapterById(chapterId);
      return localChapter
        ? localDataService.transformChapterToUIFormat(localChapter)
        : null;
    } catch (error) {
      throw new Error(
        `Failed to fetch chapter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },

  /**
   * Get chapters count for a book
   */
  async getChaptersCount(bookId: string): Promise<number> {
    try {
      await this.ensureDatabaseReady();
      return await localDataService.getChaptersCount(bookId);
    } catch (error) {
      throw new Error(
        `Failed to get chapters count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
};
