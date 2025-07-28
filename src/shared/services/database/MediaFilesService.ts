import DatabaseManager from './DatabaseManager';
import type { LocalMediaFile } from './schema';
import { logger } from '../../utils/logger';

export interface MediaFileFilters {
  language_entity_id?: string;
  media_type?: string;
  upload_status?: string;
  publish_status?: string;
  chapter_id?: string;
  include_deleted?: boolean;
}

export interface MediaFileSort {
  field:
    | 'created_at'
    | 'updated_at'
    | 'sequence_id'
    | 'file_size'
    | 'duration_seconds';
  direction: 'asc' | 'desc';
}

// Validation constants
const ALLOWED_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'sequence_id',
  'file_size',
  'duration_seconds',
] as const;
const ALLOWED_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export class MediaFilesService {
  private static instance: MediaFilesService;
  private databaseManager = DatabaseManager.getInstance();

  private constructor() {}

  static getInstance(): MediaFilesService {
    if (!MediaFilesService.instance) {
      MediaFilesService.instance = new MediaFilesService();
    }
    return MediaFilesService.instance;
  }

  /**
   * Validate required fields for media file
   */
  private validateMediaFile(mediaFile: Partial<LocalMediaFile>): void {
    const requiredFields = [
      'id',
      'language_entity_id',
      'sequence_id',
      'media_type',
      'local_path',
      'remote_path',
    ];

    for (const field of requiredFields) {
      if (!mediaFile[field as keyof LocalMediaFile]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (mediaFile.file_size !== undefined && mediaFile.file_size < 0) {
      throw new Error('File size cannot be negative');
    }

    if (
      mediaFile.duration_seconds !== undefined &&
      mediaFile.duration_seconds < 0
    ) {
      throw new Error('Duration cannot be negative');
    }

    if (mediaFile.version !== undefined && mediaFile.version < 1) {
      throw new Error('Version must be at least 1');
    }
  }

  /**
   * Validate sort parameters to prevent SQL injection
   */
  private validateSort(sort?: MediaFileSort): boolean {
    if (!sort) return false;

    return (
      ALLOWED_SORT_FIELDS.includes(sort.field) &&
      ALLOWED_SORT_DIRECTIONS.includes(sort.direction)
    );
  }

  /**
   * Get media files with optional filtering
   */
  async getMediaFiles(
    filters: MediaFileFilters = {},
    sort?: MediaFileSort
  ): Promise<LocalMediaFile[]> {
    try {
      const db = await this.databaseManager.getDatabase();

      let query = 'SELECT * FROM media_files';
      const conditions: string[] = [];
      const params: (string | number | null)[] = [];

      if (filters?.language_entity_id) {
        conditions.push('language_entity_id = ?');
        params.push(filters.language_entity_id);
      }

      if (filters?.media_type) {
        conditions.push('media_type = ?');
        params.push(filters.media_type);
      }

      if (filters?.upload_status) {
        conditions.push('upload_status = ?');
        params.push(filters.upload_status);
      }

      if (filters?.publish_status) {
        conditions.push('publish_status = ?');
        params.push(filters.publish_status);
      }

      if (filters?.chapter_id) {
        conditions.push('chapter_id = ?');
        params.push(filters.chapter_id);
      }

      if (!filters?.include_deleted) {
        conditions.push('deleted_at IS NULL');
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Safe sorting with validation
      if (this.validateSort(sort)) {
        query += ` ORDER BY ${sort!.field} ${sort!.direction.toUpperCase()}`;
      } else {
        query += ' ORDER BY created_at DESC';
      }

      return await db.getAllAsync(query, params);
    } catch (error) {
      logger.error('Error getting media files:', error);
      throw new Error('Failed to retrieve media files');
    }
  }

  /**
   * Get a single media file by ID
   */
  async getMediaFileById(id: string): Promise<LocalMediaFile | null> {
    if (!id) {
      throw new Error('Media file ID is required');
    }

    try {
      const result = await this.databaseManager.executeQuery<LocalMediaFile>(
        'SELECT * FROM media_files WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      return result[0] || null;
    } catch (error) {
      logger.error('Error getting media file by ID:', error);
      throw new Error('Failed to retrieve media file');
    }
  }

  /**
   * Get media files by sequence ID
   */
  async getMediaFilesBySequenceId(
    sequenceId: string
  ): Promise<LocalMediaFile[]> {
    if (!sequenceId) {
      throw new Error('Sequence ID is required');
    }

    try {
      return await this.databaseManager.executeQuery<LocalMediaFile>(
        'SELECT * FROM media_files WHERE sequence_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
        [sequenceId]
      );
    } catch (error) {
      logger.error('Error getting media files by sequence ID:', error);
      throw new Error('Failed to retrieve media files by sequence ID');
    }
  }

  /**
   * Get media files by chapter ID
   */
  async getMediaFilesByChapterId(chapterId: string): Promise<LocalMediaFile[]> {
    if (!chapterId) {
      throw new Error('Chapter ID is required');
    }

    try {
      return await this.databaseManager.executeQuery<LocalMediaFile>(
        'SELECT * FROM media_files WHERE chapter_id = ? AND deleted_at IS NULL ORDER BY sequence_id ASC',
        [chapterId]
      );
    } catch (error) {
      logger.error('Error getting media files by chapter ID:', error);
      throw new Error('Failed to retrieve media files by chapter ID');
    }
  }

  /**
   * Get media files by language entity ID
   */
  async getMediaFilesByLanguageEntityId(
    languageEntityId: string
  ): Promise<LocalMediaFile[]> {
    if (!languageEntityId) {
      throw new Error('Language entity ID is required');
    }

    try {
      return await this.databaseManager.executeQuery<LocalMediaFile>(
        'SELECT * FROM media_files WHERE language_entity_id = ? AND deleted_at IS NULL ORDER BY created_at DESC',
        [languageEntityId]
      );
    } catch (error) {
      logger.error('Error getting media files by language entity ID:', error);
      throw new Error('Failed to retrieve media files by language entity ID');
    }
  }

  /**
   * Save a new media file
   */
  async saveMediaFile(
    mediaFile: Omit<LocalMediaFile, 'created_at' | 'updated_at'>
  ): Promise<void> {
    try {
      // Validate required fields
      this.validateMediaFile(mediaFile);

      const now = new Date().toISOString();
      await this.databaseManager.executeQuery(
        `INSERT INTO media_files (
          id, language_entity_id, sequence_id, media_type, local_path, remote_path,
          file_size, duration_seconds, upload_status, publish_status, check_status,
          version, created_at, updated_at, deleted_at, chapter_id, verses,
          start_verse_id, end_verse_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mediaFile.id,
          mediaFile.language_entity_id,
          mediaFile.sequence_id,
          mediaFile.media_type,
          mediaFile.local_path,
          mediaFile.remote_path,
          mediaFile.file_size,
          mediaFile.duration_seconds,
          mediaFile.upload_status,
          mediaFile.publish_status,
          mediaFile.check_status,
          mediaFile.version,
          now,
          now,
          mediaFile.deleted_at,
          mediaFile.chapter_id,
          mediaFile.verses,
          mediaFile.start_verse_id,
          mediaFile.end_verse_id,
        ]
      );
    } catch (error) {
      logger.error('Error saving media file:', error);
      throw new Error('Failed to save media file');
    }
  }

  /**
   * Update an existing media file
   */
  async updateMediaFile(
    id: string,
    updates: Partial<LocalMediaFile>
  ): Promise<void> {
    if (!id) {
      throw new Error('Media file ID is required');
    }

    try {
      // Validate updates if they contain validatable fields
      if (updates.file_size !== undefined && updates.file_size < 0) {
        throw new Error('File size cannot be negative');
      }

      if (
        updates.duration_seconds !== undefined &&
        updates.duration_seconds < 0
      ) {
        throw new Error('Duration cannot be negative');
      }

      if (updates.version !== undefined && updates.version < 1) {
        throw new Error('Version must be at least 1');
      }

      const setClause = Object.keys(updates)
        .filter(key => key !== 'id' && key !== 'created_at')
        .map(key => `${key} = ?`)
        .join(', ');

      const values = Object.entries(updates)
        .filter(([key]) => key !== 'id' && key !== 'created_at')
        .map(([, value]) => value);

      values.push(new Date().toISOString()); // updated_at
      values.push(id);

      await this.databaseManager.executeQuery(
        `UPDATE media_files SET ${setClause}, updated_at = ? WHERE id = ?`,
        values
      );
    } catch (error) {
      logger.error('Error updating media file:', error);
      throw new Error('Failed to update media file');
    }
  }

  /**
   * Soft delete a media file
   */
  async deleteMediaFile(id: string): Promise<void> {
    if (!id) {
      throw new Error('Media file ID is required');
    }

    try {
      await this.databaseManager.executeQuery(
        'UPDATE media_files SET deleted_at = ?, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), new Date().toISOString(), id]
      );
    } catch (error) {
      logger.error('Error deleting media file:', error);
      throw new Error('Failed to delete media file');
    }
  }

  /**
   * Hard delete a media file
   */
  async hardDeleteMediaFile(id: string): Promise<void> {
    if (!id) {
      throw new Error('Media file ID is required');
    }

    try {
      await this.databaseManager.executeQuery(
        'DELETE FROM media_files WHERE id = ?',
        [id]
      );
    } catch (error) {
      logger.error('Error hard deleting media file:', error);
      throw new Error('Failed to hard delete media file');
    }
  }

  /**
   * Restore a soft-deleted media file
   */
  async restoreMediaFile(id: string): Promise<void> {
    if (!id) {
      throw new Error('Media file ID is required');
    }

    try {
      await this.databaseManager.executeQuery(
        'UPDATE media_files SET deleted_at = NULL, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), id]
      );
    } catch (error) {
      logger.error('Error restoring media file:', error);
      throw new Error('Failed to restore media file');
    }
  }

  /**
   * Get media files count
   */
  async getMediaFilesCount(filters: MediaFileFilters = {}): Promise<number> {
    try {
      const db = await this.databaseManager.getDatabase();

      let query = 'SELECT COUNT(*) as count FROM media_files';
      const conditions: string[] = [];
      const params: (string | number | null)[] = [];

      if (filters?.language_entity_id) {
        conditions.push('language_entity_id = ?');
        params.push(filters.language_entity_id);
      }

      if (filters?.media_type) {
        conditions.push('media_type = ?');
        params.push(filters.media_type);
      }

      if (filters?.upload_status) {
        conditions.push('upload_status = ?');
        params.push(filters.upload_status);
      }

      if (filters?.publish_status) {
        conditions.push('publish_status = ?');
        params.push(filters.publish_status);
      }

      if (filters?.chapter_id) {
        conditions.push('chapter_id = ?');
        params.push(filters.chapter_id);
      }

      if (!filters?.include_deleted) {
        conditions.push('deleted_at IS NULL');
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const result = await db.getFirstAsync(query, params);
      return (result as { count: number })?.count || 0;
    } catch (error) {
      logger.error('Error getting media files count:', error);
      throw new Error('Failed to get media files count');
    }
  }

  /**
   * Get total file size for media files
   */
  async getTotalFileSize(filters: MediaFileFilters = {}): Promise<number> {
    try {
      const db = await this.databaseManager.getDatabase();

      let query = 'SELECT SUM(file_size) as total_size FROM media_files';
      const conditions: string[] = [];
      const params: (string | number | null)[] = [];

      if (filters?.language_entity_id) {
        conditions.push('language_entity_id = ?');
        params.push(filters.language_entity_id);
      }

      if (filters?.media_type) {
        conditions.push('media_type = ?');
        params.push(filters.media_type);
      }

      if (filters?.upload_status) {
        conditions.push('upload_status = ?');
        params.push(filters.upload_status);
      }

      if (filters?.publish_status) {
        conditions.push('publish_status = ?');
        params.push(filters.publish_status);
      }

      if (filters?.chapter_id) {
        conditions.push('chapter_id = ?');
        params.push(filters.chapter_id);
      }

      if (!filters?.include_deleted) {
        conditions.push('deleted_at IS NULL');
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const result = await db.getFirstAsync(query, params);
      return (result as { total_size: number })?.total_size || 0;
    } catch (error) {
      logger.error('Error getting total file size:', error);
      throw new Error('Failed to get total file size');
    }
  }

  /**
   * Get media files by upload status
   */
  async getMediaFilesByUploadStatus(
    uploadStatus: string
  ): Promise<LocalMediaFile[]> {
    if (!uploadStatus) {
      throw new Error('Upload status is required');
    }

    try {
      return await this.databaseManager.executeQuery<LocalMediaFile>(
        'SELECT * FROM media_files WHERE upload_status = ? AND deleted_at IS NULL ORDER BY created_at ASC',
        [uploadStatus]
      );
    } catch (error) {
      logger.error('Error getting media files by upload status:', error);
      throw new Error('Failed to retrieve media files by upload status');
    }
  }

  /**
   * Get media files by publish status
   */
  async getMediaFilesByPublishStatus(
    publishStatus: string
  ): Promise<LocalMediaFile[]> {
    if (!publishStatus) {
      throw new Error('Publish status is required');
    }

    try {
      return await this.databaseManager.executeQuery<LocalMediaFile>(
        'SELECT * FROM media_files WHERE publish_status = ? AND deleted_at IS NULL ORDER BY created_at ASC',
        [publishStatus]
      );
    } catch (error) {
      logger.error('Error getting media files by publish status:', error);
      throw new Error('Failed to retrieve media files by publish status');
    }
  }

  /**
   * Update upload status for a media file
   */
  async updateUploadStatus(id: string, uploadStatus: string): Promise<void> {
    if (!uploadStatus) {
      throw new Error('Upload status is required');
    }
    await this.updateMediaFile(id, { upload_status: uploadStatus });
  }

  /**
   * Update publish status for a media file
   */
  async updatePublishStatus(id: string, publishStatus: string): Promise<void> {
    if (!publishStatus) {
      throw new Error('Publish status is required');
    }
    await this.updateMediaFile(id, { publish_status: publishStatus });
  }

  /**
   * Update check status for a media file
   */
  async updateCheckStatus(id: string, checkStatus: string): Promise<void> {
    if (!checkStatus) {
      throw new Error('Check status is required');
    }
    await this.updateMediaFile(id, { check_status: checkStatus });
  }

  /**
   * Update local path for a media file
   */
  async updateLocalPath(id: string, localPath: string): Promise<void> {
    if (!localPath) {
      throw new Error('Local path is required');
    }
    await this.updateMediaFile(id, { local_path: localPath });
  }

  /**
   * Update remote path for a media file
   */
  async updateRemotePath(id: string, remotePath: string): Promise<void> {
    if (!remotePath) {
      throw new Error('Remote path is required');
    }
    await this.updateMediaFile(id, { remote_path: remotePath });
  }

  /**
   * Update file size for a media file
   */
  async updateFileSize(id: string, fileSize: number): Promise<void> {
    if (fileSize < 0) {
      throw new Error('File size cannot be negative');
    }
    await this.updateMediaFile(id, { file_size: fileSize });
  }

  /**
   * Update duration for a media file
   */
  async updateDuration(id: string, durationSeconds: number): Promise<void> {
    if (durationSeconds < 0) {
      throw new Error('Duration cannot be negative');
    }
    await this.updateMediaFile(id, { duration_seconds: durationSeconds });
  }

  /**
   * Update verses for a media file
   */
  async updateVerses(id: string, verses: string): Promise<void> {
    if (!verses) {
      throw new Error('Verses data is required');
    }
    await this.updateMediaFile(id, { verses });
  }

  /**
   * Increment version for a media file
   */
  async incrementVersion(id: string): Promise<void> {
    if (!id) {
      throw new Error('Media file ID is required');
    }

    try {
      await this.databaseManager.executeQuery(
        'UPDATE media_files SET version = version + 1, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), id]
      );
    } catch (error) {
      logger.error('Error incrementing version:', error);
      throw new Error('Failed to increment version');
    }
  }

  /**
   * Update start verse ID for a media file
   */
  async updateStartVerseId(id: string, startVerseId: string): Promise<void> {
    if (!startVerseId) {
      throw new Error('Start verse ID is required');
    }
    await this.updateMediaFile(id, { start_verse_id: startVerseId });
  }

  /**
   * Update end verse ID for a media file
   */
  async updateEndVerseId(id: string, endVerseId: string): Promise<void> {
    if (!endVerseId) {
      throw new Error('End verse ID is required');
    }
    await this.updateMediaFile(id, { end_verse_id: endVerseId });
  }

  /**
   * Get media files by verse range
   */
  async getMediaFilesByVerseRange(
    startVerseId: string,
    endVerseId: string
  ): Promise<LocalMediaFile[]> {
    if (!startVerseId || !endVerseId) {
      throw new Error('Both start and end verse IDs are required');
    }

    try {
      return await this.databaseManager.executeQuery<LocalMediaFile>(
        `SELECT * FROM media_files 
         WHERE start_verse_id = ? AND end_verse_id = ? 
         AND deleted_at IS NULL 
         ORDER BY created_at ASC`,
        [startVerseId, endVerseId]
      );
    } catch (error) {
      logger.error('Error getting media files by verse range:', error);
      throw new Error('Failed to retrieve media files by verse range');
    }
  }

  /**
   * Get media files that contain a specific verse
   */
  async getMediaFilesContainingVerse(
    verseId: string
  ): Promise<LocalMediaFile[]> {
    if (!verseId) {
      throw new Error('Verse ID is required');
    }

    try {
      return await this.databaseManager.executeQuery<LocalMediaFile>(
        `SELECT * FROM media_files 
         WHERE (start_verse_id = ? OR end_verse_id = ? OR 
                (start_verse_id <= ? AND end_verse_id >= ?))
         AND deleted_at IS NULL 
         ORDER BY created_at ASC`,
        [verseId, verseId, verseId, verseId]
      );
    } catch (error) {
      logger.error('Error getting media files containing verse:', error);
      throw new Error('Failed to retrieve media files containing verse');
    }
  }
}

export const mediaFilesService = MediaFilesService.getInstance();
