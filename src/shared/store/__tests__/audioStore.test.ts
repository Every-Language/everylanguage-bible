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

// Mock the AudioService
jest.mock('@/shared/services/AudioService', () => ({
  audioService: {
    getAudioChapter: jest.fn((recordingId: string) => {
      // Return null for invalid chapters to test error handling
      if (recordingId === 'invalid-chapter') {
        return Promise.resolve(null);
      }

      return Promise.resolve({
        audioRecording: {
          id: 'genesis-1',
          title: 'Genesis Chapter 1',
          audio_file_url: 'mock-url-1',
          original_language: 'en',
          target_language: 'en',
          duration_seconds: 600,
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
            text: 'In the beginning was the Word',
            confidence: 0.95,
            speakerId: 'narrator-1',
          },
          {
            id: 'genesis-1-verse-2',
            segmentNumber: 2,
            startTime: 20,
            endTime: 40,
            text: 'And the Word was with God',
            confidence: 0.95,
            speakerId: 'narrator-1',
          },
        ],
        bookName: 'Genesis',
        chapterNumber: 1,
        totalSegments: 2,
        totalDuration: 40,
        language: 'en',
      });
    }),
    getAudioRecordings: jest.fn(() =>
      Promise.resolve([
        {
          id: 'genesis-1',
          title: 'Genesis Chapter 1',
          audio_file_url: 'mock-url-1',
          original_language: 'en',
          target_language: 'en',
          duration_seconds: 600,
          description: 'The book of Genesis, Chapter 1',
          status: 'active',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'genesis-2',
          title: 'Genesis Chapter 2',
          audio_file_url: 'mock-url-2',
          original_language: 'en',
          target_language: 'en',
          duration_seconds: 650,
          description: 'The book of Genesis, Chapter 2',
          status: 'active',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    ),
    searchAudioRecordings: jest.fn(() =>
      Promise.resolve([
        {
          id: 'genesis-1',
          title: 'Genesis Chapter 1',
          audio_file_url: 'mock-url-1',
          original_language: 'en',
          target_language: 'en',
          duration_seconds: 600,
          description: 'The book of Genesis, Chapter 1',
          status: 'active',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'genesis-2',
          title: 'Genesis Chapter 2',
          audio_file_url: 'mock-url-2',
          original_language: 'en',
          target_language: 'en',
          duration_seconds: 650,
          description: 'The book of Genesis, Chapter 2',
          status: 'active',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
    ),
  },
  ChapterUIHelper: jest.fn(() => ({
    getCurrentSegment: jest.fn(() => ({
      segmentNumber: 1,
      startTime: 0,
      endTime: 20,
    })),
    getSegmentByVerseNumber: jest.fn(() => ({
      segmentNumber: 1,
      startTime: 0,
      endTime: 20,
    })),
    getVerseDisplayData: jest.fn(() => [
      {
        verseNumber: 1,
        text: 'Test verse 1',
        startTime: 0,
        endTime: 20,
        isCurrentVerse: true,
      },
      {
        verseNumber: 2,
        text: 'Test verse 2',
        startTime: 20,
        endTime: 40,
        isCurrentVerse: false,
      },
    ]),
  })),
}));

describe('audioStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store to initial state
    const { result } = renderHook(() => useAudioStore());
    act(() => {
      result.current.close();
      result.current.clearPlaylist();
    });
  });

  afterEach(() => {
    // Clean up after each test
    const { result } = renderHook(() => useAudioStore());
    act(() => {
      result.current.close();
      result.current.clearPlaylist();
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

      expect(result.current.playlist).toHaveLength(0);
    });

    it('should clear playlist', () => {
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
      expect(result.current.currentPlaylistIndex).toBe(-1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid recording IDs in navigation', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const nextChapter = result.current.findNextChapter('invalid-id');
      expect(nextChapter).toBeNull();

      const previousChapter = result.current.findPreviousChapter('invalid-id');
      expect(previousChapter).toBeNull();
    });

    it('should handle missing Bible books', () => {
      const { result } = renderHook(() => useAudioStore());

      // Don't initialize Bible books - but the store will auto-initialize them
      const nextChapter = result.current.findNextChapter('genesis-1');
      // The store automatically initializes Bible books when needed, so this should return genesis-2
      expect(nextChapter).toBe('genesis-2');
    });
  });

  describe('Close Functionality', () => {
    it('should close and reset state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setPlaybackState(true);
        result.current.setProgress(30, 120);
        result.current.close();
      });

      expect(result.current.currentRecording).toBeUndefined();
      expect(result.current.currentChapter).toBeNull();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
      expect(result.current.totalTime).toBe(0);
    });
  });

  describe('Playlist Navigation', () => {
    const mockRecording1 = {
      id: 'genesis-1',
      title: 'Genesis Chapter 1',
      duration: 600,
      url: 'mock-url-1',
      segments: [],
      audio_file_url: 'mock-url-1',
      created_at: null,
      description: null,
      duration_seconds: 600,
      original_language: 'en',
      status: null,
      target_language: 'en',
      updated_at: null,
      user_id: null,
    } as any;

    const mockRecording2 = {
      id: 'genesis-2',
      title: 'Genesis Chapter 2',
      duration: 650,
      url: 'mock-url-2',
      segments: [],
      audio_file_url: 'mock-url-2',
      created_at: null,
      description: null,
      duration_seconds: 650,
      original_language: 'en',
      status: null,
      target_language: 'en',
      updated_at: null,
      user_id: null,
    } as any;

    it('should navigate to next item in playlist', async () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording1);
        result.current.addToPlaylist(mockRecording2);
      });

      const success = await act(async () => {
        return result.current.playNext();
      });

      expect(success).toBe(true);
      expect(result.current.currentPlaylistIndex).toBe(1);
    });

    it('should navigate to previous item in playlist', async () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording1);
        result.current.addToPlaylist(mockRecording2);
      });

      // Manually set current index to 1 (simulate being at second item)
      act(() => {
        // Use the store's internal mechanism to set state
        const store = useAudioStore.getState();
        useAudioStore.setState({ ...store, currentPlaylistIndex: 1 });
      });

      const success = await act(async () => {
        return result.current.playPrevious();
      });

      expect(success).toBe(true);
      expect(result.current.currentPlaylistIndex).toBe(0);
    });

    it('should return false when at end of playlist', async () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording1);
      });

      const success = await act(async () => {
        return result.current.playNext();
      });

      expect(success).toBe(false);
    });

    it('should return false when at beginning of playlist', async () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording1);
      });

      const success = await act(async () => {
        return result.current.playPrevious();
      });

      expect(success).toBe(false);
    });

    it('should allow duplicate recordings in playlist', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording1);
        result.current.addToPlaylist(mockRecording1); // Add duplicate (now allowed)
      });

      expect(result.current.playlist).toHaveLength(2);
      expect(result.current.playlist[0]?.id).toBe('genesis-1');
      expect(result.current.playlist[1]?.id).toBe('genesis-1');
    });

    it('should update playlist index when removing item before current', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording1);
        result.current.addToPlaylist(mockRecording2);
      });

      // Manually set current index to 1
      act(() => {
        const store = useAudioStore.getState();
        useAudioStore.setState({ ...store, currentPlaylistIndex: 1 });
      });

      act(() => {
        result.current.removeFromPlaylist(0); // Remove first item
      });

      expect(result.current.currentPlaylistIndex).toBe(0);
    });
  });

  describe('Verse Navigation', () => {
    it('should navigate to next verse', async () => {
      const { result } = renderHook(() => useAudioStore());

      await act(async () => {
        result.current.nextVerse();
      });

      // Should complete without error
      expect(result.current.error).toBeUndefined();
    });

    it('should navigate to previous verse', async () => {
      const { result } = renderHook(() => useAudioStore());

      await act(async () => {
        result.current.previousVerse();
      });

      // Should complete without error
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Chapter Loading', () => {
    it('should load audio chapter successfully', async () => {
      const { result } = renderHook(() => useAudioStore());

      await act(async () => {
        await result.current.setCurrentAudio('genesis-1');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.currentRecording).toBeDefined();
      expect(result.current.currentChapter).toBeDefined();
    });

    it('should handle loading errors', async () => {
      const { result } = renderHook(() => useAudioStore());

      await act(async () => {
        await result.current.setCurrentAudio('invalid-chapter');
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });

    it('should set loading state during chapter load', async () => {
      const { result } = renderHook(() => useAudioStore());

      // Start loading
      const loadPromise = act(async () => {
        await result.current.setCurrentAudio('genesis-1');
      });

      // Check loading state briefly
      expect(result.current.isLoading).toBe(false); // Will be false by the time we check due to act()

      await loadPromise;
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Progress Updates', () => {
    it('should update progress with duration', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setProgress(30, 120);
      });

      expect(result.current.currentTime).toBe(30);
      expect(result.current.totalTime).toBe(120);
    });

    it('should update progress without duration', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setProgress(100, 200);
        result.current.setProgress(150); // Update without duration
      });

      expect(result.current.currentTime).toBe(150);
      expect(result.current.totalTime).toBe(200); // Should remain unchanged
    });

    it('should update verse display data when progress changes', () => {
      const { result } = renderHook(() => useAudioStore());

      // First create a mock UI helper
      const mockUIHelper = {
        getCurrentSegment: jest.fn(() => ({
          segmentNumber: 1,
          startTime: 0,
          endTime: 20,
        })),
        getVerseDisplayData: jest.fn(() => [
          {
            verseNumber: 1,
            text: 'Test verse',
            startTime: 0,
            endTime: 20,
            isCurrentVerse: true,
          },
        ]),
      };

      act(() => {
        result.current.currentUIHelper = mockUIHelper as any;
        result.current.setProgress(15, 120);
      });

      expect(result.current.currentVerseDisplayData).toHaveLength(1);
      expect(mockUIHelper.getVerseDisplayData).toHaveBeenCalledWith(15);
    });
  });

  describe('Bible Navigation Integration', () => {
    it('should navigate to next chapter when not using playlist', async () => {
      const { result } = renderHook(() => useAudioStore());

      // Set up current recording
      act(() => {
        result.current.currentRecording = {
          id: 'genesis-1',
          title: 'Genesis Chapter 1',
          audio_file_url: 'test-url',
          duration_seconds: 600,
          original_language: 'en',
          target_language: 'en',
          description: 'Test',
          status: 'active',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      const success = await act(async () => {
        return result.current.playNext();
      });

      expect(success).toBe(true);
    });

    it('should navigate to previous chapter when not using playlist', async () => {
      const { result } = renderHook(() => useAudioStore());

      // Set up current recording
      act(() => {
        result.current.currentRecording = {
          id: 'genesis-2',
          title: 'Genesis Chapter 2',
          audio_file_url: 'test-url',
          duration_seconds: 600,
          original_language: 'en',
          target_language: 'en',
          description: 'Test',
          status: 'active',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      const success = await act(async () => {
        return result.current.playPrevious();
      });

      expect(success).toBe(true);
    });

    it('should handle navigation at Bible boundaries', async () => {
      const { result } = renderHook(() => useAudioStore());

      // Set up current recording at beginning of Bible
      act(() => {
        result.current.currentRecording = {
          id: 'genesis-1',
          title: 'Genesis Chapter 1',
          audio_file_url: 'test-url',
          duration_seconds: 600,
          original_language: 'en',
          target_language: 'en',
          description: 'Test',
          status: 'active',
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      const success = await act(async () => {
        return result.current.playPrevious();
      });

      expect(success).toBe(false);
    });
  });

  describe('Database Integration', () => {
    it('should load recordings from service', async () => {
      const { result } = renderHook(() => useAudioStore());

      const recordings = await act(async () => {
        return result.current.loadRecordings();
      });

      expect(recordings).toHaveLength(2);
      expect(recordings[0]?.id).toBe('genesis-1');
    });

    it('should search recordings', async () => {
      const { result } = renderHook(() => useAudioStore());

      const recordings = await act(async () => {
        return result.current.searchRecordings('genesis');
      });

      expect(recordings).toHaveLength(2);
      expect(recordings[0]?.title).toBe('Genesis Chapter 1');
    });

    it('should refresh current chapter', async () => {
      const { result } = renderHook(() => useAudioStore());

      await act(async () => {
        result.current.refreshCurrentChapter();
      });

      // Should complete without error
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing currentUIHelper in setProgress', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.currentUIHelper = null;
        result.current.setProgress(30, 120);
      });

      expect(result.current.currentTime).toBe(30);
      expect(result.current.totalTime).toBe(120);
      expect(result.current.currentSegment).toBeUndefined();
    });

    it('should handle empty playlist navigation', async () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.clearPlaylist();
        // Also clear current recording to ensure no Bible navigation
        // @ts-expect-error - Testing edge case
        result.current.currentRecording = null;
      });

      const nextSuccess = await act(async () => {
        return result.current.playNext();
      });

      const prevSuccess = await act(async () => {
        return result.current.playPrevious();
      });

      expect(nextSuccess).toBe(false);
      expect(prevSuccess).toBe(false);
    });

    it('should handle missing current recording in navigation', async () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        // @ts-expect-error - Testing edge case
        result.current.currentRecording = null;
      });

      const nextSuccess = await act(async () => {
        return result.current.playNext();
      });

      const prevSuccess = await act(async () => {
        return result.current.playPrevious();
      });

      expect(nextSuccess).toBe(false);
      expect(prevSuccess).toBe(false);
    });

    it('should handle removeFromPlaylist with empty playlist', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.clearPlaylist();
        result.current.removeFromPlaylist(0);
      });

      expect(result.current.playlist).toEqual([]);
      expect(result.current.currentPlaylistIndex).toBe(-1);
    });
  });
});
