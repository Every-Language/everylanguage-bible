import { backgroundSyncService } from '../BackgroundSyncService';

// Mock the dependencies
jest.mock('../SyncService', () => ({
  syncService: {
    syncAll: jest.fn(),
    getLastSync: jest.fn(),
  },
}));

jest.mock('../../api/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('expo-background-fetch', () => ({
  BackgroundFetchStatus: {
    Available: 1,
    Denied: 2,
    Restricted: 3,
  },
  BackgroundFetchResult: {
    NewData: 1,
    NoData: 2,
    Failed: 3,
  },
  getStatusAsync: jest.fn(),
  registerTaskAsync: jest.fn(),
  unregisterTaskAsync: jest.fn(),
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  getRegisteredTasksAsync: jest.fn(),
}));

describe('BackgroundSyncService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = backgroundSyncService;
      const instance2 = backgroundSyncService;
      expect(instance1).toBe(instance2);
    });
  });

  describe('checkForChanges', () => {
    it('should return false when no changes exist', async () => {
      const { supabase } = jest.requireMock('../../api/supabase');
      const { syncService } = jest.requireMock('../SyncService');

      syncService.getLastSync.mockResolvedValue('2023-01-01T00:00:00.000Z');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gt: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const hasChanges = await backgroundSyncService.checkForChanges();
      expect(hasChanges).toBe(false);
    });

    it('should return true when changes exist', async () => {
      const { supabase } = jest.requireMock('../../api/supabase');
      const { syncService } = jest.requireMock('../SyncService');

      syncService.getLastSync.mockResolvedValue('2023-01-01T00:00:00.000Z');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gt: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [{ id: '1' }],
              error: null,
            }),
          }),
        }),
      });

      const hasChanges = await backgroundSyncService.checkForChanges();
      expect(hasChanges).toBe(true);
    });

    it('should return false on error', async () => {
      const { supabase } = jest.requireMock('../../api/supabase');
      const { syncService } = jest.requireMock('../SyncService');

      syncService.getLastSync.mockResolvedValue('2023-01-01T00:00:00.000Z');
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          gt: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }),
        }),
      });

      const hasChanges = await backgroundSyncService.checkForChanges();
      expect(hasChanges).toBe(false);
    });
  });
});
