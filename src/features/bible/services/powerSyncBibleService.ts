import { powerSyncSystem } from '@/shared/services/powersync';
import { logger } from '@/shared/utils/logger';
import type { AppSchema } from '../../../../powersync/AppSchema';

// Types based on PowerSync schema
type PowerSyncDatabase = (typeof AppSchema)['types'];
export type PowerSyncBook = PowerSyncDatabase['books'];
export type PowerSyncChapter = PowerSyncDatabase['chapters'];
export type PowerSyncVerse = PowerSyncDatabase['verses'];
export type PowerSyncVerseText = PowerSyncDatabase['verse_texts'];
export type PowerSyncTextVersion = PowerSyncDatabase['text_versions'];
export type PowerSyncAudioVersion = PowerSyncDatabase['audio_versions'];
export type PowerSyncMediaFile = PowerSyncDatabase['media_files'];
export type PowerSyncMediaFileVerse = PowerSyncDatabase['media_files_verses'];

// Filter and sort interfaces
export interface BookFilters {
  testament?: 'OT' | 'NT';
  search?: string;
  bibleVersionId?: string;
}

export interface BookSort {
  field: 'name' | 'book_number' | 'global_order';
  direction: 'asc' | 'desc';
}

export interface ChapterFilters {
  bookId?: string;
}

export interface VerseFilters {
  chapterId?: string;
  verseNumber?: number;
  hasText?: boolean;
  textVersionId?: string;
}

export interface VerseSort {
  field: 'verse_number' | 'global_order';
  direction: 'asc' | 'desc';
}

// Enhanced types with metadata
export interface BookWithMetadata extends PowerSyncBook {
  chaptersCount?: number;
  hasAudio?: boolean;
  hasText?: boolean;
}

export interface ChapterWithMetadata extends PowerSyncChapter {
  versesCount?: number;
  hasAudio?: boolean;
  hasText?: boolean;
  bookName?: string;
}

export interface VerseWithText extends PowerSyncVerse {
  verseText?: string;
  textVersionName?: string;
  hasAudio?: boolean;
}

export interface VerseWithMetadata extends PowerSyncVerse {
  chapterNumber?: number;
  bookName?: string;
  verseText?: string;
  audioFile?: PowerSyncMediaFile;
  hasText?: boolean;
  hasAudio?: boolean;
}

export enum MediaAvailabilityStatus {
  NONE = 'none',
  PARTIAL = 'partial',
  COMPLETE = 'complete',
}

/**
 * PowerSync-based Bible Service
 *
 * Provides a clean API for accessing Bible data through PowerSync with:
 * - Proper error handling and logging
 * - Optimized queries for performance
 * - Type safety with PowerSync schema
 * - Consistent data transformation
 */
export class PowerSyncBibleService {
  private static instance: PowerSyncBibleService;

  private constructor() {}

  static getInstance(): PowerSyncBibleService {
    if (!PowerSyncBibleService.instance) {
      PowerSyncBibleService.instance = new PowerSyncBibleService();
    }
    return PowerSyncBibleService.instance;
  }

  /**
   * Ensure PowerSync is ready before operations
   */
  private ensureReady(): void {
    if (!powerSyncSystem.isInitialized) {
      throw new Error(
        'PowerSync not initialized. Please wait for initialization to complete.'
      );
    }
  }

  // ==================== BIBLE VERSIONS ====================

