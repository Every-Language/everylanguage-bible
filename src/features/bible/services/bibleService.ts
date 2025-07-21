import { localDataService } from '@/shared/services/database/LocalDataService';
import DatabaseManager from '@/shared/services/database/DatabaseManager';

const databaseManager = DatabaseManager.getInstance();
import type { Book } from '../types';
import type { Tables } from '@everylanguage/shared-types';

export const bibleService = {
  async ensureDatabaseReady(): Promise<void> {
    try {
      await databaseManager.waitForReady(5000); // 5 second timeout
    } catch (error) {
      console.error('Database readiness check failed:', error);
      throw new Error(
        'Database not ready. Please wait for the app to finish loading or try restarting.'
      );
    }
  },

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

  async isDataAvailable(): Promise<boolean> {
    try {
      await this.ensureDatabaseReady();
      return await localDataService.isDataAvailable();
    } catch (error) {
      console.error('Failed to check data availability:', error);
      return false;
    }
  },

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
