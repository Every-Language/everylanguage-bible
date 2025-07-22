import DatabaseManager from './DatabaseManager';
import { LocalBook, LocalChapter, LocalVerse, LocalVerseText } from './schema';
import type { Tables } from '@everylanguage/shared-types';
import { validateTestament } from '../sync/types';

const databaseManager = DatabaseManager.getInstance();

interface BookFilters {
  testament?: string; // Changed from hardcoded union to flexible string
  search?: string;
}

export interface BookSort {
  field: string;
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

export class LocalDataService {
  private static instance: LocalDataService;

  private constructor() {}

  static getInstance(): LocalDataService {
    if (!LocalDataService.instance) {
      LocalDataService.instance = new LocalDataService();
    }
    return LocalDataService.instance;
  }

  /**
   * Ensure database is ready before operations
   */
  private async ensureReady(): Promise<void> {
    await databaseManager.ensureInitialized();
  }

  /**
   * Get books with optional filtering
   */
  async getBooks(filters: BookFilters = {}): Promise<LocalBook[]> {
    await this.ensureReady();

    const db = await databaseManager.getDatabase();

    let query = 'SELECT * FROM books';
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.testament) {
      // Validate and normalize testament but don't fail on unknown values
      const validatedTestament = validateTestament(filters.testament);
      if (validatedTestament !== null) {
        conditions.push('testament = ?');
        params.push(validatedTestament);
      }
    }

