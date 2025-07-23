// Database Manager
export { default as DatabaseManager } from './DatabaseManager';

// Local Data Service
export { LocalDataService, localDataService } from './LocalDataService';

// Media Files Service
export { mediaFilesService } from './MediaFilesService';
export type { MediaFileFilters, MediaFileSort } from './MediaFilesService';

// Media Files Verses Service
export { mediaFilesVersesService } from './MediaFilesVersesService';

// Schema types
export type {
  LocalBook,
  LocalChapter,
  LocalVerse,
  LocalVerseText,
  LocalMediaFile,
  LocalMediaFileVerse,
  UserSavedVersion,
  LanguageEntityCache,
  AvailableVersionCache,
  SyncMetadata,
} from './schema';

// Schema utilities
export {
  DATABASE_NAME,
  DATABASE_VERSION,
  createTables,
  dropTables,
  getTableSchema,
} from './schema';
