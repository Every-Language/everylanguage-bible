/**
 * Mock Database Service for Jest Testing
 */
export class MockDatabaseService {
  private static instance: MockDatabaseService;
  private isInitialized = false;

  static getInstance(): MockDatabaseService {
    if (!MockDatabaseService.instance) {
      MockDatabaseService.instance = new MockDatabaseService();
    }
    return MockDatabaseService.instance;
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getDatabase() {
    const mockResult = Promise.resolve([]);
    return {
      insert: () => ({
        values: () => ({
          onConflictDoNothing: () => mockResult,
        }),
      }),
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => mockResult,
            orderBy: () => mockResult,
          }),
          orderBy: () => mockResult,
          limit: () => mockResult,
        }),
      }),
      delete: () => ({
        where: () => mockResult,
      }),
    };
  }

  async close(): Promise<void> {
    this.isInitialized = false;
  }
}

export const databaseService = MockDatabaseService.getInstance();
