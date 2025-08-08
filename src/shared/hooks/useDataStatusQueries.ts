import { useQuery } from '@tanstack/react-query';
import { localDataService } from '../services/database/LocalDataService';
import { useSync } from './useSyncFromStore';

// Data Status Query Keys
export const dataStatusQueryKeys = {
  all: ['data-status'] as const,
  availability: () => [...dataStatusQueryKeys.all, 'availability'] as const,
  counts: () => [...dataStatusQueryKeys.all, 'counts'] as const,
  health: () => [...dataStatusQueryKeys.all, 'health'] as const,
  lastSync: () => [...dataStatusQueryKeys.all, 'last-sync'] as const,
} as const;

/**
 * Hook to check if data is available in the database
 */
export const useDataAvailabilityQuery = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: dataStatusQueryKeys.availability(),
    queryFn: async () => {
      const hasData = await localDataService.isDataAvailable();
      return hasData;
    },
    enabled: isInitialized,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, _error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

/**
 * Hook to get data counts for all tables
 */
export const useDataCountsQuery = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: dataStatusQueryKeys.counts(),
    queryFn: async () => {
      const [booksCount, chaptersCount, versesCount] = await Promise.all([
        localDataService.getBooksCount(),
        localDataService.getChaptersCount(),
        localDataService.getVersesCount(),
      ]);

      return {
        booksCount,
        chaptersCount,
        versesCount,
        hasData: booksCount > 0 && chaptersCount > 0 && versesCount > 0,
      };
    },
    enabled: isInitialized,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};

/**
 * Hook to get database health status
 */
export const useDatabaseHealthQuery = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: dataStatusQueryKeys.health(),
    queryFn: async () => {
      const [booksCount, chaptersCount, versesCount] = await Promise.all([
        localDataService.getBooksCount(),
        localDataService.getChaptersCount(),
        localDataService.getVersesCount(),
      ]);

      const hasData = booksCount > 0 && chaptersCount > 0 && versesCount > 0;

      return {
        isHealthy: hasData,
        booksCount,
        chaptersCount,
        versesCount,
        missingTables: [
          ...(booksCount === 0 ? ['books'] : []),
          ...(chaptersCount === 0 ? ['chapters'] : []),
          ...(versesCount === 0 ? ['verses'] : []),
        ],
      };
    },
    enabled: isInitialized,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

/**
 * Hook to get last sync timestamp
 */
export const useLastSyncQuery = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: dataStatusQueryKeys.lastSync(),
    queryFn: async () => {
      const lastSync = await localDataService.getLastSyncedAt();
      return lastSync;
    },
    enabled: isInitialized,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, _error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

/**
 * Hook to get language tables data counts
 */
export const useLanguageTablesCountsQuery = () => {
  const { isInitialized } = useSync();

  return useQuery({
    queryKey: [...dataStatusQueryKeys.all, 'language-tables'],
    queryFn: async () => {
      const DatabaseManager = await import(
        '../services/database/DatabaseManager'
      );
      const databaseManager = DatabaseManager.default.getInstance();

      const [
        languageEntitiesResult,
        availableVersionsResult,
        userSavedVersionsResult,
      ] = await Promise.all([
        // Language entities cache removed - using server-side fuzzy search instead
        Promise.resolve([{ count: 0 }]),
        // Available versions cache removed - using server-side fuzzy search instead
        Promise.resolve([{ count: 0 }]),
        databaseManager.executeQuery<{ count: number }>(
          'SELECT COUNT(*) as count FROM user_saved_versions'
        ),
      ]);

      return {
        languageEntitiesCount: languageEntitiesResult[0]?.count || 0,
        availableVersionsCount: availableVersionsResult[0]?.count || 0,
        userSavedVersionsCount: userSavedVersionsResult[0]?.count || 0,
      };
    },
    enabled: isInitialized,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 2) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};
