import { supabase } from '../../api/supabase';
import DatabaseManager from '../../database/DatabaseManager';

const databaseManager = DatabaseManager.getInstance();
import type {
  SyncOptions,
  SyncResult,
  BaseSyncService,
  BibleSyncMetadata,
  SyncConfig,
} from '../types';
import type { Tables } from '@everylanguage/shared-types';

export interface MediaFilesVersesSyncOptions extends SyncOptions {
  forceFullSync?: boolean;
  checkVersionOnly?: boolean;
}

// Enhanced error types for better error handling
export class MediaFilesVersesSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'MediaFilesVersesSyncError';
  }
}

// Validation utilities for MediaFilesVerses-specific data
const validateMediaFileVerseData = (mediaFileVerse: any): any => {
  if (
    !mediaFileVerse.id ||
    !mediaFileVerse.media_file_id ||
    !mediaFileVerse.verse_id
  ) {
    throw new MediaFilesVersesSyncError(
      'Invalid media file verse data: missing required fields',
      'INVALID_MEDIA_FILE_VERSE_DATA',
      { mediaFileVerse }
    );
  }

  return {
    ...mediaFileVerse,
    start_time_seconds: mediaFileVerse.start_time_seconds || 0,
  };
};

class MediaFilesVersesSyncService implements BaseSyncService {
  private static instance: MediaFilesVersesSyncService;
  private isSyncing = false;
  private syncListeners: ((result: SyncResult) => void)[] = [];
  private config: SyncConfig = {
    strategy: 'version', // Use version-based syncing for media files verses
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

  static getInstance(): MediaFilesVersesSyncService {
    if (!MediaFilesVersesSyncService.instance) {
      MediaFilesVersesSyncService.instance = new MediaFilesVersesSyncService();
    }
    return MediaFilesVersesSyncService.instance;
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
   * Check if media files verses need updating
   */
  async needsUpdate(): Promise<{ needsUpdate: boolean; tables: string[] }> {
    try {
      const tables = ['media_files_verses'];
      const tablesToUpdate: string[] = [];

      for (const table of tables) {
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
      console.error('Error checking if media files verses need update:', error);
      return { needsUpdate: false, tables: [] };
    }
  }

  /**
   * Sync all media files verses data
   */
  async syncAll(
    options: MediaFilesVersesSyncOptions = {}
  ): Promise<SyncResult[]> {
    if (this.isSyncing) {
      throw new MediaFilesVersesSyncError(
        'Sync already in progress',
        'SYNC_IN_PROGRESS'
      );
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];

    try {
      console.log('Starting media files verses sync...');

      // Sync media files verses
      const mediaFilesVersesResult = await this.syncMediaFilesVerses(options);
      results.push(mediaFilesVersesResult);

      console.log('Media files verses sync completed successfully');
      return results;
    } catch (error) {
      console.error('Error during media files verses sync:', error);
      const errorResult: SyncResult = {
        success: false,
        tableName: 'media_files_verses',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      results.push(errorResult);
      return results;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync media files verses data
   */
  private async syncMediaFilesVerses(
    _options: MediaFilesVersesSyncOptions = {}
  ): Promise<SyncResult> {
    try {
      await this.updateSyncStatus('media_files_verses', 'syncing');

      const lastSync = await this.getLastSync('media_files_verses');
      console.log(`Syncing media_files_verses since: ${lastSync}`);

      // Fetch media files verses from Supabase
      const { data: mediaFilesVerses, error } = await supabase
        .from('media_files_verses')
        .select('*')
        .gte('updated_at', lastSync)
        .order('updated_at', { ascending: true });

      if (error) {
        throw new MediaFilesVersesSyncError(
          `Failed to fetch media files verses: ${error.message}`,
          'FETCH_ERROR',
          { error }
        );
      }

      if (!mediaFilesVerses || mediaFilesVerses.length === 0) {
        console.log('No new media files verses to sync');
        await this.updateSyncStatus('media_files_verses', 'idle');
        return {
          success: true,
          tableName: 'media_files_verses',
          recordsSynced: 0,
        };
      }

      console.log(`Syncing ${mediaFilesVerses.length} media files verses`);

      // Validate and upsert media files verses
      const validatedMediaFilesVerses = mediaFilesVerses.map(
        validateMediaFileVerseData
      );
      await this.upsertMediaFilesVerses(validatedMediaFilesVerses);

      // Update sync metadata
      const now = new Date().toISOString();
      await this.updateLastSync('media_files_verses', now);
      await this.updateSyncStatus('media_files_verses', 'idle');

      const result: SyncResult = {
        success: true,
        tableName: 'media_files_verses',
        recordsSynced: mediaFilesVerses.length,
      };

      this.notifyListeners(result);
      return result;
    } catch (error) {
      console.error('Error syncing media files verses:', error);
      await this.updateSyncStatus(
        'media_files_verses',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      const errorResult: SyncResult = {
        success: false,
        tableName: 'media_files_verses',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.notifyListeners(errorResult);
      return errorResult;
    }
  }

  /**
   * Upsert media files verses to local database
   */
  private async upsertMediaFilesVerses(
    mediaFilesVerses: Tables<'media_files_verses'>[]
  ): Promise<void> {
    const now = new Date().toISOString();

    for (const mediaFileVerse of mediaFilesVerses) {
      await databaseManager.executeQuery(
        `INSERT OR REPLACE INTO media_files_verses (
          id, media_file_id, verse_id, start_time_seconds,
          created_at, updated_at, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          mediaFileVerse.id,
          mediaFileVerse.media_file_id,
          mediaFileVerse.verse_id,
          mediaFileVerse.start_time_seconds,
          mediaFileVerse.created_at,
          mediaFileVerse.updated_at,
          now,
        ]
      );
    }
  }

  /**
   * Get last sync timestamp for a table
   */
  async getLastSync(tableName: string): Promise<string> {
    try {
      const result = await databaseManager.executeQuery(
        'SELECT last_sync FROM sync_metadata WHERE table_name = ?',
        [tableName]
      );

      if (result && result.length > 0) {
        return result[0].last_sync;
      }

      return '1970-01-01T00:00:00.000Z';
    } catch (error) {
      console.error(`Error getting last sync for ${tableName}:`, error);
      return '1970-01-01T00:00:00.000Z';
    }
  }

  /**
   * Update last sync timestamp for a table
   */
  private async updateLastSync(
    tableName: string,
    timestamp: string
  ): Promise<void> {
    try {
      await databaseManager.executeQuery(
        `UPDATE sync_metadata 
         SET last_sync = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE table_name = ?`,
        [timestamp, tableName]
      );
    } catch (error) {
      console.error(`Error updating last sync for ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Update sync status for a table
   */
  private async updateSyncStatus(
    tableName: string,
    status: 'idle' | 'syncing' | 'error',
    errorMessage?: string
  ): Promise<void> {
    try {
      await databaseManager.executeQuery(
        `UPDATE sync_metadata 
         SET sync_status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE table_name = ?`,
        [status, errorMessage || null, tableName]
      );
    } catch (error) {
      console.error(`Error updating sync status for ${tableName}:`, error);
    }
  }

  /**
   * Get sync metadata for all tables or a specific table
   */
  async getSyncMetadata(tableName?: string): Promise<BibleSyncMetadata[]> {
    try {
      const query = tableName
        ? 'SELECT * FROM sync_metadata WHERE table_name = ?'
        : 'SELECT * FROM sync_metadata';
      const params = tableName ? [tableName] : [];

      const result = await databaseManager.executeQuery(query, params);
      return result || [];
    } catch (error) {
      console.error('Error getting sync metadata:', error);
      return [];
    }
  }

  /**
   * Check if there are remote changes for a table
   */
  async hasRemoteChanges(tableName: string): Promise<boolean> {
    try {
      const lastSync = await this.getLastSync(tableName);

      // Check if there are any records updated since last sync
      const { data, error } = await supabase
        .from('media_files_verses' as const)
        .select('updated_at')
        .gte('updated_at', lastSync)
        .limit(1);

      if (error) {
        console.error(`Error checking remote changes for ${tableName}:`, error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error(`Error checking remote changes for ${tableName}:`, error);
      return false;
    }
  }

  /**
   * Reset sync metadata for all tables or a specific table
   */
  async resetSyncMetadata(tableName?: string): Promise<void> {
    try {
      const query = tableName
        ? 'DELETE FROM sync_metadata WHERE table_name = ?'
        : 'DELETE FROM sync_metadata';
      const params = tableName ? [tableName] : [];

      await databaseManager.executeQuery(query, params);

      // Re-initialize sync metadata
      if (tableName) {
        await databaseManager.executeQuery(
          `INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
           VALUES (?, '1970-01-01T00:00:00.000Z')`,
          [tableName]
        );
      } else {
        // Re-initialize all sync metadata
        const tables = ['media_files_verses'];
        for (const table of tables) {
          await databaseManager.executeQuery(
            `INSERT OR IGNORE INTO sync_metadata (table_name, last_sync)
             VALUES (?, '1970-01-01T00:00:00.000Z')`,
            [table]
          );
        }
      }

      console.log(`Sync metadata reset for ${tableName || 'all tables'}`);
    } catch (error) {
      console.error('Error resetting sync metadata:', error);
      throw error;
    }
  }

  /**
   * Force a full sync by resetting metadata and syncing all data
   */
  async forceFullSync(): Promise<SyncResult[]> {
    await this.resetSyncMetadata();
    return this.syncAll({ forceFullSync: true });
  }

  /**
   * Clear local data for all tables or a specific table
   */
  async clearLocalData(tableName?: string): Promise<void> {
    try {
      if (tableName) {
        await databaseManager.executeQuery(`DELETE FROM ${tableName}`);
      } else {
        await databaseManager.executeQuery('DELETE FROM media_files_verses');
      }
      console.log(`Local data cleared for ${tableName || 'all tables'}`);
    } catch (error) {
      console.error('Error clearing local data:', error);
      throw error;
    }
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get current sync configuration
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Update sync configuration
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export default MediaFilesVersesSyncService;
