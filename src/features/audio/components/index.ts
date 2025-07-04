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

export { AudioPlayer } from './AudioPlayer';
export type { AudioPlayerProps } from './AudioPlayer';

export { VerseNavigator } from './VerseNavigator';
export type { VerseNavigatorProps } from './VerseNavigator';

export { MiniPlayer } from './MiniPlayer';

// Component categories for easy imports
export const AudioComponents = {
  AudioPlayer,
  VerseNavigator,
  MiniPlayer,
} as const;

/**
 * @example Basic usage:
 * ```tsx
 * import { AudioPlayer, VerseNavigator, MiniPlayer } from '@/features/audio/components';
 *
 * function BiblePage() {
 *   const [currentVerse, setCurrentVerse] = useState(1);
 *
 *   return (
 *     <View>
 *       <AudioPlayer
 *         bookId="gen"
 *         chapterNumber={1}
 *         autoPlay={false}
 *         onVerseSelect={setCurrentVerse}
 *       />
 *
 *       <VerseNavigator
 *         verses={chapterData.verse_timestamps}
 *         currentVerse={currentVerse}
 *         onVerseSelect={setCurrentVerse}
 *       />
 *
 *       <MiniPlayer />
 *     </View>
 *   );
 * }
 * ```
 */
