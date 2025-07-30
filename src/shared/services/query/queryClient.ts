import { QueryClient } from '@tanstack/react-query';
import { logger } from '../../utils/logger';

/**
 * TanStack Query client configuration optimized for offline-first Bible app
 *
 * Features:
 * - Optimized caching for local SQLite database
 * - Background refetching for data freshness
 * - Error retry logic for resilience
 * - Stale time management for Bible content
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Bible content rarely changes, so longer stale times
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)

      // Retry failed queries with exponential backoff
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (user errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }

        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Background refetching for data freshness
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,

      // Optimistic updates for better UX
      networkMode: 'always',
    },
    mutations: {
      // Retry mutations less aggressively
      retry: 1,
      retryDelay: 1000,

      // Error handling for mutations
      onError: error => {
        logger.error('Mutation error:', error);
      },
    },
  },
});

/**
 * Prefetch common Bible data for better performance
 */
export const prefetchBibleData = async () => {
  try {
    // Prefetch books list (most commonly accessed)
    await queryClient.prefetchQuery({
      queryKey: ['books'],
      queryFn: async () => {
        const { localDataService } = await import(
          '../database/LocalDataService'
        );
        return localDataService.getBooks();
      },
    });

    logger.info('Bible data prefetched successfully');
  } catch (error) {
    logger.error('Failed to prefetch Bible data:', error);
  }
};

/**
 * Invalidate all Bible-related queries
 */
export const invalidateBibleQueries = () => {
  queryClient.invalidateQueries({ queryKey: ['books'] });
  queryClient.invalidateQueries({ queryKey: ['chapters'] });
  queryClient.invalidateQueries({ queryKey: ['verses'] });
  queryClient.invalidateQueries({ queryKey: ['verse-texts'] });
};

/**
 * Clear all cached Bible data
 */
export const clearBibleCache = () => {
  queryClient.removeQueries({ queryKey: ['books'] });
  queryClient.removeQueries({ queryKey: ['chapters'] });
  queryClient.removeQueries({ queryKey: ['verses'] });
  queryClient.removeQueries({ queryKey: ['verse-texts'] });
};
