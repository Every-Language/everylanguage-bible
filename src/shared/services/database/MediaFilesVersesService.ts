import DatabaseManager from './DatabaseManager';
import type { LocalMediaFileVerse } from './schema';
import { logger } from '../../utils/logger';

const databaseManager = DatabaseManager.getInstance();

export class MediaFilesVersesService {
  private static instance: MediaFilesVersesService;

  private constructor() {}

  static getInstance(): MediaFilesVersesService {
    if (!MediaFilesVersesService.instance) {
      MediaFilesVersesService.instance = new MediaFilesVersesService();
    }
    return MediaFilesVersesService.instance;
  }

  /**
   * Get all media files verses
   */
  async getAllMediaFilesVerses(): Promise<LocalMediaFileVerse[]> {
    try {
      const result = await databaseManager.executeQuery(
        'SELECT * FROM media_files_verses ORDER BY start_time_seconds ASC'
      );
      return result || [];
    } catch (error) {
      logger.error('Error getting all media files verses:', error);
      throw new Error('Failed to get media files verses');
    }
  }

  /**
   * Get media files verses by media file ID
   */
  async getMediaFilesVersesByMediaFileId(
    mediaFileId: string
  ): Promise<LocalMediaFileVerse[]> {
    try {
      const result = await databaseManager.executeQuery(
        'SELECT * FROM media_files_verses WHERE media_file_id = ? ORDER BY start_time_seconds ASC',
        [mediaFileId]
      );
      return result || [];
    } catch (error) {
      logger.error('Error getting media files verses by media file ID:', error);
      throw new Error('Failed to get media files verses by media file ID');
    }
  }

  /**
   * Get media files verses by verse ID
   */
  async getMediaFilesVersesByVerseId(
    verseId: string
  ): Promise<LocalMediaFileVerse[]> {
    try {
      const result = await databaseManager.executeQuery(
        'SELECT * FROM media_files_verses WHERE verse_id = ? ORDER BY start_time_seconds ASC',
        [verseId]
      );
      return result || [];
    } catch (error) {
      logger.error('Error getting media files verses by verse ID:', error);
      throw new Error('Failed to get media files verses by verse ID');
    }
  }

  /**
   * Get a specific media file verse by ID
   */
  async getMediaFileVerse(id: string): Promise<LocalMediaFileVerse | null> {
    try {
      const result = await databaseManager.executeQuery(
        'SELECT * FROM media_files_verses WHERE id = ?',
        [id]
      );
      return result && result.length > 0 ? result[0] : null;
    } catch (error) {
      logger.error('Error getting media file verse:', error);
      throw new Error('Failed to get media file verse');
    }
  }

