import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { truncateTime, sanitizeTime } from '@/features/media/utils/audioUtils';

// Types
export interface MediaTrack {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  currentTime: number;
  url?: string;
  book?: string;
  chapter?: string;
  verse?: string;
}

export interface MediaPlayerState {
  currentTrack: MediaTrack | null;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  isExpanded: boolean;
  queue: MediaTrack[];
  currentIndex: number;
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;
  error: string | null;
}

export interface MediaPlayerActions {
  // State setters
  setCurrentTrack: (track: MediaTrack) => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setExpanded: (expanded: boolean) => void;
  setQueue: (tracks: MediaTrack[]) => void;
  setCurrentIndex: (index: number) => void;
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
  setShuffleMode: (shuffle: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Player actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  expand: () => void;
  collapse: () => void;
  toggleExpanded: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: MediaTrack) => void;
  removeFromQueue: (trackId: string) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  updateProgress: (currentTime: number) => void;
}

export type MediaPlayerStore = MediaPlayerState & MediaPlayerActions;

// Store
export const useMediaPlayerStore = create<MediaPlayerStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTrack: null,
      isPlaying: false,
      volume: 1.0,
      playbackRate: 1.0,
      isExpanded: false,
      queue: [],
      currentIndex: -1,
      repeatMode: 'none',
      shuffleMode: false,
      error: null,

      // State setters
      setCurrentTrack: track => {
        set({
          currentTrack: {
            ...track,
            currentTime: 0, // Always start from the beginning
          },
          isPlaying: false,
          error: null,
        });
      },

      setPlaying: playing => {
        set({ isPlaying: playing });
      },

      setVolume: volume => {
        set({ volume });
      },

      setPlaybackRate: rate => {
        set({ playbackRate: rate });
      },

      setExpanded: expanded => {
        set({ isExpanded: expanded });
      },

      setQueue: tracks => {
        set({
          queue: tracks,
          currentIndex: tracks.length > 0 ? 0 : -1,
          currentTrack: tracks.length > 0 ? tracks[0] || null : null,
        });
      },

      setCurrentIndex: index => {
        set({ currentIndex: index });
      },

      setRepeatMode: mode => {
        set({ repeatMode: mode });
      },

      setShuffleMode: shuffle => {
        set({ shuffleMode: shuffle });
      },

      setError: error => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Player actions
      play: () => {
        set({ isPlaying: true });
      },

      pause: () => {
        set({ isPlaying: false });
      },

      stop: () => {
        set({
          isPlaying: false,
          currentTrack: null,
          isExpanded: false,
        });
      },

      seekTo: time => {
        const sanitizedTime = sanitizeTime(time);
        const truncatedTime = truncateTime(sanitizedTime, 1);

        set({
          currentTrack: get().currentTrack
            ? { ...get().currentTrack!, currentTime: truncatedTime }
            : null,
        });
      },

      expand: () => {
        set({ isExpanded: true });
      },

      collapse: () => {
        set({ isExpanded: false });
      },

      toggleExpanded: () => {
        set({ isExpanded: !get().isExpanded });
      },

      nextTrack: () => {
        const { queue, currentIndex, repeatMode } = get();
        if (queue.length === 0) return;

        let nextIndex = currentIndex + 1;
        if (nextIndex >= queue.length) {
          nextIndex = repeatMode === 'all' ? 0 : currentIndex;
        }

        if (nextIndex !== currentIndex) {
          set({
            currentIndex: nextIndex,
            currentTrack: queue[nextIndex] || null,
          });
        }
      },

      previousTrack: () => {
        const { queue, currentIndex, repeatMode } = get();
        if (queue.length === 0) return;

        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          prevIndex = repeatMode === 'all' ? queue.length - 1 : 0;
        }

        if (prevIndex !== currentIndex) {
          set({
            currentIndex: prevIndex,
            currentTrack: queue[prevIndex] || null,
          });
        }
      },

      addToQueue: track => {
        set({ queue: [...get().queue, track] });
      },

      removeFromQueue: trackId => {
        set({
          queue: get().queue.filter(track => track.id !== trackId),
        });
      },

      toggleRepeat: () => {
        const { repeatMode } = get();
        const newMode =
          repeatMode === 'none' ? 'one' : repeatMode === 'one' ? 'all' : 'none';
        set({ repeatMode: newMode });
      },

      toggleShuffle: () => {
        set({ shuffleMode: !get().shuffleMode });
      },

      updateProgress: currentTime => {
        const sanitizedTime = sanitizeTime(currentTime);
        const truncatedTime = truncateTime(sanitizedTime, 1);

        set({
          currentTrack: get().currentTrack
            ? { ...get().currentTrack!, currentTime: truncatedTime }
            : null,
        });
      },
    }),
    {
      name: 'media-player-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist essential state, not real-time states
      partialize: state => ({
        volume: state.volume,
        playbackRate: state.playbackRate,
        repeatMode: state.repeatMode,
        shuffleMode: state.shuffleMode,
      }),
    }
  )
);
