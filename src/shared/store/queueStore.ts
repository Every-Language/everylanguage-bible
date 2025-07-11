import { create } from 'zustand';
import {
  QueueState,
  QueueActions,
  QueueItem,
  Chapter,
  createQueueItem,
  getQueueItemDisplayName,
} from '@/types/queue';
import { loadBibleBooks, type Book } from '@/shared/utils';

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

// Helper function to find next chapters starting from a given chapter
function findNextChapters(
  startingChapterId: string,
  count: number = 5
): string[] {
  const bibleBooks = loadBibleBooks();
  const parsed = parseRecordingId(startingChapterId);
  if (!parsed) return [];

  const { bookName, chapter } = parsed;
  const currentBook = bibleBooks.find(book => book.name === bookName);
  if (!currentBook) return [];

  const nextChapters: string[] = [];
  let currentChapter = chapter;
  let currentBookIndex = bibleBooks.findIndex(book => book.name === bookName);
  let workingBook = currentBook;

  while (nextChapters.length < count) {
    // Check if there's a next chapter in current book
    if (currentChapter < workingBook.chapters) {
      currentChapter++;
      nextChapters.push(getRecordingId(workingBook, currentChapter));
    } else {
      // Move to next book
      currentBookIndex++;
      if (currentBookIndex < bibleBooks.length) {
        const nextBook = bibleBooks[currentBookIndex];
        if (nextBook) {
          workingBook = nextBook;
          currentChapter = 1;
          nextChapters.push(getRecordingId(workingBook, currentChapter));
        } else {
          break;
        }
      } else {
        // Reached end of Bible
        break;
      }
    }
  }

  return nextChapters;
}

// Helper function to find the first non-playlist item in the queue
function findFirstNonPlaylistItem(queue: QueueItem[]): QueueItem | null {
  return queue.find(item => item.type !== 'playlist') || null;
}

// Helper function to get actual verse count for a chapter
function getChapterVerseCount(bookName: string, chapter: number): number {
  // Common chapters with known verse counts (this could be expanded or moved to a data file)
  const verseCountMap: Record<string, Record<number, number>> = {
    John: { 1: 51, 2: 25, 3: 36, 4: 54, 5: 47, 6: 71 },
    Luke: { 1: 80, 2: 52, 3: 38, 4: 44, 5: 39 },
    Matthew: { 1: 25, 2: 23, 3: 17, 4: 25, 5: 48 },
    Mark: { 1: 45, 2: 28, 3: 35, 4: 41, 5: 43 },
    Galatians: { 1: 24, 2: 21, 3: 29, 4: 31, 5: 26, 6: 18 },
  };

  return verseCountMap[bookName]?.[chapter] || 35; // Default to 35 if not found
}

