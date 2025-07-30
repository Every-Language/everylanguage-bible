import { supabase } from '../../api/supabase';
import DatabaseManager from '../../database/DatabaseManager';
import type { LocalVerseText } from '../../database/schema';
import type { SyncOptions, SyncResult, BaseSyncService } from '../types';
import type { Tables } from '@everylanguage/shared-types';
import { logger } from '../../../utils/logger';

const databaseManager = DatabaseManager.getInstance();

export interface VerseTextSyncOptions extends SyncOptions {
  forceFullSync?: boolean;
}

export class VerseTextSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'VerseTextSyncError';
  }
}

class VerseTextSyncService implements BaseSyncService {
  private static instance: VerseTextSyncService;
  private isSyncing = false;
  private syncListeners: ((result: SyncResult) => void)[] = [];

  private constructor() {}

  static getInstance(): VerseTextSyncService {
    if (!VerseTextSyncService.instance) {
      VerseTextSyncService.instance = new VerseTextSyncService();
    }
    return VerseTextSyncService.instance;
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

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  private notifyListeners(result: SyncResult): void {
    this.syncListeners.forEach(listener => listener(result));
  }

  /**
   * Sync verse texts for a specific text version or project
   */
  async syncVerseTextsForVersion(
    versionId: string,
    options: VerseTextSyncOptions = {}
  ): Promise<SyncResult> {
    logger.info('VerseTextSync - syncVerseTextsForVersion called:', {
      versionId,
      options,
    });

    if (this.isSyncing) {
      logger.info(
        'VerseTextSync - Sync already in progress, skipping this request'
      );
      return {
        success: true,
        tableName: 'verse_texts',
        recordsSynced: 0,
        warning: 'Verse text sync is already in progress',
      };
    }

    this.isSyncing = true;
    const { batchSize = 500 } = options;

    try {
      await this.updateSyncStatus('verse_texts', 'syncing');

      logger.info(
        `VerseTextSync - Starting verse text sync for text_version: ${versionId}`
      );

      const lastSync = options.forceFullSync
        ? '1970-01-01T00:00:00.000Z'
        : await this.getLastSync('verse_texts');

      logger.info(
        `VerseTextSync - Last sync: ${lastSync}, Force full sync: ${options.forceFullSync}`
      );

      let allVerseTexts: Tables<'verse_texts'>[] = [];
      let hasMoreData = true;
      let lastFetchedId: string | null = null;
      const mobileBatchSize = Math.min(batchSize, 2000); // Increased from 500 to 2000 for faster onboarding

      while (hasMoreData) {
        logger.info(
          `VerseTextSync - Fetching batch (limit: ${mobileBatchSize}, lastFetchedId: ${lastFetchedId})`
        );

        // Build query based on version type
        let query = supabase
          .from('verse_texts')
          .select('*')
          .gte('updated_at', lastSync)
          .eq('publish_status', 'published')
          .is('deleted_at', null)
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(mobileBatchSize);

        // Filter by the specific version
        logger.info(
          `VerseTextSync - Filtering by text_version_id: ${versionId}`
        );
        query = query.eq('text_version_id', versionId);

        if (lastFetchedId) {
          query = query.gt('id', lastFetchedId);
        }

        logger.info(`VerseTextSync - Executing Supabase query...`);
        const { data: remoteVerseTexts, error } = await query;

        if (error) {
          logger.error(`VerseTextSync - Supabase query error:`, error);
          throw new VerseTextSyncError(
            `Failed to fetch verse texts: ${error.message}`,
            'FETCH_ERROR',
            { versionId, error }
          );
        }

        logger.info(
          `VerseTextSync - Query returned ${remoteVerseTexts?.length || 0} verse texts`
        );
        if (remoteVerseTexts && remoteVerseTexts.length > 0) {
          const firstVerseText = remoteVerseTexts[0];
          logger.info(`VerseTextSync - First verse text:`, {
            id: firstVerseText?.id,
            verse_id: firstVerseText?.verse_id,
            text_version_id: firstVerseText?.text_version_id,
            verse_text: firstVerseText?.verse_text?.substring(0, 50) + '...',
          });
        }

        if (!remoteVerseTexts || remoteVerseTexts.length === 0) {
          logger.info(`VerseTextSync - No more data, stopping fetch loop`);
          hasMoreData = false;
          break;
        }

        allVerseTexts = allVerseTexts.concat(remoteVerseTexts);

        const lastVerseText = remoteVerseTexts[remoteVerseTexts.length - 1];
        if (lastVerseText?.id) {
          lastFetchedId = lastVerseText.id;
        }

        if (remoteVerseTexts.length < mobileBatchSize) {
          hasMoreData = false;
        }
      }

      if (allVerseTexts.length === 0) {
        await this.updateSyncStatus('verse_texts', 'idle');
        logger.info(`No verse texts found for text_version: ${versionId}`);

        const result: SyncResult = {
          success: true,
          tableName: 'verse_texts',
          recordsSynced: 0,
        };

        this.notifyListeners(result);
        return result;
      }

      // Batch upsert for better performance
      await this.upsertVerseTexts(allVerseTexts);

      // Update sync metadata
      const latestVerseText = allVerseTexts[allVerseTexts.length - 1];
      if (latestVerseText?.updated_at) {
        await this.updateLastSync('verse_texts', latestVerseText.updated_at);
      }
      await this.updateSyncStatus('verse_texts', 'idle');

      logger.info(
        `Synced ${allVerseTexts.length} verse texts for text_version: ${versionId}`
      );

      const result: SyncResult = {
        success: true,
        tableName: 'verse_texts',
        recordsSynced: allVerseTexts.length,
      };

      this.notifyListeners(result);
      return result;
    } catch (error) {
      logger.error('Verse texts sync failed:', error);
      await this.updateSyncStatus(
        'verse_texts',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      const result: SyncResult = {
        success: false,
        tableName: 'verse_texts',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.notifyListeners(result);
      return result;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get verse texts for a chapter with optional text version filter
   */
  async getVerseTextsForChapter(
    chapterId: string,
    textVersionId?: string
  ): Promise<LocalVerseText[]> {
    try {
      const db = await databaseManager.getDatabase();

      let query = `
        SELECT vt.* FROM verse_texts vt
        INNER JOIN verses v ON vt.verse_id = v.id
        WHERE v.chapter_id = ? AND vt.publish_status = 'published'
      `;

      const params: (string | number)[] = [chapterId];

      if (textVersionId) {
        query += ` AND vt.text_version_id = ?`;
        params.push(textVersionId);
      }

      query += ` ORDER BY v.verse_number ASC`;

      const results = await db.getAllAsync<LocalVerseText>(query, params);
      return results;
    } catch (error) {
      logger.error('Error getting verse texts for chapter:', error);
      throw new VerseTextSyncError(
        'Failed to get verse texts for chapter',
        'QUERY_ERROR',
        { chapterId, textVersionId, error }
      );
    }
  }

  /**
   * Clean up verse texts for versions no longer in user's saved list
   */
  async cleanupUnusedVerseTexts(): Promise<void> {
    try {
      const db = await databaseManager.getDatabase();

      // Get all saved version IDs
      const savedVersions = await db.getAllAsync<{ version_id: string }>(
        'SELECT DISTINCT version_id FROM user_saved_versions WHERE version_type = ?',
        ['text']
      );

      if (savedVersions.length === 0) {
        // If no saved versions, clean up all verse texts
        await db.execAsync('DELETE FROM verse_texts');
        logger.info('Cleaned up all verse texts (no saved text versions)');
        return;
      }

      const savedVersionIds = savedVersions.map(v => v.version_id);
      const placeholders = savedVersionIds.map(() => '?').join(',');

      // Delete verse texts that don't belong to any saved version
      const query = `
        DELETE FROM verse_texts 
        WHERE text_version_id NOT IN (${placeholders}) 
        AND text_version_id IS NOT NULL
      `;

      await databaseManager.execSingle(query, savedVersionIds);
      logger.info('Cleaned up unused verse texts');
    } catch (error) {
      logger.error('Error cleaning up unused verse texts:', error);
      throw new VerseTextSyncError(
        'Failed to clean up unused verse texts',
        'CLEANUP_ERROR',
        { error }
      );
    }
  }

  // Private helper methods (following BibleSyncService patterns)

  private async upsertVerseTexts(
    verseTexts: Tables<'verse_texts'>[]
  ): Promise<void> {
    if (verseTexts.length === 0) return;

    // Split large batches to avoid SQLite variable limits
    const BATCH_SIZE = 500;

    for (let i = 0; i < verseTexts.length; i += BATCH_SIZE) {
      const batch = verseTexts.slice(i, i + BATCH_SIZE);

      await databaseManager.transaction(async () => {
        const placeholders = batch
          .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .join(', ');

        const query = `
          INSERT OR REPLACE INTO verse_texts (
            id, verse_id, text_version_id, verse_text,
            publish_status, version, created_at, updated_at, synced_at
          ) VALUES ${placeholders}
        `;

        const params = batch.flatMap(verseText => [
          verseText.id,
          verseText.verse_id,
          verseText.text_version_id,
          verseText.verse_text,
          verseText.publish_status,
          verseText.version,
          verseText.created_at || new Date().toISOString(),
          verseText.updated_at || new Date().toISOString(),
        ]);

        await databaseManager.execSingle(query, params);
      });
    }
  }

  private async getLastSync(tableName: string): Promise<string> {
    try {
      const db = await databaseManager.getDatabase();
      const result = await db.getFirstAsync<{ last_sync: string }>(
        'SELECT last_sync FROM sync_metadata WHERE table_name = ?',
        [tableName]
      );
      return result?.last_sync || '1970-01-01T00:00:00.000Z';
    } catch (error) {
      logger.error(`Error getting last sync for ${tableName}:`, error);
      return '1970-01-01T00:00:00.000Z';
    }
  }

  private async updateLastSync(
    tableName: string,
    timestamp: string
  ): Promise<void> {
    try {
      await databaseManager.execSingle(
        `UPDATE sync_metadata 
         SET last_sync = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE table_name = ?`,
        [timestamp, tableName]
      );
    } catch (error) {
      logger.error(`Error updating last sync for ${tableName}:`, error);
    }
  }

  private async updateSyncStatus(
    tableName: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await databaseManager.execSingle(
        `UPDATE sync_metadata 
         SET sync_status = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE table_name = ?`,
        [status, errorMessage || null, tableName]
      );
    } catch (error) {
      logger.error(`Error updating sync status for ${tableName}:`, error);
    }
  }
}

export default VerseTextSyncService;
