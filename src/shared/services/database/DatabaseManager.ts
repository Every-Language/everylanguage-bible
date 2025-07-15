import * as SQLite from 'expo-sqlite';
import { DATABASE_NAME, createTables, dropTables } from './schema';

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

      // Create tables and schema
      await createTables(this.db);

      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
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

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    console.log('Resetting database...');
    await dropTables(this.db);
    await createTables(this.db);
    console.log('Database reset complete');
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

export const databaseManager = DatabaseManager.getInstance();
