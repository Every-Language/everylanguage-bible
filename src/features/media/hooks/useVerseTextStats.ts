import { useQuery } from '@tanstack/react-query';
import { useLanguageSelection } from '@/features/languages/hooks/useLanguageSelection';
import { DatabaseManager } from '@/shared/services/database';
import { logger } from '@/shared/utils/logger';

interface VerseTextStats {
  totalVersesInDatabase: number;
  totalVerseTextsForVersion: number;
  downloadedVerseTexts: number;
  textVersionId: string | null;
  textVersionName: string | null;
  languageEntityId: string | null;
  percentageComplete: number;
}

export const useVerseTextStats = () => {
  const {
    state: { currentTextVersion },
  } = useLanguageSelection();

  return useQuery({
    queryKey: ['verseTextStats', currentTextVersion?.id],
    queryFn: async (): Promise<VerseTextStats> => {
      try {
        const db = await DatabaseManager.getInstance().getDatabase();

        // Get total verses in database
        const totalVersesResult = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM verses'
        );
        const totalVersesInDatabase = totalVersesResult?.count || 0;

        if (!currentTextVersion?.id) {
          return {
            totalVersesInDatabase,
            totalVerseTextsForVersion: 0,
            downloadedVerseTexts: 0,
            textVersionId: null,
            textVersionName: null,
            languageEntityId: null,
            percentageComplete: 0,
          };
        }

        // Get total verse texts for this version (from remote data)
        const totalVerseTextsForVersion = currentTextVersion.verseCount || 0;

        logger.debug('Verses txt details', currentTextVersion);
        // Get downloaded verse texts for this version
        const downloadedResult = await db.getFirstAsync<{ count: number }>(
          'SELECT COUNT(*) as count FROM verse_texts WHERE text_version_id = ? AND publish_status = ?',
          [currentTextVersion.id, 'pending']
        );
        const downloadedVerseTexts = downloadedResult?.count || 0;

        const percentageComplete =
          totalVerseTextsForVersion > 0
            ? Math.round(
                (downloadedVerseTexts / totalVerseTextsForVersion) * 100
              )
            : 0;

        return {
          totalVersesInDatabase,
          totalVerseTextsForVersion,
          downloadedVerseTexts,
          textVersionId: currentTextVersion.id,
          textVersionName: currentTextVersion.name,
          languageEntityId: currentTextVersion.languageEntityId,
          percentageComplete,
        };
      } catch (error) {
        logger.error('Error getting verse text stats:', error);
        throw error;
      }
    },
    enabled: !!currentTextVersion?.id,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
};
