import { AudioService, ChapterUIHelper, audioService } from '../AudioService';
import { AudioChapter } from '@/types/audio';

// Mock the createAudioChapter utility
jest.mock('@/types/audio', () => ({
  ...jest.requireActual('@/types/audio'),
  createAudioChapter: jest.fn((recording, segments) => ({
    audioRecording: recording,
    segments: segments.map((seg: any, index: number) => ({
      id: seg.id,
      segmentNumber: index + 1,
      startTime: seg.start_time_seconds,
      endTime: seg.end_time_seconds,
      text: seg.original_text,
      confidence: seg.confidence_score,
      speakerId: seg.speaker_id,
    })),
    bookName: recording.title.split(' Chapter ')[0],
    chapterNumber: parseInt(recording.title.split(' Chapter ')[1]) || 1,
    totalSegments: segments.length,
    totalDuration: recording.duration_seconds,
    language: recording.original_language,
  })),
}));

// Mock the SegmentCalculator
const mockSegmentCalculator = {
  getVerseDisplayData: jest.fn((currentTime: number) => [
    {
      verseNumber: 1,
      text: 'Test verse 1',
      startTime: 0,
      endTime: 20,
      isCurrentVerse: currentTime < 20,
    },
    {
      verseNumber: 2,
      text: 'Test verse 2',
      startTime: 20,
      endTime: 40,
      isCurrentVerse: currentTime >= 20 && currentTime < 40,
    },
  ]),
  getCurrentSegment: jest.fn((currentTime: number) => {
    if (currentTime < 20) {
      return { segmentNumber: 1, startTime: 0, endTime: 20 };
    } else if (currentTime < 40) {
      return { segmentNumber: 2, startTime: 20, endTime: 40 };
    }
    return undefined;
  }),
  getCurrentSegmentPosition: jest.fn((currentTime: number) => ({
    segmentNumber: currentTime < 20 ? 1 : 2,
    positionInSegment: currentTime < 20 ? currentTime : currentTime - 20,
    totalSegmentDuration: 20,
  })),
  getSegmentByNumber: jest.fn((verseNumber: number) => ({
    segmentNumber: verseNumber,
    startTime: (verseNumber - 1) * 20,
    endTime: verseNumber * 20,
  })),
};

jest.mock('@/types/audio', () => ({
  ...jest.requireActual('@/types/audio'),
  SegmentCalculator: jest.fn(() => mockSegmentCalculator),
}));

