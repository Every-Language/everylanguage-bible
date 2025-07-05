/**
 * Audio Player Global State Management
 *
 * Comprehensive state management for the audio player feature based on the Flutter
 * implementation approach with multiple state providers. This store handles:
 * - Audio player state and controls
 * - Verse navigation and timing
 * - Playlist management and navigation
 * - Background playback coordination
 * - Real-time position tracking
 *
 * @since 1.0.0
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
  audioService,
  type AudioSound,
} from '@/features/audio/services/audioService';
import { DatabaseAdapter } from '@/features/audio/adapters/databaseAdapter';
import type {
  AudioTrack,
  ChapterAudio_temp,
  VerseTimestamp_temp,
  PlaybackSpeed,
} from '@/features/audio/types';
import { useMemo } from 'react';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Audio Player Mode - based on Flutter implementation
 */
export type AudioPlayerMode = 'chapter' | 'playlist';

/**
 * Audio Player Status
 */
export type AudioPlayerStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'error'
  | 'completed';

/**
 * Audio Player State Interface
 */
export interface AudioPlayerState {
  // Core player state
  mode: AudioPlayerMode;
  status: AudioPlayerStatus;
  currentTrack: AudioTrack | null;
  currentChapter: ChapterAudio_temp | null;
  sound: AudioSound | null; // Real Expo Audio sound instance

  // Playback state
  isLoaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  position: number; // Current position in seconds
  duration: number; // Total duration in seconds

  // Audio settings
  volume: number;
  playbackSpeed: PlaybackSpeed;
  isMuted: boolean;

  // Background playback
  isBackgroundPlaybackEnabled: boolean;
  isInBackground: boolean;

  // Language settings
  audioLanguageId: string | null;
  textLanguageId: string | null;

  // Error state
  error: string | null;
  lastErrorTimestamp: number | null;

  // Loading state
  isLoadingChapter: boolean;
  loadingProgress: number;
}

/**
 * Verse State Interface
 */
export interface VerseState {
  // Current verse data
  currentVerseNumber: number | null;
  currentVerse: VerseTimestamp_temp | null;
  verses: VerseTimestamp_temp[];

  // Verse navigation state
  canGoToNextVerse: boolean;
  canGoToPreviousVerse: boolean;
  verseProgress: number; // Progress through current verse (0-1)

  // Verse highlighting and UI
  highlightedVerseNumber: number | null;
  autoScrollToCurrentVerse: boolean;
  verseDisplayMode: 'list' | 'reader';

  // Timing and synchronization
  lastVerseChangeTimestamp: number | null;
  verseTimingAccuracy: 'precise' | 'estimated' | 'none';
}

/**
 * Playlist State Interface
 */
export interface PlaylistState {
  // Playlist data
  currentPlaylist: AudioTrack[] | null;
  playlistIndex: number;
  playlistMode: 'off' | 'repeat_one' | 'repeat_all' | 'shuffle';

  // Cross-chapter navigation
  currentBookId: string | null;
  currentChapterNumber: number | null;
  canGoToNextChapter: boolean;
  canGoToPreviousChapter: boolean;

  // Auto-progression
  autoAdvanceToNextVerse: boolean;
  autoAdvanceToNextChapter: boolean;
  autoAdvanceDelay: number; // Delay in seconds

  // Playlist navigation history
  navigationHistory: Array<{
    bookId: string;
    chapterNumber: number;
    verseNumber?: number;
    timestamp: number;
  }>;

  // Preloading
  nextChapterPreloaded: boolean;
  previousChapterPreloaded: boolean;
}

/**
 * Combined Audio Store State
 */
export interface AudioStoreState {
  player: AudioPlayerState;
  verse: VerseState;
  playlist: PlaylistState;
  positionTrackingInterval: ReturnType<typeof setInterval> | null;
}

/**
 * Audio Store Actions
 */
export interface AudioStoreActions {
  // Player actions
  initializePlayer: () => Promise<void>;
  loadChapter: (bookId: string, chapterNumber: number) => Promise<void>;
  loadTrack: (track: AudioTrack) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seek: (positionSeconds: number) => Promise<void>;
  skipForward: (seconds?: number) => Promise<void>;
  skipBackward: (seconds?: number) => Promise<void>;

  // Audio settings
  setVolume: (volume: number) => Promise<void>;
  setPlaybackSpeed: (speed: PlaybackSpeed) => Promise<void>;
  toggleMute: () => Promise<void>;

