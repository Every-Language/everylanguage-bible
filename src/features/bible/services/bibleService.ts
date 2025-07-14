import { localDataService } from '@/shared/services/database/LocalDataService';
import { databaseManager } from '@/shared/services/database/DatabaseManager';
import type { Book } from '../types';

export const bibleService = {
  /**
   * Ensure database is ready before performing operations
   */
  async ensureDatabaseReady(): Promise<void> {
    if (!databaseManager.isReady()) {
      throw new Error('Database not initialized. Please wait for the app to finish loading.');
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
      throw new Error(`Failed to fetch books: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to fetch book: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to fetch books for testament: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to search books: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to get books count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
   * Get random books for discovery
   */
  async getRandomBooks(count = 5): Promise<Book[]> {
    try {
      await this.ensureDatabaseReady();
      const localBooks = await localDataService.getRandomBooks(count);
      return localBooks.map(book => localDataService.transformToUIFormat(book));
    } catch (error) {
      throw new Error(`Failed to get random books: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Legacy method - fetch books by bible version (deprecated)
   * @deprecated Use fetchBooksByTestament instead
   */
  async fetchBooksByVersion(_bibleVersionId: string): Promise<Book[]> {
    console.warn('fetchBooksByVersion is deprecated. Use fetchBooksByTestament instead.');
    // Default to all books since we don't have version concept in local DB
    return this.fetchBooks();
  },
}; 