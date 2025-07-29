import { supabase } from '../../api/supabase';
import DatabaseManager from '../../database/DatabaseManager';
import { MediaFilesService } from '../../database/MediaFilesService';
import type {
  SyncOptions,
  SyncResult,
  BaseSyncService,
  BibleSyncMetadata,
  SyncConfig,
} from '../types';
import type { Tables } from '@everylanguage/shared-types';
import { logger } from '@/shared/utils/logger';

const databaseManager = DatabaseManager.getInstance();
const mediaFilesService = MediaFilesService.getInstance();

export interface MediaFilesVersesSyncOptions extends SyncOptions {
  forceFullSync?: boolean;
  checkVersionOnly?: boolean;
  mediaFileIds?: string[]; // Optional: sync specific media files only
}

// Enhanced error types for better error handling
export class MediaFilesVersesSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'MediaFilesVersesSyncError';
  }
}

// Validation utilities for MediaFilesVerses-specific data
const validateMediaFileVerseData = (
  mediaFileVerse: Record<string, unknown>
): Tables<'media_files_verses'> => {
  if (
    !mediaFileVerse['id'] ||
    !mediaFileVerse['media_file_id'] ||
    !mediaFileVerse['verse_id']
  ) {
    throw new MediaFilesVersesSyncError(
      'Invalid media file verse data: missing required fields',
      'INVALID_MEDIA_FILE_VERSE_DATA',
      { mediaFileVerse }
    );
  }

  return {
    ...mediaFileVerse,
    // Ensure start_time_seconds is a valid number (can be decimal for precise timing)
    start_time_seconds: Number(mediaFileVerse['start_time_seconds']) || 0,
  } as Tables<'media_files_verses'>;
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
      logger.error('Error checking if media files verses need update:', error);
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
      logger.info('Starting media files verses sync...');

      // Sync media files verses using the new approach
      const mediaFilesVersesResult = await this.syncMediaFilesVerses(options);
      results.push(mediaFilesVersesResult);

      logger.info('Media files verses sync completed successfully');
      return results;
    } catch (error) {
      logger.error('Error during media files verses sync:', error);
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
   * Sync media files verses data using the new approach:
   * 1. Get media files from local media_files table
   * 2. For each media file, check if there's corresponding data in Supabase media_files_verses
   * 3. Download any existing data
   */
  private async syncMediaFilesVerses(
    options: MediaFilesVersesSyncOptions = {}
  ): Promise<SyncResult> {
    try {
      await this.updateSyncStatus('media_files_verses', 'syncing');

      logger.info('Starting media files verses sync with new approach...');

      // Step 1: Get media files from local media_files table
      let mediaFiles;
      if (options.mediaFileIds && options.mediaFileIds.length > 0) {
        // Sync specific media files only
        mediaFiles = [];
        for (const mediaFileId of options.mediaFileIds) {
          const mediaFile =
            await mediaFilesService.getMediaFileById(mediaFileId);
          if (mediaFile) {
            mediaFiles.push(mediaFile);
          }
        }
        logger.info(`Syncing ${mediaFiles.length} specific media files`);
      } else {
        // Get all media files
        mediaFiles = await mediaFilesService.getMediaFiles({
          include_deleted: false, // Don't sync deleted files
        });
        logger.info(`Found ${mediaFiles.length} media files to check`);
      }

      if (!mediaFiles || mediaFiles.length === 0) {
        logger.info('No media files found to sync');
        await this.updateSyncStatus('media_files_verses', 'idle');
        return {
          success: true,
          tableName: 'media_files_verses',
          recordsSynced: 0,
        };
      }

      // Step 2: For each media file, check and download corresponding media_files_verses data
      let totalRecordsSynced = 0;
      const mediaFileIds = mediaFiles.map((mf: { id: string }) => mf.id);

      logger.info(
        `Checking for media_files_verses data for ${mediaFileIds.length} media files`
      );

      // Fetch all media_files_verses data for these media files from Supabase
      const { data: mediaFilesVerses, error } = await supabase
        .from('media_files_verses')
        .select('*')
        .in('media_file_id', mediaFileIds)
        .order('media_file_id', { ascending: true })
        .order('start_time_seconds', { ascending: true });

      if (error) {
        throw new MediaFilesVersesSyncError(
          `Failed to fetch media files verses: ${error.message}`,
          'FETCH_ERROR',
          { error }
        );
      }

      if (!mediaFilesVerses || mediaFilesVerses.length === 0) {
        logger.info(
          'No media_files_verses data found in Supabase for these media files'
        );
        await this.updateSyncStatus('media_files_verses', 'idle');
        return {
          success: true,
          tableName: 'media_files_verses',
          recordsSynced: 0,
        };
      }

      logger.info(
        `Found ${mediaFilesVerses.length} media_files_verses records in Supabase`
      );

      // Step 3: Validate and upsert the data
      const validatedMediaFilesVerses = mediaFilesVerses.map(
        validateMediaFileVerseData
      );

      // Group by media_file_id for better logging
      const groupedByMediaFile = validatedMediaFilesVerses.reduce(
        (acc, mfv) => {
          if (!acc[mfv.media_file_id]) {
            acc[mfv.media_file_id] = [];
          }
          acc[mfv.media_file_id].push(mfv);
          return acc;
        },
        {} as Record<string, typeof validatedMediaFilesVerses>
      );

      logger.info(
        `Syncing verses data for ${Object.keys(groupedByMediaFile).length} media files:`
      );
      Object.entries(groupedByMediaFile).forEach(([mediaFileId, verses]) => {
        logger.debug(`  - Media file ${mediaFileId}: ${verses.length} verses`);
      });

      await this.upsertMediaFilesVerses(validatedMediaFilesVerses);
      totalRecordsSynced = validatedMediaFilesVerses.length;

      // Update sync metadata
      const now = new Date().toISOString();
      await this.updateLastSync('media_files_verses', now);
      await this.updateSyncStatus('media_files_verses', 'idle');

      const result: SyncResult = {
        success: true,
        tableName: 'media_files_verses',
        recordsSynced: totalRecordsSynced,
      };

      this.notifyListeners(result);
      return result;
    } catch (error) {
      logger.error('Error syncing media files verses:', error);
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
   * Sync media files verses for a specific media file
   */
  async syncForMediaFile(mediaFileId: string): Promise<SyncResult[]> {
    return this.syncAll({ mediaFileIds: [mediaFileId] });
  }

  /**
   * Sync media files verses for multiple specific media files
   */
  async syncForMediaFiles(mediaFileIds: string[]): Promise<SyncResult[]> {
    return this.syncAll({ mediaFileIds });
  }

  /**
   * Upsert media files verses to local database
   */
  private async upsertMediaFilesVerses(
    mediaFilesVerses: Tables<'media_files_verses'>[]
  ): Promise<void> {
    const now = new Date().toISOString();

    for (const mediaFileVerse of mediaFilesVerses) {
      try {
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
      } catch (error) {
        logger.error('Error upserting media file verse:', {
          error: (error as Error).message,
          mediaFileVerse: {
            id: mediaFileVerse.id,
            media_file_id: mediaFileVerse.media_file_id,
            verse_id: mediaFileVerse.verse_id,
            start_time_seconds: mediaFileVerse.start_time_seconds,
          },
        });

        // Re-throw the error to be handled by the calling method
        throw new MediaFilesVersesSyncError(
          `Failed to upsert media file verse ${mediaFileVerse.id}: ${(error as Error).message}`,
          'UPSERT_ERROR',
          { error, mediaFileVerse }
        );
      }
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
      logger.error(`Error getting last sync for ${tableName}:`, error);
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
      logger.error(`Error updating last sync for ${tableName}:`, error);
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
      logger.error(`Error updating sync status for ${tableName}:`, error);
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
      logger.error('Error getting sync metadata:', error);
      return [];
    }
  }

  /**
   * Check if there are remote changes for a table
   */
  async hasRemoteChanges(tableName: string): Promise<boolean> {
    try {
      // For the new approach, we check if there are any media files locally
      // and if there might be corresponding data in Supabase
      const mediaFiles = await mediaFilesService.getMediaFiles({
        include_deleted: false,
      });

      if (mediaFiles.length === 0) {
        return false;
      }

      // Check if there are any media_files_verses records in Supabase
      const { data, error } = await supabase
        .from('media_files_verses' as const)
        .select('id')
        .limit(1);

      if (error) {
        logger.error(`Error checking remote changes for ${tableName}:`, error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      logger.error(`Error checking remote changes for ${tableName}:`, error);
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

      logger.info(`Sync metadata reset for ${tableName || 'all tables'}`);
    } catch (error) {
      logger.error('Error resetting sync metadata:', error);
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
      logger.info(`Local data cleared for ${tableName || 'all tables'}`);
    } catch (error) {
      logger.error('Error clearing local data:', error);
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
