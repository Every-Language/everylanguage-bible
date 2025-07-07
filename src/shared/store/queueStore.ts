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

// Helper function to find next 5 chapters starting from a given chapter
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

  // Initialize default queue with John 1 and Luke 1 in user queue
  initializeDefaultQueue: () => {
    try {
      // Create John 1 chapter
      const johnChapter = createMockChapter('john-1');
      const johnQueueItem = createQueueItem('chapter', johnChapter);

      // Create Luke 1 chapter
      const lukeChapter = createMockChapter('luke-1');
      const lukeQueueItem = createQueueItem('chapter', lukeChapter);

      set(state => ({
        userQueue: {
          ...state.userQueue,
          items: [johnQueueItem, lukeQueueItem],
          isActive: true,
        },
        isUserQueueActive: true,
      }));

      console.log('Default user queue initialized with John 1 and Luke 1');
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
        currentIndex:
          state.userQueue.currentIndex >= 0
            ? state.userQueue.currentIndex + 1
            : 0,
        isActive: true,
      },
      isUserQueueActive: true,
    }));
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

    // If this is the first item from user queue, clear and repopulate automatic queue
    if (isUserQueueActive && userQueue.currentIndex === -1 && nextIndex === 0) {
      const currentItem = userQueue.items[0];
      if (currentItem && currentItem.type === 'chapter') {
        const chapter = currentItem.data as Chapter;
        const chapterId = `${chapter.book_name.toLowerCase().replace(/\s+/g, '-')}-${chapter.chapter_number}`;
        get().populateAutomaticQueue(chapterId);
      }
    }

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
    const { userQueue, automaticQueue, isUserQueueActive } = get();
    const activeQueue = isUserQueueActive ? userQueue : automaticQueue;

    if (
      activeQueue.currentIndex >= 0 &&
      activeQueue.currentIndex < activeQueue.items.length
    ) {
      return activeQueue.items[activeQueue.currentIndex] || null;
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
