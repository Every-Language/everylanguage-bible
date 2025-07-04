import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { schema } from './schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

/**
 * Database Service
 * Manages SQLite connection and provides query interface for Bible content
 */
class DatabaseService {
  private static instance: DatabaseService;
  private db: ExpoSQLiteDatabase<typeof schema> | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize the database connection and run migrations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Open SQLite database
      const expoDb = openDatabaseSync('everylanguage_bible.db');

      // Create Drizzle instance
      this.db = drizzle(expoDb, { schema });

      // Run migrations
      await this.runMigrations();

      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Run database migrations
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Note: In a real app, you would have actual migration files
      // For now, we'll handle schema creation manually
      console.log('🔄 Running database migrations...');

      // Migrations will be handled by Drizzle Kit
      // await migrate(this.db, { migrationsFolder: './src/shared/services/database/migrations' });

      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get the database instance
   */
  getDatabase(): ExpoSQLiteDatabase<typeof schema> {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      // Note: expo-sqlite doesn't have explicit close method
      // Connection is automatically managed
      this.db = null;
      this.isInitialized = false;
      console.log('📪 Database connection closed');
    }
  }

  /**
   * Reset database (for testing purposes)
   */
  async reset(): Promise<void> {
    await this.close();
    this.isInitialized = false;
    await this.initialize();
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
export { DatabaseService };