  /**
   * Save a new media file verse
   */
  async saveMediaFileVerse(
    mediaFileVerse: Omit<
      LocalMediaFileVerse,
      'created_at' | 'updated_at' | 'synced_at'
    >
  ): Promise<void> {
    try {
      this.validateMediaFileVerse(mediaFileVerse);

      const now = new Date().toISOString();
      await databaseManager.executeQuery(
        `INSERT INTO media_files_verses (
          id, media_file_id, verse_id, start_time_seconds,
          created_at, updated_at, synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          mediaFileVerse.id,
          mediaFileVerse.media_file_id,
          mediaFileVerse.verse_id,
          mediaFileVerse.start_time_seconds,
          now,
          now,
          now,
        ]
      );
    } catch (error) {
      logger.error('Error saving media file verse:', error);
      throw new Error('Failed to save media file verse');
    }
  }

  /**
   * Update an existing media file verse
   */
  async updateMediaFileVerse(
    id: string,
    updates: Partial<
      Omit<LocalMediaFileVerse, 'id' | 'created_at' | 'synced_at'>
    >
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      const fields = Object.keys(updates);

      if (fields.length === 0) {
        return;
      }

      const setClause = fields.map(field => `${field} = ?`).join(', ');
      const values = [
        ...fields.map(field => updates[field as keyof typeof updates]),
        now,
        id,
      ];

      await databaseManager.executeQuery(
        `UPDATE media_files_verses SET ${setClause}, updated_at = ? WHERE id = ?`,
        values
      );
    } catch (error) {
      logger.error('Error updating media file verse:', error);
      throw new Error('Failed to update media file verse');
    }
  }

  /**
   * Delete a media file verse
   */
  async deleteMediaFileVerse(id: string): Promise<void> {
    try {
      await databaseManager.executeQuery(
        'DELETE FROM media_files_verses WHERE id = ?',
        [id]
      );
    } catch (error) {
      logger.error('Error deleting media file verse:', error);
      throw new Error('Failed to delete media file verse');
    }
  }

  /**
   * Delete all media files verses for a specific media file
   */
  async deleteMediaFilesVersesByMediaFileId(
    mediaFileId: string
  ): Promise<void> {
    try {
      await databaseManager.executeQuery(
        'DELETE FROM media_files_verses WHERE media_file_id = ?',
        [mediaFileId]
      );
    } catch (error) {
      logger.error(
        'Error deleting media files verses by media file ID:',
        error
      );
      throw new Error('Failed to delete media files verses by media file ID');
    }
  }

  /**
   * Delete all media files verses for a specific verse
   */
  async deleteMediaFilesVersesByVerseId(verseId: string): Promise<void> {
    try {
      await databaseManager.executeQuery(
        'DELETE FROM media_files_verses WHERE verse_id = ?',
        [verseId]
      );
    } catch (error) {
      logger.error('Error deleting media files verses by verse ID:', error);
      throw new Error('Failed to delete media files verses by verse ID');
    }
  }

  /**
   * Get media files verses with related data (media files and verses)
   */
  async getMediaFilesVersesWithRelatedData(
    mediaFileId?: string
  ): Promise<any[]> {
    try {
      let query = `
        SELECT 
          mfv.*,
          mf.language_entity_id,
          mf.sequence_id,
          mf.media_type,
          mf.local_path,
          mf.remote_path,
          mf.file_size,
          mf.duration_seconds,
          v.verse_number,
          c.chapter_number,
          b.name as book_name
        FROM media_files_verses mfv
        JOIN media_files mf ON mfv.media_file_id = mf.id
        JOIN verses v ON mfv.verse_id = v.id
        JOIN chapters c ON v.chapter_id = c.id
        JOIN books b ON c.book_id = b.id
      `;

      const params: string[] = [];
      if (mediaFileId) {
        query += ' WHERE mfv.media_file_id = ?';
        params.push(mediaFileId);
      }

      query += ' ORDER BY mfv.start_time_seconds ASC';

      const result = await databaseManager.executeQuery(query, params);
      return result || [];
    } catch (error) {
      logger.error(
        'Error getting media files verses with related data:',
        error
      );
      throw new Error('Failed to get media files verses with related data');
    }
  }

  /**
   * Count media files verses by media file ID
   */
  async countMediaFilesVersesByMediaFileId(
    mediaFileId: string
  ): Promise<number> {
    try {
      const result = await databaseManager.executeQuery(
        'SELECT COUNT(*) as count FROM media_files_verses WHERE media_file_id = ?',
        [mediaFileId]
      );
      return result && result.length > 0 ? result[0].count : 0;
    } catch (error) {
      logger.error(
        'Error counting media files verses by media file ID:',
        error
      );
      throw new Error('Failed to count media files verses by media file ID');
    }
  }

  /**
   * Count media files verses by verse ID
   */
  async countMediaFilesVersesByVerseId(verseId: string): Promise<number> {
    try {
      const result = await databaseManager.executeQuery(
        'SELECT COUNT(*) as count FROM media_files_verses WHERE verse_id = ?',
        [verseId]
      );
      return result && result.length > 0 ? result[0].count : 0;
    } catch (error) {
      logger.error('Error counting media files verses by verse ID:', error);
      throw new Error('Failed to count media files verses by verse ID');
    }
  }

  /**
   * Validate media file verse data
   */
  private validateMediaFileVerse(
    mediaFileVerse: Omit<
      LocalMediaFileVerse,
      'created_at' | 'updated_at' | 'synced_at'
    >
  ): void {
    if (!mediaFileVerse.id) {
      throw new Error('Media file verse ID is required');
    }
    if (!mediaFileVerse.media_file_id) {
      throw new Error('Media file ID is required');
    }
    if (!mediaFileVerse.verse_id) {
      throw new Error('Verse ID is required');
    }
    if (
      mediaFileVerse.start_time_seconds === undefined ||
      mediaFileVerse.start_time_seconds < 0
    ) {
      throw new Error('Start time seconds must be a non-negative number');
    }
  }

  /**
   * Clear all media files verses data
   */
  async clearAllData(): Promise<void> {
    try {
      await databaseManager.executeQuery('DELETE FROM media_files_verses');
    } catch (error) {
      logger.error('Error clearing all media files verses data:', error);
      throw new Error('Failed to clear all media files verses data');
    }
  }
}

export const mediaFilesVersesService = MediaFilesVersesService.getInstance();
