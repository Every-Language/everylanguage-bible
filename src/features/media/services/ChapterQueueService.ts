import { mediaFilesService } from '@/shared/services/database/MediaFilesService';
import { mediaFilesVersesService } from '@/shared/services/database/MediaFilesVersesService';
import DatabaseManager from '@/shared/services/database/DatabaseManager';
import { logger } from '@/shared/utils/logger';
import type {
  LocalMediaFile,
  LocalMediaFileVerse,
} from '@/shared/services/database/schema';

export interface ChapterAudioInfo {
  chapterId: string;
  hasAudioFiles: boolean;
  hasVersesMarked: boolean;
  mediaFiles: LocalMediaFile[];
  mediaFileVerses: LocalMediaFileVerse[];
  totalDuration: number;
  totalFileSize: number;
  verseCount: number;
  audioFileCount: number;
  localPaths: string[];
}

export interface ChapterQueueOptions {
  languageEntityId?: string;
  mediaType?: string;
  includeDeleted?: boolean;
  sortBy?: 'chapter' | 'duration' | 'fileSize' | 'verseCount';
  sortDirection?: 'asc' | 'desc';
}

export class ChapterQueueService {
  /**
   * Get audio information for all chapters that have downloaded media files
   */
  async getChapterAudioInfo(
    options: ChapterQueueOptions = {}
  ): Promise<ChapterAudioInfo[]> {
    try {
      logger.info('Getting chapter audio information...', options);

      // Get all media files with optional filtering
      const filters: any = {
        media_type: options.mediaType || 'audio',
        include_deleted: options.includeDeleted || false,
      };

      if (options.languageEntityId) {
        filters.language_entity_id = options.languageEntityId;
      }

      const mediaFiles = await mediaFilesService.getMediaFiles(filters);

      if (!mediaFiles || mediaFiles.length === 0) {
        logger.info('No media files found');
        return [];
      }

      // Group media files by chapter
      const chapterGroups = this.groupMediaFilesByChapter(mediaFiles);
      logger.info(
        `Found media files for ${Object.keys(chapterGroups).length} chapters`
      );

      // Get audio information for each chapter
      const chapterAudioInfo: ChapterAudioInfo[] = [];

      for (const [chapterId, mediaFiles] of Object.entries(chapterGroups)) {
        const audioInfo = await this.getChapterAudioInfoById(
          chapterId,
          mediaFiles
        );
        chapterAudioInfo.push(audioInfo);
      }

      // Sort results
      const sortedResults = this.sortChapterAudioInfo(
        chapterAudioInfo,
        options
      );

      logger.info(
        `Generated audio information for ${sortedResults.length} chapters`
      );
      return sortedResults;
    } catch (error) {
      logger.error('Error getting chapter audio information:', error);
      throw new Error('Failed to get chapter audio information');
    }
  }

  /**
   * Get audio information for a specific chapter
   */
  async getChapterAudioInfoById(
    chapterId: string,
    mediaFiles?: LocalMediaFile[]
  ): Promise<ChapterAudioInfo> {
    try {
      // If media files not provided, fetch them
      if (!mediaFiles) {
        mediaFiles =
          await mediaFilesService.getMediaFilesByChapterId(chapterId);
      }

      const hasAudioFiles = mediaFiles.length > 0;
      let mediaFileVerses: LocalMediaFileVerse[] = [];
      let hasVersesMarked = false;

      if (hasAudioFiles) {
        // Get all media file verses for this chapter's media files
        const mediaFileIds = mediaFiles.map(mf => mf.id);
        mediaFileVerses =
          await this.getMediaFileVersesForMediaFiles(mediaFileIds);
        hasVersesMarked = mediaFileVerses.length > 0;
      }

      // Calculate totals
      const totalDuration = mediaFiles.reduce(
        (sum, mf) => sum + (mf.duration_seconds || 0),
        0
      );
      const totalFileSize = mediaFiles.reduce(
        (sum, mf) => sum + (mf.file_size || 0),
        0
      );
      const verseCount = mediaFileVerses.length;
      const audioFileCount = mediaFiles.length;
      const localPaths = mediaFiles
        .map(mf => mf.local_path)
        .filter(path => path);

      return {
        chapterId,
        hasAudioFiles,
        hasVersesMarked,
        mediaFiles,
        mediaFileVerses,
        totalDuration,
        totalFileSize,
        verseCount,
        audioFileCount,
        localPaths,
      };
    } catch (error) {
      logger.error(
        `Error getting audio information for chapter ${chapterId}:`,
        error
      );
      throw new Error(
        `Failed to get audio information for chapter ${chapterId}`
      );
    }
  }

