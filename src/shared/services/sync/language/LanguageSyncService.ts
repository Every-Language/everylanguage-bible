import { supabase } from '../../api/supabase';
import DatabaseManager from '../../database/DatabaseManager';
import type {
  SyncOptions,
  SyncResult,
  BaseSyncService,
  SyncConfig,
} from '../types';
import type { SyncMetadata } from '../../database/schema';

import { logger } from '../../../utils/logger';

const databaseManager = DatabaseManager.getInstance();

export interface LanguageSyncOptions extends SyncOptions {
  forceFullSync?: boolean;
  syncUserVersions?: boolean;
  syncAvailableVersions?: boolean;
}

// Define interfaces for remote Supabase types
interface RemoteLanguageEntity {
  id: string;
  name: string;
  level: 'family' | 'language' | 'dialect' | 'mother_tongue';
  parent_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at?: string | null;
}

interface AudioVersionData {
  id: string;
  version_type: 'audio';
  language_entity_id: string;
  version_id: string;
  version_name: string;
  created_at: string | null;
  updated_at: string | null;
  is_available: boolean;
  published_content_count: number;
  last_availability_check: string;
}

interface TextVersionData {
  id: string;
  version_type: 'text';
  language_entity_id: string;
  version_id: string;
  version_name: string;
  created_at: string | null;
  updated_at: string | null;
  is_available: boolean;
  published_content_count: number;
  last_availability_check: string;
}

// Note: RemoteProject and RemoteTextVersion interfaces are defined inline where used
// to avoid linter warnings about unused interfaces

// Enhanced error types for better error handling
export class LanguageSyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'LanguageSyncError';
  }
}

class LanguageSyncService implements BaseSyncService {
  private static instance: LanguageSyncService;
  private isSyncing = false;
  private syncListeners: ((result: SyncResult) => void)[] = [];
  private config: SyncConfig = {
    strategy: 'timestamp',
    checkInterval: 6 * 60 * 60 * 1000, // Check for updates every 6 hours
    autoSync: true,
  };

  // Cache for version check results
  private versionCheckCache: Map<
    string,
    { version: string; timestamp: number }
  > = new Map();
  private readonly VERSION_CACHE_TTL = 30 * 60 * 1000; // 30 minutes cache

  private constructor() {}

