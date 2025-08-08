// Legacy service (to be deprecated after migration)
export { bibleService } from './bibleService';

// New PowerSync service (preferred)
export { powerSyncBibleService } from './powerSyncBibleService';
export type {
  // Types from PowerSync service
  PowerSyncBook,
  PowerSyncChapter,
  PowerSyncVerse,
  PowerSyncVerseText,
  PowerSyncTextVersion,
  PowerSyncAudioVersion,
  PowerSyncMediaFile,
  PowerSyncMediaFileVerse,

  // Filter and sort interfaces
  BookFilters,
  BookSort,
  ChapterFilters,
  VerseFilters,
  VerseSort,

  // Enhanced types with metadata
  BookWithMetadata,
  ChapterWithMetadata,
  VerseWithText,
  VerseWithMetadata,
  MediaAvailabilityStatus,
} from './powerSyncBibleService';