  // Verse navigation
  goToVerse: (verseNumber: number) => Promise<void>;
  nextVerse: () => Promise<void>;
  previousVerse: () => Promise<void>;

  // Chapter navigation
  nextChapter: () => Promise<void>;
  previousChapter: () => Promise<void>;

  // Language switching
  switchAudioLanguage: (languageId: string) => Promise<void>;
  switchTextLanguage: (languageId: string) => void;

  // Background playback
  enableBackgroundPlayback: () => Promise<void>;
  disableBackgroundPlayback: () => Promise<void>;

  // Position tracking
  updatePosition: (positionSeconds: number) => void;
  startPositionTracking: () => void;
  stopPositionTracking: () => void;

  // Error handling
  clearError: () => void;
  setError: (error: string) => void;

  // Utility actions
  reset: () => void;
  cleanup: () => Promise<void>;
}

// ============================================================================
// Initial State
// ============================================================================

const initialPlayerState: AudioPlayerState = {
  mode: 'chapter',
  status: 'idle',
  currentTrack: null,
  currentChapter: null,
  sound: null,

  isLoaded: false,
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: 0,

  volume: 1.0,
  playbackSpeed: 1.0,
  isMuted: false,

  isBackgroundPlaybackEnabled: false,
  isInBackground: false,

  audioLanguageId: null,
  textLanguageId: null,

  error: null,
  lastErrorTimestamp: null,

  isLoadingChapter: false,
  loadingProgress: 0,
};

const initialVerseState: VerseState = {
  currentVerseNumber: null,
  currentVerse: null,
  verses: [],

  canGoToNextVerse: false,
  canGoToPreviousVerse: false,
  verseProgress: 0,

  highlightedVerseNumber: null,
  autoScrollToCurrentVerse: true,
  verseDisplayMode: 'list',

  lastVerseChangeTimestamp: null,
  verseTimingAccuracy: 'none',
};

const initialPlaylistState: PlaylistState = {
  currentPlaylist: null,
  playlistIndex: 0,
  playlistMode: 'off',

  currentBookId: null,
  currentChapterNumber: null,
  canGoToNextChapter: false,
  canGoToPreviousChapter: false,

  autoAdvanceToNextVerse: false,
  autoAdvanceToNextChapter: false,
  autoAdvanceDelay: 1,

  navigationHistory: [],

  nextChapterPreloaded: false,
  previousChapterPreloaded: false,
};

// ============================================================================
// Audio Store Implementation
// ============================================================================

// Create database adapter instance
const databaseAdapter = new DatabaseAdapter();

