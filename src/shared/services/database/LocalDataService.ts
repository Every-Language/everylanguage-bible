import DatabaseManager from './DatabaseManager';
import type { Tables } from '@everylanguage/shared-types';
import type {
  LocalBook,
  LocalChapter,
  LocalVerse,
  LocalVerseText,
} from './schema';
import { validateTestament } from '../sync/types';
import { logger } from '../../utils/logger';
import { SQLiteBindParams } from 'expo-sqlite';

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

export enum MediaAvailabilityStatus {
  NONE = 'none',
  PARTIAL = 'partial',
  COMPLETE = 'complete',
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
    const params: SQLiteBindParams = [];

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
    const params: SQLiteBindParams = [];

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

  /**
   * Check if all required tables have complete data
   */
  async isDataComplete(): Promise<{
    isComplete: boolean;
    details: Array<{
      tableName: string;
      localCount: number;
      expectedMinCount: number;
      isComplete: boolean;
    }>;
  }> {
    try {
      const checks = [
        {
          tableName: 'books',
          checkFn: () => this.getBooksCount(),
          expectedMinCount: 66,
        },
        {
          tableName: 'chapters',
          checkFn: () => this.getChaptersCount(),
          expectedMinCount: 1000,
        },
        {
          tableName: 'verses',
          checkFn: () => this.getVersesCount(),
          expectedMinCount: 30000,
        },
      ];

      const results = await Promise.all(
        checks.map(async check => {
          const count = await check.checkFn();
          return {
            tableName: check.tableName,
            localCount: count,
            expectedMinCount: check.expectedMinCount,
            isComplete: count >= check.expectedMinCount,
          };
        })
      );

      const isComplete = results.every(result => result.isComplete);

      return {
        isComplete,
        details: results,
      };
    } catch (error) {
      logger.error('Error checking data completeness:', error);
      return {
        isComplete: false,
        details: [],
      };
    }
  }

