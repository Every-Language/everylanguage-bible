// Core Database Service
export { databaseService, DatabaseService } from './database';

// Schema and Types
export * from './schema';

// Repositories
export { BibleRepository } from './repositories/bibleRepository';

// Seed Data
export { GenesisSeedData } from './seeds/genesis';

// Initialize Database (call this in app startup)
export async function initializeDatabase() {
  const { databaseService } = await import('./database');
  await databaseService.initialize();
}
