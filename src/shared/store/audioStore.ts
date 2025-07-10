import { create } from 'zustand';
import { AudioRecording, VerseDisplayData } from '@/types/audio';
import { audioService, ChapterUIHelper } from '@/shared/services/AudioService';
import { loadBibleBooks, type Book } from '@/shared/utils';
import { useQueueStore } from './queueStore';

// Helper function to convert Book and chapter to recording ID (matching MainNavigator)
const getRecordingId = (book: Book, chapter: number): string => {
  const bookId = book.name.toLowerCase().replace(/\s+/g, '-');
  return `${bookId}-${chapter}`;
};

// Helper function to parse recording ID back to book and chapter info
function parseRecordingId(
  recordingId: string
): { bookName: string; chapter: number } | null {
  const parts = recordingId.split('-');
  if (parts.length < 2) return null;

  const chapterStr = parts[parts.length - 1];
  if (!chapterStr) return null;
  const chapter = parseInt(chapterStr, 10);
  if (isNaN(chapter)) return null;

  const bookName = parts
    .slice(0, -1)
    .join('-')
    .split('-')
    .map(word =>
      word && word.length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : ''
    )
    .join(' ');

  return { bookName, chapter };
}

interface AudioState {
  // Core audio player state (similar to AudioPlayerState but with nullable fields for initial state)
  currentRecording?: AudioRecording;
  currentChapter?: any; // Will be AudioChapter when loaded
  currentSegment?: any; // Will be AudioSegment when active
  currentTime: number;
  totalTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isLoading: boolean;
  error?: string | undefined;

  // Additional UI state
  currentUIHelper: ChapterUIHelper | null;
  currentVerseDisplayData: VerseDisplayData[];

  // Track what's currently playing (separate from queue)
  currentlyPlaying: {
    type: 'chapter' | 'passage' | 'playlist' | null;
    data: any;
    fromQueue: boolean; // true if playing from queue, false if playing directly
  } | null;

  // Playlist state
  playlist: AudioRecording[];
  currentPlaylistIndex: number;

  // Bible navigation state
  bibleBooks: Book[];
  currentBook: Book | null;

  // Loading states
  isBuffering: boolean;

  // Actions
  setCurrentAudio: (recordingId: string) => Promise<void>;
  setPlaybackState: (isPlaying: boolean) => void;
  setProgress: (position: number, duration?: number) => void;
  setLoading: (isLoading: boolean) => void;
  setBuffering: (isBuffering: boolean) => void;

  // Verse navigation actions
  previousVerse: () => Promise<void>;
  nextVerse: () => Promise<void>;

  // Queue integration actions
  onItemFinished: () => Promise<void>;
  addPreviousChapterToQueue: (currentRecordingId: string) => Promise<void>;

  // Playlist actions
  addToPlaylist: (recording: AudioRecording) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  playNext: () => Promise<boolean>;
  playPrevious: () => Promise<boolean>;

  // Control actions
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  close: () => void;

  // New actions for database integration
  loadRecordings: () => Promise<AudioRecording[]>;
  searchRecordings: (query: string) => Promise<AudioRecording[]>;
  refreshCurrentChapter: () => Promise<void>;

  // Bible navigation helpers
  initializeBibleBooks: () => void;
  findNextChapter: (currentRecordingId: string) => string | null;
  findPreviousChapter: (currentRecordingId: string) => string | null;

  // Queue integration
  playFromQueueItem: (queueItem: any, fromQueue: boolean) => Promise<void>;
}

// Initial state will be set by MainNavigator when it loads John 1

