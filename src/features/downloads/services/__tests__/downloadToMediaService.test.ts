import { DownloadToMediaService } from '../downloadToMediaService';
import { MediaFilesService } from '@/shared/services/database/MediaFilesService';
import { FileDownloadProgress } from '../../hooks/useDownloadProgress';
import MediaFilesVersesSyncService from '@/shared/services/sync/media/MediaFilesVersesSyncService';

// Mock dependencies
jest.mock('@/shared/services/database/MediaFilesService');
jest.mock('@/shared/services/sync/media/MediaFilesVersesSyncService');

// Create a mock instance
const mockMediaFilesServiceInstance = {
  getMediaFileById: jest.fn(),
  saveMediaFile: jest.fn(),
  updateLocalPath: jest.fn(),
  updateFileSize: jest.fn(),
  databaseManager: {
    getDatabase: jest.fn(),
  },
};

// Create a mock instance for MediaFilesVersesSyncService
const mockMediaFilesVersesSyncServiceInstance = {
  syncForMediaFile: jest.fn(),
};

// Mock the getInstance methods
const mockGetInstance = jest
  .fn()
  .mockReturnValue(mockMediaFilesServiceInstance);
const mockGetVersesSyncInstance = jest
  .fn()
  .mockReturnValue(mockMediaFilesVersesSyncServiceInstance);
(MediaFilesService.getInstance as jest.MockedFunction<any>) = mockGetInstance;
(MediaFilesVersesSyncService.getInstance as jest.MockedFunction<any>) =
  mockGetVersesSyncInstance;

// Mock the DownloadToMediaService constructor to inject our mock
jest.mock('../downloadToMediaService', () => {
  const originalModule = jest.requireActual('../downloadToMediaService');
  return {
    ...originalModule,
    DownloadToMediaService: class MockDownloadToMediaService extends originalModule.DownloadToMediaService {
      constructor() {
        super();
        // Override the mediaFilesService with our mock
        (this as any).mediaFilesService = mockMediaFilesServiceInstance;
        // Override the mediaFilesVersesSyncService with our mock
        (this as any).mediaFilesVersesSyncService =
          mockMediaFilesVersesSyncServiceInstance;
      }
    },
  };
});

