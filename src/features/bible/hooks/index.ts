// Legacy hooks (to be deprecated after migration)
export {
  useBooksQuery as useLegacyBooksQuery,
  useBookQuery as useLegacyBookQuery,
  useChaptersQuery as useLegacyChaptersQuery,
  useChapterQuery as useLegacyChapterQuery,
  useVersesQuery as useLegacyVersesQuery,
  useVerseQuery as useLegacyVerseQuery,
  useVerseRangeQuery as useLegacyVerseRangeQuery,
  useRefreshBibleDataMutation as useLegacyRefreshBibleDataMutation,
  bibleQueryKeys,
} from './useBibleQueries';

export * from './useChapters';
export * from './useChaptersWithMetadata';
export * from './useVerses';

// New PowerSync hooks (preferred) - these are the ones to use going forward
export * from './usePowerSyncBible';

// Re-export the query keys for both systems during migration
export { powerSyncBibleQueryKeys } from './usePowerSyncBible';
