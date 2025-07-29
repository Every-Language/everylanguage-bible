import { supabase } from '../../api/supabase';
import DatabaseManager from '../../database/DatabaseManager';
import type {
  SyncOptions,
  SyncResult,
  BaseSyncService,
  BibleSyncMetadata,
  SyncConfig,
} from '../types';

import type { Tables } from '@everylanguage/shared-types';
import { logger } from '../../../utils/logger';

const databaseManager = DatabaseManager.getInstance();

export interface BibleSyncOptions extends SyncOptions {
  forceFullSync?: boolean;
  checkVersionOnly?: boolean;
}

// Enhanced error types for better error handling
export interface BibleSyncErrorDetails {
  tableName?: string;
  recordId?: string;
  originalError?: unknown;
}

export class BibleSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: BibleSyncErrorDetails
  ) {
    super(message);
    this.name = 'BibleSyncError';
  }
}

// Validation utilities for Bible-specific data
const validateBookData = (book: Record<string, unknown>): Tables<'books'> => {
  if (!book['id'] || typeof book['id'] !== 'string') {
    throw new Error('Invalid book data: missing or invalid id');
  }

  if (!book['name'] || typeof book['name'] !== 'string') {
    throw new Error('Invalid book data: missing or invalid name');
  }

  if (
    typeof book['book_number'] !== 'number' ||
    (book['book_number'] as number) < 1
  ) {
    throw new Error('Invalid book data: missing or invalid book_number');
  }

  // Normalize testament field
  if (
    book['testament'] &&
    typeof book['testament'] === 'string' &&
    !['OT', 'NT'].includes(book['testament'] as string)
  ) {
    book['testament'] = null; // Set to null if invalid
  }

  return book as Tables<'books'>;
};

const validateChapterData = (
  chapter: Record<string, unknown>
): Tables<'chapters'> => {
  if (!chapter['id'] || typeof chapter['id'] !== 'string') {
    throw new Error('Invalid chapter data: missing or invalid id');
  }

  if (!chapter['book_id'] || typeof chapter['book_id'] !== 'string') {
    throw new Error('Invalid chapter data: missing or invalid book_id');
  }

  if (
    typeof chapter['chapter_number'] !== 'number' ||
    (chapter['chapter_number'] as number) < 1
  ) {
    throw new Error('Invalid chapter data: missing or invalid chapter_number');
  }

  // Ensure total_verses is a positive number
  if (
    typeof chapter['total_verses'] !== 'number' ||
    (chapter['total_verses'] as number) < 0
  ) {
    chapter['total_verses'] = 1; // Default to 1 if invalid
  }

  return chapter as Tables<'chapters'>;
};

const validateVerseData = (
  verse: Record<string, unknown>
): Tables<'verses'> => {
  if (!verse['id'] || typeof verse['id'] !== 'string') {
    throw new Error('Invalid verse data: missing or invalid id');
  }

  if (!verse['chapter_id'] || typeof verse['chapter_id'] !== 'string') {
    throw new Error('Invalid verse data: missing or invalid chapter_id');
  }

  if (
    typeof verse['verse_number'] !== 'number' ||
    (verse['verse_number'] as number) < 1
  ) {
    throw new Error('Invalid verse data: missing or invalid verse_number');
  }

  return verse as Tables<'verses'>;
};

class BibleSyncService implements BaseSyncService {
  private static instance: BibleSyncService;
  private isSyncing = false;
  private syncListeners: ((result: SyncResult) => void)[] = [];
  private config: SyncConfig = {
    strategy: 'version', // Use version-based syncing for bible content
    checkInterval: 24 * 60 * 60 * 1000, // Check for updates once per day
    autoSync: true,
  };

  // Cache for version check results to avoid frequent API calls
  private versionCheckCache: Map<
    string,
    { version: string; timestamp: number }
  > = new Map();
  private readonly VERSION_CACHE_TTL = 60 * 60 * 1000; // 1 hour cache

  // Clean up expired cache entries
  private cleanupVersionCache(): void {
    const now = Date.now();
    for (const [key, value] of this.versionCheckCache.entries()) {
      if (now - value.timestamp > this.VERSION_CACHE_TTL) {
        this.versionCheckCache.delete(key);
      }
    }
  }

  // Clean up sync state on errors
  private async cleanupSyncState(): Promise<void> {
    try {
      const tables = ['books', 'chapters', 'verses'];
      for (const table of tables) {
        await this.updateSyncStatus(table, 'idle');
      }
    } catch (error) {
      logger.error('Error cleaning up sync state:', error);
    }
  }

  private constructor() {}

  static getInstance(): BibleSyncService {
    if (!BibleSyncService.instance) {
      BibleSyncService.instance = new BibleSyncService();
    }
    return BibleSyncService.instance;
  }

