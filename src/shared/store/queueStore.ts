import { create } from 'zustand';
import {
  QueueState,
  QueueActions,
  QueueItem,
  Chapter,
  createQueueItem,
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
  isUserQueueActive: false,
  bibleBooks: [],

  // Initialize default queue with John 1 and Luke 1:15-55 in user queue
  initializeDefaultQueue: () => {
    try {
      // Create John 1 chapter (full chapter)
      const johnChapter = createMockChapter('john-1');
      const johnQueueItem = createQueueItem('chapter', johnChapter);

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
          items: [johnQueueItem, lukeQueueItem],
          isActive: true,
        },
        isUserQueueActive: true,
      }));

      // Update automatic queue based on the new user queue
      get().updateAutomaticQueueFromUserQueue();

      console.log(
        'Default user queue initialized with John 1 and Luke 1:15-55'
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

    // Update automatic queue based on the new user queue
    get().updateAutomaticQueueFromUserQueue();
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

    // Update automatic queue based on the new user queue
    get().updateAutomaticQueueFromUserQueue();
  },

  removeFromUserQueue: (index: number) => {
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

    // Update automatic queue based on the new user queue
    get().updateAutomaticQueueFromUserQueue();
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

    // Update automatic queue based on the new user queue
    get().updateAutomaticQueueFromUserQueue();
  },

  clearUserQueue: () => {
    set(() => ({
      userQueue: {
        items: [],
        currentIndex: -1,
        isActive: false,
      },
      isUserQueueActive: false,
    }));

    // Update automatic queue based on the new user queue (will clear it since user queue is empty)
    get().updateAutomaticQueueFromUserQueue();
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
    const { userQueue, automaticQueue } = get();
    const firstNonPlaylistItem = findFirstNonPlaylistItem(userQueue.items);
    
    if (!firstNonPlaylistItem) {
      // No non-playlist items, keep existing automatic queue if it exists
      // Only clear if there was no automatic queue before
      if (automaticQueue.items.length === 0) {
        get().clearAutomaticQueue();
      }
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

    set(() => ({
      automaticQueue: {
        items: automaticItems,
        currentIndex: -1,
        isActive: automaticItems.length > 0,
      },
    }));
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
      const currentIndex = userQueue.currentIndex >= 0 ? userQueue.currentIndex : 0;
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
      const currentIndex = automaticQueue.currentIndex >= 0 ? automaticQueue.currentIndex : 0;
      if (currentIndex < automaticQueue.items.length) {
        return automaticQueue.items[currentIndex] || null;
      }
    }

    return null;
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
}));
