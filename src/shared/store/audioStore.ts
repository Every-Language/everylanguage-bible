import { create } from 'zustand';
import { type Book } from '../utils/bibleData';

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

  // Playlist actions
  addToPlaylist: (book: Book, chapter: number) => void;
  removeFromPlaylist: (index: number) => void;
  clearPlaylist: () => void;
  playNext: () => boolean; // returns true if there's a next item
  playPrevious: () => boolean; // returns true if there's a previous item

  // Control actions
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (position: number) => void;
}

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
      totalDuration: 0,
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

  playNext: () => {
    const { playlist, currentPlaylistIndex } = get();
    const nextIndex = currentPlaylistIndex + 1;

    if (nextIndex < playlist.length) {
      const nextItem = playlist[nextIndex];
      if (nextItem) {
        set({
          currentPlaylistIndex: nextIndex,
          currentBook: nextItem.book,
          currentChapter: nextItem.chapter,
          currentPosition: 0,
        });
        return true;
      }
    }
    return false;
  },

  playPrevious: () => {
    const { playlist, currentPlaylistIndex } = get();
    const prevIndex = currentPlaylistIndex - 1;

    if (prevIndex >= 0) {
      const prevItem = playlist[prevIndex];
      if (prevItem) {
        set({
          currentPlaylistIndex: prevIndex,
          currentBook: prevItem.book,
          currentChapter: prevItem.chapter,
          currentPosition: 0,
        });
        return true;
      }
    }
    return false;
  },

  // Control actions
  play: () => {
    set({ isPlaying: true });
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
}));