  // Subscribe to sync events
  onSync(listener: (result: SyncResult) => void): () => void {
    this.syncListeners.push(listener);
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => listener(result));
  }

  /**
   * Check if bible content needs updating (optimized for rarely changing data)
   */
  async needsUpdate(): Promise<{ needsUpdate: boolean; tables: string[] }> {
    try {
      // Clean up expired cache entries
      this.cleanupVersionCache();

      const tables = ['books', 'chapters', 'verses'];
      const tablesToUpdate: string[] = [];

      for (const table of tables) {
        // Check cache first
        const cached = this.versionCheckCache.get(table);
        if (cached && Date.now() - cached.timestamp < this.VERSION_CACHE_TTL) {
          const localVersion = await this.getLocalVersion(table);
          if (localVersion !== cached.version) {
            tablesToUpdate.push(table);
          }
          continue;
        }

        // Check for data completeness (local vs remote count comparison)
        const needsCompletenessCheck = await this.needsCompletenessCheck(table);
        if (needsCompletenessCheck) {
          tablesToUpdate.push(table);
          continue;
        }

        // Check remote version (this would ideally be a lightweight endpoint)
        const hasChanges = await this.hasRemoteChanges(table);
        if (hasChanges) {
          tablesToUpdate.push(table);
        }
      }

      return {
        needsUpdate: tablesToUpdate.length > 0,
        tables: tablesToUpdate,
      };
    } catch (error) {
      logger.error('Error checking for updates:', error);
      return { needsUpdate: false, tables: [] };
    }
  }

  /**
   * Check if a table needs completeness verification by comparing local vs remote counts
   */
  private async needsCompletenessCheck(tableName: string): Promise<boolean> {
    try {
      if (!databaseManager.initialized) {
        return false;
      }

      // Get local count
      const localCountResult = await databaseManager.executeQuery<{
        count: number;
      }>(`SELECT COUNT(*) as count FROM ${tableName}`);
      const localCount = localCountResult[0]?.count || 0;

      // Get remote count
      const { count: remoteCount, error } = await supabase
        .from(tableName as 'books' | 'chapters' | 'verses')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error(`Error getting remote count for ${tableName}:`, error);
        return false; // Assume no update needed if we can't check
      }

      const countDifference = Math.abs((remoteCount || 0) - localCount);
      const needsUpdate = countDifference > 0;

      if (needsUpdate) {
        logger.info(`Data completeness check for ${tableName}:`, {
          localCount,
          remoteCount,
          difference: countDifference,
          needsUpdate: true,
        });
      }

      return needsUpdate;
    } catch (error) {
      logger.error(`Error in completeness check for ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Optimized sync method for bible content
   */
  async syncAll(options: BibleSyncOptions = {}): Promise<SyncResult[]> {
    if (this.isSyncing) {
      throw new Error('Bible sync is already in progress');
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];

    try {
      // Check if we need to sync at all (unless force sync)
      if (!options.forceFullSync) {
        const updateCheck = await this.needsUpdate();
        if (!updateCheck.needsUpdate) {
          logger.info('Bible content is up to date, skipping sync');
          return [
            {
              success: true,
              tableName: 'all',
              recordsSynced: 0,
            },
          ];
        }

        logger.info(
          'Bible content needs updating for tables:',
          updateCheck.tables
        );
      }

      // Sync books table with retry logic
      let booksResult: SyncResult;
      try {
        booksResult = await this.syncBooks(options);
        results.push(booksResult);
        this.notifyListeners(booksResult);
      } catch (error) {
        logger.error('Books sync failed:', error);
        booksResult = {
          success: false,
          tableName: 'books',
          recordsSynced: 0,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
        results.push(booksResult);
        this.notifyListeners(booksResult);
      }

      // Only sync chapters if books sync was successful
      if (booksResult.success) {
        let chaptersResult: SyncResult;
        try {
          chaptersResult = await this.syncChapters(options);
          results.push(chaptersResult);
          this.notifyListeners(chaptersResult);
        } catch (error) {
          logger.error('Chapters sync failed:', error);
          chaptersResult = {
            success: false,
            tableName: 'chapters',
            recordsSynced: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
          results.push(chaptersResult);
          this.notifyListeners(chaptersResult);
        }

        // Only sync verses if chapters sync was successful
        if (chaptersResult.success) {
          let versesResult: SyncResult;
          try {
            versesResult = await this.syncVerses(options);
            results.push(versesResult);
            this.notifyListeners(versesResult);
          } catch (error) {
            logger.error('Verses sync failed:', error);
            versesResult = {
              success: false,
              tableName: 'verses',
              recordsSynced: 0,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
            results.push(versesResult);
            this.notifyListeners(versesResult);
          }
        }
      }

      // Update last successful sync time only if at least one table synced successfully
      const hasSuccessfulSync = results.some(result => result.success);
      if (hasSuccessfulSync) {
        await this.updateLastFullSync();

        // Verify sync completeness after successful sync
        if (options.forceFullSync) {
          logger.info(
            'Performing completeness verification after full sync...'
          );
          const completenessResult = await this.verifySyncCompleteness();

          if (!completenessResult.success) {
            logger.warn(
              'Sync completed but data is incomplete:',
              completenessResult
            );

            // Add a warning result to notify about incomplete data
            const warningResult: SyncResult = {
              success: true,
              tableName: 'completeness_check',
              recordsSynced: 0,
              warning: `Data incomplete: ${completenessResult.summary.incompleteTables} tables missing records`,
            };
            results.push(warningResult);
            this.notifyListeners(warningResult);
          } else {
            logger.info('Sync completeness verification passed');
          }
        }
      }
    } catch (error) {
      // Enhanced error logging with detailed information
      const errorDetails = {
        error: error,
        errorType: typeof error,
        errorConstructor: (error as Error)?.constructor?.name,
        errorMessage: (error as Error)?.message || 'No message',
        errorStack: (error as Error)?.stack || 'No stack',
        // Remove the problematic JSON.stringify that was causing empty objects
        // errorStringified: JSON.stringify(
        //   error,
        //   Object.getOwnPropertyNames(error || {})
        // ),
      };

      logger.error('Bible sync failed:', errorDetails);

      // Clean up sync state on error
      await this.cleanupSyncState();

      // Add a general error result if no specific error results exist
      if (results.length === 0) {
        const errorResult: SyncResult = {
          success: false,
          tableName: 'general',
          recordsSynced: 0,
          error: error instanceof Error ? error.message : 'Unknown sync error',
        };
        results.push(errorResult);
        this.notifyListeners(errorResult);
      }
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  private async syncBooks(options: BibleSyncOptions = {}): Promise<SyncResult> {
    const { batchSize = 2000 } = options; // Increased from 1000 to 2000

    try {
      await this.updateSyncStatus('books', 'syncing');

      // For bible content, we often want full sync to ensure consistency
      const lastSync = options.forceFullSync
        ? '1970-01-01T00:00:00.000Z'
        : await this.getLastSync('books');

      let allBooks: Tables<'books'>[] = [];
      let hasMoreData = true;
      let lastFetchedId: string | null = null;

      // Dynamic batch sizing based on available memory (if possible)
      let optimizedBatchSize = Math.min(batchSize, 2000); // Increased from 500

      // For very large datasets, consider smaller batches to prevent memory issues
      if (options.forceFullSync && optimizedBatchSize > 1000) {
        optimizedBatchSize = 1000; // More conservative for full syncs
        logger.info('Using conservative batch size for full book sync');
      }

      while (hasMoreData) {
        let query = supabase
          .from('books')
          .select('*')
          .gte('updated_at', lastSync)
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(optimizedBatchSize);

        if (lastFetchedId) {
          query = query.gt('id', lastFetchedId);
        }

        // Add retry logic for network failures
        let remoteBooks: Tables<'books'>[] | null = null;
        let error: unknown = null;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const result = await query;
            remoteBooks = result.data;
            error = result.error;
            break; // Success, exit retry loop
          } catch (retryError) {
            if (attempt === maxRetries) {
              throw retryError;
            }
            logger.warn(
              `Book fetch attempt ${attempt} failed, retrying...`,
              retryError
            );
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          }
        }

        if (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to fetch books: ${errorMessage}`);
        }

        if (!remoteBooks || remoteBooks.length === 0) {
          hasMoreData = false;
          break;
        }

        allBooks = allBooks.concat(remoteBooks);

        const lastBook = remoteBooks[remoteBooks.length - 1];
        if (lastBook?.id) {
          lastFetchedId = lastBook.id;
        }

        if (remoteBooks.length < optimizedBatchSize) {
          hasMoreData = false;
        }
      }

      if (allBooks.length === 0) {
        await this.updateSyncStatus('books', 'idle');
        return {
          success: true,
          tableName: 'books',
          recordsSynced: 0,
        };
      }

      // Validate and upsert books
      const validatedBooks = allBooks.map(validateBookData);
      await this.upsertBooks(validatedBooks);

      await this.updateSyncStatus('books', 'idle');
      await this.updateLastSync('books', new Date().toISOString());

      return {
        success: true,
        tableName: 'books',
        recordsSynced: validatedBooks.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.updateSyncStatus('books', 'error', errorMessage);
      return {
        success: false,
        tableName: 'books',
        recordsSynced: 0,
        error: errorMessage,
      };
    }
  }

  private async syncChapters(
    options: BibleSyncOptions = {}
  ): Promise<SyncResult> {
    const { batchSize = 2000 } = options; // Increased from 1000 to 2000

    try {
      await this.updateSyncStatus('chapters', 'syncing');

      const lastSync = options.forceFullSync
        ? '1970-01-01T00:00:00.000Z'
        : await this.getLastSync('chapters');

      let allChapters: Tables<'chapters'>[] = [];
      let hasMoreData = true;
      let lastFetchedId: string | null = null;

      // Dynamic batch sizing based on available memory (if possible)
      let optimizedBatchSize = Math.min(batchSize, 2000); // Increased from 500

      // For very large datasets, consider smaller batches to prevent memory issues
      if (options.forceFullSync && optimizedBatchSize > 1000) {
        optimizedBatchSize = 1000; // More conservative for full syncs
        logger.info('Using conservative batch size for full chapter sync');
      }

      while (hasMoreData) {
        let query = supabase
          .from('chapters')
          .select('*')
          .gte('updated_at', lastSync)
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(optimizedBatchSize);

        if (lastFetchedId) {
          query = query.gt('id', lastFetchedId);
        }

        // Add retry logic for network failures
        let remoteChapters: Tables<'chapters'>[] | null = null;
        let error: unknown = null;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const result = await query;
            remoteChapters = result.data;
            error = result.error;
            break; // Success, exit retry loop
          } catch (retryError) {
            if (attempt === maxRetries) {
              throw retryError;
            }
            logger.warn(
              `Chapter fetch attempt ${attempt} failed, retrying...`,
              retryError
            );
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          }
        }

        if (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to fetch chapters: ${errorMessage}`);
        }

        if (!remoteChapters || remoteChapters.length === 0) {
          hasMoreData = false;
          break;
        }

        allChapters = allChapters.concat(remoteChapters);

        const lastChapter = remoteChapters[remoteChapters.length - 1];
        if (lastChapter?.id) {
          lastFetchedId = lastChapter.id;
        }

        if (remoteChapters.length < optimizedBatchSize) {
          hasMoreData = false;
        }
      }

      if (allChapters.length === 0) {
        await this.updateSyncStatus('chapters', 'idle');
        return {
          success: true,
          tableName: 'chapters',
          recordsSynced: 0,
        };
      }

      await this.upsertChapters(allChapters);
      await this.updateSyncStatus('chapters', 'idle');
      await this.updateLastSync('chapters', new Date().toISOString());

      return {
        success: true,
        tableName: 'chapters',
        recordsSynced: allChapters.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.updateSyncStatus('chapters', 'error', errorMessage);

      return {
        success: false,
        tableName: 'chapters',
        recordsSynced: 0,
        error: errorMessage,
      };
    }
  }

  private async syncVerses(
    options: BibleSyncOptions = {}
  ): Promise<SyncResult> {
    const { batchSize = 2000 } = options; // Increased from 1000 to 2000

    try {
      await this.updateSyncStatus('verses', 'syncing');

      const lastSync = options.forceFullSync
        ? '1970-01-01T00:00:00.000Z'
        : await this.getLastSync('verses');

      let allVerses: Tables<'verses'>[] = [];
      let hasMoreData = true;
      let lastFetchedId: string | null = null;

      // Dynamic batch sizing based on available memory (if possible)
      let optimizedBatchSize = Math.min(batchSize, 2000); // Increased from 500

      // For very large datasets, consider smaller batches to prevent memory issues
      if (options.forceFullSync && optimizedBatchSize > 1000) {
        optimizedBatchSize = 1000; // More conservative for full syncs
        logger.info('Using conservative batch size for full verse sync');
      }

      while (hasMoreData) {
        let query = supabase
          .from('verses')
          .select('*')
          .gte('updated_at', lastSync)
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(optimizedBatchSize);

        if (lastFetchedId) {
          query = query.gt('id', lastFetchedId);
        }

        // Add retry logic for network failures
        let remoteVerses: Tables<'verses'>[] | null = null;
        let error: unknown = null;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const result = await query;
            remoteVerses = result.data;
            error = result.error;
            break; // Success, exit retry loop
          } catch (retryError) {
            if (attempt === maxRetries) {
              throw retryError;
            }
            logger.warn(
              `Verse fetch attempt ${attempt} failed, retrying...`,
              retryError
            );
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
          }
        }

        if (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to fetch verses: ${errorMessage}`);
        }

        if (!remoteVerses || remoteVerses.length === 0) {
          hasMoreData = false;
          break;
        }

        allVerses = allVerses.concat(remoteVerses);

        const lastVerse = remoteVerses[remoteVerses.length - 1];
        if (lastVerse?.id) {
          lastFetchedId = lastVerse.id;
        }

        if (remoteVerses.length < optimizedBatchSize) {
          hasMoreData = false;
        }
      }

      if (allVerses.length === 0) {
        await this.updateSyncStatus('verses', 'idle');
        return {
          success: true,
          tableName: 'verses',
          recordsSynced: 0,
        };
      }

      await this.upsertVerses(allVerses);
      await this.updateSyncStatus('verses', 'idle');
      await this.updateLastSync('verses', new Date().toISOString());

      return {
        success: true,
        tableName: 'verses',
        recordsSynced: allVerses.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.updateSyncStatus('verses', 'error', errorMessage);

      return {
        success: false,
        tableName: 'verses',
        recordsSynced: 0,
        error: errorMessage,
      };
    }
  }

  // ✅ PERFORMANCE FIX: True batch upsert using SQLite batch operations
  private async upsertBooks(books: Tables<'books'>[]): Promise<void> {
    if (books.length === 0) return;

    try {
      await databaseManager.transaction(async () => {
        // Validate and normalize book data
        const validatedBooks = books
          .map(book => {
            try {
              return validateBookData(book);
            } catch (error) {
              logger.warn('Skipping invalid book data:', error);
              return null;
            }
          })
          .filter((book): book is Tables<'books'> => book !== null);

        if (validatedBooks.length === 0) {
          logger.warn('No valid books to insert after validation');
          return;
        }

        // Create placeholders for batch insert
        const placeholders = validatedBooks
          .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .join(', ');

        const query = `
        INSERT OR REPLACE INTO books (
          id, book_number, name, testament, global_order, 
          created_at, updated_at, synced_at
        ) VALUES ${placeholders}
      `;

        // Flatten all parameters with validated data
        const params = validatedBooks.flatMap(book => [
          book.id,
          book.book_number,
          book.name,
          book.testament, // Use validated testament
          book.global_order || 0,
          book.created_at || new Date().toISOString(),
          book.updated_at || new Date().toISOString(),
          new Date().toISOString(), // synced_at
        ]);

        await databaseManager.executeQuery(query, params);
      });
    } catch (error) {
      logger.error('Error upserting books:', error);
      throw error; // Re-throw to let the calling method handle it
    }
  }

  private async upsertChapters(chapters: Tables<'chapters'>[]): Promise<void> {
    if (chapters.length === 0) return;

    try {
      await databaseManager.transaction(async () => {
        // Validate and normalize chapter data
        const validatedChapters = chapters
          .map(chapter => {
            try {
              return validateChapterData(chapter);
            } catch (error) {
              logger.warn('Skipping invalid chapter data:', error);
              return null;
            }
          })
          .filter((chapter): chapter is Tables<'chapters'> => chapter !== null);

        if (validatedChapters.length === 0) {
          logger.warn('No valid chapters to insert after validation');
          return;
        }

        // ✅ PERFORMANCE FIX: Batch insert for chapters
        const placeholders = validatedChapters
          .map(() => '(?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .join(', ');

        const query = `
        INSERT OR REPLACE INTO chapters (
          id, book_id, chapter_number, total_verses, global_order,
          created_at, updated_at, synced_at
        ) VALUES ${placeholders}
      `;

        const params = validatedChapters.flatMap(chapter => [
          chapter.id,
          chapter.book_id,
          chapter.chapter_number,
          chapter.total_verses,
          chapter.global_order || 0,
          chapter.created_at || new Date().toISOString(),
          chapter.updated_at || new Date().toISOString(),
          new Date().toISOString(), // synced_at
        ]);

        await databaseManager.executeQuery(query, params);
      });
    } catch (error) {
      logger.error('Error upserting chapters:', error);
      throw error; // Re-throw to let the calling method handle it
    }
  }

  private async upsertVerses(verses: Tables<'verses'>[]): Promise<void> {
    if (verses.length === 0) return;

    try {
      await databaseManager.transaction(async () => {
        // Validate and normalize verse data
        const validatedVerses = verses
          .map(verse => {
            try {
              return validateVerseData(verse);
            } catch (error) {
              logger.warn('Skipping invalid verse data:', error);
              return null;
            }
          })
          .filter(Boolean);

        if (validatedVerses.length === 0) {
          logger.warn('No valid verses to insert after validation');
          return;
        }

        // ✅ PERFORMANCE FIX: Split large verse batches to avoid SQLite variable limits
        const BATCH_SIZE = 500; // SQLite has variable limits (~999), so batch to be safe

        for (let i = 0; i < validatedVerses.length; i += BATCH_SIZE) {
          const batch = validatedVerses
            .slice(i, i + BATCH_SIZE)
            .filter((verse): verse is Tables<'verses'> => verse !== null);

          if (batch.length === 0) continue;

          const placeholders = batch
            .map(() => '(?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
            .join(', ');

          const query = `
          INSERT OR REPLACE INTO verses (
            id, chapter_id, verse_number, global_order,
            created_at, updated_at, synced_at
          ) VALUES ${placeholders}
        `;

          const params = batch.flatMap(verse => [
            verse.id,
            verse.chapter_id,
            verse.verse_number,
            verse.global_order || 0,
            verse.created_at || new Date().toISOString(),
            verse.updated_at || new Date().toISOString(),
            new Date().toISOString(), // synced_at
          ]);

          await databaseManager.executeQuery(query, params);
        }
      });
    } catch (error) {
      logger.error('Error upserting verses:', error);
      throw error; // Re-throw to let the calling method handle it
    }
  }

  // Helper methods
  async getLastSync(tableName: string): Promise<string> {
    try {
      if (!databaseManager.initialized) {
        return '1970-01-01T00:00:00.000Z';
      }

      const result = await databaseManager.executeQuery<BibleSyncMetadata>(
        'SELECT last_sync FROM sync_metadata WHERE table_name = ?',
        [tableName]
      );

      return result[0]?.last_sync || '1970-01-01T00:00:00.000Z';
    } catch (error) {
      logger.error(`Error getting last sync for ${tableName}:`, error);
      return '1970-01-01T00:00:00.000Z';
    }
  }

  private async getLocalVersion(tableName: string): Promise<string | null> {
    if (!databaseManager.initialized) {
      return null;
    }

    const result = await databaseManager.executeQuery<BibleSyncMetadata>(
      'SELECT content_version FROM sync_metadata WHERE table_name = ?',
      [tableName]
    );

    return result[0]?.content_version || null;
  }

  private async updateLastSync(
    tableName: string,
    timestamp: string
  ): Promise<void> {
    await databaseManager.executeQuery(
      'UPDATE sync_metadata SET last_sync = ?, updated_at = CURRENT_TIMESTAMP WHERE table_name = ?',
      [timestamp, tableName]
    );
  }

  private async updateLastFullSync(): Promise<void> {
    const timestamp = new Date().toISOString();
    const tables = ['books', 'chapters', 'verses'];

    for (const table of tables) {
      await databaseManager.executeQuery(
        'UPDATE sync_metadata SET last_version_check = ?, updated_at = CURRENT_TIMESTAMP WHERE table_name = ?',
        [timestamp, table]
      );
    }
  }

  private async updateSyncStatus(
    tableName: string,
    status: 'idle' | 'syncing' | 'error',
    errorMessage?: string
  ): Promise<void> {
    try {
      await databaseManager.executeQuery(
        'UPDATE sync_metadata SET sync_status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE table_name = ?',
        [status, errorMessage || null, tableName]
      );
    } catch (error) {
      logger.error(`Error updating sync status for ${tableName}:`, error);
      // Don't throw here as it could break the sync process
    }
  }

  async getSyncMetadata(tableName?: string): Promise<BibleSyncMetadata[]> {
    const query = tableName
      ? 'SELECT * FROM sync_metadata WHERE table_name = ?'
      : 'SELECT * FROM sync_metadata WHERE table_name IN (?, ?, ?)';

    const params = tableName ? [tableName] : ['books', 'chapters', 'verses'];

    return databaseManager.executeQuery<BibleSyncMetadata>(query, params);
  }

  async hasRemoteChanges(tableName: string): Promise<boolean> {
    try {
      if (!databaseManager.initialized) {
        return false;
      }

      const lastSync = await this.getLastSync(tableName);

      const { data, error } = await supabase
        .from(tableName as 'books' | 'chapters' | 'verses')
        .select('id')
        .gt('updated_at', lastSync)
        .limit(1);

      if (error) {
        logger.error(`Error checking for changes in ${tableName}:`, error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      logger.error(`Error in hasRemoteChanges for ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Reset sync metadata to force a complete resync
   */
  async resetSyncMetadata(tableName?: string): Promise<void> {
    try {
      if (!databaseManager.initialized) {
        throw new Error('Database not initialized');
      }

      const resetTimestamp = '1970-01-01T00:00:00.000Z';
      const currentTimestamp = new Date().toISOString();

      if (tableName) {
        await databaseManager.executeQuery(
          `UPDATE sync_metadata 
           SET last_sync = ?, sync_status = 'idle', updated_at = ?
           WHERE table_name = ?`,
          [resetTimestamp, currentTimestamp, tableName]
        );
      } else {
        // Reset all bible tables
        const tables = ['books', 'chapters', 'verses'];
        for (const table of tables) {
          await databaseManager.executeQuery(
            `UPDATE sync_metadata 
             SET last_sync = ?, sync_status = 'idle', updated_at = ?
             WHERE table_name = ?`,
            [resetTimestamp, currentTimestamp, table]
          );
        }
      }
    } catch (error) {
      logger.error('Failed to reset sync metadata:', error);
      throw error;
    }
  }

  async forceFullSync(): Promise<SyncResult[]> {
    return this.syncAll({ forceFullSync: true });
  }

  async clearLocalData(tableName?: string): Promise<void> {
    const tables = tableName ? [tableName] : ['books', 'chapters', 'verses'];

    for (const table of tables) {
      await databaseManager.executeQuery(`DELETE FROM ${table}`);
      await this.resetSyncMetadata(table);
    }
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get configuration for bible sync
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Update configuration for bible sync
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Verify that all tables have complete data after sync
   */
  async verifySyncCompleteness(): Promise<{
    success: boolean;
    tables: Array<{
      tableName: string;
      localCount: number;
      remoteCount: number;
      isComplete: boolean;
      difference: number;
    }>;
    summary: {
      totalTables: number;
      completeTables: number;
      incompleteTables: number;
      totalLocalRecords: number;
      totalRemoteRecords: number;
    };
  }> {
    try {
      const tables = ['books', 'chapters', 'verses'];
      const results = [];

      for (const tableName of tables) {
        try {
          // Get local count
          const localCountResult = await databaseManager.executeQuery<{
            count: number;
          }>(`SELECT COUNT(*) as count FROM ${tableName}`);
          const localCount = localCountResult[0]?.count || 0;

          // Get remote count
          const { count: remoteCount, error } = await supabase
            .from(tableName as 'books' | 'chapters' | 'verses')
            .select('*', { count: 'exact', head: true });

          if (error) {
            logger.error(`Error getting remote count for ${tableName}:`, error);
            results.push({
              tableName,
              localCount,
              remoteCount: 0,
              isComplete: false,
              difference: localCount,
            });
            continue;
          }

          const difference = Math.abs((remoteCount || 0) - localCount);
          const isComplete = difference === 0;

          results.push({
            tableName,
            localCount,
            remoteCount: remoteCount || 0,
            isComplete,
            difference,
          });

          if (!isComplete) {
            logger.warn(`Table ${tableName} is incomplete:`, {
              localCount,
              remoteCount,
              difference,
            });
          }
        } catch (error) {
          logger.error(`Error verifying ${tableName}:`, error);
          results.push({
            tableName,
            localCount: 0,
            remoteCount: 0,
            isComplete: false,
            difference: 0,
          });
        }
      }

      const completeTables = results.filter(r => r.isComplete).length;
      const totalLocalRecords = results.reduce(
        (sum, r) => sum + r.localCount,
        0
      );
      const totalRemoteRecords = results.reduce(
        (sum, r) => sum + r.remoteCount,
        0
      );

      const summary = {
        totalTables: tables.length,
        completeTables,
        incompleteTables: tables.length - completeTables,
        totalLocalRecords,
        totalRemoteRecords,
      };

      const success = completeTables === tables.length;

      logger.info('Sync completeness verification:', {
        success,
        summary,
        details: results,
      });

      return {
        success,
        tables: results,
        summary,
      };
    } catch (error) {
      logger.error('Error in sync completeness verification:', error);
      return {
        success: false,
        tables: [],
        summary: {
          totalTables: 0,
          completeTables: 0,
          incompleteTables: 0,
          totalLocalRecords: 0,
          totalRemoteRecords: 0,
        },
      };
    }
  }

  /**
   * Force a complete resync and verify completeness
   */
  async forceCompleteSync(): Promise<SyncResult[]> {
    logger.info('Starting forced complete sync with verification...');

    // First, perform a full sync
    const syncResults = await this.syncAll({ forceFullSync: true });

    // Then verify completeness
    const completenessResult = await this.verifySyncCompleteness();

    if (!completenessResult.success) {
      logger.warn('Initial sync incomplete, attempting recovery...');

      // If incomplete, try to reset sync metadata and sync again
      await this.resetSyncMetadata();
      const recoveryResults = await this.syncAll({ forceFullSync: true });

      // Verify again after recovery
      const recoveryCompleteness = await this.verifySyncCompleteness();

      if (!recoveryCompleteness.success) {
        logger.error(
          'Recovery sync also failed to achieve completeness:',
          recoveryCompleteness
        );

        // Add error result for incomplete data
        const errorResult: SyncResult = {
          success: false,
          tableName: 'completeness_recovery',
          recordsSynced: 0,
          error: `Failed to achieve complete sync after recovery. Missing records in ${recoveryCompleteness.summary.incompleteTables} tables.`,
        };

        return [...syncResults, ...recoveryResults, errorResult];
      } else {
        logger.info('Recovery sync successful, data is now complete');
        return [...syncResults, ...recoveryResults];
      }
    }

    logger.info('Complete sync successful, all data verified');
    return syncResults;
  }

  /**
   * Get comprehensive sync statistics for debugging and monitoring
   */
  async getSyncStatistics(): Promise<{
    lastSyncTimes: Record<string, string>;
    localCounts: Record<string, number>;
    remoteCounts: Record<string, number>;
    completenessStatus: Record<string, boolean>;
    syncStatus: Record<string, string>;
    summary: {
      totalLocalRecords: number;
      totalRemoteRecords: number;
      missingRecords: number;
      syncHealth: 'excellent' | 'good' | 'warning' | 'critical';
    };
  }> {
    try {
      const tables = ['books', 'chapters', 'verses'];
      const lastSyncTimes: Record<string, string> = {};
      const localCounts: Record<string, number> = {};
      const remoteCounts: Record<string, number> = {};
      const completenessStatus: Record<string, boolean> = {};
      const syncStatus: Record<string, string> = {};

      // Get sync metadata
      const metadata = await this.getSyncMetadata();

      for (const table of tables) {
        try {
          // Get last sync time
          const lastSync = await this.getLastSync(table);
          lastSyncTimes[table] = lastSync;

          // Get local count
          const localCountResult = await databaseManager.executeQuery<{
            count: number;
          }>(`SELECT COUNT(*) as count FROM ${table}`);
          const localCount = localCountResult[0]?.count || 0;
          localCounts[table] = localCount;

          // Get remote count
          const { count: remoteCount, error } = await supabase
            .from(table as 'books' | 'chapters' | 'verses')
            .select('*', { count: 'exact', head: true });

          if (error) {
            logger.error(`Error getting remote count for ${table}:`, error);
            remoteCounts[table] = 0;
            completenessStatus[table] = false;
          } else {
            remoteCounts[table] = remoteCount || 0;
            completenessStatus[table] = (remoteCount || 0) === localCount;
          }

          // Get sync status
          const tableMetadata = metadata.find(m => m.table_name === table);
          syncStatus[table] = tableMetadata?.sync_status || 'unknown';
        } catch (error) {
          logger.error(`Error getting statistics for ${table}:`, error);
          lastSyncTimes[table] = 'unknown';
          localCounts[table] = 0;
          remoteCounts[table] = 0;
          completenessStatus[table] = false;
          syncStatus[table] = 'error';
        }
      }

      const totalLocalRecords = Object.values(localCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      const totalRemoteRecords = Object.values(remoteCounts).reduce(
        (sum, count) => sum + count,
        0
      );
      const missingRecords = totalRemoteRecords - totalLocalRecords;

      // Determine sync health
      let syncHealth: 'excellent' | 'good' | 'warning' | 'critical' =
        'excellent';
      const completeTables =
        Object.values(completenessStatus).filter(Boolean).length;

      if (completeTables === tables.length && missingRecords === 0) {
        syncHealth = 'excellent';
      } else if (
        completeTables >= tables.length * 0.8 &&
        missingRecords < 100
      ) {
        syncHealth = 'good';
      } else if (
        completeTables >= tables.length * 0.5 &&
        missingRecords < 1000
      ) {
        syncHealth = 'warning';
      } else {
        syncHealth = 'critical';
      }

      const summary = {
        totalLocalRecords,
        totalRemoteRecords,
        missingRecords,
        syncHealth,
      };

      logger.info('Sync statistics:', {
        lastSyncTimes,
        localCounts,
        remoteCounts,
        completenessStatus,
        syncStatus,
        summary,
      });

      return {
        lastSyncTimes,
        localCounts,
        remoteCounts,
        completenessStatus,
        syncStatus,
        summary,
      };
    } catch (error) {
      logger.error('Error getting sync statistics:', error);
      return {
        lastSyncTimes: {},
        localCounts: {},
        remoteCounts: {},
        completenessStatus: {},
        syncStatus: {},
        summary: {
          totalLocalRecords: 0,
          totalRemoteRecords: 0,
          missingRecords: 0,
          syncHealth: 'critical',
        },
      };
    }
  }

  /**
   * Check if books table needs completeness verification
   */
  async checkBooksCompleteness(): Promise<{
    isComplete: boolean;
    localCount: number;
    remoteCount: number;
    difference: number;
    details: string;
  }> {
    try {
      // Get local count
      const localCountResult = await databaseManager.executeQuery<{
        count: number;
      }>('SELECT COUNT(*) as count FROM books');
      const localCount = localCountResult[0]?.count || 0;

      // Get remote count
      const { count: remoteCount, error } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error('Error getting remote books count:', error);
        return {
          isComplete: false,
          localCount,
          remoteCount: 0,
          difference: localCount,
          details: `Failed to get remote count: ${error.message}`,
        };
      }

      const difference = Math.abs((remoteCount || 0) - localCount);
      const isComplete = difference === 0;

      return {
        isComplete,
        localCount,
        remoteCount: remoteCount || 0,
        difference,
        details: isComplete
          ? 'Books data is complete'
          : `Missing ${difference} books (local: ${localCount}, remote: ${remoteCount})`,
      };
    } catch (error) {
      logger.error('Error checking books completeness:', error);
      return {
        isComplete: false,
        localCount: 0,
        remoteCount: 0,
        difference: 0,
        details: `Error checking completeness: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if verses table needs completeness verification
   */
  async checkVersesCompleteness(): Promise<{
    isComplete: boolean;
    localCount: number;
    remoteCount: number;
    difference: number;
    details: string;
  }> {
    try {
      // Get local count
      const localCountResult = await databaseManager.executeQuery<{
        count: number;
      }>('SELECT COUNT(*) as count FROM verses');
      const localCount = localCountResult[0]?.count || 0;

      // Get remote count
      const { count: remoteCount, error } = await supabase
        .from('verses')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error('Error getting remote verses count:', error);
        return {
          isComplete: false,
          localCount,
          remoteCount: 0,
          difference: localCount,
          details: `Failed to get remote count: ${error.message}`,
        };
      }

      const difference = Math.abs((remoteCount || 0) - localCount);
      const isComplete = difference === 0;

      return {
        isComplete,
        localCount,
        remoteCount: remoteCount || 0,
        difference,
        details: isComplete
          ? 'Verses data is complete'
          : `Missing ${difference} verses (local: ${localCount}, remote: ${remoteCount})`,
      };
    } catch (error) {
      logger.error('Error checking verses completeness:', error);
      return {
        isComplete: false,
        localCount: 0,
        remoteCount: 0,
        difference: 0,
        details: `Error checking completeness: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check if chapters table needs completeness verification
   */
  async checkChaptersCompleteness(): Promise<{
    isComplete: boolean;
    localCount: number;
    remoteCount: number;
    difference: number;
    details: string;
  }> {
    try {
      // Get local count
      const localCountResult = await databaseManager.executeQuery<{
        count: number;
      }>('SELECT COUNT(*) as count FROM chapters');
      const localCount = localCountResult[0]?.count || 0;

      // Get remote count
      const { count: remoteCount, error } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true });

      if (error) {
        logger.error('Error getting remote chapters count:', error);
        return {
          isComplete: false,
          localCount,
          remoteCount: 0,
          difference: localCount,
          details: `Failed to get remote count: ${error.message}`,
        };
      }

      const difference = Math.abs((remoteCount || 0) - localCount);
      const isComplete = difference === 0;

      return {
        isComplete,
        localCount,
        remoteCount: remoteCount || 0,
        difference,
        details: isComplete
          ? 'Chapters data is complete'
          : `Missing ${difference} chapters (local: ${localCount}, remote: ${remoteCount})`,
      };
    } catch (error) {
      logger.error('Error checking chapters completeness:', error);
      return {
        isComplete: false,
        localCount: 0,
        remoteCount: 0,
        difference: 0,
        details: `Error checking completeness: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check completeness of all Bible data (books, chapters, verses)
   */
  async checkAllBibleDataCompleteness(): Promise<{
    overallComplete: boolean;
    books: {
      isComplete: boolean;
      localCount: number;
      remoteCount: number;
      difference: number;
      details: string;
    };
    chapters: {
      isComplete: boolean;
      localCount: number;
      remoteCount: number;
      difference: number;
      details: string;
    };
    verses: {
      isComplete: boolean;
      localCount: number;
      remoteCount: number;
      difference: number;
      details: string;
    };
    summary: {
      totalLocalRecords: number;
      totalRemoteRecords: number;
      totalMissingRecords: number;
      completeTables: number;
      totalTables: number;
      health: 'excellent' | 'good' | 'warning' | 'critical';
    };
  }> {
    try {
      // Check all tables in parallel
      const [booksCheck, chaptersCheck, versesCheck] = await Promise.all([
        this.checkBooksCompleteness(),
        this.checkChaptersCompleteness(),
        this.checkVersesCompleteness(),
      ]);

      const totalLocalRecords =
        booksCheck.localCount +
        chaptersCheck.localCount +
        versesCheck.localCount;
      const totalRemoteRecords =
        booksCheck.remoteCount +
        chaptersCheck.remoteCount +
        versesCheck.remoteCount;
      const totalMissingRecords =
        booksCheck.difference +
        chaptersCheck.difference +
        versesCheck.difference;

      const completeTables = [booksCheck, chaptersCheck, versesCheck].filter(
        check => check.isComplete
      ).length;
      const totalTables = 3;

      // Determine overall health
      let health: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

      if (completeTables === totalTables && totalMissingRecords === 0) {
        health = 'excellent';
      } else if (completeTables >= 2 && totalMissingRecords < 100) {
        health = 'good';
      } else if (completeTables >= 1 && totalMissingRecords < 1000) {
        health = 'warning';
      } else {
        health = 'critical';
      }

      const overallComplete =
        completeTables === totalTables && totalMissingRecords === 0;

      const summary = {
        totalLocalRecords,
        totalRemoteRecords,
        totalMissingRecords,
        completeTables,
        totalTables,
        health,
      };

      logger.info('Bible data completeness check:', {
        overallComplete,
        summary,
        details: {
          books: booksCheck,
          chapters: chaptersCheck,
          verses: versesCheck,
        },
      });

      return {
        overallComplete,
        books: booksCheck,
        chapters: chaptersCheck,
        verses: versesCheck,
        summary,
      };
    } catch (error) {
      logger.error('Error checking all Bible data completeness:', error);
      return {
        overallComplete: false,
        books: {
          isComplete: false,
          localCount: 0,
          remoteCount: 0,
          difference: 0,
          details: 'Error checking books',
        },
        chapters: {
          isComplete: false,
          localCount: 0,
          remoteCount: 0,
          difference: 0,
          details: 'Error checking chapters',
        },
        verses: {
          isComplete: false,
          localCount: 0,
          remoteCount: 0,
          difference: 0,
          details: 'Error checking verses',
        },
        summary: {
          totalLocalRecords: 0,
          totalRemoteRecords: 0,
          totalMissingRecords: 0,
          completeTables: 0,
          totalTables: 3,
          health: 'critical',
        },
      };
    }
  }
}

export const bibleSync = BibleSyncService.getInstance();