export const useAudioStore = create<AudioState>((set, get) => ({
  // Core audio player state
  // currentRecording will be set by MainNavigator on startup
  currentChapter: null,
  currentSegment: null,
  currentTime: 0,
  totalTime: 0,
  isPlaying: false,
  playbackSpeed: 1.0,
  isLoading: false,
  error: undefined,

  // UI state
  currentUIHelper: null,
  currentVerseDisplayData: [],

  // Track what's currently playing (separate from queue)
  currentlyPlaying: null,

  // Playlist state
  playlist: [],
  currentPlaylistIndex: -1,
  isBuffering: false,

  // Bible navigation state
  bibleBooks: [],
  currentBook: null,

  // Loading states

  // Initialize Bible books data
  initializeBibleBooks: () => {
    const books = loadBibleBooks();
    set({ bibleBooks: books });
  },

  // Find next chapter in Bible sequence
  findNextChapter: (currentRecordingId: string) => {
    const { bibleBooks } = get();
    if (bibleBooks.length === 0) {
      get().initializeBibleBooks();
    }

    const parsed = parseRecordingId(currentRecordingId);
    if (!parsed) return null;

    const { bookName, chapter } = parsed;

    // Find current book
    const currentBook = bibleBooks.find(book => book.name === bookName);
    if (!currentBook) return null;

    // Check if there's a next chapter in current book
    if (chapter < currentBook.chapters) {
      return getRecordingId(currentBook, chapter + 1);
    }

    // Find next book
    const nextBook = bibleBooks.find(
      book => book.order === currentBook.order + 1
    );
    if (nextBook) {
      return getRecordingId(nextBook, 1);
    }

    return null; // At end of Bible
  },

  // Find previous chapter in Bible sequence
  findPreviousChapter: (currentRecordingId: string) => {
    const { bibleBooks } = get();
    if (bibleBooks.length === 0) {
      get().initializeBibleBooks();
    }

    const parsed = parseRecordingId(currentRecordingId);
    if (!parsed) return null;

    const { bookName, chapter } = parsed;

    // Find current book
    const currentBook = bibleBooks.find(book => book.name === bookName);
    if (!currentBook) return null;

    // Check if there's a previous chapter in current book
    if (chapter > 1) {
      return getRecordingId(currentBook, chapter - 1);
    }

    // Find previous book
    const previousBook = bibleBooks.find(
      book => book.order === currentBook.order - 1
    );
    if (previousBook) {
      return getRecordingId(previousBook, previousBook.chapters);
    }

    return null; // At beginning of Bible
  },

  // Set current audio by recording ID
  setCurrentAudio: async (recordingId: string) => {
    try {
      set({ isLoading: true, error: undefined });

      const chapter = await audioService.getAudioChapter(recordingId);
      if (!chapter) {
        set({ error: 'Failed to load audio chapter', isLoading: false });
        return;
      }

      const uiHelper = new ChapterUIHelper(chapter);
      const verseDisplayData = uiHelper.getVerseDisplayData(0);

      // Find the full Book object from bibleBooks
      const { bibleBooks } = get();
      const bookObj = bibleBooks.find(b => b.name === chapter.bookName) || null;

      set({
        currentRecording: chapter.audioRecording,
        currentChapter: chapter,
        currentUIHelper: uiHelper,
        currentVerseDisplayData: verseDisplayData,
        currentTime: 0,
        totalTime: chapter.totalDuration,
        isLoading: false,
        currentBook: bookObj,
      });

      console.log(
        `Loaded audio chapter: ${chapter.bookName} ${chapter.chapterNumber}`
      );
    } catch (error) {
      console.error('Error setting current audio:', error);
      set({
        error: 'Failed to load audio chapter',
        isLoading: false,
      });
    }
  },

  // Basic setters
  setPlaybackState: (isPlaying: boolean) => {
    set({ isPlaying });
  },

  setProgress: (position: number, duration?: number) => {
    const { currentUIHelper } = get();

    const updates: Partial<AudioState> = {
      currentTime: position,
      ...(duration !== undefined && { totalTime: duration }),
    };

    // Update current segment and verse display data
    if (currentUIHelper) {
      const currentSegment = currentUIHelper.getCurrentSegment(position);
      const verseDisplayData = currentUIHelper.getVerseDisplayData(position);

      updates.currentSegment = currentSegment;
      updates.currentVerseDisplayData = verseDisplayData;
    } else {
      // If no UI helper, clear segment data
      updates.currentSegment = undefined;
      updates.currentVerseDisplayData = [];
    }

    set(updates);
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setBuffering: (isBuffering: boolean) => {
    set({ isBuffering });
  },

  // Playlist management
  addToPlaylist: (recording: AudioRecording) => {
    const { playlist } = get();
    // Allow duplicates - users can queue the same track multiple times
    set({
      playlist: [...playlist, recording],
    });
  },

  removeFromPlaylist: (index: number) => {
    const { playlist, currentPlaylistIndex } = get();
    const newPlaylist = playlist.filter((_, i) => i !== index);

    let newCurrentIndex = currentPlaylistIndex;
    if (index <= currentPlaylistIndex) {
      newCurrentIndex = Math.max(0, currentPlaylistIndex - 1);
    }

    set({
      playlist: newPlaylist,
      currentPlaylistIndex: newPlaylist.length === 0 ? -1 : newCurrentIndex,
    });
  },

  clearPlaylist: () => {
    set({
      playlist: [],
      currentPlaylistIndex: -1,
    });
  },

  playNext: async () => {
    const { playlist, currentPlaylistIndex, currentRecording } = get();

    // If we have a playlist, use playlist navigation (priority over queue)
    if (playlist.length > 0) {
      // Only advance if already started
      if (currentPlaylistIndex === -1) {
        return false;
      }
      const nextIndex = currentPlaylistIndex + 1;
      if (nextIndex < playlist.length) {
        const nextRecording = playlist[nextIndex];
        if (nextRecording) {
          await get().setCurrentAudio(nextRecording.id);
          set({ currentPlaylistIndex: nextIndex });
          return true;
        }
      }
      return false;
    }

    // Try to use the queue system
    const queueStore = useQueueStore.getState();
    const currentQueueItem = queueStore.getCurrentItem();

    if (currentQueueItem) {
      // We're currently playing from a queue
      const success = await queueStore.playNext();
      if (success) {
        const nextItem = queueStore.getCurrentItem();
        if (nextItem && nextItem.type === 'chapter') {
          const chapter = nextItem.data as any;
          const chapterId = `${chapter.book_name.toLowerCase().replace(/\s+/g, '-')}-${chapter.chapter_number}`;
          await get().setCurrentAudio(chapterId);
          return true;
        }
      }
      return success;
    }

    // Bible chapter navigation - only if we have a current recording
    if (currentRecording) {
      const nextChapterRecordingId = get().findNextChapter(currentRecording.id);
      if (nextChapterRecordingId) {
        await get().setCurrentAudio(nextChapterRecordingId);
        console.log(`Next chapter: loaded ${nextChapterRecordingId}`);
        return true;
      } else {
        console.log('Next chapter: already at end of Bible');
        return false;
      }
    }

    console.log('Next chapter: no current recording');
    return false;
  },

  playPrevious: async () => {
    const {
      playlist,
      currentPlaylistIndex,
      currentRecording,
      currentUIHelper,
      currentTime,
    } = get();

    // If we have a playlist, use playlist navigation (priority over queue)
    if (playlist.length > 0) {
      // Only go back if index > 0
      if (currentPlaylistIndex <= 0) {
        return false;
      }
      const prevIndex = currentPlaylistIndex - 1;
      if (prevIndex >= 0) {
        const prevRecording = playlist[prevIndex];
        if (prevRecording) {
          await get().setCurrentAudio(prevRecording.id);
          set({ currentPlaylistIndex: prevIndex });
          return true;
        }
      }
      return false;
    }

    // Try to use the queue system
    const queueStore = useQueueStore.getState();
    const currentQueueItem = queueStore.getCurrentItem();

    if (currentQueueItem) {
      // We're currently playing from a queue
      const success = await queueStore.playPrevious();
      if (success) {
        const prevItem = queueStore.getCurrentItem();
        if (prevItem && prevItem.type === 'chapter') {
          const chapter = prevItem.data as any;
          const chapterId = `${chapter.book_name.toLowerCase().replace(/\s+/g, '-')}-${chapter.chapter_number}`;
          await get().setCurrentAudio(chapterId);
          return true;
        }
      }
      return success;
    }

    // Bible chapter navigation with "restart chapter" logic - only if we have a current recording
    if (currentRecording && currentUIHelper) {
      const currentSegment = currentUIHelper.getCurrentSegment(currentTime);

      // Check if we're at verse 1 (first segment) or very close to the beginning
      const firstSegment = currentUIHelper.getSegmentByVerseNumber(1);
      const isAtFirstVerse =
        currentSegment?.segmentNumber === 1 || currentTime < 5; // 5 second threshold

      if (!isAtFirstVerse && firstSegment) {
        // Not at verse 1, so go to verse 1 of current chapter
        get().seek(firstSegment.startTime);
        console.log('Previous chapter: seeking to verse 1 of current chapter');
        return true;
      } else {
        // At verse 1, so add previous chapter to queue and go to it
        await get().addPreviousChapterToQueue(currentRecording.id);

        const previousChapterRecordingId = get().findPreviousChapter(
          currentRecording.id
        );
        if (previousChapterRecordingId) {
          await get().setCurrentAudio(previousChapterRecordingId);

          // After loading previous chapter, seek to verse 1
          const { currentUIHelper: newUIHelper } = get();
          if (newUIHelper) {
            const firstSegmentOfPrevChapter =
              newUIHelper.getSegmentByVerseNumber(1);
            if (firstSegmentOfPrevChapter) {
              get().seek(firstSegmentOfPrevChapter.startTime);
              console.log(
                `Previous chapter: added previous chapter to queue, loaded ${previousChapterRecordingId} and seeking to verse 1`
              );
            }
          }
          return true;
        } else {
          console.log('Previous chapter: already at beginning of Bible');
          return false;
        }
      }
    }

    console.log('Previous chapter: no current recording or UI helper');
    return false;
  },

  // Control actions
  play: () => {
    set({ isPlaying: true });

    // Mock progress simulation for demo
    const simulateProgress = () => {
      const { isPlaying, currentTime, totalTime } = get();
      if (isPlaying && currentTime < totalTime) {
        get().setProgress(currentTime + 1);
        setTimeout(simulateProgress, 1000);
      } else if (isPlaying && currentTime >= totalTime) {
        // Item finished playing
        set({ isPlaying: false });
        get().onItemFinished();
      }
    };
    setTimeout(simulateProgress, 1000);

    // TODO: Integrate with actual audio player service
  },

  pause: () => {
    set({ isPlaying: false });
    // TODO: Integrate with actual audio player service
  },

  togglePlayPause: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  stop: () => {
    set({
      isPlaying: false,
      currentTime: 0,
    });
    // TODO: Integrate with actual audio player service
  },

  seek: (position: number) => {
    get().setProgress(position);
    // TODO: Integrate with actual audio player service
  },

  // Verse navigation functions
  previousVerse: async () => {
    const {
      currentTime,
      currentUIHelper,
      currentSegment: storedCurrentSegment,
    } = get();

    if (!currentUIHelper) {
      console.log('No UI helper available for verse navigation');
      return;
    }

    // Use stored current segment if available, otherwise calculate it
    const currentSegment =
      storedCurrentSegment || currentUIHelper.getCurrentSegment(currentTime);

    if (!currentSegment) {
      console.log('No current segment for verse navigation');
      return;
    }

    // If not at the very beginning of the segment, seek to beginning
    if (currentTime > currentSegment.startTime + 2) {
      // 2 second threshold
      get().seek(currentSegment.startTime);
      console.log(
        `Previous verse: seeking to beginning of current segment at ${currentSegment.startTime}s`
      );
      return;
    }

    // Otherwise, go to previous segment
    const prevSegment = currentUIHelper.getSegmentByVerseNumber(
      currentSegment.segmentNumber - 1
    );
    if (prevSegment) {
      get().seek(prevSegment.startTime);
      console.log(
        `Previous verse: seeking to segment ${prevSegment.segmentNumber} at ${prevSegment.startTime}s`
      );
    } else {
      // At beginning of chapter - add previous chapter to queue and navigate to it
      const { currentRecording } = get();
      if (currentRecording) {
        await get().addPreviousChapterToQueue(currentRecording.id);

        // Now navigate to the previous chapter
        const success = await get().playPrevious();
        if (success) {
          // After loading previous chapter, seek to the last verse
          const { currentUIHelper: newUIHelper, currentChapter } = get();
          if (newUIHelper && currentChapter) {
            const lastSegment = newUIHelper.getSegmentByVerseNumber(
              currentChapter.totalSegments
            );
            if (lastSegment) {
              get().seek(lastSegment.startTime);
              console.log(
                `Previous verse: added previous chapter to queue, loaded it, and seeking to last verse ${currentChapter.totalSegments} at ${lastSegment.startTime}s`
              );
            }
          }
        } else {
          console.log('Previous verse: already at beginning');
        }
      }
    }
  },

  nextVerse: async () => {
    const {
      currentTime,
      currentUIHelper,
      currentSegment: storedCurrentSegment,
    } = get();

    if (!currentUIHelper) {
      console.log('No UI helper available for verse navigation');
      return;
    }

    // Use stored current segment if available, otherwise calculate it
    const currentSegment =
      storedCurrentSegment || currentUIHelper.getCurrentSegment(currentTime);

    if (!currentSegment) {
      console.log('No current segment for verse navigation');
      return;
    }

    // Go to next segment
    const nextSegment = currentUIHelper.getSegmentByVerseNumber(
      currentSegment.segmentNumber + 1
    );
    if (nextSegment) {
      get().seek(nextSegment.startTime);
      console.log(
        `Next verse: seeking to segment ${nextSegment.segmentNumber} at ${nextSegment.startTime}s`
      );
    } else {
      // At end of chapter, try to go to next chapter via queue system
      const success = await get().playNext();
      if (success) {
        // After loading next chapter, seek to verse 1
        const { currentUIHelper: newUIHelper } = get();
        if (newUIHelper) {
          const firstSegment = newUIHelper.getSegmentByVerseNumber(1);
          if (firstSegment) {
            get().seek(firstSegment.startTime);
            console.log(
              `Next verse: loaded next chapter and seeking to verse 1 at ${firstSegment.startTime}s`
            );
          }
        }
      } else {
        console.log('Next verse: already at end of queue');
      }
    }
  },

  close: () => {
    set({
      currentChapter: null,
      currentSegment: null,
      currentUIHelper: null,
      currentVerseDisplayData: [],
      isPlaying: false,
      currentTime: 0,
      totalTime: 0,
    });
  },

  // New database integration methods
  loadRecordings: async () => {
    try {
      const recordings = await audioService.getAudioRecordings();
      console.log(`Loaded ${recordings.length} audio recordings`);
      return recordings;
    } catch (error) {
      console.error('Error loading recordings:', error);
      return [];
    }
  },

  searchRecordings: async (query: string) => {
    try {
      const recordings = await audioService.searchAudioRecordings(query);
      console.log(`Found ${recordings.length} recordings for query: ${query}`);
      return recordings;
    } catch (error) {
      console.error('Error searching recordings:', error);
      return [];
    }
  },

  refreshCurrentChapter: async () => {
    const { currentRecording } = get();
    if (currentRecording) {
      await get().setCurrentAudio(currentRecording.id);
    }
  },

  // Queue integration
  playFromQueueItem: async (queueItem: any, fromQueue: boolean = true) => {
    // Set currently playing state
    set({
      currentlyPlaying: {
        type: queueItem.type,
        data: queueItem.data,
        fromQueue,
      },
    });

    if (queueItem.type === 'chapter') {
      const chapter = queueItem.data;
      const chapterId = `${chapter.book_name.toLowerCase().replace(/\s+/g, '-')}-${chapter.chapter_number}`;
      await get().setCurrentAudio(chapterId);
    } else if (queueItem.type === 'passage') {
      // For passages, we'd need to load the chapter and seek to the specific time
      const passage = queueItem.data;
      const chapterId = passage.chapter_id;
      await get().setCurrentAudio(chapterId);
      get().seek(passage.start_time_seconds);
    } else if (queueItem.type === 'playlist') {
      // For playlists, we'd need to load the first item in the playlist
      // TODO: Implement playlist loading
      console.log('Playlist playback not yet implemented');
    }
  },

  // Sync audio store with queue's current item
  syncWithQueue: async () => {
    const queueStore = useQueueStore.getState();
    const currentQueueItem = queueStore.getCurrentItem();

    if (currentQueueItem) {
      await get().playFromQueueItem(currentQueueItem, true);
      console.log('Audio store synced with queue:', currentQueueItem);
    } else {
      console.log('No queue item to sync with');
    }
  },

  // Handle when an item finishes playing
  onItemFinished: async () => {
    const { currentlyPlaying } = get();

    if (!currentlyPlaying) {
      console.log('No currently playing item to finish');
      return;
    }

    if (currentlyPlaying.fromQueue) {
      // Item was from queue, remove it and play next from queue
      const queueStore = useQueueStore.getState();
      const currentItem = queueStore.getCurrentItem();

      if (currentItem && queueStore.isUserQueueActive) {
        const activeQueue = queueStore.getActiveQueue();
        const currentIndex = activeQueue.currentIndex;

        if (currentIndex >= 0) {
          // Remove the finished item from user queue
          queueStore.removeFromUserQueue(currentIndex);
        }
      }

      // Try to play the next item from queue
      const nextQueueItem = queueStore.getCurrentItem();
      if (nextQueueItem) {
        await get().playFromQueueItem(nextQueueItem, true);
        get().play();
        console.log(
          'Queue item finished, playing next from queue:',
          nextQueueItem
        );
      } else {
        // No more items in queue
        set({ currentlyPlaying: null, isPlaying: false });
        console.log('Queue finished, no more items to play');
      }
    } else {
      // Item was played directly (not from queue)
      // Check if there's something in the user queue to play next
      const queueStore = useQueueStore.getState();
      const nextQueueItem = queueStore.getCurrentItem();

      if (nextQueueItem) {
        await get().playFromQueueItem(nextQueueItem, true);
        get().play();
        console.log('Direct play finished, starting queue:', nextQueueItem);
      } else {
        // No queue items, just stop
        set({ currentlyPlaying: null, isPlaying: false });
        console.log('Direct play finished, no queue items to continue with');
      }
    }
  },

  // Add previous chapter to the front of the user queue
  addPreviousChapterToQueue: async (currentRecordingId: string) => {
    const previousChapterRecordingId =
      get().findPreviousChapter(currentRecordingId);

    if (previousChapterRecordingId) {
      const queueStore = useQueueStore.getState();

      // Parse the previous chapter ID to get book and chapter info
      const parsed = parseRecordingId(previousChapterRecordingId);
      if (parsed) {
        const { bookName, chapter } = parsed;

        // Create mock chapter data for the previous chapter
        const previousChapter = {
          id: previousChapterRecordingId,
          book_name: bookName,
          chapter_number: chapter,
          title: `${bookName} Chapter ${chapter}`,
          audio_file_url: `https://example.com/${previousChapterRecordingId}.mp3`,
          duration_seconds: 600 + chapter * 30,
          language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Add to the front of the user queue
        queueStore.addToUserQueueFront({
          type: 'chapter',
          data: previousChapter,
        });

        console.log(
          `Added previous chapter ${bookName} ${chapter} to front of queue`
        );
      }
    }
  },
}));