  static getInstance(): LanguageSyncService {
    if (!LanguageSyncService.instance) {
      LanguageSyncService.instance = new LanguageSyncService();
    }
    return LanguageSyncService.instance;
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
   * Check if language data needs updating
   */
  async needsUpdate(): Promise<{ needsUpdate: boolean; tables: string[] }> {
    try {
      const tables = ['language_entities_cache', 'available_versions_cache'];
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
      logger.error('Error checking for language updates:', error);
      return { needsUpdate: false, tables: [] };
    }
  }

  /**
   * Sync all language-related data
   */
  async syncAll(options: LanguageSyncOptions = {}): Promise<SyncResult[]> {
    if (this.isSyncing) {
      logger.info(
        'Language sync is already in progress, skipping this request'
      );
      return [
        {
          success: true,
          tableName: 'all',
          recordsSynced: 0,
          warning: 'Language sync is already in progress',
        },
      ];
    }

    this.isSyncing = true;
    const results: SyncResult[] = [];

    try {
      // Check if we need to sync at all (unless force sync)
      if (!options.forceFullSync) {
        const updateCheck = await this.needsUpdate();
        if (!updateCheck.needsUpdate) {
          logger.info('Language data is up to date, skipping sync');
          return [
            {
              success: true,
              tableName: 'all',
              recordsSynced: 0,
            },
          ];
        }

        logger.info(
          'Language data needs updating for tables:',
          updateCheck.tables
        );
      }

      // Sync language entities first (foundation for everything else)
      const languageEntitiesResult = await this.syncLanguageEntities(options);
      results.push(languageEntitiesResult);
      this.notifyListeners(languageEntitiesResult);

      // Only sync versions if language entities sync was successful
      if (languageEntitiesResult.success) {
        if (options.syncAvailableVersions !== false) {
          const availableVersionsResult =
            await this.syncAvailableVersions(options);
          results.push(availableVersionsResult);
          this.notifyListeners(availableVersionsResult);
        }

        if (options.syncUserVersions !== false) {
          const userVersionsResult = await this.syncUserSavedVersions(options);
          results.push(userVersionsResult);
          this.notifyListeners(userVersionsResult);
        }
      }

      // Update last successful sync time
      await this.updateLastFullSync();
    } catch (error) {
      logger.error('Language sync failed:', error);
    } finally {
      this.isSyncing = false;
    }

    return results;
  }

  private async syncLanguageEntities(
    options: LanguageSyncOptions = {}
  ): Promise<SyncResult> {
    const { batchSize = 1000 } = options;

    try {
      await this.updateSyncStatus('language_entities_cache', 'syncing');

      const lastSync = options.forceFullSync
        ? '1970-01-01T00:00:00.000Z'
        : await this.getLastSync('language_entities_cache');

      let allEntities: RemoteLanguageEntity[] = [];
      let hasMoreData = true;
      let lastFetchedId: string | null = null;
      const mobileBatchSize = Math.min(batchSize, 2000); // Increased from 500 to 2000 for faster onboarding

      while (hasMoreData) {
        let query = supabase
          .from('language_entities')
          .select('*')
          .gte('updated_at', lastSync)
          .is('deleted_at', null) // Only fetch non-deleted entities
          .order('updated_at', { ascending: true })
          .order('id', { ascending: true })
          .limit(mobileBatchSize);

        if (lastFetchedId) {
          query = query.gt('id', lastFetchedId);
        }

        const { data: remoteEntities, error } = await query;

        if (error) {
          throw new Error(
            `Failed to fetch language entities: ${error.message}`
          );
        }

        if (!remoteEntities || remoteEntities.length === 0) {
          hasMoreData = false;
          break;
        }

        allEntities = allEntities.concat(remoteEntities);

        const lastEntity = remoteEntities[remoteEntities.length - 1];
        if (lastEntity?.id) {
          lastFetchedId = lastEntity.id;
        }

        if (remoteEntities.length < mobileBatchSize) {
          hasMoreData = false;
        }
      }

      if (allEntities.length === 0) {
        await this.updateSyncStatus('language_entities_cache', 'idle');
        return {
          success: true,
          tableName: 'language_entities_cache',
          recordsSynced: 0,
        };
      }

      // Batch insert for better performance
      await this.upsertLanguageEntities(allEntities);

      // Update sync metadata
      const latestEntity = allEntities[allEntities.length - 1];
      if (latestEntity?.updated_at) {
        await this.updateLastSync(
          'language_entities_cache',
          latestEntity.updated_at
        );
      }
      await this.updateSyncStatus('language_entities_cache', 'idle');

      logger.info(`Synced ${allEntities.length} language entities`);

      return {
        success: true,
        tableName: 'language_entities_cache',
        recordsSynced: allEntities.length,
      };
    } catch (error) {
      logger.error('Language entities sync failed:', error);
      await this.updateSyncStatus(
        'language_entities_cache',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        tableName: 'language_entities_cache',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async syncAvailableVersions(
    options: LanguageSyncOptions = {}
  ): Promise<SyncResult> {
    const { batchSize = 1000 } = options;

    try {
      await this.updateSyncStatus('available_versions_cache', 'syncing');

      const lastSync = options.forceFullSync
        ? '1970-01-01T00:00:00.000Z'
        : await this.getLastSync('available_versions_cache');

      // First sync audio versions
      const audioVersions = await this.fetchAudioVersions(lastSync, batchSize);

      // Then sync text versions
      const textVersions = await this.fetchTextVersions(lastSync, batchSize);

      const totalVersions = audioVersions.length + textVersions.length;

      if (totalVersions === 0) {
        await this.updateSyncStatus('available_versions_cache', 'idle');
        return {
          success: true,
          tableName: 'available_versions_cache',
          recordsSynced: 0,
        };
      }

      // Batch insert versions
      await this.upsertAvailableVersions(audioVersions, textVersions);

      // Update sync metadata with the latest timestamp
      const latestTimestamp = Math.max(
        ...audioVersions.map(v =>
          new Date(v.updated_at || new Date()).getTime()
        ),
        ...textVersions.map(v => new Date(v.updated_at || new Date()).getTime())
      );

      if (latestTimestamp > 0) {
        const newLastSync = new Date(latestTimestamp).toISOString();
        await this.updateLastSync('available_versions_cache', newLastSync);
      }
      await this.updateSyncStatus('available_versions_cache', 'idle');

      // Update language availability data after syncing versions
      try {
        const { availabilityService } = await import(
          '../../../../features/languages/services/availabilityService'
        );
        await availabilityService.updateLanguageAvailability();
      } catch (error) {
        logger.error('Failed to update language availability data:', error);
      }

      return {
        success: true,
        tableName: 'available_versions_cache',
        recordsSynced: totalVersions,
      };
    } catch (error) {
      logger.error('Available versions sync failed:', error);
      await this.updateSyncStatus(
        'available_versions_cache',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        tableName: 'available_versions_cache',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async fetchAudioVersions(
    lastSync: string,
    batchSize: number
  ): Promise<AudioVersionData[]> {
    const audioVersions: AudioVersionData[] = [];
    let hasMoreData = true;
    let lastFetchedId: string | null = null;
    const audioBatchSize = Math.min(batchSize, 2000); // Increased from 500 to 2000 for faster onboarding

    while (hasMoreData) {
      // Fetch audio_versions that have at least one published media file
      let query = supabase
        .from('audio_versions')
        .select(
          `
          id,
          name,
          language_entity_id,
          created_at,
          updated_at,
          media_files!inner(
            id,
            publish_status
          )
        `
        )
        .gte('updated_at', lastSync)
        .is('deleted_at', null)
        .eq('media_files.publish_status', 'published')
        .is('media_files.deleted_at', null)
        .order('updated_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(audioBatchSize);

      if (lastFetchedId) {
        query = query.gt('id', lastFetchedId);
      }

      const { data: remoteAudioVersions, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch audio versions: ${error.message}`);
      }

      if (!remoteAudioVersions || remoteAudioVersions.length === 0) {
        hasMoreData = false;
        break;
      }

      // Count published media files for each audio version
      for (const audioVersion of remoteAudioVersions) {
        const { count: publishedCount, error: countError } = await supabase
          .from('media_files')
          .select('*', { count: 'exact', head: true })
          .eq('audio_version_id', audioVersion.id)
          .eq('publish_status', 'published')
          .is('deleted_at', null);

        if (countError) {
          logger.error(
            `Error counting media files for audio version ${audioVersion.id}:`,
            countError
          );
          continue;
        }

        // Only include audio versions with published content
        if (publishedCount && publishedCount > 0) {
          audioVersions.push({
            id: audioVersion.id,
            version_type: 'audio' as const,
            language_entity_id: audioVersion.language_entity_id,
            version_id: audioVersion.id,
            version_name: audioVersion.name,
            created_at: audioVersion.created_at,
            updated_at: audioVersion.updated_at,
            is_available: true,
            published_content_count: publishedCount,
            last_availability_check: new Date().toISOString(),
          });
        }
      }

      const lastAudioVersion =
        remoteAudioVersions[remoteAudioVersions.length - 1];
      if (lastAudioVersion?.id) {
        lastFetchedId = lastAudioVersion.id;
      }

      if (remoteAudioVersions.length < audioBatchSize) {
        hasMoreData = false;
      }
    }

    return audioVersions;
  }

  private async fetchTextVersions(
    lastSync: string,
    batchSize: number
  ): Promise<TextVersionData[]> {
    const textVersions: TextVersionData[] = [];
    let hasMoreData = true;
    let lastFetchedId: string | null = null;
    const textBatchSize = Math.min(batchSize, 2000); // Increased from 500 to 2000 for faster onboarding

    while (hasMoreData) {
      // Only fetch text_versions that have at least one published verse_text
      let query = supabase
        .from('text_versions')
        .select(
          `
          id,
          name,
          language_entity_id,
          created_at,
          updated_at,
          verse_texts!inner(
            id,
            publish_status
          )
        `
        )
        .gte('updated_at', lastSync)
        .is('deleted_at', null)
        .eq('verse_texts.publish_status', 'published')
        .is('verse_texts.deleted_at', null)
        .order('updated_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(textBatchSize);

      if (lastFetchedId) {
        query = query.gt('id', lastFetchedId);
      }

      const { data: remoteTextVersions, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch text versions: ${error.message}`);
      }

      if (!remoteTextVersions || remoteTextVersions.length === 0) {
        hasMoreData = false;
        break;
      }

      // Count published verse_texts for each text_version
      for (const textVersion of remoteTextVersions) {
        const { count: publishedCount } = await supabase
          .from('verse_texts')
          .select('*', { count: 'exact', head: true })
          .eq('text_version_id', textVersion.id)
          .eq('publish_status', 'published')
          .is('deleted_at', null);

        // Only include text_versions with published content
        if (publishedCount && publishedCount > 0) {
          textVersions.push({
            id: textVersion.id,
            version_type: 'text' as const,
            language_entity_id: textVersion.language_entity_id,
            version_id: textVersion.id,
            version_name: textVersion.name,
            created_at: textVersion.created_at,
            updated_at: textVersion.updated_at,
            is_available: true,
            published_content_count: publishedCount,
            last_availability_check: new Date().toISOString(),
          });
        }
      }

      const lastTextVersion = remoteTextVersions[remoteTextVersions.length - 1];
      if (lastTextVersion?.id) {
        lastFetchedId = lastTextVersion.id;
      }

      if (remoteTextVersions.length < textBatchSize) {
        hasMoreData = false;
      }
    }

    return textVersions;
  }

  private async syncUserSavedVersions(
    _options: LanguageSyncOptions = {}
  ): Promise<SyncResult> {
    try {
      // Note: User saved versions are typically stored locally only
      // This method is a placeholder for future remote sync if needed

      await this.updateSyncStatus('user_saved_versions', 'idle');

      return {
        success: true,
        tableName: 'user_saved_versions',
        recordsSynced: 0,
      };
    } catch (error) {
      logger.error('User saved versions sync failed:', error);
      await this.updateSyncStatus(
        'user_saved_versions',
        'error',
        error instanceof Error ? error.message : 'Unknown error'
      );

      return {
        success: false,
        tableName: 'user_saved_versions',
        recordsSynced: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Optimized upsert methods using batch transactions
  private async upsertLanguageEntities(
    entities: RemoteLanguageEntity[]
  ): Promise<void> {
    await databaseManager.transaction(async () => {
      for (const entity of entities) {
        await databaseManager.executeQuery(
          `
          INSERT OR REPLACE INTO language_entities_cache (
            id, name, level, parent_id, created_at, updated_at, synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `,
          [
            entity.id,
            entity.name,
            entity.level,
            entity.parent_id,
            entity.created_at,
            entity.updated_at,
          ]
        );
      }
    });
  }

  private async upsertAvailableVersions(
    audioVersions: AudioVersionData[],
    textVersions: TextVersionData[]
  ): Promise<void> {
    const allVersions = [...audioVersions, ...textVersions];

    if (allVersions.length === 0) {
      return;
    }

    const db = await databaseManager.getDatabase();

    // Use transaction for better performance
    await db.withTransactionAsync(async () => {
      for (const version of allVersions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO available_versions_cache 
           (id, version_type, language_entity_id, version_id, version_name, 
            created_at, updated_at, synced_at, is_available, published_content_count, last_availability_check) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            version.id,
            version.version_type,
            version.language_entity_id,
            version.version_id,
            version.version_name,
            version.created_at,
            version.updated_at,
            new Date().toISOString(),
            version.is_available ? 1 : 0,
            version.published_content_count || 0,
            version.last_availability_check || new Date().toISOString(),
          ]
        );
      }
    });
  }

  // Helper methods (similar to BibleSyncService)
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

  private async updateLastFullSync(): Promise<void> {
    const timestamp = new Date().toISOString();
    const tables = [
      'language_entities_cache',
      'available_versions_cache',
      'user_saved_versions',
    ];

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

  async getSyncMetadata(tableName?: string): Promise<SyncMetadata[]> {
    const query = tableName
      ? 'SELECT * FROM sync_metadata WHERE table_name = ?'
      : 'SELECT * FROM sync_metadata WHERE table_name IN (?, ?, ?)';

    const params = tableName
      ? [tableName]
      : [
          'language_entities_cache',
          'available_versions_cache',
          'user_saved_versions',
        ];

    return databaseManager.executeQuery<SyncMetadata>(query, params);
  }

  async hasRemoteChanges(tableName: string): Promise<boolean> {
    try {
      if (!databaseManager.initialized) {
        return false;
      }

      const lastSync = await this.getLastSync(tableName);

      // Map local table names to remote table names
      const tableMapping: Record<string, string> = {
        language_entities_cache: 'language_entities',
        available_versions_cache: 'projects', // We'll check both projects and text_versions
        user_saved_versions: 'user_saved_versions',
      };

      const remoteTableName = tableMapping[tableName];
      if (!remoteTableName) {
        return false;
      }

      // For available_versions_cache, check both projects and text_versions
      if (tableName === 'available_versions_cache') {
        const [projectsResult, textVersionsResult] = await Promise.all([
          supabase
            .from('projects')
            .select('id')
            .gt('updated_at', lastSync)
            .is('deleted_at', null)
            .limit(1),
          supabase
            .from('text_versions')
            .select('id')
            .gt('updated_at', lastSync)
            .is('deleted_at', null)
            .limit(1),
        ]);

        const hasProjectChanges = !!(
          projectsResult.data && projectsResult.data.length > 0
        );
        const hasTextVersionChanges = !!(
          textVersionsResult.data && textVersionsResult.data.length > 0
        );

        return hasProjectChanges || hasTextVersionChanges;
      }

      // For other tables, check normally
      const { data, error } = await supabase
        .from(
          remoteTableName as 'language_entities' | 'projects' | 'text_versions'
        )
        .select('id')
        .gt('updated_at', lastSync)
        .is('deleted_at', null)
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
        // Reset all language tables
        const tables = [
          'language_entities_cache',
          'available_versions_cache',
          'user_saved_versions',
        ];
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
      logger.error('Failed to reset language sync metadata:', error);
      throw error;
    }
  }

  async forceFullSync(): Promise<SyncResult[]> {
    return this.syncAll({ forceFullSync: true });
  }

  async clearLocalData(tableName?: string): Promise<void> {
    const tables = tableName
      ? [tableName]
      : [
          'language_entities_cache',
          'available_versions_cache',
          'user_saved_versions',
        ];

    for (const table of tables) {
      await databaseManager.executeQuery(`DELETE FROM ${table}`);
      await this.resetSyncMetadata(table);
    }
  }

  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Get configuration for language sync
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * Update configuration for language sync
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const languageSync = LanguageSyncService.getInstance();
