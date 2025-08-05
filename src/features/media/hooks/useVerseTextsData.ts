import { useQuery } from '@tanstack/react-query';
import { DatabaseManager } from '@/shared/services/database';
import { logger } from '@/shared/utils/logger';
import type { LocalVerseText } from '@/shared/services/database/schema';

interface VerseTextsData {
  verseTexts: LocalVerseText[];
  totalCount: number;
  uniqueVersions: string[];
  uniquePublishStatuses: string[];
  averageTextLength: number;
  oldestRecord: string | null;
  newestRecord: string | null;
}

export const useVerseTextsData = () => {
  return useQuery({
    queryKey: ['verseTextsData'],
    queryFn: async (): Promise<VerseTextsData> => {
      try {
        const db = await DatabaseManager.getInstance().getDatabase();

        // Get all verse texts
        const verseTexts = await db.getAllAsync<LocalVerseText>(
          'SELECT * FROM verse_texts ORDER BY created_at DESC LIMIT 1000'
        );

        // Get total count
        const totalCountResult = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM verse_texts'
        );
        const totalCount = totalCountResult?.count || 0;

        // Get unique text versions
        const uniqueVersionsResult = await db.getAllAsync<{
          text_version_id: string;
        }>(
          'SELECT DISTINCT text_version_id FROM verse_texts WHERE text_version_id IS NOT NULL'
        );
        const uniqueVersions = uniqueVersionsResult.map(v => v.text_version_id);

        // Get unique publish statuses
        const uniqueStatusesResult = await db.getAllAsync<{
          publish_status: string;
        }>('SELECT DISTINCT publish_status FROM verse_texts');
        const uniquePublishStatuses = uniqueStatusesResult.map(
          s => s.publish_status
        );

        // Calculate average text length
        const avgLengthResult = await db.getFirstAsync<{ avg_length: number }>(
          'SELECT AVG(LENGTH(verse_text)) as avg_length FROM verse_texts'
        );
        const averageTextLength = Math.round(avgLengthResult?.avg_length || 0);

        // Get oldest and newest records
        const oldestResult = await db.getFirstAsync<{ created_at: string }>(
          'SELECT created_at FROM verse_texts ORDER BY created_at ASC LIMIT 1'
        );
        const newestResult = await db.getFirstAsync<{ created_at: string }>(
          'SELECT created_at FROM verse_texts ORDER BY created_at DESC LIMIT 1'
        );

        return {
          verseTexts,
          totalCount,
          uniqueVersions,
          uniquePublishStatuses,
          averageTextLength,
          oldestRecord: oldestResult?.created_at || null,
          newestRecord: newestResult?.created_at || null,
        };
      } catch (error) {
        logger.error('Error getting verse texts data:', error);
        throw error;
      }
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};
