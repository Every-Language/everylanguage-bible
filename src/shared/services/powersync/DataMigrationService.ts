import { supabase } from '@/shared/services/api/supabase';
import DatabaseManager from '@/shared/services/database/DatabaseManager';
import { logger } from '@/shared/utils/logger';

export interface MigrationResult {
  success: boolean;
  migratedTables: string[];
  affectedRecords: number;
  error?: string;
}

export interface MigrationOptions {
  shouldMergeData: boolean;
  conflictResolution: 'keep_anonymous' | 'keep_authenticated' | 'merge';
}

/**
 * Service for migrating user data from anonymous to authenticated state
 * Handles the transition when users sign up or sign in after using the app anonymously
 */
export class DataMigrationService {
  private static instance: DataMigrationService;

  // Tables that contain user-specific data with anon_user_id
  private readonly USER_DATA_TABLES = [
    'user_saved_versions',
    'user_bookmarks',
    'user_bookmark_folders',
    'user_saved_image_sets',
    'user_playlist_groups',
    'user_playlists',
    'sessions',
    'shares',
    'share_opens',
    'verse_listens',
    'media_file_listens',
    'app_downloads',
  ];

  private constructor() {}

  public static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  /**
   * Migrate anonymous user data to authenticated user
   */
  public async migrateAnonymousDataToUser(
    targetUserId: string,
    options: MigrationOptions = {
      shouldMergeData: true,
      conflictResolution: 'merge',
    }
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedTables: [],
      affectedRecords: 0,
    };

    try {
      logger.info(
        'DataMigrationService: Starting data migration to user:',
        targetUserId
      );

      // Get current session to find the anonymous user ID
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }

      if (!session?.user) {
        throw new Error('No active session found');
      }

      const sourceAnonUserId = session.user.id;

      if (sourceAnonUserId === targetUserId) {
        logger.info(
          'DataMigrationService: Source and target user IDs are the same, no migration needed'
        );
        result.success = true;
        return result;
      }

      logger.info(
        'DataMigrationService: Migrating from anonymous user:',
        sourceAnonUserId
      );

      if (!options.shouldMergeData) {
        logger.info('DataMigrationService: Merge disabled, skipping migration');
        result.success = true;
        return result;
      }

      const db = await DatabaseManager.getInstance().getDatabase();

      // Perform migration in a transaction
      await db.withTransactionAsync(async () => {
        for (const tableName of this.USER_DATA_TABLES) {
          try {
            const records = await this.migrateTableData(
              db,
              tableName,
              sourceAnonUserId,
              targetUserId,
              options
            );

            if (records > 0) {
              result.migratedTables.push(tableName);
              result.affectedRecords += records;
              logger.info(
                `DataMigrationService: Migrated ${records} records from ${tableName}`
              );
            }
          } catch (tableError) {
            logger.warn(
              `DataMigrationService: Failed to migrate table ${tableName}:`,
              tableError
            );
            // Continue with other tables instead of failing the entire migration
          }
        }
      });

      result.success = true;
      logger.info('DataMigrationService: Migration completed successfully', {
        migratedTables: result.migratedTables,
        affectedRecords: result.affectedRecords,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      result.error = errorMessage;
      logger.error('DataMigrationService: Migration failed:', errorMessage);
    }

    return result;
  }

  /**
   * Migrate data for a specific table
   */
  private async migrateTableData(
    db: any, // SQLite database instance
    tableName: string,
    sourceAnonUserId: string,
    targetUserId: string,
    options: MigrationOptions
  ): Promise<number> {
    // Check if table exists and has the required columns
    const tableInfo = await this.getTableInfo(db, tableName);

    if (!tableInfo.exists) {
      logger.debug(
        `DataMigrationService: Table ${tableName} does not exist, skipping`
      );
      return 0;
    }

    const hasAnonUserIdColumn = tableInfo.columns.includes('anon_user_id');
    const hasUserIdColumn = tableInfo.columns.includes('user_id');

    if (!hasAnonUserIdColumn) {
      logger.debug(
        `DataMigrationService: Table ${tableName} has no anon_user_id column, skipping`
      );
      return 0;
    }

    // Get records to migrate
    const anonRecords = await db.getAllAsync(
      `SELECT * FROM ${tableName} WHERE anon_user_id = ?`,
      [sourceAnonUserId]
    );

    if (anonRecords.length === 0) {
      return 0;
    }

    let migratedCount = 0;

    if (!hasUserIdColumn) {
      // Table only has anon_user_id (like sessions, analytics tables)
      // Update anon_user_id to the new user ID
      const result = await db.runAsync(
        `UPDATE ${tableName} SET anon_user_id = ? WHERE anon_user_id = ?`,
        [targetUserId, sourceAnonUserId]
      );
      migratedCount = result.changes || 0;
    } else {
      // Table has both user_id and anon_user_id columns
      // Handle potential conflicts based on options
      await this.handleUserIdMigration(
        db,
        tableName,
        anonRecords,
        targetUserId,
        options
      );
      migratedCount = anonRecords.length;
    }

    return migratedCount;
  }

