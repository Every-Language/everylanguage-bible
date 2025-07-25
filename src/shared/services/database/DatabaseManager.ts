import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, createTables, dropTables } from './schema';

const CURRENT_DATABASE_VERSION = 4; // Increment when schema changes

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

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private state: DatabaseState = DatabaseState.UNINITIALIZED;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
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
    try {
      this.state = DatabaseState.INITIALIZING;
      this.initializationError = null;

      console.log('Initializing database...');

      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await createTables(this.db);
      await this.performMigrations();

      this.state = DatabaseState.INITIALIZED;
      console.log('Database initialized successfully');
    } catch (error) {
      this.state = DatabaseState.ERROR;
      this.initializationError =
        error instanceof Error ? error : new Error(String(error));

      console.error('Failed to initialize database:', error);

      // Clean up on failure
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (closeError) {
          console.error(
            'Failed to close database after initialization error:',
            closeError
          );
        }
        this.db = null;
      }

      throw new DatabaseError('Database initialization failed', 'INIT_FAILED', {
        originalError: error,
      });
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
    } catch (error) {
      console.log(
        'No previous database version found, starting from version 1:',
        error
      );
    }

    console.log(
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

    // Update database version
    await this.db.execAsync(
      `PRAGMA user_version = ${CURRENT_DATABASE_VERSION}`
    );
  }

  private async migrateToVersion2(): Promise<void> {
    if (!this.db) return;

    console.log(
      'Migrating database to version 2: Adding last_version_check column'
    );

    try {
      // First check if the sync_metadata table exists
      const tableExists = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='sync_metadata'`
      );

      if (!tableExists || tableExists.count === 0) {
        console.log(
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
        console.log(
          'Successfully added last_version_check column to sync_metadata table'
        );
      } else {
        console.log(
          'last_version_check column already exists in sync_metadata table'
        );
      }
    } catch (error) {
      console.error('Error during migration to version 2:', error);
      throw error;
    }
  }

  private async migrateToVersion3(): Promise<void> {
    if (!this.db) return;

    console.log('Migrating database to version 3: Adding availability columns');

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
          console.log(
            'Added availability columns to language_entities_cache table'
          );
        }
      } else {
        console.log(
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
          console.log(
            'Added availability columns to available_versions_cache table'
          );
        }
      } else {
        console.log(
          'available_versions_cache table does not exist yet, skipping migration for this table'
        );
      }

      console.log('Successfully migrated to version 3');
    } catch (error) {
      console.error('Error during migration to version 3:', error);
      throw error;
    }
  }

  private async migrateToVersion4(): Promise<void> {
    if (!this.db) return;

    console.log(
      'Migrating database to version 4: Making testament field nullable'
    );

    try {
      // Check if books table exists
      const booksTableExists = await this.db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='books'`
      );

      if (booksTableExists && booksTableExists.count > 0) {
        // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
        console.log('Recreating books table with nullable testament field...');

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

        console.log(
          'Successfully made testament field nullable in books table'
        );
      } else {
        console.log('Books table does not exist yet, skipping migration');
      }

      console.log('Successfully migrated to version 4');
    } catch (error) {
      console.error('Error during migration to version 4:', error);
      throw error;
    }
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
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Failed to reset database:', error);
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
