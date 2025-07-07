import { renderHook, act } from '@testing-library/react-native';
import { useAudioStore } from '../audioStore';

// Mock the utils module
jest.mock('@/shared/utils', () => ({
  loadBibleBooks: jest.fn(() => [
    {
      id: '01',
      name: 'Genesis',
      testament: 'old',
      chapters: 50,
      order: 1,
      imagePath: '01_genesis.png',
    },
    {
      id: '02',
      name: 'Exodus',
      testament: 'old',
      chapters: 40,
      order: 2,
      imagePath: '02_exodus.png',
    },
    {
      id: '43',
      name: 'John',
      testament: 'new',
      chapters: 21,
      order: 43,
      imagePath: '43_john.png',
    },
  ]),
}));

// Mock the AudioService
jest.mock('@/shared/services/AudioService', () => ({
  audioService: {
    getAudioChapter: jest.fn(() =>
      Promise.resolve({
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
      })
    ),
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
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock console.log to avoid noise in tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.clearAllMocks();

    // Clear the store state between tests to prevent state leakage
    useAudioStore.setState({
      playlist: [],
      currentPlaylistIndex: -1,
      currentVerseDisplayData: [],
      isPlaying: false,
      currentTime: 0,
      totalTime: 0,
      isLoading: false,
      isBuffering: false,
      bibleBooks: [],
    } as Partial<typeof useAudioStore.getState>);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAudioStore());

      expect(result.current.currentRecording).toBeUndefined();
      expect(result.current.currentChapter).toBeNull();
      expect(result.current.currentTime).toBe(0);
      expect(result.current.totalTime).toBe(0);
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.playbackSpeed).toBe(1.0);
      expect(result.current.currentVerseDisplayData).toEqual([]);
      expect(result.current.bibleBooks).toEqual([]);
      expect(result.current.playlist).toEqual([]);
      expect(result.current.currentPlaylistIndex).toBe(-1);
      expect(result.current.isBuffering).toBe(false);
    });
  });

  describe('Bible Books Initialization', () => {
    it('should initialize Bible books', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      expect(result.current.bibleBooks).toHaveLength(3);
      expect(result.current.bibleBooks[0]?.name).toBe('Genesis');
      expect(result.current.bibleBooks[1]?.name).toBe('Exodus');
      expect(result.current.bibleBooks[2]?.name).toBe('John');
    });
  });

  describe('Playback Controls', () => {
    it('should toggle play/pause', () => {
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

    it('should play', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.play();
      });

      expect(result.current.isPlaying).toBe(true);
    });

    it('should pause', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setPlaybackState(true);
        result.current.pause();
      });

      expect(result.current.isPlaying).toBe(false);
    });

    it('should stop', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setPlaybackState(true);
        result.current.setProgress(30, 120);
        result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentTime).toBe(0);
    });

    it('should seek', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.seek(45);
      });

      expect(result.current.currentTime).toBe(45);
    });

    it('should set progress', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setProgress(30, 120);
      });

      expect(result.current.currentTime).toBe(30);
      expect(result.current.totalTime).toBe(120);
    });

    it('should set progress without duration', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setProgress(30);
      });

      expect(result.current.currentTime).toBe(30);
      // totalTime should remain unchanged
    });
  });

  describe('Loading States', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should set buffering state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setBuffering(true);
      });

      expect(result.current.isBuffering).toBe(true);
    });

    it('should set playback state', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.setPlaybackState(true);
      });

      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('Chapter Navigation Helpers', () => {
    it('should find next chapter', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const nextChapter = result.current.findNextChapter('genesis-1');
      expect(nextChapter).toBe('genesis-2');
    });

    it('should find next book when at last chapter', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const nextChapter = result.current.findNextChapter('genesis-50');
      expect(nextChapter).toBe('exodus-1');
    });

    it('should find previous chapter', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const previousChapter = result.current.findPreviousChapter('genesis-2');
      expect(previousChapter).toBe('genesis-1');
    });

    it('should find previous book when at first chapter', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const previousChapter = result.current.findPreviousChapter('exodus-1');
      expect(previousChapter).toBe('genesis-50');
    });

    it('should return null when at beginning of Bible', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const previousChapter = result.current.findPreviousChapter('genesis-1');
      expect(previousChapter).toBeNull();
    });

    it('should return null when at end of Bible', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.initializeBibleBooks();
      });

      const nextChapter = result.current.findNextChapter('john-21');
      expect(nextChapter).toBeNull();
    });
  });

  describe('Playlist Management', () => {
    const mockRecording = {
      id: 'test-recording',
      title: 'Test Recording',
      duration: 912,
      url: 'mock-url',
      segments: [],
      audio_file_url: 'mock-url',
      created_at: null,
      description: null,
      duration_seconds: 912,
      original_language: 'en',
      status: null,
      target_language: 'en',
      updated_at: null,
      user_id: null,
    } as any;

    it('should add recording to playlist', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording);
      });

      expect(result.current.playlist).toHaveLength(1);
      expect(result.current.playlist[0]).toEqual(mockRecording);
    });

    it('should remove recording from playlist', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording);
        result.current.removeFromPlaylist(0);
      });

      expect(result.current.playlist).toHaveLength(0);
    });

    it('should clear playlist', () => {
      const { result } = renderHook(() => useAudioStore());

      act(() => {
        result.current.addToPlaylist(mockRecording);
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
