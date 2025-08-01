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
    _options: VerseTextSyncOptions = {}
  ): Promise<SyncResult> {
    if (this.isSyncing) {
      logger.warn('Verse text sync already in progress');
      return {
        success: false,
        error: 'Sync already in progress',
        tableName: 'verse_texts',
        recordsSynced: 0,
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        logger.info(
          `Starting verse text sync for version: ${versionId} (attempt ${retryCount + 1}/${maxRetries})`
        );

        // Update sync status
        await this.updateSyncStatus('verse_texts', 'syncing');

        // Get last sync time
        const lastSync = await this.getLastSync('verse_texts');
        logger.info('Last sync time:', lastSync);

        // Fetch verse texts from Supabase
        const { data: verseTexts, error: fetchError } = await supabase
          .from('verse_texts')
          .select('*')
          .eq('text_version_id', versionId)
          .gte('updated_at', lastSync)
          .order('updated_at', { ascending: true });

        if (fetchError) {
          logger.error('Error fetching verse texts:', fetchError);
          await this.updateSyncStatus(
            'verse_texts',
            'error',
            fetchError.message
          );
          throw new VerseTextSyncError(
            'Failed to fetch verse texts from server',
            'FETCH_ERROR',
            { error: fetchError }
          );
        }

        if (!verseTexts || verseTexts.length === 0) {
          logger.info('No new verse texts to sync');
          await this.updateSyncStatus('verse_texts', 'idle');
          return {
            success: true,
            tableName: 'verse_texts',
            recordsSynced: 0,
          };
        }

        logger.info(`Found ${verseTexts.length} verse texts to sync`);

        // Pre-validate the data before processing
        const validVerseTexts = verseTexts.filter(verseText => {
          const isValid =
            verseText.id &&
            verseText.verse_id &&
            verseText.verse_text &&
            typeof verseText.id === 'string' &&
            typeof verseText.verse_id === 'string' &&
            typeof verseText.verse_text === 'string';

          if (!isValid) {
            logger.warn('Skipping invalid verse text record:', {
              id: verseText.id,
              verse_id: verseText.verse_id,
              has_text: !!verseText.verse_text,
              text_length: verseText.verse_text?.length,
            });
          }

          return isValid;
        });

        if (validVerseTexts.length === 0) {
          logger.warn('No valid verse texts found after validation');
          await this.updateSyncStatus('verse_texts', 'idle');
          return {
            success: true,
            tableName: 'verse_texts',
            recordsSynced: 0,
          };
        }

        logger.info(
          `Processing ${validVerseTexts.length} valid verse texts out of ${verseTexts.length} total`
        );

        // Enhanced logging for debugging
        logger.info('Sample verse text data:', {
          sampleRecord: validVerseTexts[0]
            ? {
                id: validVerseTexts[0].id,
                verse_id: validVerseTexts[0].verse_id,
                text_version_id: validVerseTexts[0].text_version_id,
                text_length: validVerseTexts[0].verse_text?.length,
                publish_status: validVerseTexts[0].publish_status,
                version: validVerseTexts[0].version,
              }
            : null,
          totalRecords: validVerseTexts.length,
          versionId,
        });

        // Upsert verse texts
        await this.upsertVerseTexts(validVerseTexts);

        // Update last sync time
        const newSyncTime = new Date().toISOString();
        await this.updateLastSync('verse_texts', newSyncTime);

        const duration = Date.now() - startTime;
        logger.info(`Verse text sync completed successfully in ${duration}ms`, {
          recordsProcessed: validVerseTexts.length,
          versionId,
          duration,
          retryCount,
        });

        await this.updateSyncStatus('verse_texts', 'idle');

        const result: SyncResult = {
          success: true,
          tableName: 'verse_texts',
          recordsSynced: validVerseTexts.length,
        };

        this.notifyListeners(result);
        return result;
      } catch (error) {
        retryCount++;
        const duration = Date.now() - startTime;

        // Log the error with retry information
        logger.error(
          `Verse text sync failed (attempt ${retryCount}/${maxRetries}):`,
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            errorCode:
              error instanceof VerseTextSyncError ? error.code : 'UNKNOWN',
            duration,
            retryCount,
            maxRetries,
          }
        );

        // If this is the last retry, update status and return error
        if (retryCount >= maxRetries) {
          await this.updateSyncStatus(
            'verse_texts',
            'error',
            error instanceof Error ? error.message : 'Unknown error'
          );

          const result: SyncResult = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            tableName: 'verse_texts',
            recordsSynced: 0,
          };

          this.notifyListeners(result);
          return result;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        logger.info(`Retrying verse text sync in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // This should never be reached, but just in case
    this.isSyncing = false;
    return {
      success: false,
      error: 'Max retries exceeded',
      tableName: 'verse_texts',
      recordsSynced: 0,
    };
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
      await db.execAsync(`
        DELETE FROM verse_texts 
        WHERE text_version_id NOT IN (
          SELECT version_id FROM user_saved_versions 
          WHERE version_type = 'text'
        )
      `);
    } catch (error) {
      logger.error('Error cleaning up unused verse texts:', error);
      throw new VerseTextSyncError(
        'Failed to clean up unused verse texts',
        'CLEANUP_ERROR',
        { error }
      );
    }
  }

  /**
   * Clear and rebuild verse_texts table to fix corruption issues
   */
  async clearAndRebuildVerseTextsTable(): Promise<void> {
    try {
      logger.info('Clearing and rebuilding verse_texts table...');

      const db = await databaseManager.getDatabase();

      // Drop and recreate the table
      await db.execAsync('DROP TABLE IF EXISTS verse_texts');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS verse_texts (
          id TEXT PRIMARY KEY,
          verse_id TEXT NOT NULL,
          text_version_id TEXT,
          verse_text TEXT NOT NULL,
          publish_status TEXT NOT NULL,
          version INTEGER DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (verse_id) REFERENCES verses (id) ON DELETE CASCADE
        )
      `);

      // Reset sync metadata
      await db.execAsync(`
        DELETE FROM sync_metadata WHERE table_name = 'verse_texts'
      `);
      await db.execAsync(`
        INSERT INTO sync_metadata (table_name, last_sync, total_records, sync_status, created_at, updated_at)
        VALUES ('verse_texts', '1970-01-01T00:00:00.000Z', 0, 'idle', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);

      logger.info('Verse_texts table cleared and rebuilt successfully');
    } catch (error) {
      logger.error('Error clearing and rebuilding verse_texts table:', error);
      throw new VerseTextSyncError(
        'Failed to clear and rebuild verse_texts table',
        'REBUILD_ERROR',
        { error }
      );
    }
  }

  /**
   * Diagnose and fix verse text sync issues
   */
  async diagnoseAndFixSyncIssues(): Promise<{
    success: boolean;
    issues: string[];
    fixes: string[];
  }> {
    const issues: string[] = [];
    const fixes: string[] = [];

    try {
      logger.info('Diagnosing verse text sync issues...');

      const db = await databaseManager.getDatabase();

      // Check if verse_texts table exists
      const tableExists = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='verse_texts'"
      );

      if (!tableExists || tableExists.count === 0) {
        issues.push('verse_texts table does not exist');
        fixes.push('Creating verse_texts table');
        await this.clearAndRebuildVerseTextsTable();
      }

      // Check table structure
      const tableInfo = await db.getAllAsync<{ name: string; type: string }>(
        'PRAGMA table_info(verse_texts)'
      );

      const expectedColumns = [
        'id',
        'verse_id',
        'text_version_id',
        'verse_text',
        'publish_status',
        'version',
        'created_at',
        'updated_at',
        'synced_at',
      ];

      const actualColumns = tableInfo.map(col => col.name);
      const missingColumns = expectedColumns.filter(
        col => !actualColumns.includes(col)
      );

      if (missingColumns.length > 0) {
        issues.push(`Missing columns: ${missingColumns.join(', ')}`);
        fixes.push('Rebuilding table with correct structure');
        await this.clearAndRebuildVerseTextsTable();
      }

      // Check sync metadata
      const syncMetadata = await db.getFirstAsync<{
        last_sync: string;
        sync_status: string;
      }>(
        'SELECT last_sync, sync_status FROM sync_metadata WHERE table_name = ?',
        ['verse_texts']
      );

      if (!syncMetadata) {
        issues.push('Missing sync metadata for verse_texts');
        fixes.push('Creating sync metadata');
        await db.execAsync(`
          INSERT INTO sync_metadata (table_name, last_sync, total_records, sync_status, created_at, updated_at)
          VALUES ('verse_texts', '1970-01-01T00:00:00.000Z', 0, 'idle', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `);
      }

      // Test a simple insert to verify the table works
      try {
        await db.runAsync(
          `
          INSERT OR REPLACE INTO verse_texts (
            id, verse_id, text_version_id, verse_text,
            publish_status, version, created_at, updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
          [
            'test-id',
            'test-verse-id',
            'test-version-id',
            'test text',
            'published',
            1,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        // Clean up test data
        await db.runAsync('DELETE FROM verse_texts WHERE id = ?', ['test-id']);

        logger.info('Table structure test passed');
      } catch (testError) {
        issues.push(
          `Table structure test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`
        );
        fixes.push('Rebuilding table due to structure issues');
        await this.clearAndRebuildVerseTextsTable();
      }

      logger.info('Verse text sync diagnosis completed', { issues, fixes });

      return {
        success: issues.length === 0,
        issues,
        fixes,
      };
    } catch (error) {
      logger.error('Error during verse text sync diagnosis:', error);
      issues.push(
        `Diagnosis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {
        success: false,
        issues,
        fixes: ['Manual intervention required'],
      };
    }
  }

  /**
   * Emergency fix for database transaction errors
   * This method can be called when encountering the ERR_INTERNAL_SQLITE_ERROR
   */
  async emergencyFixTransactionError(): Promise<{
    success: boolean;
    message: string;
    actions: string[];
  }> {
    try {
      logger.info('Starting emergency fix for verse text transaction error...');

      const actions: string[] = [];

      // First, try to diagnose the issue
      const diagnosis = await this.diagnoseAndFixSyncIssues();
      actions.push(...diagnosis.fixes);

      if (!diagnosis.success) {
        // If diagnosis shows issues, rebuild the table
        logger.warn(
          'Database issues detected, rebuilding verse_texts table...'
        );
        await this.clearAndRebuildVerseTextsTable();
        actions.push('Rebuilt verse_texts table due to corruption');
      }

      // Test the fix by trying a simple operation
      try {
        const db = await databaseManager.getDatabase();
        await db.runAsync(
          `
          INSERT OR REPLACE INTO verse_texts (
            id, verse_id, text_version_id, verse_text,
            publish_status, version, created_at, updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
          [
            'emergency-test-id',
            'emergency-test-verse',
            'emergency-test-version',
            'Emergency test text',
            'published',
            1,
            new Date().toISOString(),
            new Date().toISOString(),
          ]
        );

        // Clean up test data
        await db.runAsync('DELETE FROM verse_texts WHERE id = ?', [
          'emergency-test-id',
        ]);
        actions.push('Verified database operations work correctly');

        logger.info('Emergency fix completed successfully');
        return {
          success: true,
          message: 'Database transaction error has been fixed',
          actions,
        };
      } catch (testError) {
        logger.error('Emergency fix verification failed:', testError);
        return {
          success: false,
          message: 'Database is still corrupted after fix attempt',
          actions: [...actions, 'Manual database reset required'],
        };
      }
    } catch (error) {
      logger.error('Emergency fix failed:', error);
      return {
        success: false,
        message: 'Emergency fix failed',
        actions: ['Manual intervention required'],
      };
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
        // Validate and clean the batch data
        const validatedBatch = batch
          .map(verseText => {
            try {
              // Validate required fields
              if (
                !verseText.id ||
                !verseText.verse_id ||
                !verseText.verse_text
              ) {
                logger.warn('Skipping invalid verse text:', {
                  id: verseText.id,
                  verse_id: verseText.verse_id,
                  has_text: !!verseText.verse_text,
                });
                return null;
              }

              // Clean and validate the data
              return {
                id: verseText.id.trim(),
                verse_id: verseText.verse_id.trim(),
                text_version_id: verseText.text_version_id?.trim() || null,
                verse_text: verseText.verse_text.trim(),
                publish_status: verseText.publish_status?.trim() || 'published',
                version:
                  typeof verseText.version === 'number' && verseText.version > 0
                    ? verseText.version
                    : 1,
                created_at: verseText.created_at || new Date().toISOString(),
                updated_at: verseText.updated_at || new Date().toISOString(),
              };
            } catch (error) {
              logger.warn('Error validating verse text data:', error);
              return null;
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        if (validatedBatch.length === 0) {
          logger.warn('No valid verse texts to insert after validation');
          return;
        }

        // Create placeholders for each record (8 parameters per record, excluding synced_at which uses CURRENT_TIMESTAMP)
        const placeholders = validatedBatch
          .map(() => '(?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
          .join(', ');

        const query = `
          INSERT OR REPLACE INTO verse_texts (
            id, verse_id, text_version_id, verse_text,
            publish_status, version, created_at, updated_at, synced_at
          ) VALUES ${placeholders}
        `;

        // Flatten the parameters for each record (8 parameters per record)
        const params = validatedBatch.flatMap(verseText => [
          verseText.id,
          verseText.verse_id,
          verseText.text_version_id,
          verseText.verse_text,
          verseText.publish_status,
          verseText.version,
          verseText.created_at,
          verseText.updated_at,
          // Note: synced_at is handled by CURRENT_TIMESTAMP in the SQL
        ]);

        // Debug logging to verify parameter count
        const expectedPlaceholders = validatedBatch.length * 8;
        const actualParams = params.length;

        if (expectedPlaceholders !== actualParams) {
          logger.error('Parameter count mismatch detected:', {
            expectedPlaceholders,
            actualParams,
            batchSize: validatedBatch.length,
            query: query.substring(0, 200) + '...',
            paramsCount: params.length,
            sampleParams: params.slice(0, 8), // Log first 8 params for debugging
          });
          throw new VerseTextSyncError(
            `Parameter count mismatch: expected ${expectedPlaceholders}, got ${actualParams}`,
            'PARAMETER_MISMATCH',
            {
              expectedPlaceholders,
              actualParams,
              batchSize: validatedBatch.length,
            }
          );
        }

        // Additional validation: ensure no undefined or null values in critical fields
        const hasInvalidParams = params.some((param, index) => {
          const fieldIndex = index % 8;
          const isCriticalField =
            fieldIndex === 0 || fieldIndex === 1 || fieldIndex === 3; // id, verse_id, verse_text
          return (
            isCriticalField &&
            (param === undefined || param === null || param === '')
          );
        });

        if (hasInvalidParams) {
          logger.error('Invalid parameters detected in verse text batch:', {
            batchSize: validatedBatch.length,
            paramsCount: params.length,
            sampleParams: params.slice(0, 16), // Log first 16 params for debugging
          });
          throw new VerseTextSyncError(
            'Invalid parameters detected in verse text batch',
            'INVALID_PARAMETERS',
            { batchSize: validatedBatch.length, paramsCount: params.length }
          );
        }

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
