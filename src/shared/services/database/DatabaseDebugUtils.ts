import * as SQLite from 'expo-sqlite';
import { logger } from '../../utils/logger';

export interface DatabaseDebugInfo {
  tables: string[];
  integrityCheck: Array<Record<string, unknown>>;
  foreignKeysEnabled: boolean;
  journalMode: string;
  synchronous: string;
  tempStore: string;
  pageSize: number;
  pageCount: number;
  freelistCount: number;
  autoVacuum: string;
  userVersion: number;
  applicationId: number;
}

export interface TableSchemaInfo {
  name: string;
  columns: Array<{
    name: string;
    type: string;
    notnull: number;
    defaultValue: unknown;
    pk: number;
  }>;
  indexes: Array<{
    name: string;
    unique: number;
    columns: string[];
  }>;
  foreignKeys: Array<{
    id: number;
    seq: number;
    table: string;
    from: string;
    to: string;
    onUpdate: string;
    onDelete: string;
    match: string;
  }>;
}

export class DatabaseDebugUtils {
  /**
   * Get comprehensive database debug information
   */
  static async getDatabaseDebugInfo(
    db: SQLite.SQLiteDatabase
  ): Promise<DatabaseDebugInfo> {
    try {
      const [
        tables,
        integrityCheck,
        foreignKeys,
        journalMode,
        synchronous,
        tempStore,
        pageSize,
        pageCount,
        freelistCount,
        autoVacuum,
        userVersion,
        applicationId,
      ] = await Promise.all([
        db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type='table'"
        ),
        db.getAllAsync('PRAGMA integrity_check'),
        db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys'),
        db.getFirstAsync<{ journal_mode: string }>('PRAGMA journal_mode'),
        db.getFirstAsync<{ synchronous: string }>('PRAGMA synchronous'),
        db.getFirstAsync<{ temp_store: string }>('PRAGMA temp_store'),
        db.getFirstAsync<{ page_size: number }>('PRAGMA page_size'),
        db.getFirstAsync<{ page_count: number }>('PRAGMA page_count'),
        db.getFirstAsync<{ freelist_count: number }>('PRAGMA freelist_count'),
        db.getFirstAsync<{ auto_vacuum: string }>('PRAGMA auto_vacuum'),
        db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'),
        db.getFirstAsync<{ application_id: number }>('PRAGMA application_id'),
      ]);

      return {
        tables: tables.map(t => t.name),
        integrityCheck: integrityCheck as Array<Record<string, unknown>>,
        foreignKeysEnabled: foreignKeys?.foreign_keys === 1,
        journalMode: journalMode?.journal_mode || 'unknown',
        synchronous: synchronous?.synchronous || 'unknown',
        tempStore: tempStore?.temp_store || 'unknown',
        pageSize: pageSize?.page_size || 0,
        pageCount: pageCount?.page_count || 0,
        freelistCount: freelistCount?.freelist_count || 0,
        autoVacuum: autoVacuum?.auto_vacuum || 'unknown',
        userVersion: userVersion?.user_version || 0,
        applicationId: applicationId?.application_id || 0,
      };
    } catch (error) {
      logger.error('Failed to get database debug info:', error);
      throw error;
    }
  }

  /**
   * Get detailed schema information for a specific table
   */
  static async getTableSchemaInfo(
    db: SQLite.SQLiteDatabase,
    tableName: string
  ): Promise<TableSchemaInfo> {
    try {
      const [columns, indexes, foreignKeys] = await Promise.all([
        db.getAllAsync('PRAGMA table_info(' + tableName + ')'),
        db.getAllAsync('PRAGMA index_list(' + tableName + ')'),
        db.getAllAsync('PRAGMA foreign_key_list(' + tableName + ')'),
      ]);

      // Get index details
      const indexDetails = await Promise.all(
        indexes.map(async (index: Record<string, unknown>) => {
          const indexColumns = await db.getAllAsync(
            'PRAGMA index_info(' + (index.name as string) + ')'
          );
          return {
            name: index.name as string,
            unique: index.unique as number,
            columns: indexColumns
              .map((col: Record<string, unknown>) => col.name as string)
              .filter(Boolean),
          };
        })
      );

      return {
        name: tableName,
        columns: columns.map((col: any) => ({
          name: col.name,
          type: col.type,
          notnull: col.notnull,
          defaultValue: col.dflt_value,
          pk: col.pk,
        })),
        indexes: indexDetails,
        foreignKeys: foreignKeys.map((fk: any) => ({
          id: fk.id,
          seq: fk.seq,
          table: fk.table,
          from: fk.from,
          to: fk.to,
          onUpdate: fk.on_update,
          onDelete: fk.on_delete,
          match: fk.match,
        })),
      };
    } catch (error) {
      logger.error(`Failed to get schema info for table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Log comprehensive error information for debugging
   */
  static logDetailedError(
    error: any,
    context: string = 'Database operation'
  ): void {
    logger.error(`${context} failed:`, {
      error: error,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      errorMessage: error?.message || 'No message',
      errorStack: error?.stack || 'No stack',
      errorCode: error?.code || 'No code',
      // Remove the problematic JSON.stringify that was causing empty objects
      // errorStringified: JSON.stringify(
      //   error,
      //   Object.getOwnPropertyNames(error || {})
      // ),
      timestamp: new Date().toISOString(),
      context,
    });
  }

  /**
   * Check if a table exists and log its basic info
   */
  static async checkTableExists(
    db: SQLite.SQLiteDatabase,
    tableName: string
  ): Promise<boolean> {
    try {
      const result = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName]
      );

      if (result) {
        // Get row count
        const rowCount = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );

        logger.info(
          `Table ${tableName} exists with ${rowCount?.count || 0} rows`
        );
        return true;
      } else {
        logger.info(`Table ${tableName} does not exist`);
        return false;
      }
    } catch (error) {
      logger.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  }

  /**
   * Get SQLite error details from error object
   */
  static extractSqliteErrorDetails(error: any): {
    code?: string;
    message?: string;
    extendedCode?: number;
    sql?: string;
  } {
    return {
      code: error?.code,
      message: error?.message,
      extendedCode: error?.extendedCode,
      sql: error?.sql,
    };
  }
}
