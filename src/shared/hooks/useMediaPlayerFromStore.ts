import { useMediaPlayerStore } from '../store/mediaPlayerStore';
import type { MediaTrack } from '../store/mediaPlayerStore';

// Types for backward compatibility
export interface MediaPlayerContextType {
  state: {
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
  };
  actions: {
    setCurrentTrack: (track: MediaTrack) => void;
    play: () => void;
    pause: () => void;
    stop: () => void;
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    setPlaybackRate: (rate: number) => void;
    expand: () => void;
    collapse: () => void;
    toggleExpanded: () => void;
    nextTrack: () => void;
    previousTrack: () => void;
    setQueue: (tracks: MediaTrack[]) => void;
    addToQueue: (track: MediaTrack) => void;
    removeFromQueue: (trackId: string) => void;
    toggleRepeat: () => void;
    toggleShuffle: () => void;
    updateProgress: (currentTime: number) => void;
    clearError: () => void;
  };
}

/**
 * Hook that provides the same API as the old MediaPlayerContext
 * but uses the new Zustand store instead of React Context
 */
export const useMediaPlayer = (): MediaPlayerContextType => {
  const {
    currentTrack,
    isPlaying,
    volume,
    playbackRate,
    isExpanded,
    queue,
    currentIndex,
    repeatMode,
    shuffleMode,
    error,
    setCurrentTrack,
    play,
    pause,
    stop,
    seekTo,
    setVolume,
    setPlaybackRate,
    expand,
    collapse,
    toggleExpanded,
    nextTrack,
    previousTrack,
    setQueue,
    addToQueue,
    removeFromQueue,
    toggleRepeat,
    toggleShuffle,
    updateProgress,
    clearError,
  } = useMediaPlayerStore();

  return {
    state: {
      currentTrack,
      isPlaying,
      volume,
      playbackRate,
      isExpanded,
      queue,
      currentIndex,
      repeatMode,
      shuffleMode,
      error,
    },
    actions: {
      setCurrentTrack,
      play,
      pause,
      stop,
      seekTo,
      setVolume,
      setPlaybackRate,
      expand,
      collapse,
      toggleExpanded,
      nextTrack,
      previousTrack,
      setQueue,
      addToQueue,
      removeFromQueue,
      toggleRepeat,
      toggleShuffle,
      updateProgress,
      clearError,
    },
  };
};
