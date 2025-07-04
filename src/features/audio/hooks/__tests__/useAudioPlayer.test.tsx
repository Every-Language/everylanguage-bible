import { renderHook, act } from '@testing-library/react-native';
import { useAudioPlayer } from '../useAudioPlayer';
import { AudioService } from '../../services/audioService';
import { DatabaseAdapter } from '../../adapters/databaseAdapter';
import type { AudioTrack, ChapterAudio_temp } from '../../types';

// Mock the services
jest.mock('../../services/audioService');
jest.mock('../../adapters/databaseAdapter');

describe('useAudioPlayer', () => {
  let mockAudioService: jest.Mocked<AudioService>;
  let mockDatabaseAdapter: jest.Mocked<DatabaseAdapter>;
  let mockSound: any;

  const mockAudioTrack: AudioTrack = {
    id: 'test-track-1',
    chapter_id: 'gen-1',
    language_entity_id: 'en-us',
    url: 'https://example.com/genesis1.mp3',
    local_path: '',
    duration: 390000, // 6.5 minutes
    file_size: 8500000,
    quality: 'high',
    format: 'mp3',
    bitrate: 128,
    is_downloaded: false,
    download_progress: 0,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockChapterAudio: ChapterAudio_temp = {
    audio_track: mockAudioTrack,
    verse_timestamps: [
      {
        verse_number: 1,
        start_time: 0,
        end_time: 15,
        duration: 15,
        text: 'In the beginning...',
        text_language_entity_id: 'en-us',
      },
      {
        verse_number: 2,
        start_time: 15,
        end_time: 35,
        duration: 20,
        text: 'Now the earth was...',
        text_language_entity_id: 'en-us',
      },
      {
        verse_number: 3,
        start_time: 35,
        end_time: 50,
        duration: 15,
        text: 'And God said...',
        text_language_entity_id: 'en-us',
      },
    ],
    chapter: {
      id: 'gen-1',
      book_id: 'gen',
      chapter_number: 1,
      verse_count: 31,
      audio_file_url: 'https://example.com/genesis1.mp3',
      audio_duration: 390000,
      audio_file_size: 8500000,
      audio_quality: 'high',
      audio_language_entity_id: 'en-us',
      is_audio_downloaded: false,
      local_audio_path: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    total_verses: 31,
  };

  beforeEach(() => {
    // Create fresh mocks for each test
    mockSound = {
      id: 'mock-sound-1',
      uri: mockAudioTrack.url,
    };

    mockAudioService = {
      initialize: jest.fn().mockResolvedValue(undefined),
      loadTrack: jest.fn().mockResolvedValue({
        isLoaded: true,
        sound: mockSound,
        durationMillis: mockAudioTrack.duration,
        error: null,
      }),
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      seekTo: jest.fn().mockResolvedValue(undefined),
      skipForward: jest.fn().mockResolvedValue({ positionMillis: 10000 }),
      skipBackward: jest.fn().mockResolvedValue({ positionMillis: 0 }),
      nextVerse: jest.fn().mockResolvedValue({
        verse_number: 2,
        audio_status: { positionMillis: 15000 },
        timestamp: mockChapterAudio.verse_timestamps[1],
      }),
      previousVerse: jest.fn().mockResolvedValue({
        verse_number: 1,
        audio_status: { positionMillis: 0 },
        timestamp: mockChapterAudio.verse_timestamps[0],
      }),
      goToVerse: jest.fn().mockResolvedValue({
        verse_number: 3,
        audio_status: { positionMillis: 35000 },
        timestamp: mockChapterAudio.verse_timestamps[2],
      }),
      setVolume: jest.fn().mockResolvedValue(undefined),
      setPlaybackRate: jest.fn().mockResolvedValue(undefined),
      setPlaybackSpeed: jest.fn().mockResolvedValue(undefined),
      unloadSound: jest.fn().mockResolvedValue(undefined),
      getStatus: jest
        .fn()
        .mockResolvedValue({ isLoaded: true, positionMillis: 0 }),
      isInitialized: jest.fn().mockReturnValue(true),
      getCurrentVerse: jest.fn().mockResolvedValue({
        verse_number: 1,
        audio_status: { positionMillis: 0 },
        is_first_verse: true,
        is_last_verse: false,
      }),
    } as any;

    mockDatabaseAdapter = {
      bibleRepository: {} as any,
      getChapterAudio: jest.fn().mockResolvedValue(mockChapterAudio),
      convertVersesToTimestamps: jest.fn(),
      convertChapterToAudioFormat: jest.fn(),
    } as any;

    (AudioService as jest.MockedClass<typeof AudioService>).mockImplementation(
      () => mockAudioService
    );
    (
      DatabaseAdapter as jest.MockedClass<typeof DatabaseAdapter>
    ).mockImplementation(() => mockDatabaseAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAudioPlayer());

      expect(result.current.currentTrack).toBeNull();
      expect(result.current.currentChapter).toBeNull();
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.positionMillis).toBe(0);
      expect(result.current.durationMillis).toBe(0);
      expect(result.current.currentVerse).toBeNull();
      expect(result.current.volume).toBe(1.0);
      expect(result.current.playbackSpeed).toBe(1.0);
      expect(result.current.error).toBeNull();
    });

    it('should initialize audio services on mount', async () => {
      renderHook(() => useAudioPlayer());

      // Wait for useEffect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(AudioService).toHaveBeenCalledTimes(1);
      expect(DatabaseAdapter).toHaveBeenCalledTimes(1);
      expect(mockAudioService.initialize).toHaveBeenCalledTimes(1);
    });

    it('should handle service initialization errors', async () => {
      const initError = new Error('Failed to initialize audio');
      mockAudioService.initialize.mockRejectedValue(initError);

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.error).toBe('Failed to initialize audio');
    });
  });

  describe('loadChapter', () => {
    it('should load chapter successfully', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      // Wait for initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.loadChapter('gen', 1);
      });

      expect(mockDatabaseAdapter.getChapterAudio).toHaveBeenCalledWith(
        'gen',
        1
      );
      expect(mockAudioService.loadTrack).toHaveBeenCalledWith(mockAudioTrack);
      expect(result.current.currentTrack).toEqual(mockAudioTrack);
      expect(result.current.currentChapter).toEqual(mockChapterAudio);
      expect(result.current.isLoaded).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.durationMillis).toBe(mockAudioTrack.duration);
    });

    it('should handle chapter not found', async () => {
      mockDatabaseAdapter.getChapterAudio.mockResolvedValue(null);
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.loadChapter('nonexistent', 1);
      });

      expect(result.current.error).toBe('Chapter nonexistent 1 not found');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle audio track loading failure', async () => {
      mockAudioService.loadTrack.mockResolvedValue({
        isLoaded: false,
        durationMillis: 0,
        error: 'Invalid audio format',
      });

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        await result.current.loadChapter('gen', 1);
      });

      expect(result.current.error).toBe('Invalid audio format');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('playback controls', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      return { result };
    });

    it('should play audio', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.play();
      });

      expect(mockAudioService.play).toHaveBeenCalledWith(mockSound);
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should pause audio', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
        await result.current.play();
      });

      await act(async () => {
        await result.current.pause();
      });

      expect(mockAudioService.pause).toHaveBeenCalledWith(mockSound);
      expect(result.current.isPlaying).toBe(false);
    });

    it('should stop audio', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
        await result.current.play();
      });

      await act(async () => {
        await result.current.stop();
      });

      expect(mockAudioService.stop).toHaveBeenCalledWith(mockSound);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.positionMillis).toBe(0);
      expect(result.current.currentVerse).toBeNull();
    });

    it('should seek to position', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.seekTo(30);
      });

      expect(mockAudioService.seekTo).toHaveBeenCalledWith(mockSound, 30);
      expect(result.current.positionMillis).toBe(30000);
    });

    it('should skip forward', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.skipForward(15);
      });

      expect(mockAudioService.skipForward).toHaveBeenCalledWith(mockSound, 15);
      expect(result.current.positionMillis).toBe(10000);
    });

    it('should skip backward', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.skipBackward(10);
      });

      expect(mockAudioService.skipBackward).toHaveBeenCalledWith(mockSound, 10);
      expect(result.current.positionMillis).toBe(0);
    });
  });

  describe('verse navigation', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      return { result };
    });

    it('should navigate to next verse', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        const navigationResult = await result.current.nextVerse();
        expect(navigationResult).toBeTruthy();
        expect(navigationResult!.verse_number).toBe(2);
      });

      expect(mockAudioService.nextVerse).toHaveBeenCalledWith(
        mockSound,
        mockChapterAudio
      );
      expect(result.current.currentVerse).toBe(2);
      expect(result.current.positionMillis).toBe(15000);
    });

    it('should navigate to previous verse', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        const navigationResult = await result.current.previousVerse();
        expect(navigationResult).toBeTruthy();
        expect(navigationResult!.verse_number).toBe(1);
      });

      expect(mockAudioService.previousVerse).toHaveBeenCalledWith(
        mockSound,
        mockChapterAudio
      );
      expect(result.current.currentVerse).toBe(1);
      expect(result.current.positionMillis).toBe(0);
    });

    it('should navigate to specific verse', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        const navigationResult = await result.current.goToVerse(3);
        expect(navigationResult).toBeTruthy();
        expect(navigationResult!.verse_number).toBe(3);
      });

      expect(mockAudioService.goToVerse).toHaveBeenCalledWith(
        mockSound,
        3,
        mockChapterAudio
      );
      expect(result.current.currentVerse).toBe(3);
      expect(result.current.positionMillis).toBe(35000);
    });

    it('should return null when no chapter loaded for verse navigation', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      await act(async () => {
        const navigationResult = await result.current.nextVerse();
        expect(navigationResult).toBeNull();
      });

      expect(mockAudioService.nextVerse).not.toHaveBeenCalled();
    });
  });

  describe('audio settings', () => {
    beforeEach(async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      return { result };
    });

    it('should set volume', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.setVolume(0.5);
      });

      expect(mockAudioService.setVolume).toHaveBeenCalledWith(mockSound, 0.5);
      expect(result.current.volume).toBe(0.5);
    });

    it('should set playback speed', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.setPlaybackSpeed(1.5);
      });

      expect(mockAudioService.setPlaybackSpeed).toHaveBeenCalledWith(
        mockSound,
        1.5
      );
      expect(result.current.playbackSpeed).toBe(1.5);
    });
  });

  describe('utility functions', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useAudioPlayer());

      // Set an error first
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it('should unload current audio', async () => {
      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.unload();
      });

      expect(mockAudioService.unloadSound).toHaveBeenCalledWith(mockSound);
      expect(result.current.currentTrack).toBeNull();
      expect(result.current.currentChapter).toBeNull();
      expect(result.current.isLoaded).toBe(false);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.positionMillis).toBe(0);
      // Volume and playback speed should be preserved
      expect(result.current.volume).toBe(1.0);
      expect(result.current.playbackSpeed).toBe(1.0);
    });
  });

  describe('error handling', () => {
    it('should handle service errors gracefully', async () => {
      const playError = new Error('Playback failed');
      mockAudioService.play.mockRejectedValue(playError);

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.error).toBe('Playback failed');
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle unknown errors', async () => {
      mockAudioService.play.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useAudioPlayer());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
        await result.current.loadChapter('gen', 1);
      });

      await act(async () => {
        await result.current.play();
      });

      expect(result.current.error).toBe('Failed to play');
    });
  });
});
