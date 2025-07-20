import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, createTables, dropTables } from './schema';

const CURRENT_DATABASE_VERSION = 2; // Increment when schema changes

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
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
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

  async initialize(): Promise<void> {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized && this.db) {
      return;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `Database initialization attempt ${attempt}/${this.maxRetries}`
        );

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

        this.isInitialized = true;

        this.updateProgress({
          stage: 'complete',
          message: 'Database ready!',
          progress: 100,
        });

        console.log('Database initialized successfully');
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `Database initialization attempt ${attempt} failed:`,
          error
        );

        this.updateProgress({
          stage: 'error',
          message: `Initialization failed: ${lastError.message}`,
          progress: 0,
          error: lastError.message,
        });

        if (attempt < this.maxRetries) {
          console.log(`Retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
          this.retryDelay *= 2; // Exponential backoff
        }
      }
    }

    // All retries failed
    this.initializationPromise = null;
    throw new Error(
      `Database initialization failed after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  private async verifyDatabaseAccess(): Promise<void> {
    if (!this.db) throw new Error('Database not opened');

    // Test basic database operations
    await this.db.execAsync('SELECT 1');
    console.log('Database access verified');
  }

  private async createTablesWithVerification(): Promise<void> {
    if (!this.db) throw new Error('Database not opened');

    try {
      // Create tables
      await createTables(this.db);

      // Verify critical tables exist
      await this.verifyCriticalTables();

      console.log('Tables created and verified successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
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

    console.log('Final verification passed');
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
      // First check if sync_metadata table exists
      const tableExists = await this.db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sync_metadata'"
      );

      if (!tableExists) {
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
      // Don't throw error, just log it and continue
      // The table creation will handle this properly
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }

  async reset(): Promise<void> {
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
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  async executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
    const db = this.getDatabase();
    return db.getAllAsync<T>(query, params);
  }

  async executeSingleQuery<T = any>(
    query: string,
    params: any[] = []
  ): Promise<T | null> {
    const db = this.getDatabase();
    return db.getFirstAsync<T>(query, params);
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    const db = this.getDatabase();
    await db.withTransactionAsync(fn);
  }
}

export default DatabaseManager;
