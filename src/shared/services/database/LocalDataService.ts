import DatabaseManager from './DatabaseManager';

const databaseManager = DatabaseManager.getInstance();
import type { LocalBook, LocalChapter, LocalVerse } from './schema';
import type { Tables } from '@everylanguage/shared-types';

export interface BookFilters {
  testament?: 'OT' | 'NT';
  search?: string;
}

export interface BookSort {
  field: 'name' | 'book_number' | 'global_order';
  direction: 'asc' | 'desc';
}

export interface VerseFilters {
  chapterId?: string;
  verseNumber?: number;
}

export interface VerseSort {
  field: 'verse_number' | 'global_order';
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

    const result = await databaseManager.executeQuery<{ count: number }>(
      query,
      params
    );
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
      limit,
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
      bible_version_id: '', // This field might not be in local schema
    };
  }

  async getBooksForUI(
    filters?: BookFilters,
    sort?: BookSort
  ): Promise<Tables<'books'>[]> {
    const localBooks = await this.getBooks(filters, sort);
    return localBooks.map(book => this.transformToUIFormat(book));
  }

  // Chapter methods
  async getChaptersByBookId(bookId: string): Promise<LocalChapter[]> {
    const query =
      'SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number ASC';
    return databaseManager.executeQuery<LocalChapter>(query, [bookId]);
  }

  async getChapterById(id: string): Promise<LocalChapter | null> {
    const result = await databaseManager.executeQuery<LocalChapter>(
      'SELECT * FROM chapters WHERE id = ?',
      [id]
    );

    return result[0] || null;
  }

  async getChapterByBookAndNumber(
    bookId: string,
    chapterNumber: number
  ): Promise<LocalChapter | null> {
    const result = await databaseManager.executeQuery<LocalChapter>(
      'SELECT * FROM chapters WHERE book_id = ? AND chapter_number = ?',
      [bookId, chapterNumber]
    );

    return result[0] || null;
  }

  async getChaptersCount(bookId?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM chapters';
    const params: any[] = [];

    if (bookId) {
      query += ' WHERE book_id = ?';
      params.push(bookId);
    }

    const result = await databaseManager.executeQuery<{ count: number }>(
      query,
      params
    );
    return result[0]?.count || 0;
  }

  // Utility method to convert local chapter to the format expected by the UI
  transformChapterToUIFormat(localChapter: LocalChapter): Tables<'chapters'> {
    return {
      id: localChapter.id,
      book_id: localChapter.book_id,
      chapter_number: localChapter.chapter_number,
      total_verses: localChapter.total_verses,
      global_order: localChapter.global_order,
      created_at: localChapter.created_at,
      updated_at: localChapter.updated_at,
    };
  }

  async getChaptersForUI(bookId: string): Promise<Tables<'chapters'>[]> {
    const localChapters = await this.getChaptersByBookId(bookId);
    return localChapters.map(chapter =>
      this.transformChapterToUIFormat(chapter)
    );
  }

  // Verse methods
  async getVersesByChapterId(
    chapterId: string,
    filters?: VerseFilters,
    sort?: VerseSort
  ): Promise<LocalVerse[]> {
    let query = 'SELECT * FROM verses WHERE chapter_id = ?';
    const params: any[] = [chapterId];
    const conditions: string[] = [];

    // Apply additional filters
    if (filters?.verseNumber) {
      conditions.push('verse_number = ?');
      params.push(filters.verseNumber);
    }

    // Add additional WHERE conditions
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // Apply sorting
    if (sort) {
      query += ` ORDER BY ${sort.field} ${sort.direction.toUpperCase()}`;
    } else {
      // Default sort by verse_number
      query += ' ORDER BY verse_number ASC';
    }

    return databaseManager.executeQuery<LocalVerse>(query, params);
  }

  async getVerseById(id: string): Promise<LocalVerse | null> {
    const result = await databaseManager.executeQuery<LocalVerse>(
      'SELECT * FROM verses WHERE id = ?',
      [id]
    );

    return result[0] || null;
  }

  async getVerseByChapterAndNumber(
    chapterId: string,
    verseNumber: number
  ): Promise<LocalVerse | null> {
    const result = await databaseManager.executeQuery<LocalVerse>(
      'SELECT * FROM verses WHERE chapter_id = ? AND verse_number = ?',
      [chapterId, verseNumber]
    );

    return result[0] || null;
  }

  async getVersesCount(chapterId?: string): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM verses';
    const params: any[] = [];

    if (chapterId) {
      query += ' WHERE chapter_id = ?';
      params.push(chapterId);
    }

    const result = await databaseManager.executeQuery<{ count: number }>(
      query,
      params
    );
    return result[0]?.count || 0;
  }

  async getVerseRange(
    chapterId: string,
    startVerse: number,
    endVerse: number
  ): Promise<LocalVerse[]> {
    const query = `
      SELECT * FROM verses 
      WHERE chapter_id = ? AND verse_number >= ? AND verse_number <= ?
      ORDER BY verse_number ASC
    `;

    return databaseManager.executeQuery<LocalVerse>(query, [
      chapterId,
      startVerse,
      endVerse,
    ]);
  }

  async getAdjacentVerse(
    chapterId: string,
    currentVerseNumber: number,
    direction: 'prev' | 'next'
  ): Promise<LocalVerse | null> {
    const operator = direction === 'next' ? '>' : '<';
    const orderDirection = direction === 'next' ? 'ASC' : 'DESC';

    const query = `
      SELECT * FROM verses 
      WHERE chapter_id = ? AND verse_number ${operator} ?
      ORDER BY verse_number ${orderDirection}
      LIMIT 1
    `;

    const params: any[] = [chapterId, currentVerseNumber];
    const result = await databaseManager.executeQuery<LocalVerse>(
      query,
      params
    );
    return result[0] || null;
  }

  async getRandomVerses(count = 5, chapterId?: string): Promise<LocalVerse[]> {
    let query = 'SELECT * FROM verses';
    const params: any[] = [];

    if (chapterId) {
      query += ' WHERE chapter_id = ?';
      params.push(chapterId);
    }

    query += ' ORDER BY RANDOM() LIMIT ?';
    params.push(count);

    return databaseManager.executeQuery<LocalVerse>(query, params);
  }

  // Utility method to convert local verse to the format expected by the UI
  transformVerseToUIFormat(localVerse: LocalVerse): Tables<'verses'> {
    return {
      id: localVerse.id,
      chapter_id: localVerse.chapter_id,
      verse_number: localVerse.verse_number,
      global_order: localVerse.global_order,
      created_at: localVerse.created_at,
      updated_at: localVerse.updated_at,
    };
  }

  async getVersesForUI(
    chapterId: string,
    filters?: VerseFilters,
    sort?: VerseSort
  ): Promise<Tables<'verses'>[]> {
    const localVerses = await this.getVersesByChapterId(
      chapterId,
      filters,
      sort
    );
    return localVerses.map(verse => this.transformVerseToUIFormat(verse));
  }

  // Combined data methods for complex queries
  async getBookWithChaptersAndVerses(bookId: string): Promise<{
    book: LocalBook | null;
    chapters: Array<{
      chapter: LocalChapter;
      verses: LocalVerse[];
    }>;
  }> {
    const book = await this.getBookById(bookId);

    if (!book) {
      return { book: null, chapters: [] };
    }

    // ✅ PERFORMANCE FIX: Use JOIN to get all chapters and verses in one query
    // This eliminates the N+1 query problem
    const query = `
      SELECT 
        c.id as chapter_id,
        c.book_id as chapter_book_id,
        c.chapter_number,
        c.total_verses,
        c.global_order as chapter_global_order,
        c.created_at as chapter_created_at,
        c.updated_at as chapter_updated_at,
        c.synced_at as chapter_synced_at,
        v.id as verse_id,
        v.chapter_id as verse_chapter_id,
        v.verse_number,
        v.global_order as verse_global_order,
        v.created_at as verse_created_at,
        v.updated_at as verse_updated_at,
        v.synced_at as verse_synced_at
      FROM chapters c
      LEFT JOIN verses v ON c.id = v.chapter_id
      WHERE c.book_id = ?
      ORDER BY c.chapter_number ASC, v.verse_number ASC
    `;

    const rows = await databaseManager.executeQuery<{
      chapter_id: string;
      chapter_book_id: string;
      chapter_number: number;
      total_verses: number;
      chapter_global_order: number | null;
      chapter_created_at: string;
      chapter_updated_at: string;
      chapter_synced_at: string;
      verse_id: string | null;
      verse_chapter_id: string | null;
      verse_number: number | null;
      verse_global_order: number | null;
      verse_created_at: string | null;
      verse_updated_at: string | null;
      verse_synced_at: string | null;
    }>(query, [bookId]);

    // Group results by chapter
    const chaptersMap = new Map<
      string,
      { chapter: LocalChapter; verses: LocalVerse[] }
    >();

    for (const row of rows) {
      if (!chaptersMap.has(row.chapter_id)) {
        chaptersMap.set(row.chapter_id, {
          chapter: {
            id: row.chapter_id,
            book_id: row.chapter_book_id,
            chapter_number: row.chapter_number,
            total_verses: row.total_verses,
            global_order: row.chapter_global_order,
            created_at: row.chapter_created_at,
            updated_at: row.chapter_updated_at,
            synced_at: row.chapter_synced_at,
          },
          verses: [],
        });
      }

      // Add verse if it exists (LEFT JOIN may return null for chapters without verses)
      if (row.verse_id && row.verse_chapter_id) {
        chaptersMap.get(row.chapter_id)!.verses.push({
          id: row.verse_id,
          chapter_id: row.verse_chapter_id,
          verse_number: row.verse_number!,
          global_order: row.verse_global_order,
          created_at: row.verse_created_at!,
          updated_at: row.verse_updated_at!,
          synced_at: row.verse_synced_at!,
        });
      }
    }

    return {
      book,
      chapters: Array.from(chaptersMap.values()),
    };
  }

  async getChapterWithVerses(chapterId: string): Promise<{
    chapter: LocalChapter | null;
    verses: LocalVerse[];
  }> {
    const chapter = await this.getChapterById(chapterId);
    const verses = chapter ? await this.getVersesByChapterId(chapterId) : [];

    return {
      chapter,
      verses,
    };
  }

  // ✅ PERFORMANCE: Bulk method to prevent N+1 queries when loading multiple chapters
  async getMultipleChaptersWithVerses(chapterIds: string[]): Promise<
    Map<
      string,
      {
        chapter: LocalChapter | null;
        verses: LocalVerse[];
      }
    >
  > {
    if (chapterIds.length === 0) {
      return new Map();
    }

    const placeholders = chapterIds.map(() => '?').join(',');
    const query = `
      SELECT 
        c.id as chapter_id,
        c.book_id as chapter_book_id,
        c.chapter_number,
        c.total_verses,
        c.global_order as chapter_global_order,
        c.created_at as chapter_created_at,
        c.updated_at as chapter_updated_at,
        c.synced_at as chapter_synced_at,
        v.id as verse_id,
        v.chapter_id as verse_chapter_id,
        v.verse_number,
        v.global_order as verse_global_order,
        v.created_at as verse_created_at,
        v.updated_at as verse_updated_at,
        v.synced_at as verse_synced_at
      FROM chapters c
      LEFT JOIN verses v ON c.id = v.chapter_id
      WHERE c.id IN (${placeholders})
      ORDER BY c.chapter_number ASC, v.verse_number ASC
    `;

    const rows = await databaseManager.executeQuery<{
      chapter_id: string;
      chapter_book_id: string;
      chapter_number: number;
      total_verses: number;
      chapter_global_order: number | null;
      chapter_created_at: string;
      chapter_updated_at: string;
      chapter_synced_at: string;
      verse_id: string | null;
      verse_chapter_id: string | null;
      verse_number: number | null;
      verse_global_order: number | null;
      verse_created_at: string | null;
      verse_updated_at: string | null;
      verse_synced_at: string | null;
    }>(query, chapterIds);

    const result = new Map<
      string,
      { chapter: LocalChapter | null; verses: LocalVerse[] }
    >();

    // Initialize all requested chapters (even if not found)
    for (const chapterId of chapterIds) {
      result.set(chapterId, { chapter: null, verses: [] });
    }

    // Group results by chapter
    for (const row of rows) {
      if (!result.has(row.chapter_id)) {
        result.set(row.chapter_id, { chapter: null, verses: [] });
      }

      const entry = result.get(row.chapter_id)!;

      // Set chapter data (only once per chapter)
      if (!entry.chapter) {
        entry.chapter = {
          id: row.chapter_id,
          book_id: row.chapter_book_id,
          chapter_number: row.chapter_number,
          total_verses: row.total_verses,
          global_order: row.chapter_global_order,
          created_at: row.chapter_created_at,
          updated_at: row.chapter_updated_at,
          synced_at: row.chapter_synced_at,
        };
      }

      // Add verse if it exists
      if (row.verse_id && row.verse_chapter_id) {
        entry.verses.push({
          id: row.verse_id,
          chapter_id: row.verse_chapter_id,
          verse_number: row.verse_number!,
          global_order: row.verse_global_order,
          created_at: row.verse_created_at!,
          updated_at: row.verse_updated_at!,
          synced_at: row.verse_synced_at!,
        });
      }
    }

    return result;
  }
}

export const localDataService = LocalDataService.getInstance();
