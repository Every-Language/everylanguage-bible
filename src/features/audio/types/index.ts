/**
 * Audio Player Core Types
 *
 * Defines the core interfaces and types for the audio player feature,
 * including state management, playback controls, and user interactions.
 *
 * @since 1.0.0
 */

import type { BibleChapter, BibleVerse, AudioTrack } from './bible';

/**
 * Audio playback status enumeration
 */
export type PlaybackStatus =
  | 'idle' // Not loaded
  | 'loading' // Loading audio file
  | 'ready' // Ready to play
  | 'playing' // Currently playing
  | 'paused' // Paused
  | 'buffering' // Buffering more content
  | 'error' // Error state
  | 'completed'; // Finished playing

/**
 * Playback speed options
 */
export type PlaybackSpeed = 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 1.75 | 2.0;

/**
 * Verse position within audio timeline
 */
export interface VersePosition {
  /** The verse being referenced */
  verse: BibleVerse;
  /** Current position in seconds from start of chapter */
  currentTime: number;
  /** Whether this verse is currently being played */
  isActive: boolean;
  /** Whether this verse has been played */
  hasBeenPlayed: boolean;
}

/**
 * Audio player error information
 */
export interface AudioError {
  /** Error code for classification */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Technical details for debugging */
  details?: string;
  /** Whether the error is recoverable */
  recoverable: boolean;
  /** Timestamp when error occurred */
  timestamp: Date;
}

/**
 * Audio player state interface
 * This represents the complete state of the audio player
 */
export interface AudioPlayerState {
  // Current content
  /** Currently loaded chapter */
  currentChapter: BibleChapter | null;
  /** Currently loaded audio track */
  currentTrack: AudioTrack | null;
  /** All verses for the current chapter */
  verses: BibleVerse[];
  /** Current verse being played/highlighted */
  currentVerse: BibleVerse | null;

  // Playback state
  /** Current playback status */
  status: PlaybackStatus;
  /** Current playback position in seconds */
  position: number;
  /** Total duration of current track in seconds */
  duration: number;
  /** Current playback speed */
  speed: PlaybackSpeed;
  /** Current volume (0-1) */
  volume: number;
  /** Whether player is muted */
  isMuted: boolean;

  // Progress and navigation
  /** Progress through current chapter (0-1) */
  progress: number;
  /** Progress through current verse (0-1) */
  verseProgress: number;
  /** Can go to previous verse */
  canGoPrevious: boolean;
  /** Can go to next verse */
  canGoNext: boolean;
  /** Can go to previous chapter */
  canGoPreviousChapter: boolean;
  /** Can go to next chapter */
  canGoNextChapter: boolean;

  // Language settings
  /** Language entity ID for audio */
  audioLanguageId: string | null;
  /** Language entity ID for text display */
  textLanguageId: string | null;

  // Error handling
  /** Current error if any */
  error: AudioError | null;

  // Background playback
  /** Whether background playback is enabled */
  backgroundPlaybackEnabled: boolean;
  /** Whether player is in background mode */
  isInBackground: boolean;

  // Download state
  /** Whether current track is downloaded for offline use */
  isDownloaded: boolean;
  /** Download progress if currently downloading (0-100) */
  downloadProgress: number | null;
}

/**
 * Audio player control actions
 * These are the actions that can be performed on the audio player
 */
export interface AudioPlayerActions {
  // Basic controls
  /** Load a chapter for playback */
  loadChapter: (chapter: BibleChapter, autoPlay?: boolean) => Promise<void>;
  /** Start or resume playback */
  play: () => Promise<void>;
  /** Pause playback */
  pause: () => Promise<void>;
  /** Stop playback and reset position */
  stop: () => Promise<void>;
  /** Toggle play/pause */
  togglePlayPause: () => Promise<void>;

  // Navigation controls
  /** Seek to specific position in seconds */
  seekTo: (positionSeconds: number) => Promise<void>;
  /** Seek to specific verse */
  seekToVerse: (verse: BibleVerse) => Promise<void>;
  /** Go to next verse */
  nextVerse: () => Promise<void>;
  /** Go to previous verse */
  previousVerse: () => Promise<void>;
  /** Go to next chapter */
  nextChapter: () => Promise<void>;
  /** Go to previous chapter */
  previousChapter: () => Promise<void>;
  /** Skip forward by seconds */
  skipForward: (seconds?: number) => Promise<void>;
  /** Skip backward by seconds */
  skipBackward: (seconds?: number) => Promise<void>;

  // Audio settings
  /** Set playback speed */
  setSpeed: (speed: PlaybackSpeed) => void;
  /** Set volume (0-1) */
  setVolume: (volume: number) => void;
  /** Toggle mute */
  toggleMute: () => void;

  // Language controls
  /** Switch audio language without losing position */
  switchAudioLanguage: (languageEntityId: string) => Promise<void>;
  /** Switch text language for verse display */
  switchTextLanguage: (languageEntityId: string) => void;

  // Error handling
  /** Clear current error */
  clearError: () => void;
  /** Retry last failed operation */
  retry: () => Promise<void>;

  // Background playback
  /** Enable/disable background playback */
  setBackgroundPlayback: (enabled: boolean) => void;

  // Download management
  /** Download current chapter for offline use */
  downloadChapter: () => Promise<void>;
  /** Remove downloaded chapter */
  removeDownload: () => Promise<void>;
}

/**
 * Combined audio player interface
 * This is what the useAudioPlayer hook returns
 */
export interface AudioPlayerInterface
  extends AudioPlayerState,
    AudioPlayerActions {}

/**
 * Audio player configuration options
 */
export interface AudioPlayerConfig {
  /** Default playback speed */
  defaultSpeed: PlaybackSpeed;
  /** Default volume */
  defaultVolume: number;
  /** Enable background playback by default */
  backgroundPlaybackEnabled: boolean;
  /** Auto-advance to next verse */
  autoAdvanceVerses: boolean;
  /** Auto-advance to next chapter */
  autoAdvanceChapters: boolean;
  /** Skip silence in audio */
  skipSilence: boolean;
  /** Buffer size in seconds */
  bufferSize: number;
  /** Maximum retry attempts for failed operations */
  maxRetries: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}

/**
 * Events that the audio player can emit
 */
export type AudioPlayerEvent =
  | { type: 'position_changed'; position: number; verse: BibleVerse | null }
  | {
      type: 'verse_changed';
      verse: BibleVerse;
      previousVerse: BibleVerse | null;
    }
  | {
      type: 'chapter_changed';
      chapter: BibleChapter;
      previousChapter: BibleChapter | null;
    }
  | {
      type: 'status_changed';
      status: PlaybackStatus;
      previousStatus: PlaybackStatus;
    }
  | { type: 'error_occurred'; error: AudioError }
  | { type: 'download_progress'; progress: number }
  | { type: 'download_completed'; chapter: BibleChapter }
  | {
      type: 'language_switched';
      languageType: 'audio' | 'text';
      languageId: string;
    };

/**
 * Audio player event listener function
 */
export type AudioPlayerEventListener = (event: AudioPlayerEvent) => void;

// Re-export commonly used types for convenience
export type {
  BibleChapter,
  BibleVerse,
  BibleBook,
  AudioTrack,
  VerseTimestamp_temp,
  ChapterAudio_temp,
  VerseNavigationResult_temp,
} from './bible';
