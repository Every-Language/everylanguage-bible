import { supabase } from '../api/supabase';
import { databaseManager } from './DatabaseManager';
import type { SyncMetadata } from './schema';
import type { Tables } from '@everylanguage/shared-types';
import { createClient } from '@supabase/supabase-js';

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

      // Add more table syncs here as needed
      // const chaptersResult = await this.syncChapters(options);
      // results.push(chaptersResult);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  private async syncBooks(options: SyncOptions = {}): Promise<SyncResult> {
    const { batchSize = 100 } = options;

    try {
      await this.updateSyncStatus('books', 'syncing');

      // Get last sync timestamp
      const lastSync = await this.getLastSync('books');
      console.log(`Syncing books since: ${lastSync}`);

      // Create a separate client for anonymous access to ensure RLS policies work
      const anonClient = supabase;

      // Fetch updated records from Supabase (works with anonymous access due to RLS policies)
      let { data: remoteBooks, error } = await anonClient
        .from('books')
        .select('*')
        .gt('updated_at', lastSync)
        .order('updated_at', { ascending: true })
        .limit(batchSize);

      if (error) {
        // Handle auth-related errors gracefully
        if (error.message.includes('JWT') || error.message.includes('auth')) {
          console.warn(
            'Authentication issue, but continuing with anonymous access:',
            error.message
          );
          // Try again with explicit anonymous session
          const { data: retryData, error: retryError } = await anonClient
            .from('books')
            .select('*')
            .gt('updated_at', lastSync)
            .order('updated_at', { ascending: true })
            .limit(batchSize);

          if (retryError) {
            throw new Error(`Failed to fetch books: ${retryError.message}`);
          }

          remoteBooks = retryData;
        } else {
          throw new Error(`Failed to fetch books: ${error.message}`);
        }
      }

      console.log(`Found ${remoteBooks?.length || 0} books to sync`);

      if (!remoteBooks || remoteBooks.length === 0) {
        await this.updateSyncStatus('books', 'idle');
        return {
          success: true,
          tableName: 'books',
          recordsSynced: 0,
        };
      }

      // Log some details about the books being synced
      console.log(
        `First book: ${remoteBooks[0]?.name} (updated: ${remoteBooks[0]?.updated_at})`
      );
      console.log(
        `Last book: ${remoteBooks[remoteBooks.length - 1]?.name} (updated: ${remoteBooks[remoteBooks.length - 1]?.updated_at})`
      );

      // Sync records to local database
      await this.upsertBooks(remoteBooks);

      // Update sync metadata
      const latestBook = remoteBooks[remoteBooks.length - 1];
      if (latestBook?.updated_at) {
        await this.updateLastSync('books', latestBook.updated_at);
      }
      await this.updateSyncStatus('books', 'idle');

      return {
        success: true,
        tableName: 'books',
        recordsSynced: remoteBooks.length,
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

  async getLastSync(tableName: string): Promise<string> {
    // Check if database is initialized before proceeding
    if (!databaseManager.initialized) {
      console.log(
        `Database not initialized yet, returning default last sync for ${tableName}`
      );
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
    }

    throw new Error(`Unknown table: ${tableName}`);
  }

  async resetSyncTimestamp(tableName: string): Promise<void> {
    await this.updateLastSync(tableName, '1970-01-01T00:00:00.000Z');
    console.log(`Reset sync timestamp for ${tableName}`);
  }

  async clearLocalData(tableName: string): Promise<void> {
    if (tableName === 'books') {
      await databaseManager.executeQuery('DELETE FROM books');
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
      // Check if database is initialized before proceeding
      if (!databaseManager.initialized) {
        console.log(
          `Database not initialized yet, skipping remote changes check for ${tableName}`
        );
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
    tableNames: string[] = ['books']
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const tableName of tableNames) {
      results[tableName] = await this.hasRemoteChanges(tableName);
    }

    return results;
  }

  async getTotalRemoteRecordsCount(tableName: string): Promise<number> {
    try {
      // Check if database is initialized before proceeding
      if (!databaseManager.initialized) {
        console.log(
          `Database not initialized yet, returning 0 for total records count for ${tableName}`
        );
        return 0;
      }

      // Create anonymous client for counting
      const anonClient = createClient(
        process.env['EXPO_PUBLIC_SUPABASE_URL']!,
        process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY']!
      );

      const { count, error } = await anonClient
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.warn(`Failed to get total count for ${tableName}:`, error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error(`Error getting total count for ${tableName}:`, error);
      return 0;
    }
  }
}

export const syncService = SyncService.getInstance();