  /**
   * Handle migration for tables with both user_id and anon_user_id columns
   */
  private async handleUserIdMigration(
    db: any,
    tableName: string,
    anonRecords: any[],
    targetUserId: string,
    options: MigrationOptions
  ): Promise<void> {
    // Check if the target user already has data in this table
    const existingRecords = await db.getAllAsync(
      `SELECT * FROM ${tableName} WHERE user_id = ?`,
      [targetUserId]
    );

    if (existingRecords.length === 0) {
      // No conflicts, simple migration
      await db.runAsync(
        `UPDATE ${tableName} SET user_id = ?, anon_user_id = NULL WHERE anon_user_id = ?`,
        [targetUserId, anonRecords[0].anon_user_id]
      );
      return;
    }

    // Handle conflicts based on resolution strategy
    switch (options.conflictResolution) {
      case 'keep_authenticated':
        // Delete anonymous data, keep authenticated user data
        await db.runAsync(`DELETE FROM ${tableName} WHERE anon_user_id = ?`, [
          anonRecords[0].anon_user_id,
        ]);
        break;

      case 'keep_anonymous':
        // Delete authenticated data, migrate anonymous data
        await db.runAsync(`DELETE FROM ${tableName} WHERE user_id = ?`, [
          targetUserId,
        ]);
        await db.runAsync(
          `UPDATE ${tableName} SET user_id = ?, anon_user_id = NULL WHERE anon_user_id = ?`,
          [targetUserId, anonRecords[0].anon_user_id]
        );
        break;

      case 'merge':
      default:
        // Merge data - migrate anonymous data and keep both
        await db.runAsync(
          `UPDATE ${tableName} SET user_id = ?, anon_user_id = NULL WHERE anon_user_id = ?`,
          [targetUserId, anonRecords[0].anon_user_id]
        );
        break;
    }
  }

  /**
   * Get table information including existence and column names
   */
  private async getTableInfo(
    db: any,
    tableName: string
  ): Promise<{
    exists: boolean;
    columns: string[];
  }> {
    try {
      // Check if table exists
      const tableCheck = await db.getFirstAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName]
      );

      if (!tableCheck) {
        return { exists: false, columns: [] };
      }

      // Get column information
      const columnsInfo = await db.getAllAsync(
        `PRAGMA table_info(${tableName})`
      );
      const columns = columnsInfo.map((col: any) => col.name);

      return { exists: true, columns };
    } catch (error) {
      logger.warn(
        `DataMigrationService: Failed to get table info for ${tableName}:`,
        error
      );
      return { exists: false, columns: [] };
    }
  }

  /**
   * Check if a user has any anonymous data that can be migrated
   */
  public async hasAnonymousData(anonUserId?: string): Promise<boolean> {
    try {
      const userId = anonUserId || (await this.getCurrentAnonUserId());
      if (!userId) return false;

      const db = await DatabaseManager.getInstance().getDatabase();

      for (const tableName of this.USER_DATA_TABLES) {
        try {
          const count = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM ${tableName} WHERE anon_user_id = ?`,
            [userId]
          );

          if (count && count.count > 0) {
            return true;
          }
        } catch {
          // Table might not exist, continue checking others
          continue;
        }
      }

      return false;
    } catch (error) {
      logger.warn(
        'DataMigrationService: Error checking for anonymous data:',
        error
      );
      return false;
    }
  }

  /**
   * Get current anonymous user ID from session
   */
  private async getCurrentAnonUserId(): Promise<string | null> {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session?.user?.id || null;
    } catch (error) {
      logger.warn(
        'DataMigrationService: Failed to get current user ID:',
        error
      );
      return null;
    }
  }

  /**
   * Clean up old anonymous data after successful migration
   */
  public async cleanupAnonymousData(anonUserId: string): Promise<void> {
    try {
      logger.info(
        'DataMigrationService: Cleaning up anonymous data for user:',
        anonUserId
      );

      const db = await DatabaseManager.getInstance().getDatabase();

      await db.withTransactionAsync(async () => {
        for (const tableName of this.USER_DATA_TABLES) {
          try {
            await db.runAsync(
              `DELETE FROM ${tableName} WHERE anon_user_id = ?`,
              [anonUserId]
            );
          } catch (error) {
            logger.warn(
              `DataMigrationService: Failed to cleanup table ${tableName}:`,
              error
            );
          }
        }
      });

      logger.info('DataMigrationService: Anonymous data cleanup completed');
    } catch (error) {
      logger.error(
        'DataMigrationService: Failed to cleanup anonymous data:',
        error
      );
    }
  }
}

// Export singleton instance
export const dataMigrationService = DataMigrationService.getInstance();
