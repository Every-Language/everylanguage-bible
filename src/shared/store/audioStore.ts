import { create } from 'zustand';
import { type Book, loadBibleBooks } from '@/shared/utils';

interface AudioState {
  // Current playback state
  currentBook: Book | null;
  currentChapter: number | null;
  isPlaying: boolean;
  currentPosition: number; // in seconds
  totalDuration: number; // in seconds

  // Playlist state
  playlist: Array<{ book: Book; chapter: number }>;
  currentPlaylistIndex: number;

  // Loading states
  isLoading: boolean;
  isBuffering: boolean;

  // Actions
  setCurrentAudio: (book: Book, chapter: number) => void;
  setPlaybackState: (isPlaying: boolean) => void;
  setProgress: (position: number, duration?: number) => void;
  setLoading: (isLoading: boolean) => void;
  setBuffering: (isBuffering: boolean) => void;

  // Verse navigation actions
  previousVerse: () => Promise<void>;
  nextVerse: () => Promise<void>;

  // Playlist actions
  addToPlaylist: (book: Book, chapter: number) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  playNext: () => Promise<boolean>; // returns promise of true if there's a next item
  playPrevious: () => Promise<boolean>; // returns promise of true if there's a previous item

  // Control actions
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  close: () => void; // Clear current audio and hide player
}

// Helper function to get books list
const getBooksAsync = async (): Promise<Book[]> => {
  try {
    return await loadBibleBooks();
  } catch (error) {
    console.error('Failed to load books:', error);
    return [];
  }
};

