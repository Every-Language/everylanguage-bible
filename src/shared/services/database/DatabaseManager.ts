import * as SQLite from 'expo-sqlite';
import { SQLiteBindParams } from 'expo-sqlite';
import { DATABASE_NAME, createTables, dropTables } from './schema';
import { logger } from '../../utils/logger';

const CURRENT_DATABASE_VERSION = 5; // Increment when schema changes

// Enhanced error types for better error handling
export interface DatabaseErrorDetails {
  query?: string;
  params?: SQLiteBindParams | undefined;
  originalError?: unknown;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: DatabaseErrorDetails
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

enum DatabaseState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  ERROR = 'error',
}

export interface DatabaseInitProgress {
  stage:
    | 'opening'
    | 'migrating'
    | 'creating_tables'
    | 'verifying'
    | 'complete'
    | 'error';
  message: string;
  progress: number; // 0-100
  error?: string;
}

type ProgressCallback = (progress: DatabaseInitProgress) => void;

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private state: DatabaseState = DatabaseState.UNINITIALIZED;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second
  private progressCallback: ProgressCallback | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  setProgressCallback(callback: ProgressCallback | null): void {
    this.progressCallback = callback;
  }

  private updateProgress(progress: DatabaseInitProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Initialize database with race condition protection
   * Returns the same promise for concurrent calls
   */
  async initialize(): Promise<void> {
    // Return existing promise if initialization is in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Return immediately if already initialized
    if (this.state === DatabaseState.INITIALIZED && this.db) {
      return;
    }

    // Throw previous error if initialization failed
    if (this.state === DatabaseState.ERROR && this.initializationError) {
      throw this.initializationError;
    }

    // Create and cache the initialization promise
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
    } catch (error) {
      // Reset promise so retry is possible
      this.initializationPromise = null;
      throw error;
    }
  }

  private async performInitialization(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(
          `Database initialization attempt ${attempt}/${this.maxRetries}`
        );

        this.state = DatabaseState.INITIALIZING;
        this.initializationError = null;

        // Close any existing database connection
        if (this.db) {
          await this.db.closeAsync();
          this.db = null;
        }

        // Stage 1: Opening database
        this.updateProgress({
          stage: 'opening',
          message: 'Opening database connection...',
          progress: 10,
        });

        try {
          this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
          logger.info('Database opened successfully');
        } catch (dbError: unknown) {
          const error = dbError as Error;
          logger.error('Failed to open database:', {
            error: dbError,
            errorType: typeof dbError,
            errorConstructor: error?.constructor?.name,
            errorMessage: error?.message || 'No message',
            errorStack: error?.stack || 'No stack',
            databaseName: DATABASE_NAME,
          });
          throw dbError;
        }

        // Stage 2: Verify database access
        this.updateProgress({
          stage: 'opening',
          message: 'Verifying database access...',
          progress: 20,
        });

        await this.verifyDatabaseAccess();

        // Stage 3: Perform migrations
        this.updateProgress({
          stage: 'migrating',
          message: 'Checking for database updates...',
          progress: 30,
        });

        await this.performMigrations();

        // Stage 4: Create tables
        this.updateProgress({
          stage: 'creating_tables',
          message: 'Setting up database tables...',
          progress: 50,
        });

        await this.createTablesWithVerification();

        // Stage 5: Final verification
        this.updateProgress({
          stage: 'verifying',
          message: 'Verifying database setup...',
          progress: 80,
        });

        await this.finalVerification();

        this.state = DatabaseState.INITIALIZED;

        this.updateProgress({
          stage: 'complete',
          message: 'Database ready!',
          progress: 100,
        });

        logger.info('Database initialized successfully');
        return;
      } catch (error: unknown) {
        lastError = error as Error;

        // Enhanced error logging
        const err = error as Error;
        logger.error(`Database initialization attempt ${attempt} failed:`, {
          error: error,
          errorType: typeof error,
          errorConstructor: err?.constructor?.name,
          errorMessage: err?.message || 'No message',
          errorStack: err?.stack || 'No stack',
          // Remove the problematic JSON.stringify that was causing empty objects
          // errorStringified: JSON.stringify(
          //   error,
          //   Object.getOwnPropertyNames(error || {})
          // ),
        });

        this.state = DatabaseState.ERROR;
        this.initializationError = lastError;

        this.updateProgress({
          stage: 'error',
          message: `Initialization failed: ${(lastError as Error)?.message || 'Unknown error'}`,
          progress: 0,
          error: (lastError as Error)?.message || 'Unknown error',
        });

        if (attempt < this.maxRetries) {
          logger.info(`Retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }

    // All retries failed
    this.initializationPromise = null;
    throw new DatabaseError(
      `Database initialization failed after ${this.maxRetries} attempts: ${(lastError as Error)?.message || 'Unknown error'}`,
      'INIT_FAILED',
      { originalError: lastError }
    );
  }

  private async verifyDatabaseAccess(): Promise<void> {
    if (!this.db) throw new Error('Database not opened');

    // Test basic database operations
    await this.db.execAsync('SELECT 1');
    logger.info('Database access verified');
  }

  private async createTablesWithVerification(): Promise<void> {
    if (!this.db) throw new Error('Database not opened');

    try {
      logger.info('Starting table creation process...');

      // Create tables
      await createTables(this.db);
      logger.info('Tables created successfully');

      // Verify critical tables exist
      await this.verifyCriticalTables();
      logger.info('Critical tables verified successfully');

      logger.info('Tables created and verified successfully');
    } catch (error) {
      logger.error('Failed to create tables:', {
        error: error,
        errorType: typeof error,
        errorConstructor: (error as Error)?.constructor?.name,
        errorMessage: (error as Error)?.message || 'No message',
        errorStack: (error as Error)?.stack || 'No stack',
        errorCode: (error as Error & { code?: string })?.code || 'No code',
        // Remove the problematic JSON.stringify that was causing empty objects
        // errorStringified: JSON.stringify(
        //   error,
        //   Object.getOwnPropertyNames(error || {})
        // ),
      });

      // Try to get database state information
      try {
        if (this.db) {
          // Check what tables exist
          const existingTables = await this.db.getAllAsync<{ name: string }>(
            "SELECT name FROM sqlite_master WHERE type='table'"
          );
          logger.error('Existing tables in database:', {
            tables: existingTables.map(t => t.name),
          });

          // Check database integrity
          const integrityResult = await this.db.getAllAsync(
            'PRAGMA integrity_check'
          );
          logger.error('Database integrity check:', integrityResult);

          // Check foreign key status
          const foreignKeysResult = await this.db.getFirstAsync<{
            foreign_keys: number;
          }>('PRAGMA foreign_keys');
          logger.error('Foreign keys status:', foreignKeysResult);
        }
      } catch (debugError) {
        logger.error('Failed to get debug information:', debugError);
      }

      throw error;
    }
  }

  private async verifyCriticalTables(): Promise<void> {
    if (!this.db) throw new Error('Database not opened');

    const criticalTables = ['sync_metadata', 'books', 'chapters', 'verses'];

    for (const tableName of criticalTables) {
      try {
        const result = await this.db.getFirstAsync<{ name: string }>(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [tableName]
        );

        if (!result) {
          throw new Error(`Critical table '${tableName}' was not created`);
        }
      } catch (error) {
        throw new Error(`Failed to verify table '${tableName}': ${error}`);
      }
    }
  }

  private async finalVerification(): Promise<void> {
    this.updateProgress({
      stage: 'verifying',
      message: 'Performing final verification...',
      progress: 95,
    });

    try {
      // Verify critical tables exist and are accessible
      await this.verifyCriticalTables();

      // Validate media_files_verses schema specifically
      await this.validateMediaFilesVersesSchema();

      this.updateProgress({
        stage: 'complete',
        message: 'Database initialization complete',
        progress: 100,
      });

      logger.info('Database initialization completed successfully');
    } catch (error) {
      this.updateProgress({
        stage: 'error',
        message: `Final verification failed: ${(error as Error).message}`,
        progress: 95,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async performMigrations(): Promise<void> {
    if (!this.db) return;

    // Get current database version
    let currentVersion = 1;
    try {
      const result = await this.db.getFirstAsync<{ user_version: number }>(
        'PRAGMA user_version'
      );
      currentVersion = result?.user_version || 1;
    } catch {
      logger.info(
        'No previous database version found, starting from version 1'
      );
    }

    logger.info(
      `Current database version: ${currentVersion}, target version: ${CURRENT_DATABASE_VERSION}`
    );

    // Perform migrations
    if (currentVersion < 2) {
      await this.migrateToVersion2();
      currentVersion = 2;
    }

    if (currentVersion < 3) {
      await this.migrateToVersion3();
      currentVersion = 3;
    }

    if (currentVersion < 4) {
      await this.migrateToVersion4();
      currentVersion = 4;
    }

    if (currentVersion < 5) {
      await this.migrateToVersion5();
      currentVersion = 5;
    }

    // Update database version
    await this.db.execAsync(
      `PRAGMA user_version = ${CURRENT_DATABASE_VERSION}`
    );
  }

  private async migrateToVersion2(): Promise<void> {
    if (!this.db) return;

    logger.info(
      'Migrating database to version 2: Adding last_version_check column'
    );

    try {
      // First check if the sync_metadata table exists
      const tableExists = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='sync_metadata'`
      );

      if (!tableExists || tableExists.count === 0) {
        logger.info(
          'sync_metadata table does not exist yet, skipping migration to version 2'
        );
        return;
      }

      // Check if the column already exists
      const tableInfo = await this.db.getAllAsync(
        'PRAGMA table_info(sync_metadata)'
      );
      const hasLastVersionCheck = tableInfo.some(
        (col: unknown) =>
          (col as { name: string }).name === 'last_version_check'
      );

      if (!hasLastVersionCheck) {
        await this.db.execAsync(
          'ALTER TABLE sync_metadata ADD COLUMN last_version_check TEXT'
        );
        logger.info(
          'Successfully added last_version_check column to sync_metadata table'
        );
      } else {
        logger.info(
          'last_version_check column already exists in sync_metadata table'
        );
      }
    } catch (error) {
      logger.error('Error during migration to version 2:', error);
      // Don't throw error, just log it and continue
      // The table creation will handle this properly
    }
  }

  private async migrateToVersion3(): Promise<void> {
    if (!this.db) return;

    logger.info('Migrating database to version 3: Adding availability columns');

    try {
      // Check if language_entities_cache table exists
      const languageTableExists = await this.db.getFirstAsync<{
        count: number;
      }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='language_entities_cache'`
      );

      if (languageTableExists && languageTableExists.count > 0) {
        // Add availability columns to language_entities_cache table
        const languageTableInfo = await this.db.getAllAsync(
          'PRAGMA table_info(language_entities_cache)'
        );

        const hasAvailableVersions = languageTableInfo.some(
          (col: unknown) =>
            (col as { name: string }).name === 'has_available_versions'
        );

        if (!hasAvailableVersions) {
          await this.db.execAsync(
            'ALTER TABLE language_entities_cache ADD COLUMN has_available_versions BOOLEAN DEFAULT 0'
          );
          await this.db.execAsync(
            'ALTER TABLE language_entities_cache ADD COLUMN audio_versions_count INTEGER DEFAULT 0'
          );
          await this.db.execAsync(
            'ALTER TABLE language_entities_cache ADD COLUMN text_versions_count INTEGER DEFAULT 0'
          );
          await this.db.execAsync(
            'ALTER TABLE language_entities_cache ADD COLUMN last_availability_check TEXT DEFAULT CURRENT_TIMESTAMP'
          );
          logger.info(
            'Added availability columns to language_entities_cache table'
          );
        }
      } else {
        logger.info(
          'language_entities_cache table does not exist yet, skipping migration for this table'
        );
      }

      // Check if available_versions_cache table exists
      const versionsTableExists = await this.db.getFirstAsync<{
        count: number;
      }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='available_versions_cache'`
      );

      if (versionsTableExists && versionsTableExists.count > 0) {
        // Add availability columns to available_versions_cache table
        const versionsTableInfo = await this.db.getAllAsync(
          'PRAGMA table_info(available_versions_cache)'
        );

        const hasIsAvailable = versionsTableInfo.some(
          (col: unknown) => (col as { name: string }).name === 'is_available'
        );

        if (!hasIsAvailable) {
          await this.db.execAsync(
            'ALTER TABLE available_versions_cache ADD COLUMN is_available BOOLEAN DEFAULT 0'
          );
          await this.db.execAsync(
            'ALTER TABLE available_versions_cache ADD COLUMN published_content_count INTEGER DEFAULT 0'
          );
          await this.db.execAsync(
            'ALTER TABLE available_versions_cache ADD COLUMN last_availability_check TEXT DEFAULT CURRENT_TIMESTAMP'
          );
          logger.info(
            'Added availability columns to available_versions_cache table'
          );
        }
      } else {
        logger.info(
          'available_versions_cache table does not exist yet, skipping migration for this table'
        );
      }

      logger.info('Successfully migrated to version 3');
    } catch (error) {
      logger.error('Error during migration to version 3:', error);
      throw error;
    }
  }

  private async migrateToVersion4(): Promise<void> {
    if (!this.db) return;

    logger.info(
      'Migrating database to version 4: Making testament field nullable'
    );

    try {
      // Check if books table exists
      const booksTableExists = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='books'`
      );

      if (booksTableExists && booksTableExists.count > 0) {
        // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
        logger.info('Recreating books table with nullable testament field...');

        // Create a temporary table with the new structure
        await this.db.execAsync(`
          CREATE TABLE books_temp (
            id TEXT PRIMARY KEY,
            book_number INTEGER NOT NULL,
            name TEXT NOT NULL,
            testament TEXT,
            chapters INTEGER NOT NULL,
            global_order INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            synced_at TEXT DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Copy data from the old table to the new table
        await this.db.execAsync(`
          INSERT INTO books_temp (id, book_number, name, testament, chapters, global_order, created_at, updated_at, synced_at)
          SELECT id, book_number, name, testament, chapters, global_order, created_at, updated_at, synced_at
          FROM books
        `);

        // Drop the old table
        await this.db.execAsync('DROP TABLE books');

        // Rename the temp table to the original name
        await this.db.execAsync('ALTER TABLE books_temp RENAME TO books');

        // Recreate indexes
        await this.db.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_books_testament ON books(testament)'
        );
        await this.db.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_books_global_order ON books(global_order)'
        );
        await this.db.execAsync(
          'CREATE INDEX IF NOT EXISTS idx_books_updated_at ON books(updated_at)'
        );

        logger.info(
          'Successfully made testament field nullable in books table'
        );
      } else {
        logger.info('Books table does not exist yet, skipping migration');
      }

      logger.info('Successfully migrated to version 4');
    } catch (error) {
      logger.error('Error during migration to version 4:', error);
      throw error;
    }
  }

  private async migrateToVersion5(): Promise<void> {
    try {
      this.updateProgress({
        stage: 'migrating',
        message: 'Migrating to version 5: Language entities cache improvements',
        progress: 80,
      });

      // Check if language_entities_cache table exists
      const tableExists = await this.db!.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='language_entities_cache'"
      );

      if (tableExists && tableExists.count > 0) {
        // Fix foreign key constraint issues
        await this.fixLanguageEntitiesCacheConstraints();
      }

      await this.db!.execAsync('PRAGMA user_version = 5');
      logger.info('Migration to version 5 completed successfully');
    } catch (error) {
      logger.error('Migration to version 5 failed:', error);
      throw error;
    }
  }

  private async fixLanguageEntitiesCacheConstraints(): Promise<void> {
    try {
      logger.info('Fixing language entities cache foreign key constraints...');

      // Step 1: Find orphaned records (records with parent_id that doesn't exist)
      const orphanedRecords = await this.db!.getAllAsync<{
        id: string;
        parent_id: string;
      }>(
        `SELECT id, parent_id FROM language_entities_cache 
         WHERE parent_id IS NOT NULL 
         AND parent_id NOT IN (SELECT id FROM language_entities_cache)`
      );

      if (orphanedRecords.length > 0) {
        logger.warn(
          `Found ${orphanedRecords.length} orphaned language entity records, setting parent_id to NULL`
        );

        // Step 2: Set parent_id to NULL for orphaned records
        const orphanedIds = orphanedRecords.map(r => r.id);
        const placeholders = orphanedIds.map(() => '?').join(',');

        await this.db!.runAsync(
          `UPDATE language_entities_cache 
           SET parent_id = NULL, updated_at = CURRENT_TIMESTAMP 
           WHERE id IN (${placeholders})`,
          orphanedIds
        );
      }

      // Step 3: Drop and recreate the foreign key constraint with ON DELETE SET NULL
      await this.db!.runAsync('PRAGMA foreign_keys = OFF');

      // Create temporary table with new schema
      await this.db!.runAsync(`
        CREATE TABLE language_entities_cache_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          level TEXT NOT NULL,
          parent_id TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          synced_at TEXT DEFAULT CURRENT_TIMESTAMP,
          has_available_versions BOOLEAN DEFAULT 0,
          audio_versions_count INTEGER DEFAULT 0,
          text_versions_count INTEGER DEFAULT 0,
          last_availability_check TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES language_entities_cache_new (id) ON DELETE SET NULL
        )
      `);

      // Copy data to new table
      await this.db!.runAsync(`
        INSERT INTO language_entities_cache_new 
        SELECT * FROM language_entities_cache
      `);

      // Drop old table and rename new one
      await this.db!.runAsync('DROP TABLE language_entities_cache');
      await this.db!.runAsync(
        'ALTER TABLE language_entities_cache_new RENAME TO language_entities_cache'
      );

      await this.db!.runAsync('PRAGMA foreign_keys = ON');

      logger.info(
        'Language entities cache foreign key constraints fixed successfully'
      );
    } catch (error) {
      logger.error('Failed to fix language entities cache constraints:', error);
      throw error;
    }
  }

  /**
   * Validate media_files_verses table schema
   */
  private async validateMediaFilesVersesSchema(): Promise<void> {
    if (!this.db) return;

    try {
      const tableInfo = await this.db.getAllAsync<{ sql: string }>(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='media_files_verses'"
      );

      if (tableInfo && tableInfo.length > 0 && tableInfo[0]) {
        const tableSql = tableInfo[0].sql;

        // Check if start_time_seconds is REAL (not INTEGER)
        if (tableSql.includes('start_time_seconds INTEGER')) {
          logger.warn(
            'media_files_verses table has INTEGER start_time_seconds, should be REAL'
          );
          // Trigger migration to version 5
          await this.migrateToVersion5();
        } else if (tableSql.includes('start_time_seconds REAL')) {
          logger.info(
            'media_files_verses table has correct REAL start_time_seconds column'
          );
        } else {
          logger.warn(
            'Could not determine start_time_seconds column type in media_files_verses table'
          );
        }
      }
    } catch (error) {
      logger.error('Error validating media_files_verses schema:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get database instance, ensuring initialization is complete
   * Automatically initializes if needed
   */
  async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    await this.ensureInitialized();

    if (!this.db) {
      throw new DatabaseError(
        'Database instance is null after initialization',
        'NULL_DB_INSTANCE'
      );
    }

    return this.db;
  }

  /**
   * Synchronous getter for when you know DB is initialized
   * Throws if not initialized - use getDatabase() for auto-init
   */
  getDatabaseSync(): SQLite.SQLiteDatabase {
    if (!this.db || this.state !== DatabaseState.INITIALIZED) {
      throw new DatabaseError(
        'Database not initialized. Call initialize() first or use getDatabase()',
        'NOT_INITIALIZED'
      );
    }
    return this.db;
  }

  /**
   * Ensure database is initialized, with automatic initialization
   */
  async ensureInitialized(): Promise<void> {
    if (this.state !== DatabaseState.INITIALIZED) {
      await this.initialize();
    }
  }

  get initialized(): boolean {
    return this.state === DatabaseState.INITIALIZED;
  }

  get isInitializing(): boolean {
    return this.state === DatabaseState.INITIALIZING;
  }

  get hasError(): boolean {
    return this.state === DatabaseState.ERROR;
  }

  get currentState(): DatabaseState {
    return this.state;
  }

  /**
   * Check if database is ready for use
   */
  isReady(): boolean {
    return this.state === DatabaseState.INITIALIZED && this.db !== null;
  }

  /**
   * Wait for database to be ready, with timeout
   */
  async waitForReady(timeoutMs: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (!this.isReady() && Date.now() - startTime < timeoutMs) {
      if (this.state === DatabaseState.ERROR) {
        throw (
          this.initializationError ||
          new DatabaseError('Database initialization failed', 'INIT_FAILED')
        );
      }

      if (this.state === DatabaseState.UNINITIALIZED) {
        await this.initialize();
        return;
      }

      // Wait a bit if initializing
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!this.isReady()) {
      throw new DatabaseError(
        `Database not ready after ${timeoutMs}ms timeout`,
        'TIMEOUT'
      );
    }
  }

  async reset(): Promise<void> {
    await this.ensureInitialized();

    if (!this.db) return;

    try {
      await dropTables(this.db);
      await createTables(this.db);
      await this.db.execAsync(
        `PRAGMA user_version = ${CURRENT_DATABASE_VERSION}`
      );
      logger.info('Database reset successfully');
    } catch (error) {
      logger.error('Failed to reset database:', error);
      throw new DatabaseError('Database reset failed', 'RESET_FAILED', {
        originalError: error,
      });
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
    }
    this.state = DatabaseState.UNINITIALIZED;
    this.initializationPromise = null;
    this.initializationError = null;
  }

  // Enhanced query methods with automatic initialization
  async executeQuery<T = Record<string, unknown>>(
    query: string,
    params?: SQLiteBindParams
  ): Promise<T[]> {
    const db = await this.getDatabase();
    try {
      const result = await db.getAllAsync<T>(query, params || []);
      return result;
    } catch (error) {
      throw new DatabaseError(
        `Query execution failed: ${query}`,
        'QUERY_FAILED',
        { query, params, originalError: error }
      );
    }
  }

  async executeSingleQuery<T = Record<string, unknown>>(
    query: string,
    params: SQLiteBindParams = []
  ): Promise<T | null> {
    const db = await this.getDatabase();
    return db.getFirstAsync<T>(query, params);
  }

  async executeRaw(
    query: string,
    params?: SQLiteBindParams
  ): Promise<SQLite.SQLiteRunResult> {
    const db = await this.getDatabase();
    try {
      const result = await db.runAsync(query, params || []);
      return result;
    } catch (error) {
      throw new DatabaseError(
        `Raw query execution failed: ${query}`,
        'RAW_QUERY_FAILED',
        { query, params, originalError: error }
      );
    }
  }

  async execSingle(query: string, params?: SQLiteBindParams): Promise<void> {
    const db = await this.getDatabase();
    try {
      await db.runAsync(query, params || []);
    } catch (error) {
      throw new DatabaseError(
        `Single query execution failed: ${query}`,
        'SINGLE_QUERY_FAILED',
        { query, params, originalError: error }
      );
    }
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    const db = await this.getDatabase();
    try {
      await db.withTransactionAsync(fn);
    } catch (error) {
      throw new DatabaseError('Transaction failed', 'TRANSACTION_FAILED', {
        originalError: error,
      });
    }
  }
}

export default DatabaseManager;
export { DatabaseState };
