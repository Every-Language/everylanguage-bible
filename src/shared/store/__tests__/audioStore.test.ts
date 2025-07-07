import { renderHook, act } from '@testing-library/react-native';
import { useAudioStore } from '../audioStore';

// Mock the AudioService
const mockAudioService = {
  getAudioChapter: jest.fn().mockResolvedValue({
    id: 'john-1',
    title: 'John Chapter 1',
    duration: 912,
    url: 'mock-url',
    segments: [],
  }),
  getAudioRecordings: jest.fn().mockResolvedValue([]),
  searchAudioRecordings: jest.fn().mockResolvedValue([]),
};

const mockChapterUIHelper = {
  getSegmentByVerseNumber: jest.fn(),
  getSegmentByTime: jest.fn(),
  getVerseByTime: jest.fn(),
};

jest.mock('@/shared/services/AudioService', () => ({
  audioService: mockAudioService,
  ChapterUIHelper: jest.fn(() => mockChapterUIHelper),
}));

// Mock the utils
jest.mock('@/shared/utils', () => ({
  loadBibleBooks: () => [
    {
      id: 'gen',
      name: 'Genesis',
      chapters: 50,
      testament: 'old',
      imagePath: '01_genesis.png',
      order: 1,
    },
    {
      id: 'exo',
      name: 'Exodus',
      chapters: 40,
      testament: 'old',
      imagePath: '02_exodus.png',
      order: 2,
    },
    {
      id: '43',
      name: 'John',
      chapters: 21,
      testament: 'new',
      imagePath: '43_john.png',
      order: 43,
    },
  ],
}));

describe('AudioStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    const { result } = renderHook(() => useAudioStore());
    act(() => {
      result.current.close();
    });
  });

  describe('Basic State Management', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useAudioStore());

      expect(result.current.currentRecording).toBeUndefined();
      expect(result.current.currentChapter).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.playlist).toEqual([]);
    });

    it('initializes Bible books', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      expect(result.current.bibleBooks).toHaveLength(3);
      expect(result.current.bibleBooks[0]?.name).toBe('Genesis');
    });
  });

  describe('Audio Controls', () => {
    it('toggles play/pause state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.togglePlayPause();
      });

      expect(result.current.isPlaying).toBe(true);

      act(() => {
        result.current.togglePlayPause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('sets playback state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setPlaybackState(true);
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('sets progress', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setProgress(30, 120);
      });

      expect(result.current.currentTime).toBe(30);
      expect(result.current.totalTime).toBe(120);
    });

    it('seeks to position', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.seek(60);
      });

      expect(result.current.currentTime).toBe(60);
    });
  });

  describe('Playlist Management', () => {
    it('adds recording to playlist', () => {
      const { result } = renderHook(() => useAudioStore());
      const recording = {
        id: 'genesis-1',
        title: 'Genesis Chapter 1',
        audio_file_url: 'mock-url-1',
        duration_seconds: 600,
        original_language: 'en',
        target_language: 'en',
        created_at: null,
        updated_at: null,
        description: null,
        status: null,
        user_id: null,
      };

      act(() => {
        result.current.addToPlaylist(recording);
      });

      expect(result.current.playlist).toHaveLength(1);
      expect(result.current.playlist[0]?.id).toBe('genesis-1');
    });

    it('removes recording from playlist', () => {
      const { result } = renderHook(() => useAudioStore());
      const recording = {
        id: 'genesis-1',
        title: 'Genesis Chapter 1',
        audio_file_url: 'mock-url-1',
        duration_seconds: 600,
        original_language: 'en',
        target_language: 'en',
        created_at: null,
        updated_at: null,
        description: null,
        status: null,
        user_id: null,
      };

      act(() => {
        result.current.addToPlaylist(recording);
        result.current.removeFromPlaylist(0);
      });

      expect(result.current.playlist).toHaveLength(0);
    });

    it('clears playlist', () => {
      const { result } = renderHook(() => useAudioStore());
      const recording = {
        id: 'genesis-1',
        title: 'Genesis Chapter 1',
        audio_file_url: 'mock-url-1',
        duration_seconds: 600,
        original_language: 'en',
        target_language: 'en',
        created_at: null,
        updated_at: null,
        description: null,
        status: null,
        user_id: null,
      };

      act(() => {
        result.current.addToPlaylist(recording);
        result.current.clearPlaylist();
      });

      expect(result.current.playlist).toHaveLength(0);
    });
  });

  describe('Bible Navigation', () => {
    it('finds next chapter', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const nextChapter = result.current.findNextChapter('genesis-1');
      expect(nextChapter).toBe('genesis-2');
    });

    it('finds previous chapter', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const previousChapter = result.current.findPreviousChapter('exodus-2');
      expect(previousChapter).toBe('exodus-1');
    });

    it('returns null at Bible boundaries', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const nextChapter = result.current.findNextChapter('john-21');
      expect(nextChapter).toBeNull();
    });
  });

  describe('Loading States', () => {
    it('sets loading state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('sets buffering state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setBuffering(true);
      });

      expect(result.current.isBuffering).toBe(true);
    });
  });
});
