import { supabase } from '../../../shared/services/api/supabase';
import DatabaseManager from '../../../shared/services/database/DatabaseManager';
import { logger } from '../../../shared/utils/logger';

const databaseManager = DatabaseManager.getInstance();

export class AvailabilityService {
  /**
   * Update availability information for all language entities
   */
  async updateLanguageAvailability(): Promise<void> {
    try {
      logger.info('Starting availability update for all languages...');

      // Get all language entities
      const allLanguages = await databaseManager.executeQuery(
        'SELECT id FROM language_entities_cache'
      );

      let updatedCount = 0;
      let hasContentCount = 0;

      for (const language of allLanguages) {
        if (!language || !language.id) continue;

        const languageId = language.id!;
        const availability = await this.checkLanguageAvailability(languageId);

        // Update the language entity cache
        await databaseManager.executeQuery(
          `UPDATE language_entities_cache 
           SET has_available_versions = ?, 
               audio_versions_count = ?, 
               text_versions_count = ?, 
               last_availability_check = ? 
           WHERE id = ?`,
          [
            availability.hasAvailableVersions ? 1 : 0,
            availability.audioCount,
            availability.textCount,
            new Date().toISOString().split('T')[0] +
              ' ' +
              (new Date().toISOString().split('T')[1] || '').slice(0, 8),
            languageId,
          ]
        );

        updatedCount++;
        if (availability.hasAvailableVersions) {
          hasContentCount++;
        }
      }

      logger.info(
        `Updated availability for ${updatedCount} languages. ${hasContentCount} have available versions.`
      );
    } catch (error) {
      logger.error('Error updating language availability:', error);
      throw error;
    }
  }

  private async checkLanguageAvailability(languageEntityId: string): Promise<{
    hasAvailableVersions: boolean;
    audioCount: number;
    textCount: number;
  }> {
    try {
      // Count available audio versions from cache
      const audioCount = await this.getPublishedAudioCount(languageEntityId);

      // Count available text versions from cache
      const textCount = await this.getPublishedTextCount(languageEntityId);

      return {
        hasAvailableVersions: audioCount > 0 || textCount > 0,
        audioCount,
        textCount,
      };
    } catch (error) {
      logger.error('Error checking language availability:', error);
      return {
        hasAvailableVersions: false,
        audioCount: 0,
        textCount: 0,
      };
    }
  }

  private async getPublishedAudioCount(
    languageEntityId: string
  ): Promise<number> {
    const { count } = await supabase
      .from('audio_versions')
      .select('*, media_files!inner(id)', { count: 'exact', head: true })
      .eq('language_entity_id', languageEntityId)
      .eq('media_files.publish_status', 'published')
      .is('deleted_at', null)
      .is('media_files.deleted_at', null);

    return count || 0;
  }

  private async getPublishedTextCount(
    languageEntityId: string
  ): Promise<number> {
    const { count } = await supabase
      .from('text_versions')
      .select('*, verse_texts!inner(id)', { count: 'exact', head: true })
      .eq('language_entity_id', languageEntityId)
      .eq('verse_texts.publish_status', 'published')
      .is('deleted_at', null)
      .is('verse_texts.deleted_at', null);

    return count || 0;
  }

  async getAvailabilitySummary(): Promise<{
    totalLanguages: number;
    languagesWithContent: number;
    totalAudioVersions: number;
    totalTextVersions: number;
  }> {
    try {
      const results = await databaseManager.executeQuery(`
        SELECT 
          COUNT(*) as total_languages,
          SUM(CASE WHEN has_available_versions = 1 THEN 1 ELSE 0 END) as languages_with_content,
          SUM(COALESCE(audio_versions_count, 0)) as total_audio_versions,
          SUM(COALESCE(text_versions_count, 0)) as total_text_versions
        FROM language_entities_cache
      `);

      const result = results[0] || {};

      return {
        totalLanguages: (result as any).total_languages || 0,
        languagesWithContent: (result as any).languages_with_content || 0,
        totalAudioVersions: (result as any).total_audio_versions || 0,
        totalTextVersions: (result as any).total_text_versions || 0,
      };
    } catch (error) {
      logger.error('Error getting availability summary:', error);
      throw error;
    }
  }
}

export const availabilityService = new AvailabilityService();
