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
export { audioService } from './services/audioService';
// export { useAudioPlayer } from './hooks/useAudioPlayer'; // TODO: Create next
// export { useAudioStore } from './store/audioStore'; // TODO: Create next

// UI Components (placeholder - easily replaceable by UI developer)
export { AudioPlayer, VerseNavigator } from './components';
export type { AudioPlayerProps, VerseNavigatorProps } from './components';

// Types and interfaces
export type {
  AudioPlayerState,
  PlaybackStatus,
  AudioTrack,
  VersePosition,
} from './types';

// Re-export commonly used types for convenience
export type { BibleChapter, BibleVerse, BibleBook } from './types/bible';
