import { supabase } from '../api/supabase';
import { databaseManager } from './DatabaseManager';
import type { SyncMetadata } from './schema';
import type { Tables } from '@everylanguage/shared-types';

export interface SyncOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface SyncResult {
  success: boolean;
  tableName: string;
  recordsSynced: number;
  error?: string;
}

class SyncService {
  private static instance: SyncService;
  private isSyncing = false;
  private syncListeners: ((result: SyncResult) => void)[] = [];

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
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

  async syncAll(options: SyncOptions = {}): Promise<SyncResult[]> {
    if (this.isSyncing) {
      throw new Error('Sync is already in progress');
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];

    try {
      // Sync books table
      const booksResult = await this.syncBooks(options);
      results.push(booksResult);
      this.notifyListeners(booksResult);

      // Sync chapters table
      const chaptersResult = await this.syncChapters(options);
      results.push(chaptersResult);
      this.notifyListeners(chaptersResult);

      // Sync verses table
      const versesResult = await this.syncVerses(options);
      results.push(versesResult);
      this.notifyListeners(versesResult);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  private async syncBooks(options: SyncOptions = {}): Promise<SyncResult> {
    const { batchSize = 1000 } = options;

    try {
      await this.updateSyncStatus('books', 'syncing');

      // Get last sync timestamp
      const lastSync = await this.getLastSync('books');
      const anonClient = supabase;

      let allBooks: Tables<'books'>[] = [];
      let currentLastSync = lastSync || '1970-01-01T00:00:00.000Z';
      let hasMoreData = true;
      let lastFetchedId: string | null = null;

      // Fetch all records in batches using cursor pagination
      while (hasMoreData) {
        let query = anonClient
          .from('books')
          .select('*')
          .gte('updated_at', currentLastSync)
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(batchSize);

        if (lastFetchedId) {
          query = query.gt('id', lastFetchedId);
        }

        let { data: remoteBooks, error } = await query;

        if (error) {
          // Handle auth-related errors gracefully
          if (error.message.includes('JWT') || error.message.includes('auth')) {
            let retryQuery = anonClient
              .from('books')
              .select('*')
              .gte('updated_at', currentLastSync)
              .order('updated_at', { ascending: true })
              .order('id', { ascending: true })
              .limit(batchSize);

            if (lastFetchedId) {
              retryQuery = retryQuery.gt('id', lastFetchedId);
            }

            const { data: retryData, error: retryError } = await retryQuery;

            if (retryError) {
              throw new Error(`Failed to fetch books: ${retryError.message}`);
            }

            remoteBooks = retryData;
          } else {
            throw new Error(`Failed to fetch books: ${error.message}`);
          }
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

        if (remoteBooks.length < batchSize) {
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

      // Sync all records to local database
      await this.upsertBooks(allBooks);

      // Update sync metadata with the timestamp of the very last record
      const latestBook = allBooks[allBooks.length - 1];
      if (latestBook?.updated_at) {
        await this.updateLastSync('books', latestBook.updated_at);
      }
      await this.updateSyncStatus('books', 'idle');

      return {
        success: true,
        tableName: 'books',
        recordsSynced: allBooks.length,
      };
    } catch (error) {
      console.error('Books sync failed:', error);
      await this.updateSyncStatus(
        'books',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        tableName: 'books',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncChapters(options: SyncOptions = {}): Promise<SyncResult> {
    const { batchSize = 1000 } = options;

    try {
      await this.updateSyncStatus('chapters', 'syncing');

      // Get last sync timestamp
      const lastSync = await this.getLastSync('chapters');
      const anonClient = supabase;

      let allChapters: Tables<'chapters'>[] = [];
      let currentLastSync = lastSync || '1970-01-01T00:00:00.000Z';
      let hasMoreData = true;
      let lastFetchedId: string | null = null;

      // Fetch all records in batches using cursor pagination
      while (hasMoreData) {
        let query = anonClient
          .from('chapters')
          .select('*')
          .gte('updated_at', currentLastSync)
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(batchSize);

        if (lastFetchedId) {
          query = query.gt('id', lastFetchedId);
        }

        let { data: remoteChapters, error } = await query;

        if (error) {
          // Handle auth-related errors gracefully
          if (error.message.includes('JWT') || error.message.includes('auth')) {
            let retryQuery = anonClient
              .from('chapters')
              .select('*')
              .gte('updated_at', currentLastSync)
              .order('updated_at', { ascending: true })
              .order('id', { ascending: true })
              .limit(batchSize);

            if (lastFetchedId) {
              retryQuery = retryQuery.gt('id', lastFetchedId);
            }

            const { data: retryData, error: retryError } = await retryQuery;

            if (retryError) {
              throw new Error(
                `Failed to fetch chapters: ${retryError.message}`
              );
            }

            remoteChapters = retryData;
          } else {
            throw new Error(`Failed to fetch chapters: ${error.message}`);
          }
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

        if (remoteChapters.length < batchSize) {
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

      // Sync all records to local database
      await this.upsertChapters(allChapters);

      // Update sync metadata with the timestamp of the very last record
      const latestChapter = allChapters[allChapters.length - 1];
      if (latestChapter?.updated_at) {
        await this.updateLastSync('chapters', latestChapter.updated_at);
      }
      await this.updateSyncStatus('chapters', 'idle');

      return {
        success: true,
        tableName: 'chapters',
        recordsSynced: allChapters.length,
      };
    } catch (error) {
      console.error('Chapters sync failed:', error);
      await this.updateSyncStatus(
        'chapters',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        tableName: 'chapters',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncVerses(options: SyncOptions = {}): Promise<SyncResult> {
    const { batchSize = 1000 } = options;

    try {
      await this.updateSyncStatus('verses', 'syncing');

      // Get last sync timestamp
      const lastSync = await this.getLastSync('verses');
      const anonClient = supabase;

      let allVerses: Tables<'verses'>[] = [];
      let currentLastSync = lastSync || '1970-01-01T00:00:00.000Z';
      let hasMoreData = true;
      let lastFetchedId: string | null = null;

      // Fetch all records in batches using cursor pagination
      while (hasMoreData) {
        let query = anonClient
          .from('verses')
          .select('*')
          .gte('updated_at', currentLastSync)
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(batchSize);

        if (lastFetchedId) {
          query = query.gt('id', lastFetchedId);
        }

        let { data: remoteVerses, error } = await query;

        if (error) {
          // Handle auth-related errors gracefully
          if (error.message.includes('JWT') || error.message.includes('auth')) {
            let retryQuery = anonClient
              .from('verses')
              .select('*')
              .gte('updated_at', currentLastSync)
              .order('updated_at', { ascending: true })
              .order('id', { ascending: true })
              .limit(batchSize);

            if (lastFetchedId) {
              retryQuery = retryQuery.gt('id', lastFetchedId);
            }

            const { data: retryData, error: retryError } = await retryQuery;

            if (retryError) {
              throw new Error(`Failed to fetch verses: ${retryError.message}`);
            }

            remoteVerses = retryData;
          } else {
            throw new Error(`Failed to fetch verses: ${error.message}`);
          }
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

        if (remoteVerses.length < batchSize) {
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

      // Sync all records to local database
      await this.upsertVerses(allVerses);

      // Update sync metadata with the timestamp of the very last record
      const latestVerse = allVerses[allVerses.length - 1];
      if (latestVerse?.updated_at) {
        await this.updateLastSync('verses', latestVerse.updated_at);
      }
      await this.updateSyncStatus('verses', 'idle');

      return {
        success: true,
        tableName: 'verses',
        recordsSynced: allVerses.length,
      };
    } catch (error) {
      console.error('Verses sync failed:', error);
      await this.updateSyncStatus(
        'verses',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        tableName: 'verses',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async upsertBooks(books: Tables<'books'>[]): Promise<void> {
    await databaseManager.transaction(async () => {
      for (const book of books) {
        await databaseManager.execSingle(
          `
          INSERT OR REPLACE INTO books (
            id, book_number, name, testament, chapters, global_order, 
            created_at, updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
          [
            book.id,
            book.book_number,
            book.name,
            'OT', // Default value since it's not in the schema
            1, // Default value since chapters is not in the schema
            book.global_order || 0,
            book.created_at || new Date().toISOString(),
            book.updated_at || new Date().toISOString(),
          ]
        );
      }
    });
  }

  private async upsertChapters(chapters: Tables<'chapters'>[]): Promise<void> {
    await databaseManager.transaction(async () => {
      for (const chapter of chapters) {
        await databaseManager.execSingle(
          `
          INSERT OR REPLACE INTO chapters (
            id, book_id, chapter_number, total_verses, global_order,
            created_at, updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
          [
            chapter.id,
            chapter.book_id,
            chapter.chapter_number,
            chapter.total_verses,
            chapter.global_order || 0,
            chapter.created_at || new Date().toISOString(),
            chapter.updated_at || new Date().toISOString(),
          ]
        );
      }
    });
  }

  private async upsertVerses(verses: Tables<'verses'>[]): Promise<void> {
    await databaseManager.transaction(async () => {
      for (const verse of verses) {
        await databaseManager.execSingle(
          `
          INSERT OR REPLACE INTO verses (
            id, chapter_id, verse_number, global_order,
            created_at, updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
          [
            verse.id,
            verse.chapter_id,
            verse.verse_number,
            verse.global_order || 0,
            verse.created_at || new Date().toISOString(),
            verse.updated_at || new Date().toISOString(),
          ]
        );
      }
    });
  }

  async getLastSync(tableName: string): Promise<string> {
    if (!databaseManager.initialized) {
      return '1970-01-01T00:00:00.000Z';
    }

    const result = await databaseManager.executeQuery<SyncMetadata>(
      'SELECT last_sync FROM sync_metadata WHERE table_name = ?',
      [tableName]
    );

    return result[0]?.last_sync || '1970-01-01T00:00:00.000Z';
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

  async getSyncMetadata(tableName?: string): Promise<SyncMetadata[]> {
    const query = tableName
      ? 'SELECT * FROM sync_metadata WHERE table_name = ?'
      : 'SELECT * FROM sync_metadata';

    const params = tableName ? [tableName] : undefined;

    return databaseManager.executeQuery<SyncMetadata>(query, params);
  }

  async forceFullSync(tableName: string): Promise<SyncResult> {
    // Reset last sync to force full sync
    await this.updateLastSync(tableName, '1970-01-01T00:00:00.000Z');

    if (tableName === 'books') {
      return this.syncBooks();
    } else if (tableName === 'chapters') {
      return this.syncChapters();
    } else if (tableName === 'verses') {
      return this.syncVerses();
    }

    throw new Error(`Unknown table: ${tableName}`);
  }

  async clearLocalData(tableName: string): Promise<void> {
    if (tableName === 'books') {
      await databaseManager.executeQuery('DELETE FROM books');
      await this.updateLastSync(tableName, '1970-01-01T00:00:00.000Z');
    } else if (tableName === 'chapters') {
      await databaseManager.executeQuery('DELETE FROM chapters');
      await this.updateLastSync(tableName, '1970-01-01T00:00:00.000Z');
    } else if (tableName === 'verses') {
      await databaseManager.executeQuery('DELETE FROM verses');
      await this.updateLastSync(tableName, '1970-01-01T00:00:00.000Z');
    } else {
      throw new Error(`Unknown table: ${tableName}`);
    }
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Check if there are remote changes for a table since last sync
   */
  async hasRemoteChanges(tableName: string): Promise<boolean> {
    try {
      if (!databaseManager.initialized) {
        return false;
      }

      const lastSync = await this.getLastSync(tableName);

      // Check if there are any records updated since last sync
      const { data, error } = await supabase
        .from(tableName as any)
        .select('id')
        .gt('updated_at', lastSync)
        .limit(1);

      if (error) {
        console.error(`Error checking for changes in ${tableName}:`, error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error(`Error in hasRemoteChanges for ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Get a summary of remote changes for multiple tables
   */
  async getRemoteChangesSummary(
    tableNames: string[] = ['books', 'chapters', 'verses']
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const tableName of tableNames) {
      results[tableName] = await this.hasRemoteChanges(tableName);
    }

    return results;
  }

  /**
   * Reset sync metadata for a specific table to force a complete resync
   */
  async resetSyncMetadata(tableName: string): Promise<void> {
    try {
      if (!databaseManager.initialized) {
        throw new Error('Database not initialized');
      }

      const resetTimestamp = '1970-01-01T00:00:00.000Z';
      const currentTimestamp = new Date().toISOString();

      const db = databaseManager.getDatabase();
      await db.runAsync(
        `INSERT OR REPLACE INTO sync_metadata (table_name, last_sync, sync_status, updated_at) 
         VALUES (?, ?, 'idle', ?)`,
        [tableName, resetTimestamp, currentTimestamp]
      );

      // Verify the reset worked
      const afterReset = await this.getLastSync(tableName);
      if (afterReset !== resetTimestamp) {
        throw new Error(
          `Reset failed: expected ${resetTimestamp}, got ${afterReset}`
        );
      }
    } catch (error) {
      console.error(`Failed to reset sync metadata for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Reset sync metadata for all tables to force a complete resync
   */
  async resetAllSyncMetadata(): Promise<void> {
    try {
      await this.resetSyncMetadata('books');
      await this.resetSyncMetadata('chapters');
      await this.resetSyncMetadata('verses');
    } catch (error) {
      console.error('Failed to reset all sync metadata:', error);
      throw error;
    }
  }

  /**
   * Get the total count of remote records for a table (for progress tracking)
   */
  async getTotalRemoteRecordsCount(tableName: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(tableName as any)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`Failed to get total count for ${tableName}:`, error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error(`Error getting total count for ${tableName}:`, error);
      return 0;
    }
  }

  /**
   * Alias for resetSyncMetadata to match SyncContext expectations
   */
  async resetSyncTimestamp(tableName: string): Promise<void> {
    return this.resetSyncMetadata(tableName);
  }
}

export const syncService = SyncService.getInstance();