// Helper function to create a passage for the remaining part of a chapter
function createRemainingChapterPassage(
  passage: any,
  currentChapterId: string
): any {
  const parsed = parseRecordingId(currentChapterId);
  if (!parsed) return null;

  const { bookName, chapter } = parsed;

  // Get actual verse count for this chapter
  const actualTotalVerses = getChapterVerseCount(bookName, chapter);
  const remainingVerses = actualTotalVerses - passage.end_verse;

  if (remainingVerses <= 0) {
    return null; // No remaining verses
  }

  return {
    id: `${currentChapterId}-remaining-${passage.end_verse + 1}-${actualTotalVerses}`,
    chapter_id: currentChapterId,
    start_verse: passage.end_verse + 1,
    end_verse: actualTotalVerses,
    start_time_seconds: passage.end_time_seconds,
    end_time_seconds: passage.end_time_seconds + remainingVerses * 20, // Estimate ~20 seconds per verse
    title: `${bookName} Chapter ${chapter} (verses ${passage.end_verse + 1}-${actualTotalVerses})`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Create mock chapter data for automatic queue population
function createMockChapter(chapterId: string): Chapter {
  const parsed = parseRecordingId(chapterId);
  if (!parsed) {
    throw new Error(`Invalid chapter ID: ${chapterId}`);
  }

  const { bookName, chapter } = parsed;
  return {
    id: chapterId,
    book_name: bookName,
    chapter_number: chapter,
    title: `${bookName} Chapter ${chapter}`,
    audio_file_url: `https://example.com/${chapterId}.mp3`,
    duration_seconds: 600 + chapter * 30, // Vary duration based on chapter
    language: 'en',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

interface QueueStoreState extends QueueState, QueueActions {
  // Additional state for internal use
  bibleBooks: Book[];
  queueViewVisible: boolean;
}

export const useQueueStore = create<QueueStoreState>((set, get) => ({
  // Initial state
  userQueue: {
    items: [],
    currentIndex: -1,
    isActive: false,
  },
  automaticQueue: {
    items: [],
    currentIndex: -1,
    isActive: false,
  },
  recentlyPlayedQueueTracks: [],
  isUserQueueActive: false,
  bibleBooks: [],
  queueViewVisible: false,

  // Initialize default queue with Galatians 1 and Luke 1:15-55 in user queue
  initializeDefaultQueue: () => {
    try {
      // Create Galatians 1 chapter (full chapter)
      const galatiansChapter = createMockChapter('galatians-1');
      const galatiansQueueItem = createQueueItem('chapter', galatiansChapter);

      // Create Luke 1:15-55 passage (partial chapter)
      const lukePassage = {
        id: 'luke-1-15-55',
        chapter_id: 'luke-1',
        start_verse: 15,
        end_verse: 55,
        start_time_seconds: 280, // Roughly 14 verses * 20 seconds each
        end_time_seconds: 1100, // Roughly 55 verses * 20 seconds each
        title: 'Luke Chapter 1 (verses 15-55)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const lukeQueueItem = createQueueItem('passage', lukePassage);

      set(state => ({
        userQueue: {
          ...state.userQueue,
          items: [galatiansQueueItem, lukeQueueItem],
          isActive: true,
        },
        isUserQueueActive: true,
      }));

      // Update automatic queue based on the new user queue
      get().updateAutomaticQueueFromUserQueue();

      console.log(
        'Default user queue initialized with Galatians 1 and Luke 1:15-55'
      );
    } catch (error) {
      console.error('Error initializing default queue:', error);
    }
  },

  // User queue management
  addToUserQueueFront: itemData => {
    const item = createQueueItem(
      itemData.type,
      itemData.data,
      itemData.priority
    );
    set(state => ({
      userQueue: {
        ...state.userQueue,
        items: [item, ...state.userQueue.items],
        currentIndex: 0, // Point to the new first item
        isActive: true,
      },
      isUserQueueActive: true,
    }));

    // Update automatic queue based on the new user queue (only if visible)
    get().updateAutomaticQueueIfVisible();
  },

  addToUserQueueBack: itemData => {
    const item = createQueueItem(
      itemData.type,
      itemData.data,
      itemData.priority
    );
    set(state => ({
      userQueue: {
        ...state.userQueue,
        items: [...state.userQueue.items, item],
        isActive: true,
      },
      isUserQueueActive: true,
    }));

    // Update automatic queue based on the new user queue (only if visible)
    get().updateAutomaticQueueIfVisible();
  },

  // Add item to empty queue, initializing with current track first
  addToEmptyQueue: (itemData, currentTrackInfo) => {
    const { userQueue } = get();

    // Only use this function when queue is actually empty
    if (userQueue.items.length > 0) {
      console.warn(
        'addToEmptyQueue called but queue is not empty. Use addToUserQueueBack instead.'
      );
      return get().addToUserQueueBack(itemData);
    }

    // Create current track item and new item
    const currentTrackItem =
      get().createQueueItemFromTrackInfo(currentTrackInfo);
    const newItem = createQueueItem(
      itemData.type,
      itemData.data,
      itemData.priority
    );

    set(() => ({
      userQueue: {
        items: [currentTrackItem, newItem],
        currentIndex: 0, // Start with current track
        isActive: true,
      },
      isUserQueueActive: true,
    }));

    // Update automatic queue based on the new user queue (only if visible)
    get().updateAutomaticQueueIfVisible();

    console.log('Added to empty queue - current track + new item:', {
      current: getQueueItemDisplayName(currentTrackItem),
      new: getQueueItemDisplayName(newItem),
    });
  },

  removeFromUserQueue: (index: number) => {
    const { userQueue } = get();
    const wasInQueueMode = userQueue.items.length > 0;

    set(state => {
      const newItems = state.userQueue.items.filter((_, i) => i !== index);
      let newCurrentIndex = state.userQueue.currentIndex;

      // Adjust current index if we removed an item before or at the current position
      if (index <= state.userQueue.currentIndex) {
        newCurrentIndex = Math.max(0, state.userQueue.currentIndex - 1);
      }

      return {
        userQueue: {
          ...state.userQueue,
          items: newItems,
          currentIndex: newItems.length === 0 ? -1 : newCurrentIndex,
          isActive: newItems.length > 0,
        },
        isUserQueueActive: newItems.length > 0,
      };
    });

    // Check if we just transitioned from queue mode to flow mode
    const newQueueState = get().userQueue;
    if (wasInQueueMode && newQueueState.items.length === 0) {
      console.log(
        '🔄 MODE TRANSITION: Switched from queue mode to flow mode (queue emptied)'
      );
    }

    // Update automatic queue based on the new user queue (only if visible)
    get().updateAutomaticQueueIfVisible();
  },

  reorderUserQueue: (fromIndex: number, toIndex: number) => {
    set(state => {
      const newItems = [...state.userQueue.items];
      const [movedItem] = newItems.splice(fromIndex, 1);
      if (movedItem) {
        newItems.splice(toIndex, 0, movedItem);
      }

      // Adjust current index based on the move
      let newCurrentIndex = state.userQueue.currentIndex;
      if (fromIndex === state.userQueue.currentIndex) {
        newCurrentIndex = toIndex;
      } else if (
        fromIndex < state.userQueue.currentIndex &&
        toIndex >= state.userQueue.currentIndex
      ) {
        newCurrentIndex--;
      } else if (
        fromIndex > state.userQueue.currentIndex &&
        toIndex <= state.userQueue.currentIndex
      ) {
        newCurrentIndex++;
      }

      return {
        userQueue: {
          ...state.userQueue,
          items: newItems,
          currentIndex: newCurrentIndex,
        },
      };
    });

    // Update automatic queue based on the new user queue (only if visible)
    get().updateAutomaticQueueIfVisible();
  },

  clearUserQueue: () => {
    const { userQueue } = get();
    const wasInQueueMode = userQueue.items.length > 0;

    set(() => ({
      userQueue: {
        items: [],
        currentIndex: -1,
        isActive: false,
      },
      isUserQueueActive: false,
    }));

    if (wasInQueueMode) {
      console.log(
        '🔄 MODE TRANSITION: Switched from queue mode to flow mode (queue cleared)'
      );
    }

    // Clear automatic queue immediately since user queue is now empty
    get().clearAutomaticQueue();
  },

  // Recently played queue management
  addToRecentlyPlayed: (item: QueueItem) => {
    set(state => {
      const newRecentlyPlayed = [item, ...state.recentlyPlayedQueueTracks];
      // Keep only the last 7 items
      if (newRecentlyPlayed.length > 7) {
        newRecentlyPlayed.splice(7);
      }
      return {
        recentlyPlayedQueueTracks: newRecentlyPlayed,
      };
    });
  },

  moveFromRecentlyPlayedToFront: (index: number) => {
    const { recentlyPlayedQueueTracks } = get();

    if (index >= 0 && index < recentlyPlayedQueueTracks.length) {
      const itemToMove = recentlyPlayedQueueTracks[index];

      if (!itemToMove) return;

      // Remove item from recently played
      set(state => ({
        recentlyPlayedQueueTracks: state.recentlyPlayedQueueTracks.filter(
          (_, i) => i !== index
        ),
      }));

      // Add item to front of user queue
      get().addToUserQueueFront({
        type: itemToMove.type,
        data: itemToMove.data,
        ...(itemToMove.priority !== undefined && {
          priority: itemToMove.priority,
        }),
      });

      console.log(
        `Moved item from recently played to front of queue: ${getQueueItemDisplayName(itemToMove)}`
      );
    }
  },

  clearRecentlyPlayed: () => {
    set(() => ({
      recentlyPlayedQueueTracks: [],
    }));
  },

  // Automatic queue management
  populateAutomaticQueue: (startingChapterId: string) => {
    const nextChapterIds = findNextChapters(startingChapterId, 5);
    const automaticItems: QueueItem[] = nextChapterIds.map(chapterId => {
      const chapter = createMockChapter(chapterId);
      return createQueueItem('chapter', chapter);
    });

    set(() => ({
      automaticQueue: {
        items: automaticItems,
        currentIndex: -1,
        isActive: automaticItems.length > 0,
      },
    }));
  },

  // Dynamically update automatic queue based on current user queue top item
  updateAutomaticQueueFromUserQueue: () => {
    const { userQueue } = get();
    const firstNonPlaylistItem = findFirstNonPlaylistItem(userQueue.items);

    if (!firstNonPlaylistItem) {
      // No non-playlist items in user queue
      // Keep existing automatic queue unchanged instead of clearing it
      // This preserves the queue state when user removes items
      console.log(
        'No non-playlist items found, keeping existing automatic queue'
      );
      return;
    }

    // Check if the first item is a playlist - if so, don't update automatic queue
    const firstItem = userQueue.items[0];
    if (firstItem && firstItem.type === 'playlist') {
      // Keep the existing automatic queue unchanged when playlist is at top
      return;
    }

    const automaticItems: QueueItem[] = [];

    if (firstNonPlaylistItem.type === 'chapter') {
      // For full chapters, add the next 5 chapters
      const chapter = firstNonPlaylistItem.data as Chapter;
      const chapterId = `${chapter.book_name.toLowerCase().replace(/\s+/g, '-')}-${chapter.chapter_number}`;
      const nextChapterIds = findNextChapters(chapterId, 5);

      nextChapterIds.forEach(nextChapterId => {
        const nextChapter = createMockChapter(nextChapterId);
        automaticItems.push(createQueueItem('chapter', nextChapter));
      });
    } else if (firstNonPlaylistItem.type === 'passage') {
      // For passages, add remaining part of current chapter first, then next 4 chapters
      const passage = firstNonPlaylistItem.data as any; // Using any since Passage type from types/queue.ts
      const currentChapterId = passage.chapter_id;

      // First, try to add the remaining part of the current chapter
      const remainingPassage = createRemainingChapterPassage(
        passage,
        currentChapterId
      );
      if (remainingPassage) {
        automaticItems.push(createQueueItem('passage', remainingPassage));
      }

      // Then add the next 4 full chapters
      const nextChapterIds = findNextChapters(currentChapterId, 4);
      nextChapterIds.forEach(nextChapterId => {
        const nextChapter = createMockChapter(nextChapterId);
        automaticItems.push(createQueueItem('chapter', nextChapter));
      });
    }

    // Only update automatic queue if we actually have new items to add
    if (automaticItems.length > 0) {
      set(() => ({
        automaticQueue: {
          items: automaticItems,
          currentIndex: -1,
          isActive: automaticItems.length > 0,
        },
      }));
    }
  },

  clearAutomaticQueue: () => {
    set(() => ({
      automaticQueue: {
        items: [],
        currentIndex: -1,
        isActive: false,
      },
    }));
  },

  // Queue navigation
  playNext: async () => {
    const { userQueue, automaticQueue, isUserQueueActive } = get();
    const activeQueue = isUserQueueActive ? userQueue : automaticQueue;

    if (activeQueue.items.length === 0) {
      return false;
    }

    const nextIndex = activeQueue.currentIndex + 1;
    if (nextIndex >= activeQueue.items.length) {
      return false; // End of queue
    }

    set(state => {
      const queueKey = isUserQueueActive ? 'userQueue' : 'automaticQueue';
      return {
        [queueKey]: {
          ...state[queueKey],
          currentIndex: nextIndex,
        },
      };
    });

    // Note: Automatic queue is now dynamically updated based on user queue changes
    // No need for manual population here since updateAutomaticQueueFromUserQueue() handles it

    return true;
  },

  playPrevious: async () => {
    const { userQueue, automaticQueue, isUserQueueActive } = get();
    const activeQueue = isUserQueueActive ? userQueue : automaticQueue;

    if (activeQueue.items.length === 0) {
      return false;
    }

    const prevIndex = activeQueue.currentIndex - 1;
    if (prevIndex < 0) {
      return false; // Beginning of queue
    }

    set(state => {
      const queueKey = isUserQueueActive ? 'userQueue' : 'automaticQueue';
      return {
        [queueKey]: {
          ...state[queueKey],
          currentIndex: prevIndex,
        },
      };
    });

    return true;
  },

  getCurrentItem: () => {
    const { userQueue, automaticQueue } = get();

    // If user queue is empty but automatic queue has items, move the first automatic item to user queue
    if (userQueue.items.length === 0 && automaticQueue.items.length > 0) {
      const firstAutomaticItem = automaticQueue.items[0];
      if (firstAutomaticItem) {
        // Move first automatic item to user queue
        get().addToUserQueueBack({
          type: firstAutomaticItem.type,
          data: firstAutomaticItem.data,
        });
        // Remove from automatic queue
        set(state => ({
          automaticQueue: {
            ...state.automaticQueue,
            items: state.automaticQueue.items.slice(1),
          },
        }));
        // Set user queue as active and point to first item
        set({
          isUserQueueActive: true,
          userQueue: {
            ...get().userQueue,
            currentIndex: 0,
            isActive: true,
          },
        });
        // Return the moved item (now at index 0 in user queue)
        return get().userQueue.items[0] || null;
      }
    }

    // Always prioritize user queue if it has items
    if (userQueue.items.length > 0) {
      // If user queue doesn't have a current index set, start from 0
      const currentIndex =
        userQueue.currentIndex >= 0 ? userQueue.currentIndex : 0;
      if (currentIndex < userQueue.items.length) {
        // Make sure user queue is active
        if (!get().isUserQueueActive) {
          set({ isUserQueueActive: true });
        }
        return userQueue.items[currentIndex] || null;
      }
    }

    // Fall back to automatic queue only if user queue is completely empty
    if (automaticQueue.items.length > 0) {
      const currentIndex =
        automaticQueue.currentIndex >= 0 ? automaticQueue.currentIndex : 0;
      if (currentIndex < automaticQueue.items.length) {
        return automaticQueue.items[currentIndex] || null;
      }
    }

    return null;
  },

  // Mode-aware navigation functions
  playNextInQueueMode: () => {
    const { userQueue } = get();

    if (userQueue.items.length === 0) {
      return false;
    }

    // Get current item to move to recently played
    const currentIndex =
      userQueue.currentIndex >= 0 ? userQueue.currentIndex : 0;
    const currentItem = userQueue.items[currentIndex];

    if (currentItem) {
      // Move current item to recently played
      get().addToRecentlyPlayed(currentItem);

      // Remove current item from user queue
      get().removeFromUserQueue(currentIndex);

      // Current index is automatically adjusted by removeFromUserQueue
      // The next item (if exists) is now at the same index position

      console.log(
        `Queue mode: moved item to recently played and advanced: ${getQueueItemDisplayName(currentItem)}`
      );
      return true;
    }

    return false;
  },

  playPreviousInQueueMode: () => {
    const { recentlyPlayedQueueTracks } = get();

    if (recentlyPlayedQueueTracks.length === 0) {
      return false; // No recently played items to go back to
    }

    // Get the most recent item (index 0) and move it back to front of queue
    get().moveFromRecentlyPlayedToFront(0);

    console.log('Queue mode: moved item from recently played back to queue');
    return true;
  },

  playNextInFlowMode: (currentRecordingId: string) => {
    const { bibleBooks } = get();

    // Initialize books if needed
    if (bibleBooks.length === 0) {
      const books = loadBibleBooks();
      set({ bibleBooks: books });
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

  playPreviousInFlowMode: (currentRecordingId: string) => {
    const { bibleBooks } = get();

    // Initialize books if needed
    if (bibleBooks.length === 0) {
      const books = loadBibleBooks();
      set({ bibleBooks: books });
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

  // Queue state
  setUserQueueActive: (active: boolean) => {
    set({ isUserQueueActive: active });
  },

  getActiveQueue: () => {
    const { userQueue, automaticQueue, isUserQueueActive } = get();
    return isUserQueueActive ? userQueue : automaticQueue;
  },

  getQueueLength: () => {
    const { userQueue, automaticQueue, isUserQueueActive } = get();
    const activeQueue = isUserQueueActive ? userQueue : automaticQueue;
    return activeQueue.items.length;
  },

  // Queue view visibility management
  setQueueViewVisible: (visible: boolean) => {
    set({ queueViewVisible: visible });

    // Update automatic queue when queue view becomes visible
    if (visible) {
      get().updateAutomaticQueueFromUserQueue();
    }
  },

  updateAutomaticQueueIfVisible: () => {
    const { queueViewVisible } = get();
    if (queueViewVisible) {
      get().updateAutomaticQueueFromUserQueue();
    }
  },

  // Play mode utilities
  getPlayMode: () => {
    const { userQueue } = get();
    return userQueue.items.length > 0 ? 'queue' : 'flow';
  },

  // Helper to create queue item from track information
  createQueueItemFromTrackInfo: trackInfo => {
    const {
      recordingId,
      bookName,
      chapterNumber,
      currentTime,
      totalDuration,
      totalVerses,
      currentVerse,
    } = trackInfo;

    // Create a chapter or passage item based on current state
    if (currentTime > 5) {
      // 5 second threshold to avoid creating passages for very short playback
      // If we're mid-playback, create a passage starting from current position
      const verseNumber = currentVerse || 1;
      const endVerse = totalVerses || 30; // Default fallback

      const passage = {
        id: `${recordingId}-from-verse-${verseNumber}`,
        chapter_id: recordingId,
        start_verse: verseNumber,
        end_verse: endVerse,
        start_time_seconds: currentTime,
        end_time_seconds: totalDuration,
        title: `${bookName} Chapter ${chapterNumber} (from verse ${verseNumber})`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return createQueueItem('passage', passage);
    } else {
      // If at beginning, create a full chapter item
      const chapter = {
        id: recordingId,
        book_name: bookName,
        chapter_number: chapterNumber,
        title: `${bookName} Chapter ${chapterNumber}`,
        audio_file_url: `https://example.com/${recordingId}.mp3`,
        duration_seconds: totalDuration,
        language: 'en',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return createQueueItem('chapter', chapter);
    }
  },

  // Initialize queue with current track when transitioning to queuePlayMode
  initializeQueueWithTrack: trackInfo => {
    const currentTrackItem = get().createQueueItemFromTrackInfo(trackInfo);

    set(() => ({
      userQueue: {
        items: [currentTrackItem],
        currentIndex: 0,
        isActive: true,
      },
      isUserQueueActive: true,
    }));

    // Also populate the automatic queue ("up next") with next chapters
    get().updateAutomaticQueueFromUserQueue();

    console.log('🔄 MODE TRANSITION: Switched from flow mode to queue mode');
    console.log(
      'Initialized queue with current track:',
      getQueueItemDisplayName(currentTrackItem)
    );
    console.log('Populated "up next" with automatic queue');
    return true;
  },
}));
