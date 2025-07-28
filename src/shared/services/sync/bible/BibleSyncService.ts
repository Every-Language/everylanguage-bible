import { supabase } from '../../api/supabase';
import DatabaseManager from '../../database/DatabaseManager';
import type {
  SyncOptions,
  SyncResult,
  BaseSyncService,
  BibleSyncMetadata,
  SyncConfig,
} from '../types';
import { validateTestament } from '../types';
import type { Tables } from '@everylanguage/shared-types';
import { logger } from '../../../utils/logger';

const databaseManager = DatabaseManager.getInstance();

export interface BibleSyncOptions extends SyncOptions {
  forceFullSync?: boolean;
  checkVersionOnly?: boolean;
}

// Enhanced error types for better error handling
export class BibleSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'BibleSyncError';
  }
}

// Validation utilities for Bible-specific data
const validateBookData = (book: any): any => {
  if (!book.id || !book.name || book.book_number === undefined) {
    throw new BibleSyncError(
      'Invalid book data: missing required fields',
      'INVALID_BOOK_DATA',
      { book }
    );
  }

  // Testament validation with graceful handling
  const validatedTestament = validateTestament(book.testament);

  return {
    ...book,
    testament: validatedTestament,
  };
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

      // Sync books table
      const booksResult = await this.syncBooks(options);
      results.push(booksResult);
      this.notifyListeners(booksResult);

      // Only sync chapters and verses if books sync was successful
      if (booksResult.success) {
        const chaptersResult = await this.syncChapters(options);
        results.push(chaptersResult);
        this.notifyListeners(chaptersResult);

        if (chaptersResult.success) {
          const versesResult = await this.syncVerses(options);
          results.push(versesResult);
          this.notifyListeners(versesResult);
        }
      }

      // Update last successful sync time
      await this.updateLastFullSync();
    } catch (error) {
      // Enhanced error logging with detailed information
      const errorDetails = {
        error: error,
        errorType: typeof error,
        errorConstructor: (error as any)?.constructor?.name,
        errorMessage: (error as any)?.message || 'No message',
        errorStack: (error as any)?.stack || 'No stack',
        errorStringified: JSON.stringify(
          error,
          Object.getOwnPropertyNames(error || {})
        ),
      };

      logger.error('Bible sync failed:', errorDetails);

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
        ? '1970-01-01T00:00:000Z'
        : await this.getLastSync('books');

      let allBooks: Tables<'books'>[] = [];
      let hasMoreData = true;
      let lastFetchedId: string | null = null;

      // Use larger batches for faster syncing during onboarding
      const optimizedBatchSize = Math.min(batchSize, 2000); // Increased from 500

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

        const { data: remoteBooks, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch books: ${error.message}`);
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
        ? '1970-01-01T00:00:000Z'
        : await this.getLastSync('chapters');

      let allChapters: Tables<'chapters'>[] = [];
      let hasMoreData = true;
      let lastFetchedId: string | null = null;
      const optimizedBatchSize = Math.min(batchSize, 2000); // Increased from 500

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

        const { data: remoteChapters, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch chapters: ${error.message}`);
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
        ? '1970-01-01T00:00:000Z'
        : await this.getLastSync('verses');

      let allVerses: Tables<'verses'>[] = [];
      let hasMoreData = true;
      let lastFetchedId: string | null = null;
      const optimizedBatchSize = Math.min(batchSize, 2000); // Increased from 500

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

        const { data: remoteVerses, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch verses: ${error.message}`);
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
        .filter(Boolean);

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
          id, book_number, name, testament, chapters, global_order, 
          created_at, updated_at, synced_at
        ) VALUES ${placeholders}
      `;

      // Flatten all parameters with validated data
      const params = validatedBooks.flatMap(book => [
        book.id,
        book.book_number,
        book.name,
        book.testament, // Use validated testament
        book.chapters || 1, // Use actual chapters or default
        book.global_order || 0,
        book.created_at || new Date().toISOString(),
        book.updated_at || new Date().toISOString(),
      ]);

      await databaseManager.executeQuery(query, params);
    });
  }

  private async upsertChapters(chapters: Tables<'chapters'>[]): Promise<void> {
    if (chapters.length === 0) return;

    await databaseManager.transaction(async () => {
      // ✅ PERFORMANCE FIX: Batch insert for chapters
      const placeholders = chapters
        .map(() => '(?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
        .join(', ');

      const query = `
        INSERT OR REPLACE INTO chapters (
          id, book_id, chapter_number, total_verses, global_order,
          created_at, updated_at, synced_at
        ) VALUES ${placeholders}
      `;

      const params = chapters.flatMap(chapter => [
        chapter.id,
        chapter.book_id,
        chapter.chapter_number,
        chapter.total_verses,
        chapter.global_order || 0,
        chapter.created_at || new Date().toISOString(),
        chapter.updated_at || new Date().toISOString(),
      ]);

      await databaseManager.executeQuery(query, params);
    });
  }

  private async upsertVerses(verses: Tables<'verses'>[]): Promise<void> {
    if (verses.length === 0) return;

    // ✅ PERFORMANCE FIX: Split large verse batches to avoid SQLite variable limits
    const BATCH_SIZE = 500; // SQLite has variable limits (~999), so batch to be safe

    for (let i = 0; i < verses.length; i += BATCH_SIZE) {
      const batch = verses.slice(i, i + BATCH_SIZE);

      await databaseManager.transaction(async () => {
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
        ]);

        await databaseManager.executeQuery(query, params);
      });
    }
  }

  // Helper methods
  async getLastSync(tableName: string): Promise<string> {
    if (!databaseManager.initialized) {
      return '1970-01-01T00:00:00.000Z';
    }

    const result = await databaseManager.executeQuery<BibleSyncMetadata>(
      'SELECT last_sync FROM sync_metadata WHERE table_name = ?',
      [tableName]
    );

    return result[0]?.last_sync || '1970-01-01T00:00:00.000Z';
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
    await databaseManager.executeQuery(
      'UPDATE sync_metadata SET sync_status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE table_name = ?',
      [status, errorMessage || null, tableName]
    );
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
        .from(tableName as any)
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
}

export const bibleSync = BibleSyncService.getInstance();