  /**
   * Get all available bible versions
   */
  async getBibleVersions(): Promise<PowerSyncDatabase['bible_versions'][]> {
    this.ensureReady();

    try {
      const query = `
        SELECT * FROM bible_versions 
        ORDER BY name ASC
      `;

      const results = await powerSyncSystem.getAll(query);
      logger.debug('PowerSyncBibleService: Retrieved bible versions', {
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get bible versions:',
        error
      );
      throw new Error(
        `Failed to get bible versions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==================== BOOKS ====================

  /**
   * Get books with optional filtering and sorting
   */
  async getBooks(
    filters: BookFilters = {},
    sort: BookSort = { field: 'global_order', direction: 'asc' }
  ): Promise<PowerSyncBook[]> {
    this.ensureReady();

    try {
      let query = 'SELECT * FROM books';
      const conditions: string[] = [];
      const params: any[] = [];

      // Apply filters
      if (filters.testament) {
        conditions.push('testament = ?');
        params.push(filters.testament);
      }

      if (filters.bibleVersionId) {
        conditions.push('bible_version_id = ?');
        params.push(filters.bibleVersionId);
      }

      if (filters.search) {
        conditions.push('name LIKE ?');
        params.push(`%${filters.search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Apply sorting
      query += ` ORDER BY ${sort.field} ${sort.direction.toUpperCase()}`;

      const results = await powerSyncSystem.getAll(query, params);
      logger.debug('PowerSyncBibleService: Retrieved books', {
        count: results.length,
        filters,
        sort,
      });
      return results;
    } catch (error) {
      logger.error('PowerSyncBibleService: Failed to get books:', error);
      throw new Error(
        `Failed to get books: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get books with metadata (chapter counts, media availability)
   */
  async getBooksWithMetadata(
    filters: BookFilters = {}
  ): Promise<BookWithMetadata[]> {
    this.ensureReady();

    try {
      let query = `
        SELECT 
          b.*,
          COUNT(DISTINCT c.id) as chaptersCount,
          CASE WHEN COUNT(DISTINCT tv.id) > 0 THEN 1 ELSE 0 END as hasText,
          CASE WHEN COUNT(DISTINCT av.id) > 0 THEN 1 ELSE 0 END as hasAudio
        FROM books b
        LEFT JOIN chapters c ON b.id = c.book_id
        LEFT JOIN text_versions tv ON b.bible_version_id = tv.bible_version_id
        LEFT JOIN audio_versions av ON b.bible_version_id = av.bible_version_id
      `;

      const conditions: string[] = [];
      const params: any[] = [];

      if (filters.testament) {
        conditions.push('b.testament = ?');
        params.push(filters.testament);
      }

      if (filters.bibleVersionId) {
        conditions.push('b.bible_version_id = ?');
        params.push(filters.bibleVersionId);
      }

      if (filters.search) {
        conditions.push('b.name LIKE ?');
        params.push(`%${filters.search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += `
        GROUP BY b.id
        ORDER BY b.global_order ASC
      `;

      const results = await powerSyncSystem.getAll(query, params);
      logger.debug('PowerSyncBibleService: Retrieved books with metadata', {
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get books with metadata:',
        error
      );
      throw new Error(
        `Failed to get books with metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a specific book by ID
   */
  async getBookById(id: string): Promise<PowerSyncBook | null> {
    this.ensureReady();

    try {
      const query = 'SELECT * FROM books WHERE id = ?';
      const result = await powerSyncSystem.get(query, [id]);

      logger.debug('PowerSyncBibleService: Retrieved book by ID', {
        id,
        found: !!result,
      });
      return result || null;
    } catch (error) {
      logger.error('PowerSyncBibleService: Failed to get book by ID:', error);
      throw new Error(
        `Failed to get book: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get book by book number
   */
  async getBookByNumber(
    bookNumber: number,
    bibleVersionId?: string
  ): Promise<PowerSyncBook | null> {
    this.ensureReady();

    try {
      let query = 'SELECT * FROM books WHERE book_number = ?';
      const params: any[] = [bookNumber];

      if (bibleVersionId) {
        query += ' AND bible_version_id = ?';
        params.push(bibleVersionId);
      }

      const result = await powerSyncSystem.get(query, params);
      logger.debug('PowerSyncBibleService: Retrieved book by number', {
        bookNumber,
        found: !!result,
      });
      return result || null;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get book by number:',
        error
      );
      throw new Error(
        `Failed to get book: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search books with ranking
   */
  async searchBooks(searchTerm: string, limit = 20): Promise<PowerSyncBook[]> {
    this.ensureReady();

    try {
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

      const results = await powerSyncSystem.getAll(query, params);
      logger.debug('PowerSyncBibleService: Search books completed', {
        searchTerm,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error('PowerSyncBibleService: Failed to search books:', error);
      throw new Error(
        `Failed to search books: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==================== CHAPTERS ====================

  /**
   * Get chapters for a book
   */
  async getChaptersByBookId(bookId: string): Promise<PowerSyncChapter[]> {
    this.ensureReady();

    try {
      const query = `
        SELECT * FROM chapters 
        WHERE book_id = ? 
        ORDER BY chapter_number ASC
      `;

      const results = await powerSyncSystem.getAll(query, [bookId]);
      logger.debug('PowerSyncBibleService: Retrieved chapters for book', {
        bookId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error('PowerSyncBibleService: Failed to get chapters:', error);
      throw new Error(
        `Failed to get chapters: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get chapters with metadata (verse counts, media availability)
   */
  async getChaptersWithMetadata(
    bookId: string
  ): Promise<ChapterWithMetadata[]> {
    this.ensureReady();

    try {
      const query = `
        SELECT 
          c.*,
          b.name as bookName,
          COUNT(DISTINCT v.id) as versesCount,
          CASE WHEN COUNT(DISTINCT vt.id) > 0 THEN 1 ELSE 0 END as hasText,
          CASE WHEN COUNT(DISTINCT mf.id) > 0 THEN 1 ELSE 0 END as hasAudio
        FROM chapters c
        LEFT JOIN books b ON c.book_id = b.id
        LEFT JOIN verses v ON c.id = v.chapter_id
        LEFT JOIN verse_texts vt ON v.id = vt.verse_id
        LEFT JOIN media_files mf ON c.id = mf.chapter_id
        WHERE c.book_id = ?
        GROUP BY c.id
        ORDER BY c.chapter_number ASC
      `;

      const results = await powerSyncSystem.getAll(query, [bookId]);
      logger.debug('PowerSyncBibleService: Retrieved chapters with metadata', {
        bookId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get chapters with metadata:',
        error
      );
      throw new Error(
        `Failed to get chapters with metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a specific chapter by ID
   */
  async getChapterById(id: string): Promise<PowerSyncChapter | null> {
    this.ensureReady();

    try {
      const query = 'SELECT * FROM chapters WHERE id = ?';
      const result = await powerSyncSystem.get(query, [id]);

      logger.debug('PowerSyncBibleService: Retrieved chapter by ID', {
        id,
        found: !!result,
      });
      return result || null;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get chapter by ID:',
        error
      );
      throw new Error(
        `Failed to get chapter: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==================== VERSES ====================

  /**
   * Get verses for a chapter with optional filtering and sorting
   */
  async getVersesByChapterId(
    chapterId: string,
    filters: VerseFilters = {},
    sort: VerseSort = { field: 'verse_number', direction: 'asc' }
  ): Promise<PowerSyncVerse[]> {
    this.ensureReady();

    try {
      let query = 'SELECT * FROM verses WHERE chapter_id = ?';
      const params: any[] = [chapterId];

      // Apply additional filters
      if (filters.verseNumber !== undefined) {
        query += ' AND verse_number = ?';
        params.push(filters.verseNumber);
      }

      // Apply sorting
      query += ` ORDER BY ${sort.field} ${sort.direction.toUpperCase()}`;

      const results = await powerSyncSystem.getAll(query, params);
      logger.debug('PowerSyncBibleService: Retrieved verses for chapter', {
        chapterId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error('PowerSyncBibleService: Failed to get verses:', error);
      throw new Error(
        `Failed to get verses: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get verses with their text content
   */
  async getVersesWithText(
    chapterId: string,
    textVersionId?: string
  ): Promise<VerseWithText[]> {
    this.ensureReady();

    try {
      let query = `
        SELECT 
          v.*,
          vt.verse_text,
          tv.name as textVersionName,
          CASE WHEN mfv.id IS NOT NULL THEN 1 ELSE 0 END as hasAudio
        FROM verses v
        LEFT JOIN verse_texts vt ON v.id = vt.verse_id
        LEFT JOIN text_versions tv ON vt.text_version_id = tv.id
        LEFT JOIN media_files_verses mfv ON v.id = mfv.verse_id
        WHERE v.chapter_id = ?
      `;

      const params: any[] = [chapterId];

      if (textVersionId) {
        query += ' AND (vt.text_version_id = ? OR vt.text_version_id IS NULL)';
        params.push(textVersionId);
      }

      query += ' ORDER BY v.verse_number ASC';

      const results = await powerSyncSystem.getAll(query, params);
      logger.debug('PowerSyncBibleService: Retrieved verses with text', {
        chapterId,
        textVersionId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get verses with text:',
        error
      );
      throw new Error(
        `Failed to get verses with text: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a specific verse by chapter and verse number
   */
  async getVerseByChapterAndNumber(
    chapterId: string,
    verseNumber: number
  ): Promise<PowerSyncVerse | null> {
    this.ensureReady();

    try {
      const query = `
        SELECT * FROM verses 
        WHERE chapter_id = ? AND verse_number = ?
      `;

      const result = await powerSyncSystem.get(query, [chapterId, verseNumber]);
      logger.debug(
        'PowerSyncBibleService: Retrieved verse by chapter and number',
        {
          chapterId,
          verseNumber,
          found: !!result,
        }
      );
      return result || null;
    } catch (error) {
      logger.error('PowerSyncBibleService: Failed to get verse:', error);
      throw new Error(
        `Failed to get verse: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get verse range
   */
  async getVerseRange(
    chapterId: string,
    startVerse: number,
    endVerse: number
  ): Promise<PowerSyncVerse[]> {
    this.ensureReady();

    try {
      const query = `
        SELECT * FROM verses 
        WHERE chapter_id = ? AND verse_number BETWEEN ? AND ?
        ORDER BY verse_number ASC
      `;

      const results = await powerSyncSystem.getAll(query, [
        chapterId,
        startVerse,
        endVerse,
      ]);
      logger.debug('PowerSyncBibleService: Retrieved verse range', {
        chapterId,
        startVerse,
        endVerse,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error('PowerSyncBibleService: Failed to get verse range:', error);
      throw new Error(
        `Failed to get verse range: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get adjacent verse (previous or next)
   */
  async getAdjacentVerse(
    chapterId: string,
    currentVerseNumber: number,
    direction: 'prev' | 'next'
  ): Promise<PowerSyncVerse | null> {
    this.ensureReady();

    try {
      const operator = direction === 'next' ? '>' : '<';
      const order = direction === 'next' ? 'ASC' : 'DESC';

      const query = `
        SELECT * FROM verses 
        WHERE chapter_id = ? AND verse_number ${operator} ?
        ORDER BY verse_number ${order}
        LIMIT 1
      `;

      const result = await powerSyncSystem.get(query, [
        chapterId,
        currentVerseNumber,
      ]);
      logger.debug('PowerSyncBibleService: Retrieved adjacent verse', {
        chapterId,
        currentVerseNumber,
        direction,
        found: !!result,
      });
      return result || null;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get adjacent verse:',
        error
      );
      throw new Error(
        `Failed to get adjacent verse: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==================== TEXT VERSIONS ====================

  /**
   * Get available text versions
   */
  async getTextVersions(
    languageEntityId?: string
  ): Promise<PowerSyncTextVersion[]> {
    this.ensureReady();

    try {
      let query = 'SELECT * FROM text_versions WHERE deleted_at IS NULL';
      const params: any[] = [];

      if (languageEntityId) {
        query += ' AND language_entity_id = ?';
        params.push(languageEntityId);
      }

      query += ' ORDER BY name ASC';

      const results = await powerSyncSystem.getAll(query, params);
      logger.debug('PowerSyncBibleService: Retrieved text versions', {
        languageEntityId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get text versions:',
        error
      );
      throw new Error(
        `Failed to get text versions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==================== AUDIO VERSIONS ====================

  /**
   * Get available audio versions
   */
  async getAudioVersions(
    languageEntityId?: string
  ): Promise<PowerSyncAudioVersion[]> {
    this.ensureReady();

    try {
      let query = 'SELECT * FROM audio_versions WHERE deleted_at IS NULL';
      const params: any[] = [];

      if (languageEntityId) {
        query += ' AND language_entity_id = ?';
        params.push(languageEntityId);
      }

      query += ' ORDER BY name ASC';

      const results = await powerSyncSystem.getAll(query, params);
      logger.debug('PowerSyncBibleService: Retrieved audio versions', {
        languageEntityId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get audio versions:',
        error
      );
      throw new Error(
        `Failed to get audio versions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==================== MEDIA FILES ====================

  /**
   * Get media files for a chapter
   */
  async getMediaFilesByChapterId(
    chapterId: string
  ): Promise<PowerSyncMediaFile[]> {
    this.ensureReady();

    try {
      const query = `
        SELECT * FROM media_files 
        WHERE chapter_id = ? AND deleted_at IS NULL
        ORDER BY created_at ASC
      `;

      const results = await powerSyncSystem.getAll(query, [chapterId]);
      logger.debug('PowerSyncBibleService: Retrieved media files for chapter', {
        chapterId,
        count: results.length,
      });
      return results;
    } catch (error) {
      logger.error('PowerSyncBibleService: Failed to get media files:', error);
      throw new Error(
        `Failed to get media files: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get statistics about the local database
   */
  async getDatabaseStats(): Promise<{
    booksCount: number;
    chaptersCount: number;
    versesCount: number;
    textVersionsCount: number;
    audioVersionsCount: number;
  }> {
    this.ensureReady();

    try {
      const [books, chapters, verses, textVersions, audioVersions] =
        await Promise.all([
          powerSyncSystem.get('SELECT COUNT(*) as count FROM books'),
          powerSyncSystem.get('SELECT COUNT(*) as count FROM chapters'),
          powerSyncSystem.get('SELECT COUNT(*) as count FROM verses'),
          powerSyncSystem.get(
            'SELECT COUNT(*) as count FROM text_versions WHERE deleted_at IS NULL'
          ),
          powerSyncSystem.get(
            'SELECT COUNT(*) as count FROM audio_versions WHERE deleted_at IS NULL'
          ),
        ]);

      const stats = {
        booksCount: books?.count || 0,
        chaptersCount: chapters?.count || 0,
        versesCount: verses?.count || 0,
        textVersionsCount: textVersions?.count || 0,
        audioVersionsCount: audioVersions?.count || 0,
      };

      logger.debug('PowerSyncBibleService: Retrieved database stats', stats);
      return stats;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to get database stats:',
        error
      );
      throw new Error(
        `Failed to get database stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if PowerSync has any Bible data
   */
  async hasBibleData(): Promise<boolean> {
    this.ensureReady();

    try {
      const result = await powerSyncSystem.get(
        'SELECT COUNT(*) as count FROM books LIMIT 1'
      );
      const hasData = (result?.count || 0) > 0;

      logger.debug('PowerSyncBibleService: Checked for Bible data', {
        hasData,
      });
      return hasData;
    } catch (error) {
      logger.error(
        'PowerSyncBibleService: Failed to check for Bible data:',
        error
      );
      return false;
    }
  }
}

// Export singleton instance
export const powerSyncBibleService = PowerSyncBibleService.getInstance();