    if (filters?.search) {
      conditions.push('name LIKE ?');
      params.push(`%${filters.search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY global_order';

    return await db.getAllAsync(query, params);
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
      testament: validateTestament(localBook.testament) as 'old' | 'new' | null, // Handle null testament values
      global_order: localBook.global_order,
      created_at: localBook.created_at,
      updated_at: localBook.updated_at,
      bible_version_id: '', // This field might not be in local schema
    };
  }

  async getBooksForUI(
    filters?: BookFilters,
    _sort?: BookSort
  ): Promise<Tables<'books'>[]> {
    const localBooks = await this.getBooks(filters);
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

  // ✅ NEW: Get verses with their associated verse texts for a chapter
  async getVersesWithTexts(
    chapterId: string,
    textVersionId?: string
  ): Promise<
    Array<{
      verse: LocalVerse;
      verseText: LocalVerseText | null;
    }>
  > {
    try {
      const db = await databaseManager.getDatabase();

      let query = `
        SELECT 
          v.id as verse_id,
          v.chapter_id,
          v.verse_number,
          v.global_order as verse_global_order,
          v.created_at as verse_created_at,
          v.updated_at as verse_updated_at,
          v.synced_at as verse_synced_at,
          vt.id as verse_text_id,
          vt.verse_text,
          vt.text_version_id,
          vt.project_id,
          vt.publish_status,
          vt.version as verse_text_version,
          vt.created_at as verse_text_created_at,
          vt.updated_at as verse_text_updated_at,
          vt.synced_at as verse_text_synced_at
        FROM verses v
        LEFT JOIN verse_texts vt ON v.id = vt.verse_id
      `;

      const params: any[] = [chapterId];

      // Add WHERE clause for chapter filter first
      query += ` WHERE v.chapter_id = ?`;

      // Add text version filter if provided
      if (textVersionId) {
        query += ` AND (vt.text_version_id = ? OR vt.project_id = ?)`;
        query += ` AND (vt.publish_status = 'published' OR vt.publish_status IS NULL)`;
        params.push(textVersionId, textVersionId);
      }

      query += ` ORDER BY v.verse_number ASC`;

      const rows = await db.getAllAsync<{
        verse_id: string;
        chapter_id: string;
        verse_number: number;
        verse_global_order: number | null;
        verse_created_at: string;
        verse_updated_at: string;
        verse_synced_at: string;
        verse_text_id: string | null;
        verse_text: string | null;
        text_version_id: string | null;
        project_id: string | null;
        publish_status: string | null;
        verse_text_version: number | null;
        verse_text_created_at: string | null;
        verse_text_updated_at: string | null;
        verse_text_synced_at: string | null;
      }>(query, params);

      return rows.map(row => ({
        verse: {
          id: row.verse_id,
          chapter_id: row.chapter_id,
          verse_number: row.verse_number,
          global_order: row.verse_global_order,
          created_at: row.verse_created_at,
          updated_at: row.verse_updated_at,
          synced_at: row.verse_synced_at,
        },
        verseText: row.verse_text_id
          ? {
              id: row.verse_text_id,
              verse_id: row.verse_id,
              text_version_id: row.text_version_id,
              project_id: row.project_id,
              verse_text: row.verse_text!,
              publish_status: row.publish_status!,
              version: row.verse_text_version!,
              created_at: row.verse_text_created_at!,
              updated_at: row.verse_text_updated_at!,
              synced_at: row.verse_text_synced_at!,
            }
          : null,
      }));
    } catch (error) {
      console.error('Error getting verses with texts:', error);
      throw error;
    }
  }

  // ✅ NEW: Get verse texts for specific verses and text version
  async getVerseTextsForChapter(
    chapterId: string,
    textVersionId?: string
  ): Promise<Map<string, LocalVerseText>> {
    try {
      console.log('🗃️ DB - getVerseTextsForChapter called with:', {
        chapterId,
        textVersionId,
      });

      if (!textVersionId) {
        console.log('🗃️ DB - No textVersionId provided, returning empty map');
        return new Map();
      }

      const db = await databaseManager.getDatabase();

      const query = `
        SELECT 
          vt.id,
          vt.verse_id,
          vt.text_version_id,
          vt.project_id,
          vt.verse_text,
          vt.publish_status,
          vt.version,
          vt.created_at,
          vt.updated_at,
          vt.synced_at
        FROM verse_texts vt
        INNER JOIN verses v ON vt.verse_id = v.id
        WHERE v.chapter_id = ?
          AND (vt.text_version_id = ? OR vt.project_id = ?)
          AND vt.publish_status = 'published'
        ORDER BY v.verse_number ASC
      `;

      console.log('🗃️ DB - Executing query with params:', [
        chapterId,
        textVersionId,
        textVersionId,
      ]);

      // First, let's check if any verse_texts exist at all
      const allVerseTextsCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM verse_texts'
      );
      console.log(
        '🗃️ DB - Total verse_texts in database:',
        allVerseTextsCount?.count || 0
      );

      // Check if any verse_texts exist for this text version
      const versionTextsCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM verse_texts WHERE text_version_id = ? OR project_id = ?',
        [textVersionId, textVersionId]
      );
      console.log(
        '🗃️ DB - Verse texts for this version:',
        versionTextsCount?.count || 0
      );

      const rows = await db.getAllAsync<LocalVerseText>(query, [
        chapterId,
        textVersionId,
        textVersionId,
      ]);

      console.log('🗃️ DB - Found', rows.length, 'verse texts');
      if (rows.length > 0) {
        const firstRow = rows[0];
        console.log('🗃️ DB - First verse text:', {
          id: firstRow?.id,
          verse_id: firstRow?.verse_id,
          text_version_id: firstRow?.text_version_id,
          project_id: firstRow?.project_id,
          verse_text: firstRow?.verse_text?.substring(0, 50) + '...',
        });
      }

      // Create a map with verse_id as key for quick lookup
      const verseTextsMap = new Map<string, LocalVerseText>();
      rows.forEach(verseText => {
        verseTextsMap.set(verseText.verse_id, verseText);
      });

      console.log('🗃️ DB - Created map with', verseTextsMap.size, 'entries');
      return verseTextsMap;
    } catch (error) {
      console.error('🗃️ DB - Error getting verse texts for chapter:', error);
      throw error;
    }
  }
}

export const localDataService = LocalDataService.getInstance();
