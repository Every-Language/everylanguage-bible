import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';

interface MediaTrack {
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

interface MediaPlayerState {
  currentTrack: MediaTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  playbackRate: number;
  isExpanded: boolean;
  queue: MediaTrack[];
  currentIndex: number;
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;
}

interface MediaPlayerContextType {
  state: MediaPlayerState;
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
  };
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(
  undefined
);

interface MediaPlayerProviderProps {
  children: ReactNode;
}

export const MediaPlayerProvider: React.FC<MediaPlayerProviderProps> = ({
  children,
}) => {
  const [state, setState] = useState<MediaPlayerState>({
    currentTrack: null,
    isPlaying: false,
    isLoading: false,
    volume: 1.0,
    playbackRate: 1.0,
    isExpanded: false,
    queue: [],
    currentIndex: -1,
    repeatMode: 'none',
    shuffleMode: false,
  });

  const setCurrentTrack = useCallback((track: MediaTrack) => {
    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: false,
      isLoading: false,
    }));
  }, []);

  const play = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const stop = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTrack: null,
      isExpanded: false,
    }));
  }, []);

  const seekTo = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      currentTrack: prev.currentTrack
        ? { ...prev.currentTrack, currentTime: time }
        : null,
    }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, []);

  const expand = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: true }));
  }, []);

  const collapse = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: false }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const nextTrack = useCallback(() => {
    setState(prev => {
      if (prev.queue.length === 0) return prev;

      let nextIndex = prev.currentIndex + 1;
      if (nextIndex >= prev.queue.length) {
        nextIndex = prev.repeatMode === 'all' ? 0 : prev.currentIndex;
      }

      if (nextIndex !== prev.currentIndex) {
        return {
          ...prev,
          currentIndex: nextIndex,
          currentTrack: prev.queue[nextIndex] || null,
        };
      }

      return prev;
    });
  }, []);

  const previousTrack = useCallback(() => {
    setState(prev => {
      if (prev.queue.length === 0) return prev;

      let prevIndex = prev.currentIndex - 1;
      if (prevIndex < 0) {
        prevIndex = prev.repeatMode === 'all' ? prev.queue.length - 1 : 0;
      }

      if (prevIndex !== prev.currentIndex) {
        return {
          ...prev,
          currentIndex: prevIndex,
          currentTrack: prev.queue[prevIndex] || null,
        };
      }

      return prev;
    });
  }, []);

  const setQueue = useCallback((tracks: MediaTrack[]) => {
    setState(prev => ({
      ...prev,
      queue: tracks,
      currentIndex: tracks.length > 0 ? 0 : -1,
      currentTrack: tracks.length > 0 ? tracks[0] || null : null,
    }));
  }, []);

  const addToQueue = useCallback((track: MediaTrack) => {
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, track],
    }));
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter(track => track.id !== trackId),
    }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState(prev => ({
      ...prev,
      repeatMode:
        prev.repeatMode === 'none'
          ? 'one'
          : prev.repeatMode === 'one'
            ? 'all'
            : 'none',
    }));
  }, []);

  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, shuffleMode: !prev.shuffleMode }));
  }, []);

  const updateProgress = useCallback((currentTime: number) => {
    setState(prev => ({
      ...prev,
      currentTrack: prev.currentTrack
        ? { ...prev.currentTrack, currentTime }
        : null,
    }));
  }, []);

  // ✅ PERFORMANCE FIX: Memoize context value to prevent unnecessary re-renders
  const contextValue: MediaPlayerContextType = useMemo(
    () => ({
      state,
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
      },
    }),
    [
      state,
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
    ]
  );

  return (
    <MediaPlayerContext.Provider value={contextValue}>
      {children}
    </MediaPlayerContext.Provider>
  );
};

export const useMediaPlayer = (): MediaPlayerContextType => {
  const context = useContext(MediaPlayerContext);
  if (!context) {
    throw new Error('useMediaPlayer must be used within a MediaPlayerProvider');
  }
  return context;
};

export type { MediaTrack, MediaPlayerState, MediaPlayerContextType };