  /**
   * Get detailed completeness information for each table
   */
  async getDetailedCompletenessInfo(): Promise<{
    books: {
      count: number;
      expectedMin: number;
      isComplete: boolean;
      percentage: number;
    };
    chapters: {
      count: number;
      expectedMin: number;
      isComplete: boolean;
      percentage: number;
    };
    verses: {
      count: number;
      expectedMin: number;
      isComplete: boolean;
      percentage: number;
    };
    overall: {
      totalRecords: number;
      totalExpected: number;
      overallPercentage: number;
      health: 'excellent' | 'good' | 'warning' | 'critical';
    };
  }> {
    try {
      const [booksCount, chaptersCount, versesCount] = await Promise.all([
        this.getBooksCount(),
        this.getChaptersCount(),
        this.getVersesCount(),
      ]);

      const booksInfo = {
        count: booksCount,
        expectedMin: 66,
        isComplete: booksCount >= 66,
        percentage: Math.min((booksCount / 66) * 100, 100),
      };

      const chaptersInfo = {
        count: chaptersCount,
        expectedMin: 1000,
        isComplete: chaptersCount >= 1000,
        percentage: Math.min((chaptersCount / 1000) * 100, 100),
      };

      const versesInfo = {
        count: versesCount,
        expectedMin: 30000,
        isComplete: versesCount >= 30000,
        percentage: Math.min((versesCount / 30000) * 100, 100),
      };

      const totalRecords = booksCount + chaptersCount + versesCount;
      const totalExpected = 66 + 1000 + 30000;
      const overallPercentage = Math.min(
        (totalRecords / totalExpected) * 100,
        100
      );

      // Determine overall health
      let health: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

      if (
        overallPercentage >= 95 &&
        booksInfo.isComplete &&
        chaptersInfo.isComplete &&
        versesInfo.isComplete
      ) {
        health = 'excellent';
      } else if (
        overallPercentage >= 80 &&
        booksInfo.isComplete &&
        chaptersInfo.isComplete
      ) {
        health = 'good';
      } else if (overallPercentage >= 50 && booksInfo.isComplete) {
        health = 'warning';
      } else {
        health = 'critical';
      }

      return {
        books: booksInfo,
        chapters: chaptersInfo,
        verses: versesInfo,
        overall: {
          totalRecords,
          totalExpected,
          overallPercentage,
          health,
        },
      };
    } catch (error) {
      logger.error('Error getting detailed completeness info:', error);
      return {
        books: { count: 0, expectedMin: 66, isComplete: false, percentage: 0 },
        chapters: {
          count: 0,
          expectedMin: 1000,
          isComplete: false,
          percentage: 0,
        },
        verses: {
          count: 0,
          expectedMin: 30000,
          isComplete: false,
          percentage: 0,
        },
        overall: {
          totalRecords: 0,
          totalExpected: 31066,
          overallPercentage: 0,
          health: 'critical',
        },
      };
    }
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
    const params: (string | number)[] = [];

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

  /**
   * Check if a chapter has media files available
   */
  async hasMediaFiles(chapterId: string): Promise<boolean> {
    try {
      const result = await databaseManager.executeQuery<{ count: number }>(
        'SELECT COUNT(*) as count FROM media_files WHERE chapter_id = ? AND deleted_at IS NULL',
        [chapterId]
      );
      return (result[0]?.count || 0) > 0;
    } catch (error) {
      logger.error('Error checking media files for chapter:', error);
      return false;
    }
  }

  /**
   * Get media availability for multiple chapters
   * Returns: 'none' (no media files), 'partial' (some verses covered), 'complete' (all verses covered)
   */
  async getChaptersMediaAvailability(
    chapterIds: string[]
  ): Promise<Map<string, MediaAvailabilityStatus>> {
    if (chapterIds.length === 0) {
      return new Map();
    }

    try {
      const placeholders = chapterIds.map(() => '?').join(',');
      const query = `
        SELECT 
          mf.chapter_id,
          mf.start_verse_id,
          mf.end_verse_id,
          c.total_verses
        FROM media_files mf
        LEFT JOIN chapters c ON mf.chapter_id = c.id
        WHERE mf.chapter_id IN (${placeholders}) AND mf.deleted_at IS NULL
        ORDER BY mf.chapter_id, mf.start_verse_id
      `;

      const results = await databaseManager.executeQuery<{
        chapter_id: string;
        start_verse_id: string | null;
        end_verse_id: string | null;
        total_verses: number;
      }>(query, chapterIds);

      const availabilityMap = new Map<string, MediaAvailabilityStatus>();

      // Initialize all chapters as not available
      for (const chapterId of chapterIds) {
        availabilityMap.set(chapterId, MediaAvailabilityStatus.NONE);
      }

      // Group results by chapter
      const chapterGroups = new Map<
        string,
        Array<{
          start_verse_id: string | null;
          end_verse_id: string | null;
          total_verses: number;
        }>
      >();

      for (const result of results) {
        if (!chapterGroups.has(result.chapter_id)) {
          chapterGroups.set(result.chapter_id, []);
        }
        chapterGroups.get(result.chapter_id)!.push({
          start_verse_id: result.start_verse_id,
          end_verse_id: result.end_verse_id,
          total_verses: result.total_verses,
        });
      }

      // Calculate availability for each chapter
      for (const [chapterId, mediaFiles] of chapterGroups) {
        if (mediaFiles.length === 0) {
          availabilityMap.set(chapterId, MediaAvailabilityStatus.NONE);
          continue;
        }

        const totalVerses = mediaFiles[0]?.total_verses || 0;
        let coveredVerses = 0;

        // Calculate total verses covered by all media files
        for (const mediaFile of mediaFiles) {
          if (mediaFile.start_verse_id && mediaFile.end_verse_id) {
            // Parse verse numbers from format like "gen-1-1" and "gen-1-31"
            // Split by "-" and get the 3rd element (index 2)
            const startVerseParts = mediaFile.start_verse_id.split('-');
            const endVerseParts = mediaFile.end_verse_id.split('-');

            if (startVerseParts.length >= 3 && endVerseParts.length >= 3) {
              const startVerseStr = startVerseParts[2];
              const endVerseStr = endVerseParts[2];

              if (startVerseStr && endVerseStr) {
                const startVerse = parseInt(startVerseStr, 10);
                const endVerse = parseInt(endVerseStr, 10);

                // Validate that we got valid numbers
                if (!isNaN(startVerse) && !isNaN(endVerse)) {
                  const versesInFile = endVerse - startVerse + 1;
                  coveredVerses += versesInFile;
                }
              }
            }
          }
        }

        // Determine availability status
        if (coveredVerses === 0) {
          availabilityMap.set(chapterId, MediaAvailabilityStatus.NONE);
        } else if (coveredVerses >= totalVerses) {
          availabilityMap.set(chapterId, MediaAvailabilityStatus.COMPLETE);
        } else {
          availabilityMap.set(chapterId, MediaAvailabilityStatus.PARTIAL);
        }
      }

      return availabilityMap;
    } catch (error) {
      logger.error('Error getting chapters media availability:', error);
      // Return all chapters as not available on error
      const availabilityMap = new Map<string, MediaAvailabilityStatus>();
      for (const chapterId of chapterIds) {
        availabilityMap.set(chapterId, MediaAvailabilityStatus.NONE);
      }
      return availabilityMap;
    }
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

    // Get media availability for all chapters
    const chapterIds = localChapters.map(chapter => chapter.id);
    const mediaAvailability =
      await this.getChaptersMediaAvailability(chapterIds);

    return localChapters.map(chapter => ({
      ...this.transformChapterToUIFormat(chapter),
      mediaAvailability:
        mediaAvailability.get(chapter.id) || MediaAvailabilityStatus.NONE,
    }));
  }

  // Verse methods
  async getVersesByChapterId(
    chapterId: string,
    filters?: VerseFilters,
    sort?: VerseSort
  ): Promise<LocalVerse[]> {
    let query = 'SELECT * FROM verses WHERE chapter_id = ?';
    const params: (string | number)[] = [chapterId];
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
    const params: (string | number)[] = [];

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

    const params: (string | number)[] = [chapterId, currentVerseNumber];
    const result = await databaseManager.executeQuery<LocalVerse>(
      query,
      params
    );
    return result[0] || null;
  }

  async getRandomVerses(count = 5, chapterId?: string): Promise<LocalVerse[]> {
    let query = 'SELECT * FROM verses';
    const params: (string | number)[] = [];

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
          vt.publish_status,
          vt.version as verse_text_version,
          vt.created_at as verse_text_created_at,
          vt.updated_at as verse_text_updated_at,
          vt.synced_at as verse_text_synced_at
        FROM verses v
        LEFT JOIN verse_texts vt ON v.id = vt.verse_id
      `;

      const params: (string | number)[] = [chapterId];

      // Add WHERE clause for chapter filter first
      query += ` WHERE v.chapter_id = ?`;

      // Add text version filter if provided
      if (textVersionId) {
        query += ` AND vt.text_version_id = ?`;
        query += ` AND (vt.publish_status = 'published' OR vt.publish_status IS NULL)`;
        params.push(textVersionId);
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
      logger.error('Error getting verses with texts:', error);
      throw error;
    }
  }

  // ✅ NEW: Get verse texts for specific verses and text version
  async getVerseTextsForChapter(
    chapterId: string,
    textVersionId?: string
  ): Promise<Map<string, LocalVerseText>> {
    try {
      logger.log('🗃️ DB - getVerseTextsForChapter called with:', {
        chapterId,
        textVersionId,
      });

      if (!textVersionId) {
        logger.log('🗃️ DB - No textVersionId provided, returning empty map');
        return new Map();
      }

      const db = await databaseManager.getDatabase();

      const query = `
        SELECT 
          vt.id,
          vt.verse_id,
          vt.text_version_id,
          vt.verse_text,
          vt.publish_status,
          vt.version,
          vt.created_at,
          vt.updated_at,
          vt.synced_at
        FROM verse_texts vt
        INNER JOIN verses v ON vt.verse_id = v.id
        WHERE v.chapter_id = ?
          AND vt.text_version_id = ?
          AND vt.publish_status = 'published'
        ORDER BY v.verse_number ASC
      `;

      logger.log('🗃️ DB - Executing query with params:', [
        chapterId,
        textVersionId,
      ]);

      // First, let's check if any verse_texts exist at all
      const allVerseTextsCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM verse_texts'
      );
      logger.log(
        '🗃️ DB - Total verse_texts in database:',
        allVerseTextsCount?.count || 0
      );

      // Check if any verse_texts exist for this text version
      const versionTextsCount = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM verse_texts WHERE text_version_id = ?',
        [textVersionId]
      );
      logger.log(
        '🗃️ DB - Verse texts for this version:',
        versionTextsCount?.count || 0
      );

      const rows = await db.getAllAsync<LocalVerseText>(query, [
        chapterId,
        textVersionId,
      ]);

      logger.log('🗃️ DB - Found', rows.length, 'verse texts');
      if (rows.length > 0) {
        const firstRow = rows[0];
        logger.log('🗃️ DB - First verse text:', {
          id: firstRow?.id,
          verse_id: firstRow?.verse_id,
          text_version_id: firstRow?.text_version_id,
          verse_text: firstRow?.verse_text?.substring(0, 50) + '...',
        });
      }

      // Create a map with verse_id as key for quick lookup
      const verseTextsMap = new Map<string, LocalVerseText>();
      rows.forEach(verseText => {
        verseTextsMap.set(verseText.verse_id, verseText);
      });

      logger.log('🗃️ DB - Created map with', verseTextsMap.size, 'entries');
      return verseTextsMap;
    } catch (error) {
      logger.error('🗃️ DB - Error getting verse texts for chapter:', error);
      throw error;
    }
  }
}

export const localDataService = LocalDataService.getInstance();