export const useAudioStore = create<AudioState>((set, get) => ({
  // Initial state
  currentBook: null,
  currentChapter: null,
  isPlaying: false,
  currentPosition: 0,
  totalDuration: 0,
  playlist: [],
  currentPlaylistIndex: -1,
  isLoading: false,
  isBuffering: false,

  // Basic setters
  setCurrentAudio: (book: Book, chapter: number) => {
    set({
      currentBook: book,
      currentChapter: chapter,
      currentPosition: 0,
      totalDuration: 912, // Mock 15:12 duration for demo
    });
  },

  setPlaybackState: (isPlaying: boolean) => {
    set({ isPlaying });
  },

  setProgress: (position: number, duration?: number) => {
    set({
      currentPosition: position,
      ...(duration !== undefined && { totalDuration: duration }),
    });
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setBuffering: (isBuffering: boolean) => {
    set({ isBuffering });
  },

  // Playlist management
  addToPlaylist: (book: Book, chapter: number) => {
    const { playlist } = get();
    const exists = playlist.some(
      item => item.book.id === book.id && item.chapter === chapter
    );

    if (!exists) {
      set({
        playlist: [...playlist, { book, chapter }],
      });
    }
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
    const { playlist, currentPlaylistIndex, currentBook, currentChapter } =
      get();

    // If we have a playlist, use playlist navigation
    if (playlist.length > 0 && currentPlaylistIndex >= 0) {
      const nextIndex = currentPlaylistIndex + 1;
      if (nextIndex < playlist.length) {
        const nextItem = playlist[nextIndex];
        if (nextItem) {
          set({
            currentPlaylistIndex: nextIndex,
            currentBook: nextItem.book,
            currentChapter: nextItem.chapter,
            currentPosition: 0,
            totalDuration: 912, // Mock duration
          });
          return true;
        }
      }
      return false;
    }

    // If no playlist, do chapter-based navigation with cross-book support
    if (!currentBook || !currentChapter) return false;

    // Try next chapter in current book
    const nextChapter = currentChapter + 1;
    if (nextChapter <= currentBook.chapters) {
      set({
        currentBook,
        currentChapter: nextChapter,
        currentPosition: 0,
        totalDuration: 912, // Mock duration
      });
      console.log(`Playing next chapter: ${currentBook.name} ${nextChapter}`);
      return true;
    }

    // Try first chapter of next book
    try {
      const books = await getBooksAsync();
      const currentBookIndex = books.findIndex(
        book => book.id === currentBook.id
      );

      if (currentBookIndex !== -1 && currentBookIndex < books.length - 1) {
        const nextBook = books[currentBookIndex + 1];
        if (nextBook) {
          set({
            currentBook: nextBook,
            currentChapter: 1,
            currentPosition: 0,
            totalDuration: 912, // Mock duration
          });
          console.log(`Playing next book: ${nextBook.name} 1`);
          return true;
        }
      }

      console.log(`End of Bible - no more books after ${currentBook.name}`);
      return false;
    } catch (error) {
      console.error('Error navigating to next book:', error);
      return false;
    }
  },

  playPrevious: async () => {
    const { playlist, currentPlaylistIndex, currentBook, currentChapter } =
      get();

    // If we have a playlist, use playlist navigation
    if (playlist.length > 0 && currentPlaylistIndex >= 0) {
      const prevIndex = currentPlaylistIndex - 1;
      if (prevIndex >= 0) {
        const prevItem = playlist[prevIndex];
        if (prevItem) {
          set({
            currentPlaylistIndex: prevIndex,
            currentBook: prevItem.book,
            currentChapter: prevItem.chapter,
            currentPosition: 0,
            totalDuration: 912, // Mock duration
          });
          return true;
        }
      }
      return false;
    }

    // If no playlist, do chapter-based navigation with cross-book support
    if (!currentBook || !currentChapter) return false;

    // Try previous chapter in current book
    const prevChapter = currentChapter - 1;
    if (prevChapter >= 1) {
      set({
        currentBook,
        currentChapter: prevChapter,
        currentPosition: 0,
        totalDuration: 912, // Mock duration
      });
      console.log(
        `Playing previous chapter: ${currentBook.name} ${prevChapter}`
      );
      return true;
    }

    // Try last chapter of previous book
    try {
      const books = await getBooksAsync();
      const currentBookIndex = books.findIndex(
        book => book.id === currentBook.id
      );

      if (currentBookIndex > 0) {
        const prevBook = books[currentBookIndex - 1];
        if (prevBook) {
          set({
            currentBook: prevBook,
            currentChapter: prevBook.chapters, // Last chapter of previous book
            currentPosition: 0,
            totalDuration: 912, // Mock duration
          });
          console.log(
            `Playing previous book: ${prevBook.name} ${prevBook.chapters}`
          );
          return true;
        }
      }

      console.log(`Beginning of Bible - no books before ${currentBook.name}`);
      return false;
    } catch (error) {
      console.error('Error navigating to previous book:', error);
      return false;
    }
  },

  // Control actions
  play: () => {
    set({ isPlaying: true });

    // Mock progress simulation for demo
    const simulateProgress = () => {
      const { isPlaying, currentPosition, totalDuration } = get();
      if (isPlaying && currentPosition < totalDuration) {
        set({ currentPosition: currentPosition + 1 });
        setTimeout(simulateProgress, 1000);
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
      currentPosition: 0,
    });
    // TODO: Integrate with actual audio player service
  },

  seek: (position: number) => {
    set({ currentPosition: position });
    // TODO: Integrate with actual audio player service
  },

  // Verse navigation functions with cross-chapter support
  previousVerse: async () => {
    const { currentPosition, currentBook, currentChapter } = get();

    // If not at the very beginning of the chapter, seek back
    if (currentPosition > 5) {
      // 5 second threshold
      const seekAmount = 15; // 15 seconds back for verse navigation
      const newPosition = Math.max(0, currentPosition - seekAmount);
      get().seek(newPosition);
      console.log(
        `Previous verse: seeking to ${newPosition}s (was ${currentPosition}s)`
      );
      return;
    }

    // If at the beginning, go to previous chapter
    if (currentBook && currentChapter) {
      const success = await get().playPrevious();
      if (success) {
        // Set position to near end of the previous chapter (simulating last verse)
        const nearEndPosition = 900; // Near end of mock 15-minute chapter
        set({ currentPosition: nearEndPosition });
        console.log(
          `Previous verse: moved to end of previous chapter at ${nearEndPosition}s`
        );
      } else {
        console.log('Previous verse: already at beginning of Bible');
      }
    }
  },

  nextVerse: async () => {
    const { currentPosition, totalDuration, currentBook, currentChapter } =
      get();

    // If not near the end of the chapter, seek forward
    if (currentPosition < totalDuration - 15) {
      // 15 second threshold from end
      const seekAmount = 15; // 15 seconds forward for verse navigation
      const newPosition = Math.min(totalDuration, currentPosition + seekAmount);
      get().seek(newPosition);
      console.log(
        `Next verse: seeking to ${newPosition}s (was ${currentPosition}s)`
      );
      return;
    }

    // If near the end, go to next chapter
    if (currentBook && currentChapter) {
      const success = await get().playNext();
      if (success) {
        // Set position to beginning of next chapter
        set({ currentPosition: 0 });
        console.log('Next verse: moved to beginning of next chapter');
      } else {
        console.log('Next verse: already at end of Bible');
      }
    }
  },

  close: () => {
    set({
      currentBook: null,
      currentChapter: null,
      isPlaying: false,
      currentPosition: 0,
      totalDuration: 0,
    });
  },
}));