describe('AudioService', () => {
  let service: AudioService;
  let mockDbClient: any;

  beforeEach(() => {
    mockDbClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
    };
    service = new AudioService(mockDbClient);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      const newService = new AudioService();
      expect(newService).toBeInstanceOf(AudioService);
    });

    it('should initialize with provided database client', () => {
      const newService = new AudioService(mockDbClient);
      expect(newService).toBeInstanceOf(AudioService);
    });
  });

  describe('getAudioRecordings', () => {
    it('should return mock recording data for testing', async () => {
      const result = await service.getAudioRecordings();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'genesis-1',
        title: 'Genesis Chapter 1',
        audio_file_url: 'mock-url-1',
        original_language: 'en',
        target_language: 'en',
        duration_seconds: 600,
        description: 'The book of Genesis, Chapter 1',
        status: 'active',
        user_id: null,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });
  });

  describe('getAudioRecordingById', () => {
    it('should return null for invalid recording ID', async () => {
      const result = await service.getAudioRecordingById('invalid-id');
      expect(result).toBeNull();
    });

    it('should return null for recording ID without chapter number', async () => {
      const result = await service.getAudioRecordingById('genesis');
      expect(result).toBeNull();
    });

    it('should return recording for valid book-chapter format', async () => {
      const result = await service.getAudioRecordingById('genesis-1');

      expect(result).toEqual({
        id: 'genesis-1',
        title: 'Genesis Chapter 1',
        audio_file_url: 'https://example.com/genesis-1.mp3',
        original_language: 'en',
        target_language: 'en',
        duration_seconds: 630, // 600 + 1 * 30
        description: 'The book of Genesis, Chapter 1',
        status: 'active',
        user_id: null,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should handle multi-word book names', async () => {
      const result = await service.getAudioRecordingById('1-timothy-3');

      expect(result).not.toBeNull();
      expect(result).toEqual({
        id: '1-timothy-3',
        title: '1 Timothy Chapter 3',
        audio_file_url: 'https://example.com/1-timothy-3.mp3',
        original_language: 'en',
        target_language: 'en',
        duration_seconds: 690, // 600 + 3 * 30
        description: 'The book of 1 Timothy, Chapter 3',
        status: 'active',
        user_id: null,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
    });

    it('should vary duration based on chapter number', async () => {
      const result1 = await service.getAudioRecordingById('genesis-1');
      const result2 = await service.getAudioRecordingById('genesis-5');

      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result1!.duration_seconds).toBe(630);
      expect(result2!.duration_seconds).toBe(750);
    });
  });

  describe('getTranslationSegments', () => {
    it('should return empty array for invalid recording ID', async () => {
      const result = await service.getTranslationSegments('invalid-id');
      expect(result).toEqual([]);
    });

    it('should generate segments for valid recording ID', async () => {
      const result = await service.getTranslationSegments('genesis-1');

      expect(result).toHaveLength(22); // 15 + (1 * 7) % 20
      expect(result[0]).toEqual({
        id: 'genesis-1-verse-1',
        start_time_seconds: 0,
        end_time_seconds: 16, // 15 + (1 % 10)
        original_text: expect.any(String),
        translated_text: expect.any(String),
        confidence_score: expect.any(Number),
        speaker_id: 'narrator-1',
        recording_id: 'genesis-1',
        created_at: expect.any(String),
      });
    });

    it('should generate different verse counts for different chapters', async () => {
      const result1 = await service.getTranslationSegments('genesis-1');
      const result2 = await service.getTranslationSegments('genesis-2');

      expect(result1.length).not.toBe(result2.length);
    });

    it('should generate sequential timing for segments', async () => {
      const result = await service.getTranslationSegments('genesis-1');

      expect(result).toHaveLength(22);
      expect(result[0]?.start_time_seconds).toBe(0);
      expect(result[0]?.end_time_seconds).toBe(16);
      expect(result[1]?.start_time_seconds).toBe(20);
      expect(result[1]?.end_time_seconds).toBe(37);
    });

    it('should vary verse text based on book type', async () => {
      const genesis = await service.getTranslationSegments('genesis-1');
      const deuteronomy = await service.getTranslationSegments('deuteronomy-1');
      const psalms = await service.getTranslationSegments('psalms-1');
      const matthew = await service.getTranslationSegments('matthew-1');

      expect(genesis).toHaveLength(22);
      expect(deuteronomy).toHaveLength(22);
      expect(psalms).toHaveLength(22);
      expect(matthew).toHaveLength(22);

      expect(genesis[0]?.original_text).not.toContain('And the Lord said:');
      expect(deuteronomy[0]?.original_text).toContain('And the Lord said:');
      expect(psalms[0]?.original_text).toContain('Praise the Lord!');
      expect(matthew[0]?.original_text).toContain('Jesus said:');
    });
  });

  describe('getAudioChapter', () => {
    it('should return null for invalid recording ID', async () => {
      const result = await service.getAudioChapter('invalid-id');
      expect(result).toBeNull();
    });

    it('should return cached chapter if available', async () => {
      // First call to populate cache
      await service.getAudioChapter('genesis-1');

      // Second call should use cache
      const result = await service.getAudioChapter('genesis-1');
      expect(result).toBeTruthy();
    });

    it('should create and cache new chapter', async () => {
      const result = await service.getAudioChapter('genesis-1');

      expect(result).toBeTruthy();
      if (result) {
        expect(result.bookName).toBe('Genesis');
        expect(result.chapterNumber).toBe(1);
        expect(result.segments).toHaveLength(22);
      }
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in getAudioRecordingById
      const originalMethod = service.getAudioRecordingById;
      service.getAudioRecordingById = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));

      const result = await service.getAudioChapter('genesis-1');
      expect(result).toBeNull();

      // Restore original method
      service.getAudioRecordingById = originalMethod;
    });
  });

  describe('searchAudioRecordings', () => {
    it('should return mock recording data for search query', async () => {
      const result = await service.searchAudioRecordings('genesis');
      expect(result).toHaveLength(2);
      expect(result[0]?.title).toBe('Genesis Chapter 1');
    });
  });

  describe('getAudioRecordingsByLanguage', () => {
    it('should return empty array (placeholder implementation)', async () => {
      const result = await service.getAudioRecordingsByLanguage('en');
      expect(result).toEqual([]);
    });
  });

  describe('getAudioRecordingsByBook', () => {
    it('should return empty array (placeholder implementation)', async () => {
      const result = await service.getAudioRecordingsByBook('Genesis');
      expect(result).toEqual([]);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      // Populate cache
      await service.getAudioChapter('genesis-1');
      expect(service.getCachedChapter('genesis-1')).toBeTruthy();

      // Clear cache
      service.clearCache();
      expect(service.getCachedChapter('genesis-1')).toBeNull();
    });

    it('should return cached chapter', async () => {
      const chapter = await service.getAudioChapter('genesis-1');
      const cached = service.getCachedChapter('genesis-1');

      expect(cached).toBe(chapter);
    });

    it('should return null for non-cached chapter', () => {
      const cached = service.getCachedChapter('non-existent');
      expect(cached).toBeNull();
    });
  });
});

