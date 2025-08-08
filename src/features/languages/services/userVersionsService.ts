import { logger } from '../../../shared/utils/logger';
import { AudioVersion, TextVersion } from '../types/entities';
import { powerSyncSystem } from '../../../shared/services/powersync/PowerSyncSystem';
import { supabase } from '../../../shared/services/api/supabase';

// Generate UUID function for PowerSync id field
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Service for managing user saved versions and current selections using PowerSync
 * Uses the correct schema tables:
 * - user_saved_audio_versions / user_saved_text_versions for saved versions
 * - user_current_selections for current audio/text version selection
 */
export class UserVersionsService {
  private static instance: UserVersionsService;

  static getInstance(): UserVersionsService {
    if (!UserVersionsService.instance) {
      UserVersionsService.instance = new UserVersionsService();
    }
    return UserVersionsService.instance;
  }

  /**
   * Get the current user's auth ID
   * PowerSync sync rules handle authentication automatically, so we always return the user ID if available
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        logger.error('Error getting auth session:', error);
        return null;
      }

      if (!session?.user) {
        logger.info(
          'No session found, user data will be local-only until authentication'
        );
        return null;
      }

      // Always return the user ID - PowerSync sync rules will handle whether to sync or not
      // based on the 'is_authenticated' parameter passed by PowerSyncConnector
      logger.debug('Using user ID from session:', session.user.id);
      return session.user.id;
    } catch (error) {
      logger.error('Error in getCurrentUserId:', error);
      return null;
    }
  }

  /**
   * Add a version to user's saved versions
   */
  async addSavedVersion(
    version: AudioVersion | TextVersion,
    type: 'audio' | 'text'
  ): Promise<void> {
    try {
      const db = powerSyncSystem.database;
      if (!db) throw new Error('PowerSync database not initialized');

      const userId = await this.getCurrentUserId();
      if (!userId) {
        // No session at all - this should be rare since PowerSync creates anonymous sessions
        throw new Error(
          'Unable to save versions. Please try again or restart the app.'
        );
      }

      // Check if already exists
      const table =
        type === 'audio'
          ? 'user_saved_audio_versions'
          : 'user_saved_text_versions';
      const versionColumn =
        type === 'audio' ? 'audio_version_id' : 'text_version_id';

      const existingQuery = `SELECT * FROM ${table} WHERE user_id = ? AND ${versionColumn} = ?`;
      const existingResults = await powerSyncSystem.getAll(existingQuery, [
        userId,
        version.id,
      ]);

      if (existingResults.length > 0) {
        logger.info(`${type} version already saved:`, version.name);
        return;
      }

      // Create new saved version record
      const recordId = generateUUID();
      const timestamp = new Date().toISOString();

      const insertQuery = `INSERT INTO ${table} (id, user_id, ${versionColumn}, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`;
      const insertParams = [recordId, userId, version.id, timestamp, timestamp];

      await powerSyncSystem.execute(insertQuery, insertParams);

      logger.info(`Saved ${type} version:`, version.name, {
        recordId,
        versionId: version.id,
        userId,
        note: 'PowerSync will sync to backend based on authentication status',
      });
    } catch (error) {
      logger.error('Error adding saved version to PowerSync:', error);
      throw new Error(`Failed to save ${type} version`);
    }
  }

  /**
   * Remove a version from user's saved versions
   */
  async removeSavedVersion(
    versionId: string,
    type: 'audio' | 'text'
  ): Promise<void> {
    try {
      const db = powerSyncSystem.database;
      if (!db) throw new Error('PowerSync database not initialized');

      const userId = await this.getCurrentUserId();
      if (!userId) {
        // For anonymous users, we can't remove synced versions
        throw new Error(
          'Authentication required to manage saved versions. Please sign in to sync your data.'
        );
      }

      const table =
        type === 'audio'
          ? 'user_saved_audio_versions'
          : 'user_saved_text_versions';
      const versionColumn =
        type === 'audio' ? 'audio_version_id' : 'text_version_id';

      const deleteQuery = `DELETE FROM ${table} WHERE user_id = ? AND ${versionColumn} = ?`;
      await powerSyncSystem.execute(deleteQuery, [userId, versionId]);

      logger.info(`Removed ${type} version from PowerSync:`, versionId, {
        userId,
      });
    } catch (error) {
      logger.error('Error removing saved version from PowerSync:', error);
      throw new Error(`Failed to remove ${type} version`);
    }
  }

