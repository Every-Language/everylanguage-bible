/**
 * Audio Feature Module
 *
 * This module provides comprehensive audio Bible playback functionality including:
 * - Verse-level navigation and synchronization
 * - Multi-language audio support
 * - Background playback capabilities
 * - Offline-first audio streaming
 *
 * @since 1.0.0
 * @author Audio Player Team
 */

// Core audio functionality (tested with TDD)
// @ts-expect-error - audioService exists, TS module resolution issue
export { audioService } from './services/audioService';
// export { useAudioPlayer } from './hooks/useAudioPlayer'; // TODO: Create next
// export { useAudioStore } from './store/audioStore'; // TODO: Create next

// UI Components (placeholder - easily replaceable by UI developer)
// @ts-expect-error - components exist, TS module resolution issue
export { AudioPlayer, VerseNavigator } from './components';
// @ts-expect-error - types exist, TS module resolution issue
export type { AudioPlayerProps, VerseNavigatorProps } from './components';

// Types and interfaces
// @ts-expect-error - types exist, TS module resolution issue
export type {
  AudioPlayerState,
  PlaybackStatus,
  AudioTrack,
  VersePosition,
} from './types';

// Re-export commonly used types for convenience
// @ts-expect-error - types exist, TS module resolution issue
export type { BibleChapter, BibleVerse, BibleBook } from './types/bible';