describe('ChapterUIHelper', () => {
  let helper: ChapterUIHelper;
  let mockChapter: AudioChapter;

  beforeEach(() => {
    mockChapter = {
      audioRecording: {
        id: 'genesis-1',
        title: 'Genesis Chapter 1',
        audio_file_url: 'https://example.com/genesis-1.mp3',
        original_language: 'en',
        target_language: 'en',
        duration_seconds: 630,
        description: 'The book of Genesis, Chapter 1',
        status: 'active',
        user_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      segments: [
        {
          id: 'genesis-1-verse-1',
          segmentNumber: 1,
          startTime: 0,
          endTime: 20,
          duration: 20,
          text: 'In the beginning God created the heavens and the earth.',
          confidence: 0.98,
          speakerId: 'narrator-1',
        },
        {
          id: 'genesis-1-verse-2',
          segmentNumber: 2,
          startTime: 20,
          endTime: 40,
          duration: 20,
          text: 'The earth was without form and void.',
          confidence: 0.97,
          speakerId: 'narrator-1',
        },
      ],
      bookName: 'Genesis',
      chapterNumber: 1,
      totalSegments: 2,
      totalDuration: 630,
      language: 'en',
    };

    helper = new ChapterUIHelper(mockChapter);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with chapter data', () => {
      expect(helper).toBeInstanceOf(ChapterUIHelper);
    });
  });

  describe('getVerseDisplayData', () => {
    it('should return verse display data for current time', () => {
      const result = helper.getVerseDisplayData(15);
      expect(mockSegmentCalculator.getVerseDisplayData).toHaveBeenCalledWith(
        15
      );
      expect(result).toHaveLength(2);
    });
  });

  describe('getCurrentSegment', () => {
    it('should return current segment for given time', () => {
      const result = helper.getCurrentSegment(15);
      expect(mockSegmentCalculator.getCurrentSegment).toHaveBeenCalledWith(15);
      expect(result).toBeTruthy();
    });
  });

  describe('getCurrentSegmentPosition', () => {
    it('should return segment position for given time', () => {
      const result = helper.getCurrentSegmentPosition(15);
      expect(
        mockSegmentCalculator.getCurrentSegmentPosition
      ).toHaveBeenCalledWith(15);
      expect(result).toBeTruthy();
    });
  });

  describe('getSegmentByVerseNumber', () => {
    it('should return segment for given verse number', () => {
      const result = helper.getSegmentByVerseNumber(1);
      expect(mockSegmentCalculator.getSegmentByNumber).toHaveBeenCalledWith(1);
      expect(result).toBeTruthy();
    });
  });

  describe('getChapterInfo', () => {
    it('should return chapter metadata', () => {
      const result = helper.getChapterInfo();

      expect(result).toEqual({
        title: 'Genesis Chapter 1',
        bookName: 'Genesis',
        chapterNumber: 1,
        totalVerses: 2,
        totalDuration: 630,
        language: 'en',
      });
    });
  });

  describe('formatTime', () => {
    it('should format seconds to MM:SS format', () => {
      expect(helper.formatTime(0)).toBe('0:00');
      expect(helper.formatTime(65)).toBe('1:05');
      expect(helper.formatTime(3661)).toBe('61:01');
    });
  });

  describe('getProgressPercentage', () => {
    it('should calculate progress percentage', () => {
      expect(helper.getProgressPercentage(0)).toBe(0);
      expect(helper.getProgressPercentage(315)).toBe(50); // 315 / 630 * 100
      expect(helper.getProgressPercentage(630)).toBe(100);
    });

    it('should handle zero duration', () => {
      const zeroChapter = { ...mockChapter, totalDuration: 0 };
      const zeroHelper = new ChapterUIHelper(zeroChapter);
      expect(zeroHelper.getProgressPercentage(100)).toBe(0);
    });

    it('should cap at 100%', () => {
      expect(helper.getProgressPercentage(1000)).toBe(100);
    });
  });
});

describe('audioService singleton', () => {
  it('should be an instance of AudioService', () => {
    expect(audioService).toBeInstanceOf(AudioService);
  });

  it('should maintain state across calls', async () => {
    // First call
    const chapter1 = await audioService.getAudioChapter('genesis-1');

    // Second call should use cache
    const chapter2 = await audioService.getAudioChapter('genesis-1');

    expect(chapter1).toBe(chapter2);
  });
});
