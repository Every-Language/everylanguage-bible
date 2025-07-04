import { useState, useCallback, useRef, useEffect } from 'react';
import { AudioService } from '../services/audioService';
import { DatabaseAdapter } from '../adapters/databaseAdapter';
import type {
  AudioTrack,
  PlaybackSpeed,
  ChapterAudio_temp,
  VerseNavigationResult_temp,
} from '../types';

/**
 * Audio Player State Interface
 */
export interface AudioPlayerState {
  // Current audio track
  currentTrack: AudioTrack | null;
  currentChapter: ChapterAudio_temp | null;

  // Playback status
  isLoaded: boolean;
  isPlaying: boolean;
  isLoading: boolean;

  // Playback position and timing
  positionMillis: number;
  durationMillis: number;
  currentVerse: number | null;

  // Audio settings
  volume: number;
  playbackSpeed: PlaybackSpeed;

  // Error state
  error: string | null;
}

/**
 * Audio Player Actions Interface
 */
export interface AudioPlayerActions {
  // Track loading and playback
  loadTrack: (track: AudioTrack) => Promise<void>;
  loadChapter: (bookId: string, chapterNumber: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;

  // Position controls
  seekTo: (positionSeconds: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;

  // Verse navigation
  nextVerse: () => Promise<VerseNavigationResult_temp | null>;
  previousVerse: () => Promise<VerseNavigationResult_temp | null>;
  goToVerse: (
    verseNumber: number
  ) => Promise<VerseNavigationResult_temp | null>;

  // Audio settings
  setVolume: (volume: number) => Promise<void>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<void>;

  // Utility
  clearError: () => void;
  unload: () => Promise<void>;
}

/**
 * Audio Player Hook Return Type
 */
export type UseAudioPlayerReturn = AudioPlayerState & AudioPlayerActions;

/**
 * Initial state for audio player
 */
const initialState: AudioPlayerState = {
  currentTrack: null,
  currentChapter: null,
  isLoaded: false,
  isPlaying: false,
  isLoading: false,
  positionMillis: 0,
  durationMillis: 0,
  currentVerse: null,
  volume: 1.0,
  playbackSpeed: 1.0,
  error: null,
};

/**
 * Custom hook for audio player functionality
 * Integrates AudioService with React state management
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  // State management
  const [state, setState] = useState<AudioPlayerState>(initialState);

  // Service references
  const audioServiceRef = useRef<AudioService | null>(null);
  const databaseAdapterRef = useRef<DatabaseAdapter | null>(null);
  const currentSoundRef = useRef<any>(null);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        audioServiceRef.current = new AudioService();
        databaseAdapterRef.current = new DatabaseAdapter();
        await audioServiceRef.current.initialize();
      } catch (error) {
        setState(prev => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to initialize audio services',
        }));
      }
    };

    initializeServices();
  }, []);

  // Helper to update state safely
  const updateState = useCallback((updates: Partial<AudioPlayerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper to handle errors
  const handleError = useCallback(
    (error: unknown, action: string) => {
      const errorMessage =
        error instanceof Error ? error.message : `Failed to ${action}`;
      updateState({ error: errorMessage, isLoading: false });
    },
    [updateState]
  );

  // Load a specific audio track
  const loadTrack = useCallback(
    async (track: AudioTrack) => {
      if (!audioServiceRef.current) {
        throw new Error('Audio service not initialized');
      }

      try {
        updateState({ isLoading: true, error: null });

        const result = await audioServiceRef.current.loadTrack(track);

        if (!result.isLoaded) {
          throw new Error(result.error || 'Failed to load track');
        }

        currentSoundRef.current = result.sound;

        updateState({
          currentTrack: track,
          isLoaded: true,
          isLoading: false,
          durationMillis: result.durationMillis || 0,
          positionMillis: 0,
        });
      } catch (error) {
        handleError(error, 'load track');
      }
    },
    [updateState, handleError]
  );

  // Load a chapter with verse navigation support
  const loadChapter = useCallback(
    async (bookId: string, chapterNumber: number) => {
      if (!databaseAdapterRef.current || !audioServiceRef.current) {
        throw new Error('Services not initialized');
      }

      try {
        updateState({ isLoading: true, error: null });

        // Get chapter data from database
        const chapterAudio = await databaseAdapterRef.current.getChapterAudio(
          bookId,
          chapterNumber
        );

        if (!chapterAudio) {
          throw new Error(`Chapter ${bookId} ${chapterNumber} not found`);
        }

        // Load the audio track
        const result = await audioServiceRef.current.loadTrack(
          chapterAudio.audio_track
        );

        if (!result.isLoaded) {
          throw new Error(result.error || 'Failed to load chapter audio');
        }

        currentSoundRef.current = result.sound;

        updateState({
          currentTrack: chapterAudio.audio_track,
          currentChapter: chapterAudio,
          isLoaded: true,
          isLoading: false,
          durationMillis: result.durationMillis || 0,
          positionMillis: 0,
          currentVerse: null,
        });
      } catch (error) {
        handleError(error, 'load chapter');
      }
    },
    [updateState, handleError]
  );

  // Play audio
  const play = useCallback(async () => {
    if (!audioServiceRef.current || !currentSoundRef.current) {
      throw new Error('No audio loaded');
    }

    try {
      await audioServiceRef.current.play(currentSoundRef.current);
      updateState({ isPlaying: true, error: null });
    } catch (error) {
      handleError(error, 'play');
    }
  }, [updateState, handleError]);

  // Pause audio
  const pause = useCallback(async () => {
    if (!audioServiceRef.current || !currentSoundRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.pause(currentSoundRef.current);
      updateState({ isPlaying: false });
    } catch (error) {
      handleError(error, 'pause');
    }
  }, [updateState, handleError]);

  // Stop audio
  const stop = useCallback(async () => {
    if (!audioServiceRef.current || !currentSoundRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.stop(currentSoundRef.current);
      updateState({ isPlaying: false, positionMillis: 0, currentVerse: null });
    } catch (error) {
      handleError(error, 'stop');
    }
  }, [updateState, handleError]);

  // Seek to position
  const seekTo = useCallback(
    async (positionSeconds: number) => {
      if (!audioServiceRef.current || !currentSoundRef.current) {
        return;
      }

      try {
        await audioServiceRef.current.seekTo(
          currentSoundRef.current,
          positionSeconds
        );
        updateState({ positionMillis: positionSeconds * 1000 });
      } catch (error) {
        handleError(error, 'seek');
      }
    },
    [updateState, handleError]
  );

  // Skip forward
  const skipForward = useCallback(
    async (seconds = 10) => {
      if (!audioServiceRef.current || !currentSoundRef.current) {
        return;
      }

      try {
        const result = await audioServiceRef.current.skipForward(
          currentSoundRef.current,
          seconds
        );
        updateState({ positionMillis: result.positionMillis || 0 });
      } catch (error) {
        handleError(error, 'skip forward');
      }
    },
    [updateState, handleError]
  );

  // Skip backward
  const skipBackward = useCallback(
    async (seconds = 10) => {
      if (!audioServiceRef.current || !currentSoundRef.current) {
        return;
      }

      try {
        const result = await audioServiceRef.current.skipBackward(
          currentSoundRef.current,
          seconds
        );
        updateState({ positionMillis: result.positionMillis || 0 });
      } catch (error) {
        handleError(error, 'skip backward');
      }
    },
    [updateState, handleError]
  );

  // Navigate to next verse
  const nextVerse =
    useCallback(async (): Promise<VerseNavigationResult_temp | null> => {
      if (
        !audioServiceRef.current ||
        !currentSoundRef.current ||
        !state.currentChapter
      ) {
        return null;
      }

      try {
        const result = await audioServiceRef.current.nextVerse(
          currentSoundRef.current,
          state.currentChapter
        );

        updateState({
          currentVerse: result.verse_number,
          positionMillis: result.audio_status.positionMillis,
        });

        return result;
      } catch (error) {
        handleError(error, 'navigate to next verse');
        return null;
      }
    }, [state.currentChapter, updateState, handleError]);

  // Navigate to previous verse
  const previousVerse =
    useCallback(async (): Promise<VerseNavigationResult_temp | null> => {
      if (
        !audioServiceRef.current ||
        !currentSoundRef.current ||
        !state.currentChapter
      ) {
        return null;
      }

      try {
        const result = await audioServiceRef.current.previousVerse(
          currentSoundRef.current,
          state.currentChapter
        );

        updateState({
          currentVerse: result.verse_number,
          positionMillis: result.audio_status.positionMillis,
        });

        return result;
      } catch (error) {
        handleError(error, 'navigate to previous verse');
        return null;
      }
    }, [state.currentChapter, updateState, handleError]);

  // Navigate to specific verse
  const goToVerse = useCallback(
    async (verseNumber: number): Promise<VerseNavigationResult_temp | null> => {
      if (
        !audioServiceRef.current ||
        !currentSoundRef.current ||
        !state.currentChapter
      ) {
        return null;
      }

      try {
        const result = await audioServiceRef.current.goToVerse(
          currentSoundRef.current,
          verseNumber,
          state.currentChapter
        );

        updateState({
          currentVerse: result.verse_number,
          positionMillis: result.audio_status.positionMillis,
        });

        return result;
      } catch (error) {
        handleError(error, 'navigate to verse');
        return null;
      }
    },
    [state.currentChapter, updateState, handleError]
  );

  // Set volume
  const setVolume = useCallback(
    async (volume: number) => {
      if (!audioServiceRef.current || !currentSoundRef.current) {
        return;
      }

      try {
        await audioServiceRef.current.setVolume(
          currentSoundRef.current,
          volume
        );
        updateState({ volume });
      } catch (error) {
        handleError(error, 'set volume');
      }
    },
    [updateState, handleError]
  );

  // Set playback speed
  const setPlaybackSpeed = useCallback(
    async (speed: PlaybackSpeed) => {
      if (!audioServiceRef.current || !currentSoundRef.current) {
        return;
      }

      try {
        await audioServiceRef.current.setPlaybackSpeed(
          currentSoundRef.current,
          speed
        );
        updateState({ playbackSpeed: speed });
      } catch (error) {
        handleError(error, 'set playback speed');
      }
    },
    [updateState, handleError]
  );

  // Clear error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Unload current audio
  const unload = useCallback(async () => {
    if (!audioServiceRef.current || !currentSoundRef.current) {
      return;
    }

    try {
      await audioServiceRef.current.unloadSound(currentSoundRef.current);
      currentSoundRef.current = null;
      updateState({
        ...initialState,
        volume: state.volume,
        playbackSpeed: state.playbackSpeed,
      });
    } catch (error) {
      handleError(error, 'unload');
    }
  }, [state.volume, state.playbackSpeed, updateState, handleError]);

  return {
    // State
    ...state,

    // Actions
    loadTrack,
    loadChapter,
    play,
    pause,
    stop,
    seekTo,
    skipForward,
    skipBackward,
    nextVerse,
    previousVerse,
    goToVerse,
    setVolume,
    setPlaybackSpeed,
    clearError,
    unload,
  };
}
