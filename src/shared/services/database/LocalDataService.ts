import { databaseManager } from './DatabaseManager';
import type { LocalBook } from './schema';
import type { Tables } from '@everylanguage/shared-types';

export interface BookFilters {
  testament?: 'OT' | 'NT';
  search?: string;
}

export interface BookSort {
  field: 'name' | 'book_number' | 'global_order';
  direction: 'asc' | 'desc';
}

class LocalDataService {
  private static instance: LocalDataService;

  private constructor() {}

  static getInstance(): LocalDataService {
    if (!LocalDataService.instance) {
      LocalDataService.instance = new LocalDataService();
    }
    return LocalDataService.instance;
  }

  async getBooks(filters?: BookFilters, sort?: BookSort): Promise<LocalBook[]> {
    let query = 'SELECT * FROM books';
    const params: any[] = [];
    const conditions: string[] = [];

    // Apply filters
    if (filters?.testament) {
      conditions.push('testament = ?');
      params.push(filters.testament);
    }

    if (filters?.search) {
      conditions.push('name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Apply sorting
    if (sort) {
      query += ` ORDER BY ${sort.field} ${sort.direction.toUpperCase()}`;
    } else {
      // Default sort by global_order
      query += ' ORDER BY global_order ASC';
    }

    return databaseManager.executeQuery<LocalBook>(query, params);
  }

  async getBookById(id: string): Promise<LocalBook | null> {
    const result = await databaseManager.executeQuery<LocalBook>(
      'SELECT * FROM books WHERE id = ?',
      [id]
    );
    
    return result[0] || null;
  }

  async getBookByNumber(bookNumber: number): Promise<LocalBook | null> {
    const result = await databaseManager.executeQuery<LocalBook>(
      'SELECT * FROM books WHERE book_number = ?',
      [bookNumber]
    );
    
    return result[0] || null;
  }

  async getBooksCount(testament?: 'OT' | 'NT'): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM books';
    const params: any[] = [];

    if (testament) {
      query += ' WHERE testament = ?';
      params.push(testament);
    }

    const result = await databaseManager.executeQuery<{ count: number }>(query, params);
    return result[0]?.count || 0;
  }

  async searchBooks(searchTerm: string, limit = 10): Promise<LocalBook[]> {
    const query = `
      SELECT * FROM books 
      WHERE name LIKE ? 
      ORDER BY 
        CASE 
          WHEN name LIKE ? THEN 1
          WHEN name LIKE ? THEN 2
          ELSE 3
        END,
        global_order ASC
      LIMIT ?
    `;
    
    const params = [
      `%${searchTerm}%`,
      `${searchTerm}%`, // Starts with search term (highest priority)
      `%${searchTerm}%`, // Contains search term
      limit
    ];

    return databaseManager.executeQuery<LocalBook>(query, params);
  }

  async getBooksByTestament(testament: 'OT' | 'NT'): Promise<LocalBook[]> {
    return this.getBooks({ testament });
  }

  async getRandomBooks(count = 5): Promise<LocalBook[]> {
    const query = 'SELECT * FROM books ORDER BY RANDOM() LIMIT ?';
    return databaseManager.executeQuery<LocalBook>(query, [count]);
  }

  async getLastSyncedAt(): Promise<string | null> {
    const result = await databaseManager.executeQuery<{ synced_at: string }>(
      'SELECT MAX(synced_at) as synced_at FROM books'
    );
    
    return result[0]?.synced_at || null;
  }

  async isDataAvailable(): Promise<boolean> {
    const count = await this.getBooksCount();
    return count > 0;
  }

  // Utility method to convert local book to the format expected by the UI
  transformToUIFormat(localBook: LocalBook): Tables<'books'> {
    return {
      id: localBook.id,
      book_number: localBook.book_number,
      name: localBook.name,
      global_order: localBook.global_order,
      created_at: localBook.created_at,
      updated_at: localBook.updated_at,
      bible_version_id: '' // This field might not be in local schema
    };
  }

  async getBooksForUI(filters?: BookFilters, sort?: BookSort): Promise<Tables<'books'>[]> {
    const localBooks = await this.getBooks(filters, sort);
    return localBooks.map(book => this.transformToUIFormat(book));
  }
}

export const localDataService = LocalDataService.getInstance(); 