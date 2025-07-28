import { ChapterQueueService, ChapterAudioInfo } from '../ChapterQueueService';
import { mediaFilesService } from '@/shared/services/database/MediaFilesService';
import { mediaFilesVersesService } from '@/shared/services/database/MediaFilesVersesService';

// Mock the services
jest.mock('@/shared/services/database/MediaFilesService');
jest.mock('@/shared/services/database/MediaFilesVersesService');
jest.mock('@/shared/utils/logger');

const mockMediaFilesService = mediaFilesService as jest.Mocked<
  typeof mediaFilesService
>;
const mockMediaFilesVersesService = mediaFilesVersesService as jest.Mocked<
  typeof mediaFilesVersesService
>;

describe('ChapterQueueService', () => {
  let service: ChapterQueueService;

  beforeEach(() => {
    service = new ChapterQueueService();
    jest.clearAllMocks();
  });

  describe('getChapterAudioInfo', () => {
    it('should return empty array when no media files exist', async () => {
      mockMediaFilesService.getMediaFiles.mockResolvedValue([]);

      const result = await service.getChapterAudioInfo();

      expect(result).toEqual([]);
      expect(mockMediaFilesService.getMediaFiles).toHaveBeenCalledWith({
        media_type: 'audio',
        include_deleted: false,
      });
    });

    it('should return chapter audio info when media files exist', async () => {
      const mockMediaFiles = [
        {
          id: 'mf1',
          chapter_id: 'ch1',
          duration_seconds: 120,
          file_size: 1024000,
          verses: '["v1", "v2"]',
        } as any,
        {
          id: 'mf2',
          chapter_id: 'ch1',
          duration_seconds: 180,
          file_size: 1536000,
          verses: '["v3", "v4"]',
        } as any,
      ];

      const mockMediaFileVerses = [
        {
          id: 'mfv1',
          media_file_id: 'mf1',
          verse_id: 'v1',
          start_time_seconds: 0,
        },
        {
          id: 'mfv2',
          media_file_id: 'mf1',
          verse_id: 'v2',
          start_time_seconds: 60,
        },
        {
          id: 'mfv3',
          media_file_id: 'mf2',
          verse_id: 'v3',
          start_time_seconds: 0,
        },
        {
          id: 'mfv4',
          media_file_id: 'mf2',
          verse_id: 'v4',
          start_time_seconds: 90,
        },
      ] as any[];

      mockMediaFilesService.getMediaFiles.mockResolvedValue(mockMediaFiles);
      mockMediaFilesVersesService.getMediaFilesVersesByMediaFileId
        .mockResolvedValueOnce([mockMediaFileVerses[0], mockMediaFileVerses[1]])
        .mockResolvedValueOnce([
          mockMediaFileVerses[2],
          mockMediaFileVerses[3],
        ]);

      const result = await service.getChapterAudioInfo();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        chapterId: 'ch1',
        hasAudioFiles: true,
        hasVersesMarked: true,
        mediaFiles: mockMediaFiles,
        mediaFileVerses: mockMediaFileVerses,
        totalDuration: 300,
        totalFileSize: 2560000,
        verseCount: 4,
        audioFileCount: 2,
        localPaths: [],
      });
    });

    it('should filter by language entity ID when provided', async () => {
      mockMediaFilesService.getMediaFiles.mockResolvedValue([]);

      await service.getChapterAudioInfo({ languageEntityId: 'lang1' });

      expect(mockMediaFilesService.getMediaFiles).toHaveBeenCalledWith({
        language_entity_id: 'lang1',
        media_type: 'audio',
        include_deleted: false,
      });
    });
  });

  describe('getChapterAudioInfoById', () => {
    it('should return chapter audio info for specific chapter', async () => {
      const mockMediaFiles = [
        {
          id: 'mf1',
          chapter_id: 'ch1',
          duration_seconds: 120,
          file_size: 1024000,
          verses: '["v1", "v2"]',
        } as any,
      ];

      const mockMediaFileVerses = [
        {
          id: 'mfv1',
          media_file_id: 'mf1',
          verse_id: 'v1',
          start_time_seconds: 0,
        },
        {
          id: 'mfv2',
          media_file_id: 'mf1',
          verse_id: 'v2',
          start_time_seconds: 60,
        },
      ] as any[];

      mockMediaFilesService.getMediaFilesByChapterId.mockResolvedValue(
        mockMediaFiles
      );
      mockMediaFilesVersesService.getMediaFilesVersesByMediaFileId.mockResolvedValue(
        mockMediaFileVerses
      );

      const result = await service.getChapterAudioInfoById('ch1');

      expect(result).toEqual({
        chapterId: 'ch1',
        hasAudioFiles: true,
        hasVersesMarked: true,
        mediaFiles: mockMediaFiles,
        mediaFileVerses: mockMediaFileVerses,
        totalDuration: 120,
        totalFileSize: 1024000,
        verseCount: 2,
        audioFileCount: 1,
        localPaths: [],
      });
    });

    it('should return chapter info with no audio when no media files exist', async () => {
      mockMediaFilesService.getMediaFilesByChapterId.mockResolvedValue([]);

      const result = await service.getChapterAudioInfoById('ch1');

      expect(result).toEqual({
        chapterId: 'ch1',
        hasAudioFiles: false,
        hasVersesMarked: false,
        mediaFiles: [],
        mediaFileVerses: [],
        totalDuration: 0,
        totalFileSize: 0,
        verseCount: 0,
        audioFileCount: 0,
        localPaths: [],
      });
    });
  });

  describe('getChaptersWithAudio', () => {
    it('should return chapter IDs that have audio files', async () => {
      const mockChapterAudioInfo = [
        { chapterId: 'ch1', hasAudioFiles: true } as ChapterAudioInfo,
        { chapterId: 'ch2', hasAudioFiles: false } as ChapterAudioInfo,
        { chapterId: 'ch3', hasAudioFiles: true } as ChapterAudioInfo,
      ];

      jest
        .spyOn(service, 'getChapterAudioInfo')
        .mockResolvedValue(mockChapterAudioInfo);

      const result = await service.getChaptersWithAudio();

      expect(result).toEqual(['ch1', 'ch3']);
    });
  });

  describe('getChaptersWithAudioAndVerses', () => {
    it('should return chapter IDs that have both audio files and verses', async () => {
      const mockChapterAudioInfo = [
        {
          chapterId: 'ch1',
          hasAudioFiles: true,
          hasVersesMarked: true,
        } as ChapterAudioInfo,
        {
          chapterId: 'ch2',
          hasAudioFiles: true,
          hasVersesMarked: false,
        } as ChapterAudioInfo,
        {
          chapterId: 'ch3',
          hasAudioFiles: false,
          hasVersesMarked: true,
        } as ChapterAudioInfo,
        {
          chapterId: 'ch4',
          hasAudioFiles: true,
          hasVersesMarked: true,
        } as ChapterAudioInfo,
      ];

      jest
        .spyOn(service, 'getChapterAudioInfo')
        .mockResolvedValue(mockChapterAudioInfo);

      const result = await service.getChaptersWithAudioAndVerses();

      expect(result).toEqual(['ch1', 'ch4']);
    });
  });

  describe('getAudioAvailabilityStats', () => {
    it('should return correct statistics', async () => {
      const mockChapterAudioInfo = [
        {
          chapterId: 'ch1',
          hasAudioFiles: true,
          hasVersesMarked: true,
          totalDuration: 120,
          totalFileSize: 1024000,
          verseCount: 2,
          audioFileCount: 1,
        } as ChapterAudioInfo,
        {
          chapterId: 'ch2',
          hasAudioFiles: true,
          hasVersesMarked: false,
          totalDuration: 180,
          totalFileSize: 1536000,
          verseCount: 0,
          audioFileCount: 1,
        } as ChapterAudioInfo,
        {
          chapterId: 'ch3',
          hasAudioFiles: false,
          hasVersesMarked: false,
          totalDuration: 0,
          totalFileSize: 0,
          verseCount: 0,
          audioFileCount: 0,
        } as ChapterAudioInfo,
      ];

      jest
        .spyOn(service, 'getChapterAudioInfo')
        .mockResolvedValue(mockChapterAudioInfo);

      const result = await service.getAudioAvailabilityStats();

      expect(result).toEqual({
        totalChapters: 3,
        chaptersWithAudio: 2,
        chaptersWithVerses: 1,
        totalAudioFiles: 2,
        totalDuration: 300,
        totalFileSize: 2560000,
        totalVerses: 2,
      });
    });
  });
});