  /**
   * Get chapters that have audio files available
   */
  async getChaptersWithAudio(
    options: ChapterQueueOptions = {}
  ): Promise<string[]> {
    try {
      const chapterAudioInfo = await this.getChapterAudioInfo(options);
      return chapterAudioInfo
        .filter(info => info.hasAudioFiles)
        .map(info => info.chapterId);
    } catch (error) {
      logger.error('Error getting chapters with audio:', error);
      throw new Error('Failed to get chapters with audio');
    }
  }

  /**
   * Get chapters that have both audio files and verses marked
   */
  async getChaptersWithAudioAndVerses(
    options: ChapterQueueOptions = {}
  ): Promise<string[]> {
    try {
      const chapterAudioInfo = await this.getChapterAudioInfo(options);
      return chapterAudioInfo
        .filter(info => info.hasAudioFiles && info.hasVersesMarked)
        .map(info => info.chapterId);
    } catch (error) {
      logger.error('Error getting chapters with audio and verses:', error);
      throw new Error('Failed to get chapters with audio and verses');
    }
  }

  /**
   * Get detailed media file and verse information for a chapter
   */
  async getChapterMediaDetails(chapterId: string): Promise<{
    mediaFiles: LocalMediaFile[];
    mediaFileVerses: LocalMediaFileVerse[];
    versesWithTiming: Array<{
      verseId: string;
      startTime: number;
      mediaFileId: string;
      mediaFile: LocalMediaFile;
      localPath: string;
    }>;
  }> {
    try {
      const audioInfo = await this.getChapterAudioInfoById(chapterId);

      // Create verses with timing information
      const versesWithTiming = audioInfo.mediaFileVerses
        .map(mfv => {
          const mediaFile = audioInfo.mediaFiles.find(
            mf => mf.id === mfv.media_file_id
          );
          if (!mediaFile) {
            logger.warn(`Media file not found for verse ${mfv.verse_id}`);
            return null;
          }
          return {
            verseId: mfv.verse_id,
            startTime: mfv.start_time_seconds,
            mediaFileId: mfv.media_file_id,
            mediaFile: mediaFile,
            localPath: mediaFile.local_path,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((a, b) => a.startTime - b.startTime);

      return {
        mediaFiles: audioInfo.mediaFiles,
        mediaFileVerses: audioInfo.mediaFileVerses,
        versesWithTiming,
      };
    } catch (error) {
      logger.error(
        `Error getting media details for chapter ${chapterId}:`,
        error
      );
      throw new Error(`Failed to get media details for chapter ${chapterId}`);
    }
  }

  /**
   * Get statistics about audio availability across all chapters
   */
  async getAudioAvailabilityStats(options: ChapterQueueOptions = {}): Promise<{
    totalChapters: number;
    chaptersWithAudio: number;
    chaptersWithVerses: number;
    totalAudioFiles: number;
    totalDuration: number;
    totalFileSize: number;
    totalVerses: number;
    totalBooks: number;
    totalChaptersInDatabase: number;
    totalVersesInDatabase: number;
  }> {
    try {
      const databaseManager = DatabaseManager.getInstance();
      const chapterAudioInfo = await this.getChapterAudioInfo(options);

      // Get total counts from database tables
      const [booksResult, chaptersResult, versesResult] = await Promise.all([
        databaseManager.executeQuery<{ count: number }>(
          'SELECT COUNT(*) as count FROM books'
        ),
        databaseManager.executeQuery<{ count: number }>(
          'SELECT COUNT(*) as count FROM chapters'
        ),
        databaseManager.executeQuery<{ count: number }>(
          'SELECT COUNT(*) as count FROM verses'
        ),
      ]);

      const totalBooks = booksResult?.[0]?.count || 0;
      const totalChaptersInDatabase = chaptersResult?.[0]?.count || 0;
      const totalVersesInDatabase = versesResult?.[0]?.count || 0;

      const chaptersWithAudio = chapterAudioInfo.filter(
        info => info.hasAudioFiles
      ).length;
      const chaptersWithVerses = chapterAudioInfo.filter(
        info => info.hasVersesMarked
      ).length;
      const totalAudioFiles = chapterAudioInfo.reduce(
        (sum, info) => sum + info.audioFileCount,
        0
      );
      const totalDuration = chapterAudioInfo.reduce(
        (sum, info) => sum + info.totalDuration,
        0
      );
      const totalFileSize = chapterAudioInfo.reduce(
        (sum, info) => sum + info.totalFileSize,
        0
      );
      const totalVerses = chapterAudioInfo.reduce(
        (sum, info) => sum + info.verseCount,
        0
      );

      return {
        totalChapters: chapterAudioInfo.length,
        chaptersWithAudio,
        chaptersWithVerses,
        totalAudioFiles,
        totalDuration,
        totalFileSize,
        totalVerses,
        totalBooks,
        totalChaptersInDatabase,
        totalVersesInDatabase,
      };
    } catch (error) {
      logger.error('Error getting audio availability stats:', error);
      throw new Error('Failed to get audio availability stats');
    }
  }

  /**
   * Group media files by chapter ID
   */
  private groupMediaFilesByChapter(
    mediaFiles: LocalMediaFile[]
  ): Record<string, LocalMediaFile[]> {
    const groups: Record<string, LocalMediaFile[]> = {};

    for (const mediaFile of mediaFiles) {
      const chapterId = mediaFile.chapter_id;
      if (chapterId) {
        if (!groups[chapterId]) {
          groups[chapterId] = [];
        }
        groups[chapterId].push(mediaFile);
      }
    }

    return groups;
  }

  /**
   * Get media file verses for multiple media files
   */
  private async getMediaFileVersesForMediaFiles(
    mediaFileIds: string[]
  ): Promise<LocalMediaFileVerse[]> {
    try {
      if (mediaFileIds.length === 0) {
        return [];
      }

      // Get all media file verses for these media files
      const allVerses: LocalMediaFileVerse[] = [];

      for (const mediaFileId of mediaFileIds) {
        const verses =
          await mediaFilesVersesService.getMediaFilesVersesByMediaFileId(
            mediaFileId
          );
        allVerses.push(...verses);
      }

      return allVerses;
    } catch (error) {
      logger.error('Error getting media file verses for media files:', error);
      throw new Error('Failed to get media file verses');
    }
  }

  /**
   * Sort chapter audio information based on options
   */
  private sortChapterAudioInfo(
    chapterAudioInfo: ChapterAudioInfo[],
    options: ChapterQueueOptions
  ): ChapterAudioInfo[] {
    const { sortBy = 'chapter', sortDirection = 'asc' } = options;

    return [...chapterAudioInfo].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'chapter':
          comparison = a.chapterId.localeCompare(b.chapterId);
          break;
        case 'duration':
          comparison = a.totalDuration - b.totalDuration;
          break;
        case 'fileSize':
          comparison = a.totalFileSize - b.totalFileSize;
          break;
        case 'verseCount':
          comparison = a.verseCount - b.verseCount;
          break;
        default:
          comparison = a.chapterId.localeCompare(b.chapterId);
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }
}

export const chapterQueueService = new ChapterQueueService();
