import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, createTables, dropTables } from './schema';
import { logger } from '../../utils/logger';

const CURRENT_DATABASE_VERSION = 5; // Increment when schema changes

// Enhanced error types for better error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
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
        logger.database(
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

        this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);

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

        logger.database('Database initialized successfully');
        return;
      } catch (error) {
        lastError = error as Error;
        logger.error(
          `Database initialization attempt ${attempt} failed:`,
          error
        );

        this.state = DatabaseState.ERROR;
        this.initializationError = lastError;

        this.updateProgress({
          stage: 'error',
          message: `Initialization failed: ${lastError.message}`,
          progress: 0,
          error: lastError.message,
        });

        if (attempt < this.maxRetries) {
          logger.database(`Retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }

    // All retries failed
    this.initializationPromise = null;
    throw new DatabaseError(
      `Database initialization failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      'INIT_FAILED',
      { originalError: lastError }
    );
  }

  private async verifyDatabaseAccess(): Promise<void> {
    if (!this.db) throw new Error('Database not opened');

    // Test basic database operations
    await this.db.execAsync('SELECT 1');
    logger.database('Database access verified');
  }

  private async createTablesWithVerification(): Promise<void> {
    if (!this.db) throw new Error('Database not opened');

    try {
      // Create tables
      await createTables(this.db);

      // Verify critical tables exist
      await this.verifyCriticalTables();

      logger.database('Tables created and verified successfully');
    } catch (error) {
      logger.error('Failed to create tables:', error);
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
    if (!this.db) throw new Error('Database not opened');

    // Test a simple query to ensure everything is working
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_metadata'
    );

    if (!result || result.count === undefined) {
      throw new Error('Final database verification failed');
    }

    logger.database('Final verification passed');
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
      logger.database(
        'No previous database version found, starting from version 1'
      );
    }

    logger.database(
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

    logger.database(
      'Migrating database to version 2: Adding last_version_check column'
    );

    try {
      // First check if the sync_metadata table exists
      const tableExists = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='sync_metadata'`
      );

      if (!tableExists || tableExists.count === 0) {
        logger.database(
          'sync_metadata table does not exist yet, skipping migration to version 2'
        );
        return;
      }

      // Check if the column already exists
      const tableInfo = await this.db.getAllAsync(
        'PRAGMA table_info(sync_metadata)'
      );
      const hasLastVersionCheck = tableInfo.some(
        (col: any) => col.name === 'last_version_check'
      );

      if (!hasLastVersionCheck) {
        await this.db.execAsync(
          'ALTER TABLE sync_metadata ADD COLUMN last_version_check TEXT'
        );
        logger.database(
          'Successfully added last_version_check column to sync_metadata table'
        );
      } else {
        logger.database(
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

    logger.database(
      'Migrating database to version 3: Adding availability columns'
    );

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
          (col: any) => col.name === 'has_available_versions'
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
          logger.database(
            'Added availability columns to language_entities_cache table'
          );
        }
      } else {
        logger.database(
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
          (col: any) => col.name === 'is_available'
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
          logger.database(
            'Added availability columns to available_versions_cache table'
          );
        }
      } else {
        logger.database(
          'available_versions_cache table does not exist yet, skipping migration for this table'
        );
      }

      logger.database('Successfully migrated to version 3');
    } catch (error) {
      logger.error('Error during migration to version 3:', error);
      throw error;
    }
  }

  private async migrateToVersion4(): Promise<void> {
    if (!this.db) return;

    logger.database(
      'Migrating database to version 4: Making testament field nullable'
    );

    try {
      // Check if books table exists
      const booksTableExists = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='books'`
      );

      if (booksTableExists && booksTableExists.count > 0) {
        // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
        logger.database(
          'Recreating books table with nullable testament field...'
        );

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

        logger.database(
          'Successfully made testament field nullable in books table'
        );
      } else {
        logger.database('Books table does not exist yet, skipping migration');
      }

      logger.database('Successfully migrated to version 4');
    } catch (error) {
      logger.error('Error during migration to version 4:', error);
      throw error;
    }
  }

  private async migrateToVersion5(): Promise<void> {
    if (!this.db) return;

    logger.database(
      'Migrating database to version 5: Updating media_files_verses table schema'
    );

    try {
      // Check if there's a schema mismatch by trying to access the table
      try {
        await this.db.execAsync('SELECT COUNT(*) FROM media_files_verses');
        logger.database('media_files_verses table exists and is accessible');
      } catch {
        logger.database(
          'media_files_verses table has schema issues, dropping and recreating'
        );

        // Drop the table if it exists
        await this.db.execAsync('DROP TABLE IF EXISTS media_files_verses');

        // Drop any existing indexes
        await this.db.execAsync(
          'DROP INDEX IF EXISTS idx_media_files_verses_media_file_id'
        );
        await this.db.execAsync(
          'DROP INDEX IF EXISTS idx_media_files_verses_verse_id'
        );
        await this.db.execAsync(
          'DROP INDEX IF EXISTS idx_media_files_verses_sequence_order'
        );
        await this.db.execAsync(
          'DROP INDEX IF EXISTS idx_media_files_verses_start_time_seconds'
        );
      }

      logger.database('Successfully migrated to version 5');
    } catch (error) {
      logger.error('Error during migration to version 5:', error);
      throw error;
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
      logger.database('Database reset successfully');
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
  async executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
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

  async executeSingleQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T | null> {
    const db = await this.getDatabase();
    return db.getFirstAsync<T>(query, params);
  }

  async executeRaw(query: string, params?: any[]): Promise<any> {
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

  async execSingle(query: string, params?: any[]): Promise<void> {
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
