import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, createTables, dropTables } from './schema';

const CURRENT_DATABASE_VERSION = 2; // Increment when schema changes

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      console.log('Initializing database...');

      // Open the database
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      // Check current version and perform migrations if needed
      await this.performMigrations();

      // Create tables and schema
      await createTables(this.db);

      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
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

  async executeQuery<T = any>(query: string, params?: any[]): Promise<T[]> {
    const db = this.getDatabase();
    const result = await db.getAllAsync<T>(query, params || []);
    return result;
  }

  async executeRaw(query: string, params?: any[]): Promise<any> {
    const db = this.getDatabase();
    const result = await db.runAsync(query, params || []);
    return result;
  }

  async execSingle(query: string, params?: any[]): Promise<void> {
    const db = this.getDatabase();
    await db.runAsync(query, params || []);
  }

  async transaction(fn: () => Promise<void>): Promise<void> {
    const db = this.getDatabase();
    await db.withTransactionAsync(fn);
  }
}

export default DatabaseManager;
