/**
 * Audio Components Exports
 *
 * This module exports all audio-related UI components for the EveryLanguage Bible app.
 * Components are fully functional and integrate with our audio services and database.
 *
 * @since 1.0.0
 */

// Core audio components
import { AudioPlayer } from './AudioPlayer';
import { VerseNavigator } from './VerseNavigator';
import { MiniPlayer } from './MiniPlayer';

// New sliding panel audio player system
import { AudioPlayerWidget } from './AudioPlayerWidget';
import { MiniPlayerView } from './MiniPlayerView';
import { FullPlayerView } from './FullPlayerView';

export { AudioPlayer } from './AudioPlayer';
export type { AudioPlayerProps } from './AudioPlayer';

export { VerseNavigator } from './VerseNavigator';
export type { VerseNavigatorProps } from './VerseNavigator';

export { MiniPlayer } from './MiniPlayer';

// New sliding panel system exports
export { AudioPlayerWidget } from './AudioPlayerWidget';
export type { PanelState } from './AudioPlayerWidget';

export { MiniPlayerView } from './MiniPlayerView';
export { FullPlayerView } from './FullPlayerView';

// Component categories for easy imports
export const AudioComponents = {
  // TDD Audio System
  AudioPlayer,
  VerseNavigator,

  // Legacy Mini Player
  MiniPlayer,

  // New Sliding Panel System
  AudioPlayerWidget,
  MiniPlayerView,
  FullPlayerView,
};

/**
 * Usage Examples:
 *
 * // Legacy approach (current)
 * import { MiniPlayer } from '@/features/audio/components';
 *
 * // TDD Audio System (our comprehensive implementation)
 * import { AudioPlayer, VerseNavigator } from '@/features/audio/components';
 *
 * // New Sliding Panel System (Flutter-inspired)
 * import { AudioPlayerWidget } from '@/features/audio/components';
 *
 * // Bulk import
 * import { AudioComponents } from '@/features/audio/components';
 * const { AudioPlayerWidget, MiniPlayerView } = AudioComponents;
 */
