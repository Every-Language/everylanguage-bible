// Mock Database Services for Jest Testing
export { databaseService } from './database';
export { BibleRepository } from './repositories/bibleRepository';

// Mock Seed Data
export class GenesisSeedData {
  async seedGenesis(): Promise<void> {
    // Mock implementation - no actual database operations
  }

  async clearGenesisSeedData(): Promise<void> {
    // Mock implementation - no actual database operations
  }
}

// Mock initialization function
export async function initializeDatabase() {
  // Mock implementation - no actual database operations
}
