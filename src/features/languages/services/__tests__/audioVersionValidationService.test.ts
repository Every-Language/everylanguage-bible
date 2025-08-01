import { audioVersionValidationService } from '../audioVersionValidationService';
import { AudioVersion } from '../../types';

describe('AudioVersionValidationService', () => {
  const mockAudioVersion: AudioVersion = {
    id: 'test-version-1',
    name: 'Test Audio Version',
    languageEntityId: 'test-language-1',
    languageName: 'Test Language',
    mediaFileCount: 100,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  describe('validateAudioVersion', () => {
    it('should return valid result for valid audio version', async () => {
      const result =
        await audioVersionValidationService.validateAudioVersion(
          mockAudioVersion
        );

      expect(result.isValid).toBe(true);
      expect(result.currentVersion).toBe(mockAudioVersion);
      expect(result.requiresVersionSelection).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid result for null audio version', async () => {
      const result =
        await audioVersionValidationService.validateAudioVersion(null);

      expect(result.isValid).toBe(false);
      expect(result.currentVersion).toBeNull();
      expect(result.requiresVersionSelection).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should return invalid result for audio version without id', async () => {
      const invalidVersion = { ...mockAudioVersion, id: '' };
      const result =
        await audioVersionValidationService.validateAudioVersion(
          invalidVersion
        );

      expect(result.isValid).toBe(false);
      expect(result.currentVersion).toBe(invalidVersion);
      expect(result.requiresVersionSelection).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should return invalid result for audio version without name', async () => {
      const invalidVersion = { ...mockAudioVersion, name: '' };
      const result =
        await audioVersionValidationService.validateAudioVersion(
          invalidVersion
        );

      expect(result.isValid).toBe(false);
      expect(result.currentVersion).toBe(invalidVersion);
      expect(result.requiresVersionSelection).toBe(true);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateForDownload', () => {
    it('should return valid result for valid audio version', async () => {
      const result =
        await audioVersionValidationService.validateForDownload(
          mockAudioVersion
        );

      expect(result.isValid).toBe(true);
      expect(result.currentVersion).toBe(mockAudioVersion);
      expect(result.requiresVersionSelection).toBe(false);
    });

    it('should return invalid result for null audio version', async () => {
      const result =
        await audioVersionValidationService.validateForDownload(null);

      expect(result.isValid).toBe(false);
      expect(result.currentVersion).toBeNull();
      expect(result.requiresVersionSelection).toBe(true);
      expect(result.error).toContain('download');
    });
  });

  describe('validateForPlayback', () => {
    it('should return valid result for valid audio version', async () => {
      const result =
        await audioVersionValidationService.validateForPlayback(
          mockAudioVersion
        );

      expect(result.isValid).toBe(true);
      expect(result.currentVersion).toBe(mockAudioVersion);
      expect(result.requiresVersionSelection).toBe(false);
    });

    it('should return invalid result for null audio version', async () => {
      const result =
        await audioVersionValidationService.validateForPlayback(null);

      expect(result.isValid).toBe(false);
      expect(result.currentVersion).toBeNull();
      expect(result.requiresVersionSelection).toBe(true);
      expect(result.error).toContain('playback');
    });
  });

  describe('validateVersionForChapter', () => {
    it('should return valid result for valid audio version and chapter', async () => {
      // Mock the mediaFilesService to return some files
      jest.doMock('@/shared/services/database/MediaFilesService', () => ({
        mediaFilesService: {
          getMediaFilesByChapterId: jest.fn().mockResolvedValue([
            { id: 'file1', chapter_id: 'test-chapter' },
            { id: 'file2', chapter_id: 'test-chapter' },
          ]),
        },
      }));

      const result =
        await audioVersionValidationService.validateVersionForChapter(
          mockAudioVersion,
          'test-chapter'
        );

      expect(result.isValid).toBe(true);
      expect(result.currentVersion).toBe(mockAudioVersion);
      expect(result.requiresVersionSelection).toBe(false);
      expect(result.hasAudioForChapter).toBe(true);
    });

    it('should return invalid result for null audio version', async () => {
      const result =
        await audioVersionValidationService.validateVersionForChapter(
          null,
          'test-chapter'
        );

      expect(result.isValid).toBe(false);
      expect(result.currentVersion).toBeNull();
      expect(result.requiresVersionSelection).toBe(true);
      expect(result.hasAudioForChapter).toBe(false);
    });
  });
});