  /**
   * Get all saved versions for the current user
   */
  async getSavedVersions(): Promise<{
    audio: AudioVersion[];
    text: TextVersion[];
  }> {
    try {
      const db = powerSyncSystem.database;
      if (!db) throw new Error('PowerSync database not initialized');

      const userId = await this.getCurrentUserId();
      if (!userId) {
        logger.info('No user session found, returning empty results');
        return { audio: [], text: [] };
      }

      // Get audio versions with details
      const audioQuery = `
        SELECT usav.*, av.name, av.language_entity_id, av.created_at as version_created_at
        FROM user_saved_audio_versions usav
        JOIN audio_versions av ON usav.audio_version_id = av.id
        WHERE usav.user_id = ?
        ORDER BY usav.created_at DESC
      `;

      // Get text versions with details
      const textQuery = `
        SELECT ustv.*, tv.name, tv.language_entity_id, tv.created_at as version_created_at
        FROM user_saved_text_versions ustv
        JOIN text_versions tv ON ustv.text_version_id = tv.id
        WHERE ustv.user_id = ?
        ORDER BY ustv.created_at DESC
      `;

      const [audioResults, textResults] = await Promise.all([
        powerSyncSystem.getAll(audioQuery, [userId]),
        powerSyncSystem.getAll(textQuery, [userId]),
      ]);

      // Convert to internal format
      const audioVersions: AudioVersion[] = audioResults.map((row: any) => ({
        id: row.audio_version_id,
        name: row.name,
        languageEntityId: row.language_entity_id,
        languageName: '', // Will be resolved separately if needed
        mediaFileCount: 0, // Will be resolved separately if needed
        createdAt: row.version_created_at,
        updatedAt: row.version_created_at,
      }));

      const textVersions: TextVersion[] = textResults.map((row: any) => ({
        id: row.text_version_id,
        name: row.name,
        languageEntityId: row.language_entity_id,
        languageName: '', // Will be resolved separately if needed
        source: 'project' as const,
        verseCount: 0, // Will be resolved separately if needed
        createdAt: row.version_created_at,
        updatedAt: row.version_created_at,
      }));

      logger.info('Loaded saved versions from PowerSync', {
        audioCount: audioVersions.length,
        textCount: textVersions.length,
        userId,
      });

      return {
        audio: audioVersions,
        text: textVersions,
      };
    } catch (error) {
      logger.error('Error getting saved versions from PowerSync:', error);
      return { audio: [], text: [] };
    }
  }

  /**
   * Check if a version is saved by the current user
   */
  async isVersionSaved(
    versionId: string,
    type: 'audio' | 'text'
  ): Promise<boolean> {
    try {
      const db = powerSyncSystem.database;
      if (!db) throw new Error('PowerSync database not initialized');

      const userId = await this.getCurrentUserId();
      if (!userId) return false;

      const table =
        type === 'audio'
          ? 'user_saved_audio_versions'
          : 'user_saved_text_versions';
      const versionColumn =
        type === 'audio' ? 'audio_version_id' : 'text_version_id';

      const query = `SELECT COUNT(*) as count FROM ${table} WHERE user_id = ? AND ${versionColumn} = ?`;
      const results = (await powerSyncSystem.getAll(query, [
        userId,
        versionId,
      ])) as { count: number }[];
      const result = results.length > 0 ? results[0] : { count: 0 };

      return (result?.count || 0) > 0;
    } catch (error) {
      logger.error('Error checking if version is saved in PowerSync:', error);
      return false;
    }
  }

