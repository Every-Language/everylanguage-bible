import { syncService } from '../SyncService';

// Mock the dependencies
jest.mock('../DatabaseManager', () => ({
  databaseManager: {
    initialized: true,
    isReady: jest.fn(() => true),
    executeQuery: jest.fn(),
    execSingle: jest.fn(),
    transaction: jest.fn(),
    getDatabase: jest.fn(() => ({
      runAsync: jest.fn(),
    })),
  },
}));

jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock shared types
jest.mock('@everylanguage/shared-types', () => ({
  Tables: {},
}));

describe('SyncService', () => {
  let mockDatabaseManager: any;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the mock implementations
    mockDatabaseManager =
      jest.requireMock('../DatabaseManager').databaseManager;
    mockSupabase = jest.requireMock('../../api/supabase').supabase;

    // Default mock implementations
    mockDatabaseManager.initialized = true;
    mockDatabaseManager.isReady.mockReturnValue(true);
    mockDatabaseManager.executeQuery.mockResolvedValue([]);
    mockDatabaseManager.execSingle.mockResolvedValue(undefined);
    mockDatabaseManager.transaction.mockImplementation(
      async (callback: () => Promise<void>) => {
        await callback();
      }
    );
    mockDatabaseManager.getDatabase.mockReturnValue({
      runAsync: jest.fn().mockResolvedValue(undefined),
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = syncService;
      const instance2 = syncService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove sync listeners', () => {
      const mockListener = jest.fn();
      const unsubscribe = syncService.onSync(mockListener);

      expect(typeof unsubscribe).toBe('function');

      // Call unsubscribe
      unsubscribe();
    });
  });

  describe('Sync Orchestration', () => {
    it('should prevent concurrent syncs', async () => {
      // Mock successful sync responses
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      const mockEmptyQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockEmptyQuery);

      // Start first sync (don't await)
      const firstSync = syncService.syncAll();

      // Try to start second sync immediately
      await expect(syncService.syncAll()).rejects.toThrow(
        'Sync is already in progress'
      );

      // Wait for first sync to complete
      await firstSync;
    });

    it('should sync both books and chapters successfully', async () => {
      // Mock last sync queries
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      // Create a mock query builder that returns sample data
      const mockBooksQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'book-1',
              book_number: 1,
              name: 'Genesis',
              global_order: 1,
              created_at: '2023-01-01T00:00:00.000Z',
              updated_at: '2023-01-02T00:00:00.000Z',
            },
          ],
          error: null,
        }),
      };

      const mockChaptersQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'chapter-1',
              book_id: 'book-1',
              chapter_number: 1,
              total_verses: 31,
              global_order: 1,
              created_at: '2023-01-01T00:00:00.000Z',
              updated_at: '2023-01-02T00:00:00.000Z',
            },
          ],
          error: null,
        }),
      };

      // Mock the from() calls to return different query builders for books vs chapters
      mockSupabase.from
        .mockReturnValueOnce(mockBooksQuery) // First call for books
        .mockReturnValueOnce(mockChaptersQuery); // Second call for chapters

      const results = await syncService.syncAll();

      expect(results).toHaveLength(2);
      expect(results[0]?.tableName).toBe('books');
      expect(results[0]?.success).toBe(true);
      expect(results[0]?.recordsSynced).toBe(1);
      expect(results[1]?.tableName).toBe('chapters');
      expect(results[1]?.success).toBe(true);
      expect(results[1]?.recordsSynced).toBe(1);
    });

    it('should handle sync errors gracefully', async () => {
      // Mock database not ready
      mockDatabaseManager.isReady.mockReturnValue(false);

      try {
        await syncService.syncAll();
      } catch {
        // Expected to fail
      }

      expect(syncService.isSyncInProgress()).toBe(false);
    });

    it('should notify listeners of sync results', async () => {
      const mockListener = jest.fn();
      const unsubscribe = syncService.onSync(mockListener);

      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      const mockEmptyQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockEmptyQuery);

      await syncService.syncAll();

      expect(mockListener).toHaveBeenCalledTimes(2); // Once for books, once for chapters

      unsubscribe();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors with retry', async () => {
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      // Mock auth error followed by successful retry
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'JWT expired' },
          })
          .mockResolvedValueOnce({
            data: [
              {
                id: 'book-1',
                book_number: 1,
                name: 'Genesis',
                global_order: 1,
                created_at: '2023-01-01T00:00:00.000Z',
                updated_at: '2023-01-02T00:00:00.000Z',
              },
            ],
            error: null,
          }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const results = await syncService.syncAll();

      expect(results[0]?.success).toBe(true);
      expect(results[0]?.recordsSynced).toBe(1);
    });

    it('should handle non-auth errors', async () => {
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Network error' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const results = await syncService.syncAll();

      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toContain('Network error');
    });
  });

  describe('Sync Metadata Management', () => {
    it('should get last sync timestamp', async () => {
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      const lastSync = await syncService.getLastSync('books');
      expect(lastSync).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should return default timestamp when no sync metadata exists', async () => {
      mockDatabaseManager.executeQuery.mockResolvedValue([]);

      const lastSync = await syncService.getLastSync('books');
      expect(lastSync).toBe('1970-01-01T00:00:00.000Z');
    });

    it('should get sync metadata for all tables', async () => {
      const mockMetadata = [
        {
          table_name: 'books',
          last_sync: '2023-01-01T00:00:00.000Z',
          sync_status: 'idle',
        },
      ];

      mockDatabaseManager.executeQuery.mockResolvedValue(mockMetadata);

      const metadata = await syncService.getSyncMetadata();
      expect(metadata).toEqual(mockMetadata);
    });

    it('should get sync metadata for specific table', async () => {
      const mockMetadata = [
        {
          table_name: 'books',
          last_sync: '2023-01-01T00:00:00.000Z',
          sync_status: 'idle',
        },
      ];

      mockDatabaseManager.executeQuery.mockResolvedValue(mockMetadata);

      const metadata = await syncService.getSyncMetadata('books');
      expect(metadata).toEqual(mockMetadata);
    });
  });

  describe('Remote Changes Detection', () => {
    it('should detect remote changes when they exist', async () => {
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'some-change' }],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const hasChanges = await syncService.hasRemoteChanges('books');
      expect(hasChanges).toBe(true);
    });

    it('should return false when no remote changes exist', async () => {
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const hasChanges = await syncService.hasRemoteChanges('books');
      expect(hasChanges).toBe(false);
    });

    it('should get remote changes summary for multiple tables', async () => {
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '2023-01-01T00:00:00.000Z' },
      ]);

      // Mock changes for books but not chapters
      const mockQueryWithChanges = {
        select: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [{ id: 'some-change' }],
          error: null,
        }),
      };

      const mockQueryNoChanges = {
        select: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockQueryWithChanges) // books
        .mockReturnValueOnce(mockQueryNoChanges); // chapters (if tested)

      const summary = await syncService.getRemoteChangesSummary(['books']);
      expect(summary['books']).toBe(true);
    });
  });

  describe('Force Operations', () => {
    it('should force full sync by resetting timestamp', async () => {
      mockDatabaseManager.executeQuery
        .mockResolvedValueOnce([]) // updateLastSync
        .mockResolvedValueOnce([{ last_sync: '1970-01-01T00:00:00.000Z' }]); // getLastSync

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await syncService.forceFullSync('books');
      expect(result.success).toBe(true);
      expect(result.tableName).toBe('books');
    });

    it('should clear local data', async () => {
      await syncService.clearLocalData('books');

      expect(mockDatabaseManager.executeQuery).toHaveBeenCalledWith(
        'DELETE FROM books'
      );
    });

    it('should reset sync metadata for a specific table', async () => {
      const mockDb = { runAsync: jest.fn().mockResolvedValue(undefined) };
      mockDatabaseManager.getDatabase.mockReturnValue(mockDb);

      // Mock the verification query
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '1970-01-01T00:00:00.000Z' },
      ]);

      await syncService.resetSyncMetadata('books');

      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO sync_metadata'),
        expect.arrayContaining(['books', '1970-01-01T00:00:00.000Z'])
      );
    });

    it('should reset all sync metadata', async () => {
      const mockDb = { runAsync: jest.fn().mockResolvedValue(undefined) };
      mockDatabaseManager.getDatabase.mockReturnValue(mockDb);

      // Mock the verification queries
      mockDatabaseManager.executeQuery.mockResolvedValue([
        { last_sync: '1970-01-01T00:00:00.000Z' },
      ]);

      await syncService.resetAllSyncMetadata();

      expect(mockDb.runAsync).toHaveBeenCalledTimes(2); // books + chapters
    });
  });

  describe('Status Checking', () => {
    it('should report sync in progress status', async () => {
      expect(syncService.isSyncInProgress()).toBe(false);

      // Mock a long-running sync
      mockDatabaseManager.executeQuery.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve([]), 100))
      );

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      // Start sync but don't await
      const syncPromise = syncService.syncAll();

      // Check status during sync
      expect(syncService.isSyncInProgress()).toBe(true);

      // Wait for sync to complete
      await syncPromise;

      expect(syncService.isSyncInProgress()).toBe(false);
    });
  });

  describe('Error Cases', () => {
    it('should handle database not initialized', async () => {
      mockDatabaseManager.initialized = false;

      const lastSync = await syncService.getLastSync('books');
      expect(lastSync).toBe('1970-01-01T00:00:00.000Z');
    });

    it('should handle unknown table in forceFullSync', async () => {
      await expect(syncService.forceFullSync('unknown_table')).rejects.toThrow(
        'Unknown table: unknown_table'
      );
    });

    it('should handle unknown table in clearLocalData', async () => {
      await expect(syncService.clearLocalData('unknown_table')).rejects.toThrow(
        'Unknown table: unknown_table'
      );
    });
  });
});
