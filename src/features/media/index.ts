export * from './types';
export { useMediaPlayer } from '@/shared/hooks';
export type { MediaTrack, MediaPlayerState } from './types';

// Audio Service exports
export { audioService, AudioService } from './services';
export type { AudioServiceState, AudioServiceCallbacks } from './services';
export { useAudioService } from './hooks';
export type { UseAudioServiceOptions } from './hooks';
export { AudioPlayerExample } from './components/AudioPlayerExample';
export { ChapterQueueExample } from './components/ChapterQueueExample';

// Chapter Queue Service exports
export {
  chapterQueueService,
  ChapterQueueService,
} from './services/ChapterQueueService';
export type {
  ChapterAudioInfo,
  ChapterQueueOptions,
} from './services/ChapterQueueService';
export {
  useChapterQueue,
  useChapterAudioInfo,
  useAudioAvailabilityStats,
} from './hooks/useChapterQueue';
export type { UseChapterQueueReturn } from './hooks/useChapterQueue';