  /**
   * Get current selections for the user
   */
  async getCurrentSelections(): Promise<{
    audio: AudioVersion | null;
    text: TextVersion | null;
  }> {
    try {
      const db = powerSyncSystem.database;
      if (!db) throw new Error('PowerSync database not initialized');

      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { audio: null, text: null };
      }

      // Get current selections with version details
      const query = `
        SELECT 
          ucs.*,
          av.name as audio_name,
          av.language_entity_id as audio_language_entity_id,
          av.created_at as audio_created_at,
          tv.name as text_name,
          tv.language_entity_id as text_language_entity_id,
          tv.created_at as text_created_at
        FROM user_current_selections ucs
        LEFT JOIN audio_versions av ON ucs.selected_audio_version = av.id
        LEFT JOIN text_versions tv ON ucs.selected_text_version = tv.id
        WHERE ucs.user_id = ?
        LIMIT 1
      `;

      const results = await powerSyncSystem.getAll(query, [userId]);
      const result = results.length > 0 ? results[0] : null;

      if (!result) {
        return { audio: null, text: null };
      }

      const audioVersion = result.selected_audio_version
        ? {
            id: result.selected_audio_version,
            name: result.audio_name || '',
            languageEntityId: result.audio_language_entity_id || '',
            languageName: '',
            mediaFileCount: 0,
            createdAt: result.audio_created_at || '',
            updatedAt: result.audio_created_at || '',
          }
        : null;

      const textVersion = result.selected_text_version
        ? {
            id: result.selected_text_version,
            name: result.text_name || '',
            languageEntityId: result.text_language_entity_id || '',
            languageName: '',
            source: 'project' as const,
            verseCount: 0,
            createdAt: result.text_created_at || '',
            updatedAt: result.text_created_at || '',
          }
        : null;

      return { audio: audioVersion, text: textVersion };
    } catch (error) {
      logger.error('Error getting current selections:', error);
      return { audio: null, text: null };
    }
  }

  /**
   * Set current audio version selection
   */
  async setCurrentAudioVersion(version: AudioVersion | null): Promise<void> {
    await this.updateCurrentSelection('audio', version?.id || null);
  }

  /**
   * Set current text version selection
   */
  async setCurrentTextVersion(version: TextVersion | null): Promise<void> {
    await this.updateCurrentSelection('text', version?.id || null);
  }

  /**
   * Update current selection for audio or text
   */
  private async updateCurrentSelection(
    type: 'audio' | 'text',
    versionId: string | null
  ): Promise<void> {
    const db = powerSyncSystem.database;
    if (!db) throw new Error('PowerSync database not initialized');

    const userId = await this.getCurrentUserId();
    if (!userId) {
      // For anonymous users, we can't set synced current selections
      throw new Error(
        'Authentication required to set current selections. Please sign in to sync your data.'
      );
    }

    const timestamp = new Date().toISOString();

    try {
      // Check if user_current_selections record exists
      const existingQuery =
        'SELECT * FROM user_current_selections WHERE user_id = ?';
      const existingResults = await powerSyncSystem.getAll(existingQuery, [
        userId,
      ]);
      const existing = existingResults.length > 0 ? existingResults[0] : null;

      if (existing) {
        // Update existing record - only update the specific field
        const column =
          type === 'audio' ? 'selected_audio_version' : 'selected_text_version';
        const updateQuery = `UPDATE user_current_selections SET ${column} = ?, updated_at = ? WHERE user_id = ?`;
        await powerSyncSystem.execute(updateQuery, [
          versionId,
          timestamp,
          userId,
        ]);
      } else {
        // Create new record with both fields, setting the appropriate one
        const recordId = generateUUID();
        const audioVersionId = type === 'audio' ? versionId : null;
        const textVersionId = type === 'text' ? versionId : null;

        const insertQuery = `
          INSERT INTO user_current_selections (id, user_id, selected_audio_version, selected_text_version, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          recordId,
          userId,
          audioVersionId,
          textVersionId,
          timestamp,
          timestamp,
        ];
        await powerSyncSystem.execute(insertQuery, insertParams);
      }

      logger.info(`Updated current ${type} selection:`, { userId, versionId });
    } catch (error) {
      logger.error(`Error setting current ${type} version:`, error);

      // If it's a unique constraint violation, try to handle it gracefully
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (
          errorMessage.includes('unique constraint') ||
          errorMessage.includes('duplicate key')
        ) {
          logger.warn(
            `Unique constraint violation detected, attempting to update existing record for ${type} selection`
          );

          // Try to update the existing record directly
          try {
            const column =
              type === 'audio'
                ? 'selected_audio_version'
                : 'selected_text_version';
            const updateQuery = `UPDATE user_current_selections SET ${column} = ?, updated_at = ? WHERE user_id = ?`;
            await powerSyncSystem.execute(updateQuery, [
              versionId,
              timestamp,
              userId,
            ]);
            logger.info(
              `Successfully updated existing ${type} selection after constraint violation`
            );
            return;
          } catch (updateError) {
            logger.error(
              `Failed to update existing record after constraint violation:`,
              updateError
            );
          }
        }
      }

      throw new Error(`Failed to set current ${type} version`);
    }
  }

  /**
   * Update both audio and text selections atomically (useful for preventing race conditions)
   */
  async updateCurrentSelections(
    audioVersionId: string | null,
    textVersionId: string | null
  ): Promise<void> {
    const db = powerSyncSystem.database;
    if (!db) throw new Error('PowerSync database not initialized');

    const userId = await this.getCurrentUserId();
    if (!userId) {
      throw new Error(
        'Authentication required to set current selections. Please sign in to sync your data.'
      );
    }

    const timestamp = new Date().toISOString();

    try {
      // Check if user_current_selections record exists
      const existingQuery =
        'SELECT * FROM user_current_selections WHERE user_id = ?';
      const existingResults = await powerSyncSystem.getAll(existingQuery, [
        userId,
      ]);
      const existing = existingResults.length > 0 ? existingResults[0] : null;

      if (existing) {
        // Update existing record with both values
        const updateQuery = `UPDATE user_current_selections SET selected_audio_version = ?, selected_text_version = ?, updated_at = ? WHERE user_id = ?`;
        await powerSyncSystem.execute(updateQuery, [
          audioVersionId,
          textVersionId,
          timestamp,
          userId,
        ]);
      } else {
        // Create new record with both fields
        const recordId = generateUUID();
        const insertQuery = `
          INSERT INTO user_current_selections (id, user_id, selected_audio_version, selected_text_version, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          recordId,
          userId,
          audioVersionId,
          textVersionId,
          timestamp,
          timestamp,
        ];
        await powerSyncSystem.execute(insertQuery, insertParams);
      }

      logger.info('Updated current selections:', {
        userId,
        audioVersionId,
        textVersionId,
      });
    } catch (error) {
      logger.error('Error setting current selections:', error);

      // Handle unique constraint violation
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (
          errorMessage.includes('unique constraint') ||
          errorMessage.includes('duplicate key')
        ) {
          logger.warn(
            'Unique constraint violation detected, attempting to update existing record'
          );

          try {
            const updateQuery = `UPDATE user_current_selections SET selected_audio_version = ?, selected_text_version = ?, updated_at = ? WHERE user_id = ?`;
            await powerSyncSystem.execute(updateQuery, [
              audioVersionId,
              textVersionId,
              timestamp,
              userId,
            ]);
            logger.info(
              'Successfully updated existing selections after constraint violation'
            );
            return;
          } catch (updateError) {
            logger.error(
              'Failed to update existing record after constraint violation:',
              updateError
            );
          }
        }
      }

      throw new Error('Failed to set current selections');
    }
  }

  /**
   * Watch saved versions for real-time updates (authenticated users only)
   */
  async watchSavedVersions() {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      // Return empty watcher for anonymous users
      return powerSyncSystem.watch(
        'SELECT NULL as type, NULL as version_id, NULL as name, NULL as language_entity_id, NULL as version_created_at WHERE 1=0'
      );
    }

    return powerSyncSystem.watch(
      `
      SELECT 
        'audio' as type,
        usav.audio_version_id as version_id,
        av.name,
        av.language_entity_id,
        av.created_at as version_created_at
      FROM user_saved_audio_versions usav
      JOIN audio_versions av ON usav.audio_version_id = av.id
      WHERE usav.user_id = ?
      UNION ALL
      SELECT 
        'text' as type,
        ustv.text_version_id as version_id,
        tv.name,
        tv.language_entity_id,
        tv.created_at as version_created_at
      FROM user_saved_text_versions ustv
      JOIN text_versions tv ON ustv.text_version_id = tv.id
      WHERE ustv.user_id = ?
      ORDER BY version_created_at DESC
    `,
      [userId, userId]
    );
  }

  /**
   * Watch current selections for real-time updates (authenticated users only)
   */
  async watchCurrentSelections() {
    const userId = await this.getCurrentUserId();
    if (!userId) {
      // Return empty watcher for anonymous users
      return powerSyncSystem.watch(
        'SELECT NULL as user_id, NULL as selected_audio_version, NULL as selected_text_version, NULL as audio_name, NULL as audio_language_entity_id, NULL as text_name, NULL as text_language_entity_id WHERE 1=0'
      );
    }

    return powerSyncSystem.watch(
      `
      SELECT 
        ucs.*,
        av.name as audio_name,
        av.language_entity_id as audio_language_entity_id,
        tv.name as text_name,
        tv.language_entity_id as text_language_entity_id
      FROM user_current_selections ucs
      LEFT JOIN audio_versions av ON ucs.selected_audio_version = av.id
      LEFT JOIN text_versions tv ON ucs.selected_text_version = tv.id
      WHERE ucs.user_id = ?
    `,
      [userId]
    );
  }
}

// Export singleton instance
export const userVersionsService = UserVersionsService.getInstance();