describe('DownloadToMediaService', () => {
  let service: DownloadToMediaService;

  beforeEach(() => {
    service = DownloadToMediaService.getInstance();
    jest.clearAllMocks();
  });

  describe('addCompletedDownloadToMedia', () => {
    it('should successfully add a completed download to media files table', async () => {
      const mockGetDatabase = mockMediaFilesServiceInstance.databaseManager
        .getDatabase as jest.MockedFunction<any>;
      const mockSaveMediaFile =
        mockMediaFilesServiceInstance.saveMediaFile as jest.MockedFunction<any>;
      const mockGetMediaFileById =
        mockMediaFilesServiceInstance.getMediaFileById as jest.MockedFunction<any>;

      // Mock database operations
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(1) // Test database connection
          .mockResolvedValueOnce({ name: 'media_files' }), // Table exists check
        execAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockGetDatabase.mockResolvedValue(mockDb);
      mockGetMediaFileById.mockResolvedValue(null); // File doesn't exist
      mockSaveMediaFile.mockResolvedValue(undefined);

      const completedFile: FileDownloadProgress = {
        filePath: 'https://example.com/audio.mp3',
        fileName: 'chapter_1_1.mp3',
        progress: 1,
        status: 'completed',
        fileSize: 1024000,
      };

      const originalSearchResult = {
        id: 'test-media-file-1',
        language_entity_id: 'test-lang',
        sequence_id: 'test-seq',
        media_type: 'audio',
        file_size: 1024000,
        duration_seconds: 120,
        chapter_id: 'test-chapter',
        start_verse_id: 'test-chapter_1',
        end_verse_id: 'test-chapter_10',
        upload_status: 'completed',
        publish_status: 'published',
        check_status: 'checked',
        version: 1,
      };

      const options = {
        chapterId: 'test-chapter',
        mediaType: 'audio',
        uploadStatus: 'completed',
        publishStatus: 'published',
        checkStatus: 'checked',
        version: 1,
      };

      const result = await service.addCompletedDownloadToMedia(
        completedFile,
        originalSearchResult,
        options
      );

      expect(result.success).toBe(true);
      expect(result.mediaFileId).toBe('test-media-file-1');
      expect(mockSaveMediaFile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-media-file-1',
          language_entity_id: 'test-lang',
          sequence_id: 'test-seq',
          media_type: 'audio',
          local_path: 'chapter_1_1.mp3',
          remote_path: 'https://example.com/audio.mp3',
          file_size: 1024000,
          duration_seconds: 120,
          chapter_id: 'test-chapter',
          upload_status: 'completed',
          publish_status: 'published',
          check_status: 'checked',
          version: 1,
        })
      );
    });

    it('should update existing media file if it already exists', async () => {
      const mockGetDatabase = mockMediaFilesServiceInstance.databaseManager
        .getDatabase as jest.MockedFunction<any>;
      const mockUpdateLocalPath =
        mockMediaFilesServiceInstance.updateLocalPath as jest.MockedFunction<any>;
      const mockUpdateFileSize =
        mockMediaFilesServiceInstance.updateFileSize as jest.MockedFunction<any>;
      const mockGetMediaFileById =
        mockMediaFilesServiceInstance.getMediaFileById as jest.MockedFunction<any>;

      // Mock database operations
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(1) // Test database connection
          .mockResolvedValueOnce({ name: 'media_files' }), // Table exists check
      };
      mockGetDatabase.mockResolvedValue(mockDb);

      // Mock existing file
      mockGetMediaFileById.mockResolvedValue({
        id: 'test-media-file-1',
        local_path: 'old-path.mp3',
        file_size: 512000,
      });

      mockUpdateLocalPath.mockResolvedValue(undefined);
      mockUpdateFileSize.mockResolvedValue(undefined);

      const completedFile: FileDownloadProgress = {
        filePath: 'https://example.com/audio.mp3',
        fileName: 'chapter_1_1.mp3',
        progress: 1,
        status: 'completed',
        fileSize: 1024000,
      };

      const originalSearchResult = {
        id: 'test-media-file-1',
        language_entity_id: 'test-lang',
        sequence_id: 'test-seq',
        media_type: 'audio',
        file_size: 1024000,
        duration_seconds: 120,
        chapter_id: 'test-chapter',
      };

      const result = await service.addCompletedDownloadToMedia(
        completedFile,
        originalSearchResult,
        {}
      );

      expect(result.success).toBe(true);
      expect(result.mediaFileId).toBe('test-media-file-1');
      expect(mockUpdateLocalPath).toHaveBeenCalledWith(
        'test-media-file-1',
        'chapter_1_1.mp3'
      );
      expect(mockUpdateFileSize).toHaveBeenCalledWith(
        'test-media-file-1',
        1024000
      );
    });

    it('should handle missing required fields gracefully', async () => {
      const mockGetDatabase = mockMediaFilesServiceInstance.databaseManager
        .getDatabase as jest.MockedFunction<any>;

      // Mock database operations
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(1) // Test database connection
          .mockResolvedValueOnce({ name: 'media_files' }), // Table exists check
      };
      mockGetDatabase.mockResolvedValue(mockDb);

      const completedFile: FileDownloadProgress = {
        filePath: 'https://example.com/audio.mp3',
        fileName: 'chapter_1_1.mp3',
        progress: 1,
        status: 'completed',
        fileSize: 1024000,
      };

      // Search result with missing ID
      const originalSearchResult = {
        language_entity_id: 'test-lang',
        sequence_id: 'test-seq',
        media_type: 'audio',
        file_size: 1024000,
        duration_seconds: 120,
        chapter_id: 'test-chapter',
      };

      const result = await service.addCompletedDownloadToMedia(
        completedFile,
        originalSearchResult,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Remote ID is required from search result'
      );
    });

    it('should generate fallback values for missing fields', async () => {
      const mockGetDatabase = mockMediaFilesServiceInstance.databaseManager
        .getDatabase as jest.MockedFunction<any>;
      const mockSaveMediaFile =
        mockMediaFilesServiceInstance.saveMediaFile as jest.MockedFunction<any>;
      const mockGetMediaFileById =
        mockMediaFilesServiceInstance.getMediaFileById as jest.MockedFunction<any>;

      // Mock database operations
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(1) // Test database connection
          .mockResolvedValueOnce({ name: 'media_files' }), // Table exists check
        execAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockGetDatabase.mockResolvedValue(mockDb);
      mockGetMediaFileById.mockResolvedValue(null); // File doesn't exist
      mockSaveMediaFile.mockResolvedValue(undefined);

      const completedFile: FileDownloadProgress = {
        filePath: 'https://example.com/audio.mp3',
        fileName: 'chapter_1_1.mp3',
        progress: 1,
        status: 'completed',
        fileSize: 1024000,
      };

      // Search result with minimal data
      const originalSearchResult = {
        id: 'test-media-file-1',
        // Missing language_entity_id, sequence_id, etc.
      };

      const result = await service.addCompletedDownloadToMedia(
        completedFile,
        originalSearchResult,
        {}
      );

      expect(result.success).toBe(true);
      expect(mockSaveMediaFile).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-media-file-1',
          language_entity_id: expect.stringMatching(
            /^fallback_test-media-file-1_\d+$/
          ),
          sequence_id: expect.stringMatching(
            /^generated_test-media-file-1_\d+$/
          ),
          media_type: 'audio',
          local_path: 'chapter_1_1.mp3',
          remote_path: 'https://example.com/audio.mp3',
          file_size: 1024000,
          upload_status: 'completed',
          publish_status: 'published',
          check_status: 'checked',
          version: 1,
        })
      );
    });
  });

  describe('addCompletedDownloadsToMedia', () => {
    it('should process multiple downloads successfully', async () => {
      const mockGetDatabase = mockMediaFilesServiceInstance.databaseManager
        .getDatabase as jest.MockedFunction<any>;
      const mockSaveMediaFile =
        mockMediaFilesServiceInstance.saveMediaFile as jest.MockedFunction<any>;
      const mockGetMediaFileById =
        mockMediaFilesServiceInstance.getMediaFileById as jest.MockedFunction<any>;

      // Mock database operations
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(1) // Test database connection
          .mockResolvedValueOnce({ name: 'media_files' }), // Table exists check
        execAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockGetDatabase.mockResolvedValue(mockDb);
      mockGetMediaFileById.mockResolvedValue(null); // Files don't exist
      mockSaveMediaFile.mockResolvedValue(undefined);

      const completedFiles: FileDownloadProgress[] = [
        {
          filePath: 'https://example.com/audio1.mp3',
          fileName: 'chapter_1_1.mp3',
          progress: 1,
          status: 'completed',
          fileSize: 1024000,
        },
        {
          filePath: 'https://example.com/audio2.mp3',
          fileName: 'chapter_1_2.mp3',
          progress: 1,
          status: 'completed',
          fileSize: 2048000,
        },
      ];

      const originalSearchResults = [
        {
          id: 'test-media-file-1',
          language_entity_id: 'test-lang',
          sequence_id: 'test-seq-1',
          media_type: 'audio',
          file_size: 1024000,
          duration_seconds: 120,
          chapter_id: 'test-chapter',
        },
        {
          id: 'test-media-file-2',
          language_entity_id: 'test-lang',
          sequence_id: 'test-seq-2',
          media_type: 'audio',
          file_size: 2048000,
          duration_seconds: 240,
          chapter_id: 'test-chapter',
        },
      ];

      const result = await service.addCompletedDownloadsToMedia(
        completedFiles,
        originalSearchResults,
        {}
      );

      expect(result.success).toBe(true);
      expect(result.successfulCount).toBe(2);
      expect(result.failedCount).toBe(0);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[1]?.success).toBe(true);
    });

    it('should handle missing search results gracefully', async () => {
      const completedFiles: FileDownloadProgress[] = [
        {
          filePath: 'https://example.com/audio1.mp3',
          fileName: 'chapter_1_1.mp3',
          progress: 1,
          status: 'completed',
          fileSize: 1024000,
        },
      ];

      const originalSearchResults: any[] = []; // Empty array

      const result = await service.addCompletedDownloadsToMedia(
        completedFiles,
        originalSearchResults,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.successfulCount).toBe(0);
      expect(result.failedCount).toBe(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('No original search result found');
    });
  });

  describe('verses sync functionality', () => {
    it('should automatically sync verses data after successful media file creation', async () => {
      const mockGetDatabase = mockMediaFilesServiceInstance.databaseManager
        .getDatabase as jest.MockedFunction<any>;
      const mockSaveMediaFile =
        mockMediaFilesServiceInstance.saveMediaFile as jest.MockedFunction<any>;
      const mockGetMediaFileById =
        mockMediaFilesServiceInstance.getMediaFileById as jest.MockedFunction<any>;
      const mockSyncForMediaFile =
        mockMediaFilesVersesSyncServiceInstance.syncForMediaFile as jest.MockedFunction<any>;

      // Mock database operations
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(1) // Test database connection
          .mockResolvedValueOnce({ name: 'media_files' }), // Table exists check
        execAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockGetDatabase.mockResolvedValue(mockDb);
      mockGetMediaFileById.mockResolvedValue(null); // File doesn't exist
      mockSaveMediaFile.mockResolvedValue(undefined);

      // Mock verses sync to return success
      mockSyncForMediaFile.mockResolvedValue([
        {
          success: true,
          tableName: 'media_files_verses',
          recordsSynced: 5,
        },
      ]);

      const completedFile: FileDownloadProgress = {
        filePath: 'https://example.com/audio.mp3',
        fileName: 'chapter_1_1.mp3',
        progress: 1,
        status: 'completed',
        fileSize: 1024000,
      };

      const originalSearchResult = {
        id: 'test-media-file-1',
        language_entity_id: 'test-lang',
        sequence_id: 'test-seq',
        media_type: 'audio',
        file_size: 1024000,
        duration_seconds: 120,
        chapter_id: 'test-chapter',
        upload_status: 'completed',
        publish_status: 'published',
        check_status: 'checked',
        version: 1,
      };

      const options = {
        chapterId: 'test-chapter',
        mediaType: 'audio',
        syncVersesData: true, // Enable verses sync
      };

      const result = await service.addCompletedDownloadToMedia(
        completedFile,
        originalSearchResult,
        options
      );

      expect(result.success).toBe(true);
      expect(result.mediaFileId).toBe('test-media-file-1');

      // Verify that verses sync was called
      expect(mockSyncForMediaFile).toHaveBeenCalledWith('test-media-file-1');
      expect(mockSyncForMediaFile).toHaveBeenCalledTimes(1);
    });

    it('should not sync verses data when syncVersesData is false', async () => {
      const mockGetDatabase = mockMediaFilesServiceInstance.databaseManager
        .getDatabase as jest.MockedFunction<any>;
      const mockSaveMediaFile =
        mockMediaFilesServiceInstance.saveMediaFile as jest.MockedFunction<any>;
      const mockGetMediaFileById =
        mockMediaFilesServiceInstance.getMediaFileById as jest.MockedFunction<any>;
      const mockSyncForMediaFile =
        mockMediaFilesVersesSyncServiceInstance.syncForMediaFile as jest.MockedFunction<any>;

      // Mock database operations
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(1) // Test database connection
          .mockResolvedValueOnce({ name: 'media_files' }), // Table exists check
        execAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockGetDatabase.mockResolvedValue(mockDb);
      mockGetMediaFileById.mockResolvedValue(null); // File doesn't exist
      mockSaveMediaFile.mockResolvedValue(undefined);

      const completedFile: FileDownloadProgress = {
        filePath: 'https://example.com/audio.mp3',
        fileName: 'chapter_1_1.mp3',
        progress: 1,
        status: 'completed',
        fileSize: 1024000,
      };

      const originalSearchResult = {
        id: 'test-media-file-1',
        language_entity_id: 'test-lang',
        sequence_id: 'test-seq',
        media_type: 'audio',
        file_size: 1024000,
        duration_seconds: 120,
        chapter_id: 'test-chapter',
        upload_status: 'completed',
        publish_status: 'published',
        check_status: 'checked',
        version: 1,
      };

      const options = {
        chapterId: 'test-chapter',
        mediaType: 'audio',
        syncVersesData: false, // Disable verses sync
      };

      const result = await service.addCompletedDownloadToMedia(
        completedFile,
        originalSearchResult,
        options
      );

      expect(result.success).toBe(true);
      expect(result.mediaFileId).toBe('test-media-file-1');

      // Verify that verses sync was NOT called
      expect(mockSyncForMediaFile).not.toHaveBeenCalled();
    });

    it('should handle verses sync errors gracefully without failing the download', async () => {
      const mockGetDatabase = mockMediaFilesServiceInstance.databaseManager
        .getDatabase as jest.MockedFunction<any>;
      const mockSaveMediaFile =
        mockMediaFilesServiceInstance.saveMediaFile as jest.MockedFunction<any>;
      const mockGetMediaFileById =
        mockMediaFilesServiceInstance.getMediaFileById as jest.MockedFunction<any>;
      const mockSyncForMediaFile =
        mockMediaFilesVersesSyncServiceInstance.syncForMediaFile as jest.MockedFunction<any>;

      // Mock database operations
      const mockDb = {
        getFirstAsync: jest
          .fn()
          .mockResolvedValueOnce(1) // Test database connection
          .mockResolvedValueOnce({ name: 'media_files' }), // Table exists check
        execAsync: jest.fn().mockResolvedValue(undefined),
      };
      mockGetDatabase.mockResolvedValue(mockDb);
      mockGetMediaFileById.mockResolvedValue(null); // File doesn't exist
      mockSaveMediaFile.mockResolvedValue(undefined);

      // Mock verses sync to throw an error
      mockSyncForMediaFile.mockRejectedValue(new Error('Sync failed'));

      const completedFile: FileDownloadProgress = {
        filePath: 'https://example.com/audio.mp3',
        fileName: 'chapter_1_1.mp3',
        progress: 1,
        status: 'completed',
        fileSize: 1024000,
      };

      const originalSearchResult = {
        id: 'test-media-file-1',
        language_entity_id: 'test-lang',
        sequence_id: 'test-seq',
        media_type: 'audio',
        file_size: 1024000,
        duration_seconds: 120,
        chapter_id: 'test-chapter',
        upload_status: 'completed',
        publish_status: 'published',
        check_status: 'checked',
        version: 1,
      };

      const options = {
        chapterId: 'test-chapter',
        mediaType: 'audio',
        syncVersesData: true, // Enable verses sync
      };

      const result = await service.addCompletedDownloadToMedia(
        completedFile,
        originalSearchResult,
        options
      );

      expect(result.success).toBe(true);
      expect(result.mediaFileId).toBe('test-media-file-1');

      // Verify that verses sync was called (even though it failed)
      expect(mockSyncForMediaFile).toHaveBeenCalledWith('test-media-file-1');
      expect(mockSyncForMediaFile).toHaveBeenCalledTimes(1);
    });
  });
});