export const useAudioStore = create<AudioStoreState & AudioStoreActions>()(
  subscribeWithSelector((set, get) => ({
    // State
    player: initialPlayerState,
    verse: initialVerseState,
    playlist: initialPlaylistState,

    // Position tracking interval
    positionTrackingInterval: null as ReturnType<typeof setInterval> | null,

    // ========================================================================
    // Player Actions
    // ========================================================================

    initializePlayer: async () => {
      try {
        // Initialize the real audio service
        await audioService.initialize();

        // Set up position update callback
        audioService.setPositionUpdateCallback((positionMillis: number) => {
          const positionSeconds = positionMillis / 1000;
          get().updatePosition(positionSeconds);
        });

        set(state => ({
          ...state,
          player: {
            ...state.player,
            status: 'ready' as AudioPlayerStatus,
            isBackgroundPlaybackEnabled:
              audioService.isBackgroundAudioEnabled(),
            error: null,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            status: 'error' as AudioPlayerStatus,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to initialize audio',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    loadChapter: async (bookId: string, chapterNumber: number) => {
      set(state => ({
        ...state,
        player: {
          ...state.player,
          status: 'loading' as AudioPlayerStatus,
          isLoadingChapter: true,
          loadingProgress: 0,
          error: null,
        },
        playlist: {
          ...state.playlist,
          currentBookId: bookId,
          currentChapterNumber: chapterNumber,
        },
      }));

      try {
        // Get chapter data from database using the real adapter
        const chapterAudio = await databaseAdapter.getChapterAudio(
          bookId,
          chapterNumber
        );

        if (!chapterAudio) {
          throw new Error(`Chapter ${bookId} ${chapterNumber} not found`);
        }

        // Load the audio track using the real audio service
        await get().loadTrack(chapterAudio.audio_track);

        set(state => ({
          ...state,
          player: {
            ...state.player,
            currentChapter: chapterAudio,
            status: 'ready' as AudioPlayerStatus,
            isLoadingChapter: false,
            loadingProgress: 100,
          },
          verse: {
            ...state.verse,
            verses: chapterAudio.verse_timestamps,
            currentVerseNumber: null,
            currentVerse: null,
            canGoToNextVerse: chapterAudio.verse_timestamps.length > 1,
            canGoToPreviousVerse: false,
            verseTimingAccuracy: 'precise',
          },
          playlist: {
            ...state.playlist,
            canGoToNextChapter: true, // TODO: Check if next chapter exists in database
            canGoToPreviousChapter: chapterNumber > 1,
          },
        }));

        // Add to navigation history
        set(state => ({
          ...state,
          playlist: {
            ...state.playlist,
            navigationHistory: [
              ...state.playlist.navigationHistory,
              {
                bookId,
                chapterNumber,
                timestamp: Date.now(),
              },
            ].slice(-50), // Keep only last 50 entries
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            status: 'error' as AudioPlayerStatus,
            error:
              error instanceof Error ? error.message : 'Failed to load chapter',
            lastErrorTimestamp: Date.now(),
            isLoadingChapter: false,
          },
        }));
      }
    },

    loadTrack: async (track: AudioTrack) => {
      try {
        // Load track using real audio service
        const result = await audioService.loadTrack(track);

        if (!result.isLoaded || !result.sound) {
          throw new Error(result.error || 'Failed to load track');
        }

        set(state => ({
          ...state,
          player: {
            ...state.player,
            currentTrack: track,
            sound: result.sound!,
            duration: track.duration,
            position: 0,
            isLoaded: true,
            status: 'ready' as AudioPlayerStatus,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            status: 'error' as AudioPlayerStatus,
            error:
              error instanceof Error ? error.message : 'Failed to load track',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    play: async () => {
      const state = get();

      if (!state.player.isLoaded || !state.player.sound) {
        throw new Error('No audio loaded');
      }

      try {
        // Use real audio service to play
        await audioService.play(state.player.sound);

        set(state => ({
          ...state,
          player: {
            ...state.player,
            isPlaying: true,
            status: 'playing' as AudioPlayerStatus,
            error: null,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            status: 'error' as AudioPlayerStatus,
            error: error instanceof Error ? error.message : 'Failed to play',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    pause: async () => {
      const state = get();

      if (!state.player.isLoaded || !state.player.sound) {
        return;
      }

      try {
        // Use real audio service to pause
        await audioService.pause(state.player.sound);

        set(state => ({
          ...state,
          player: {
            ...state.player,
            isPlaying: false,
            status: 'paused' as AudioPlayerStatus,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            status: 'error' as AudioPlayerStatus,
            error: error instanceof Error ? error.message : 'Failed to pause',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    stop: async () => {
      const state = get();

      if (!state.player.isLoaded || !state.player.sound) {
        return;
      }

      try {
        // Use real audio service to stop
        await audioService.stop(state.player.sound);

        set(state => ({
          ...state,
          player: {
            ...state.player,
            isPlaying: false,
            status: 'ready' as AudioPlayerStatus,
            position: 0,
          },
          verse: {
            ...state.verse,
            currentVerseNumber: null,
            currentVerse: null,
            verseProgress: 0,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            status: 'error' as AudioPlayerStatus,
            error: error instanceof Error ? error.message : 'Failed to stop',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    seek: async (positionSeconds: number) => {
      const state = get();

      if (!state.player.isLoaded || !state.player.sound) {
        return;
      }

      try {
        // Use real audio service to seek
        await audioService.seekTo(state.player.sound, positionSeconds);

        // Update position will be handled by the position callback
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            status: 'error' as AudioPlayerStatus,
            error: error instanceof Error ? error.message : 'Failed to seek',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    skipForward: async (seconds = 10) => {
      const state = get();

      if (!state.player.sound) {
        return;
      }

      try {
        await audioService.skipForward(state.player.sound, seconds);
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error ? error.message : 'Failed to skip forward',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    skipBackward: async (seconds = 10) => {
      const state = get();

      if (!state.player.sound) {
        return;
      }

      try {
        await audioService.skipBackward(state.player.sound, seconds);
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to skip backward',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    // ========================================================================
    // Audio Settings
    // ========================================================================

    setVolume: async (volume: number) => {
      const state = get();

      if (!state.player.sound) {
        return;
      }

      try {
        await audioService.setVolume(state.player.sound, volume);

        set(state => ({
          ...state,
          player: {
            ...state.player,
            volume: volume,
            isMuted: volume === 0,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error ? error.message : 'Failed to set volume',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    setPlaybackSpeed: async (speed: PlaybackSpeed) => {
      const state = get();

      if (!state.player.sound) {
        return;
      }

      try {
        await audioService.setPlaybackSpeed(state.player.sound, speed);

        set(state => ({
          ...state,
          player: {
            ...state.player,
            playbackSpeed: speed,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to set playback speed',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    toggleMute: async () => {
      const state = get();
      const newVolume = state.player.isMuted ? 1.0 : 0;
      await get().setVolume(newVolume);
    },

    // ========================================================================
    // Verse Navigation
    // ========================================================================

    goToVerse: async (verseNumber: number) => {
      const state = get();

      if (!state.player.sound || !state.player.currentChapter) {
        return;
      }

      try {
        // Use real audio service for verse navigation
        const result = await audioService.goToVerse(
          state.player.sound,
          verseNumber,
          state.player.currentChapter
        );

        set(state => ({
          ...state,
          verse: {
            ...state.verse,
            currentVerseNumber: result.verse_number,
            currentVerse: result.timestamp,
            lastVerseChangeTimestamp: Date.now(),
            highlightedVerseNumber: result.verse_number,
            canGoToNextVerse: !result.is_last_verse,
            canGoToPreviousVerse: !result.is_first_verse,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error ? error.message : 'Failed to go to verse',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    nextVerse: async () => {
      const state = get();

      if (
        !state.player.sound ||
        !state.player.currentChapter ||
        !state.verse.canGoToNextVerse
      ) {
        return;
      }

      try {
        const result = await audioService.nextVerse(
          state.player.sound,
          state.player.currentChapter
        );

        set(state => ({
          ...state,
          verse: {
            ...state.verse,
            currentVerseNumber: result.verse_number,
            currentVerse: result.timestamp,
            lastVerseChangeTimestamp: Date.now(),
            highlightedVerseNumber: result.verse_number,
            canGoToNextVerse: !result.is_last_verse,
            canGoToPreviousVerse: !result.is_first_verse,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to go to next verse',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    previousVerse: async () => {
      const state = get();

      if (
        !state.player.sound ||
        !state.player.currentChapter ||
        !state.verse.canGoToPreviousVerse
      ) {
        return;
      }

      try {
        const result = await audioService.previousVerse(
          state.player.sound,
          state.player.currentChapter
        );

        set(state => ({
          ...state,
          verse: {
            ...state.verse,
            currentVerseNumber: result.verse_number,
            currentVerse: result.timestamp,
            lastVerseChangeTimestamp: Date.now(),
            highlightedVerseNumber: result.verse_number,
            canGoToNextVerse: !result.is_last_verse,
            canGoToPreviousVerse: !result.is_first_verse,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to go to previous verse',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    // ========================================================================
    // Chapter Navigation
    // ========================================================================

    nextChapter: async () => {
      const state = get();

      if (
        !state.playlist.canGoToNextChapter ||
        !state.playlist.currentBookId ||
        !state.playlist.currentChapterNumber
      ) {
        return;
      }

      const nextChapterNumber = state.playlist.currentChapterNumber + 1;
      await get().loadChapter(state.playlist.currentBookId, nextChapterNumber);
    },

    previousChapter: async () => {
      const state = get();

      if (
        !state.playlist.canGoToPreviousChapter ||
        !state.playlist.currentBookId ||
        !state.playlist.currentChapterNumber
      ) {
        return;
      }

      const previousChapterNumber = state.playlist.currentChapterNumber - 1;
      await get().loadChapter(
        state.playlist.currentBookId,
        previousChapterNumber
      );
    },

    // ========================================================================
    // Language Switching
    // ========================================================================

    switchAudioLanguage: async (languageId: string) => {
      const state = get();

      if (
        !state.playlist.currentBookId ||
        !state.playlist.currentChapterNumber
      ) {
        return;
      }

      const currentPosition = state.player.position;

      try {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            audioLanguageId: languageId,
          },
        }));

        // Reload chapter with new language
        await get().loadChapter(
          state.playlist.currentBookId!,
          state.playlist.currentChapterNumber!
        );

        // Restore position
        await get().seek(currentPosition);
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to switch audio language',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    switchTextLanguage: (languageId: string) => {
      set(state => ({
        ...state,
        player: {
          ...state.player,
          textLanguageId: languageId,
        },
      }));
    },

    // ========================================================================
    // Background Playback
    // ========================================================================

    enableBackgroundPlayback: async () => {
      try {
        await audioService.enableBackgroundAudio();

        set(state => ({
          ...state,
          player: {
            ...state.player,
            isBackgroundPlaybackEnabled: true,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to enable background playback',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    disableBackgroundPlayback: async () => {
      try {
        await audioService.disableBackgroundAudio();

        set(state => ({
          ...state,
          player: {
            ...state.player,
            isBackgroundPlaybackEnabled: false,
          },
        }));
      } catch (error) {
        set(state => ({
          ...state,
          player: {
            ...state.player,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to disable background playback',
            lastErrorTimestamp: Date.now(),
          },
        }));
      }
    },

    // ========================================================================
    // Position Tracking
    // ========================================================================

    updatePosition: (positionSeconds: number) => {
      set(state => {
        // Only update if position has changed significantly (avoid micro-updates)
        const positionDiff = Math.abs(state.player.position - positionSeconds);
        if (positionDiff < 0.1) {
          return state; // No change needed
        }

        // Find current verse based on position
        const currentVerse = state.verse.verses.find(
          (verse: VerseTimestamp_temp) =>
            positionSeconds >= verse.start_time &&
            positionSeconds < verse.end_time
        );

        // Only update verse info if verse has actually changed
        const verseChanged =
          currentVerse?.verse_number !== state.verse.currentVerseNumber;

        if (currentVerse && verseChanged) {
          // Calculate verse progress
          const verseProgress =
            currentVerse.duration > 0
              ? (positionSeconds - currentVerse.start_time) /
                currentVerse.duration
              : 0;

          return {
            ...state,
            player: {
              ...state.player,
              position: positionSeconds,
            },
            verse: {
              ...state.verse,
              currentVerseNumber: currentVerse.verse_number,
              currentVerse: currentVerse,
              highlightedVerseNumber: currentVerse.verse_number,
              verseProgress: Math.max(0, Math.min(1, verseProgress)),
              canGoToNextVerse:
                currentVerse.verse_number < state.verse.verses.length,
              canGoToPreviousVerse: currentVerse.verse_number > 1,
              lastVerseChangeTimestamp: Date.now(),
            },
          };
        }

        // Only update position if no verse change
        return {
          ...state,
          player: {
            ...state.player,
            position: positionSeconds,
          },
        };
      });
    },

    startPositionTracking: () => {
      // Position tracking is now handled by the AudioService callback
      // This method is kept for API compatibility
    },

    stopPositionTracking: () => {
      // Position tracking is now handled by the AudioService callback
      // This method is kept for API compatibility
    },

    // ========================================================================
    // Error Handling
    // ========================================================================

    clearError: () => {
      set(state => ({
        ...state,
        player: {
          ...state.player,
          error: null,
          lastErrorTimestamp: null,
        },
      }));
    },

    setError: (error: string) => {
      set(state => ({
        ...state,
        player: {
          ...state.player,
          error: error,
          lastErrorTimestamp: Date.now(),
        },
      }));
    },

    // ========================================================================
    // Utility Actions
    // ========================================================================

    reset: () => {
      // Reset only state, not actions (actions are defined once in the store)
      set(state => ({
        ...state,
        player: initialPlayerState,
        verse: initialVerseState,
        playlist: initialPlaylistState,
        positionTrackingInterval: null,
      }));
    },

    cleanup: async () => {
      try {
        // Cleanup audio service
        await audioService.cleanup();
      } catch (error) {
        // Use proper logging instead of console.error
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Error during cleanup:', error);
        }
      }

      // Reset state
      get().reset();
    },
  }))
);

// ============================================================================
// State Selectors
// ============================================================================

// Player selectors
export const usePlayerState = () => useAudioStore(state => state.player);
export const usePlayerStatus = () =>
  useAudioStore(state => state.player.status);
export const usePlayerError = () => useAudioStore(state => state.player.error);
export const useIsPlaying = () =>
  useAudioStore(state => state.player.isPlaying);
export const useCurrentTrack = () =>
  useAudioStore(state => state.player.currentTrack);
export const useCurrentChapter = () =>
  useAudioStore(state => state.player.currentChapter);
export const usePlaybackPosition = () => {
  const position = useAudioStore(state => state.player.position);
  const duration = useAudioStore(state => state.player.duration);
  return useMemo(() => ({ position, duration }), [position, duration]);
};

// Verse selectors
export const useVerseState = () => useAudioStore(state => state.verse);
export const useCurrentVerse = () =>
  useAudioStore(state => state.verse.currentVerse);
export const useVerses = () => useAudioStore(state => state.verse.verses);
export const useVerseNavigation = () => {
  const canGoToNextVerse = useAudioStore(state => state.verse.canGoToNextVerse);
  const canGoToPreviousVerse = useAudioStore(
    state => state.verse.canGoToPreviousVerse
  );
  const currentVerseNumber = useAudioStore(
    state => state.verse.currentVerseNumber
  );
  return useMemo(
    () => ({ canGoToNextVerse, canGoToPreviousVerse, currentVerseNumber }),
    [canGoToNextVerse, canGoToPreviousVerse, currentVerseNumber]
  );
};

// Playlist selectors
export const usePlaylistState = () => useAudioStore(state => state.playlist);
export const useChapterNavigation = () => {
  const canGoToNextChapter = useAudioStore(
    state => state.playlist.canGoToNextChapter
  );
  const canGoToPreviousChapter = useAudioStore(
    state => state.playlist.canGoToPreviousChapter
  );
  const currentBookId = useAudioStore(state => state.playlist.currentBookId);
  const currentChapterNumber = useAudioStore(
    state => state.playlist.currentChapterNumber
  );
  return useMemo(
    () => ({
      canGoToNextChapter,
      canGoToPreviousChapter,
      currentBookId,
      currentChapterNumber,
    }),
    [
      canGoToNextChapter,
      canGoToPreviousChapter,
      currentBookId,
      currentChapterNumber,
    ]
  );
};

// Combined selectors
export const useAudioPlayerState = () => {
  const player = useAudioStore(state => state.player);
  const verse = useAudioStore(state => state.verse);
  const playlist = useAudioStore(state => state.playlist);
  return useMemo(
    () => ({ player, verse, playlist }),
    [player, verse, playlist]
  );
};

// Action selectors
export const useAudioActions = () => {
  const initializePlayer = useAudioStore(state => state.initializePlayer);
  const loadChapter = useAudioStore(state => state.loadChapter);
  const play = useAudioStore(state => state.play);
  const pause = useAudioStore(state => state.pause);
  const stop = useAudioStore(state => state.stop);
  const seek = useAudioStore(state => state.seek);
  const skipForward = useAudioStore(state => state.skipForward);
  const skipBackward = useAudioStore(state => state.skipBackward);
  const goToVerse = useAudioStore(state => state.goToVerse);
  const nextVerse = useAudioStore(state => state.nextVerse);
  const previousVerse = useAudioStore(state => state.previousVerse);
  const nextChapter = useAudioStore(state => state.nextChapter);
  const previousChapter = useAudioStore(state => state.previousChapter);
  const setVolume = useAudioStore(state => state.setVolume);
  const setPlaybackSpeed = useAudioStore(state => state.setPlaybackSpeed);
  const toggleMute = useAudioStore(state => state.toggleMute);
  const switchAudioLanguage = useAudioStore(state => state.switchAudioLanguage);
  const switchTextLanguage = useAudioStore(state => state.switchTextLanguage);
  const enableBackgroundPlayback = useAudioStore(
    state => state.enableBackgroundPlayback
  );
  const disableBackgroundPlayback = useAudioStore(
    state => state.disableBackgroundPlayback
  );
  const clearError = useAudioStore(state => state.clearError);
  const reset = useAudioStore(state => state.reset);
  const cleanup = useAudioStore(state => state.cleanup);

  return useMemo(
    () => ({
      initializePlayer,
      loadChapter,
      play,
      pause,
      stop,
      seek,
      skipForward,
      skipBackward,
      goToVerse,
      nextVerse,
      previousVerse,
      nextChapter,
      previousChapter,
      setVolume,
      setPlaybackSpeed,
      toggleMute,
      switchAudioLanguage,
      switchTextLanguage,
      enableBackgroundPlayback,
      disableBackgroundPlayback,
      clearError,
      reset,
      cleanup,
    }),
    [
      initializePlayer,
      loadChapter,
      play,
      pause,
      stop,
      seek,
      skipForward,
      skipBackward,
      goToVerse,
      nextVerse,
      previousVerse,
      nextChapter,
      previousChapter,
      setVolume,
      setPlaybackSpeed,
      toggleMute,
      switchAudioLanguage,
      switchTextLanguage,
      enableBackgroundPlayback,
      disableBackgroundPlayback,
      clearError,
      reset,
      cleanup,
    ]
  );
};
