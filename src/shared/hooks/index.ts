// Network hooks
export {
  useNetworkState,
  useNetworkCapabilities,
  useNetwork,
} from './useNetworkState';

export { usePermissions } from './usePermissions';
export { useLocation } from './useLocation';

// Media Files Hooks
export {
  useMediaFiles,
  useMediaFile,
  useMediaFilesByChapter,
  useMediaFilesByLanguage,
  useMediaFilesByUploadStatus,
  useMediaFilesByPublishStatus,
} from './useMediaFiles';

// Media Files Verses Hooks
export {
  useMediaFilesVerses,
  useMediaFileVerse,
  useMediaFilesVersesWithRelatedData,
} from './useMediaFilesVerses';

// New Zustand-based hooks (replacing context hooks)
export { useTheme } from './useThemeFromStore';
export { useLocalization, useTranslations } from './useLocalizationFromStore';
export { useOnboarding } from './useOnboardingFromStore';
export { useAuthContext } from './useAuthFromStore';
export { useSync } from './useSyncFromStore';
export { useMediaPlayer } from './useMediaPlayerFromStore';

// Data Status Query Hooks
export {
  useDataAvailabilityQuery,
  useDataCountsQuery,
  useDatabaseHealthQuery,
  useLastSyncQuery,
  useLanguageTablesCountsQuery,
  dataStatusQueryKeys,
} from './useDataStatusQueries';
