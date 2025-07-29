# Database Data Flow Migration Status

## Overview

This document tracks the progress of migrating all database data access to use TanStack Query, ensuring consistent data management throughout the application.

## Migration Progress

### ✅ **Completed Migrations**

#### 1. **Bible Data Queries** (`src/features/bible/hooks/useBibleQueries.ts`)

- ✅ Enhanced TanStack Query hooks with retry logic
- ✅ Data validation for empty results
- ✅ Proper error handling and sync state integration
- ✅ Type safety improvements

#### 2. **BibleBooksScreen** (`src/features/bible/screens/BibleBooksScreen.tsx`)

- ✅ Migrated from `useBibleBooks()` to `useBooksQuery()`
- ✅ Added search and sort functionality
- ✅ Enhanced error handling with retry and sync options
- ✅ Proper loading states and pull-to-refresh

#### 3. **ChapterScreen** (`src/features/bible/screens/ChapterScreen.tsx`)

- ✅ Migrated from `useChapters()` to `useChaptersWithMetadata()`
- ✅ Created new hook that combines TanStack Query with metadata transformation
- ✅ Maintains compatibility with existing ChapterWithMetadata structure
- ✅ Enhanced error handling and loading states

#### 4. **VersesScreen** (`src/features/bible/screens/VersesScreen.tsx`)

- ✅ Migrated from `useVerses()` + direct `localDataService` calls to `useVersesWithTextsQuery()`
- ✅ Eliminated manual verse text loading logic
- ✅ Direct integration with TanStack Query for verses with texts
- ✅ Simplified data flow and improved performance

#### 5. **Query Client Configuration** (`src/shared/services/query/queryClient.ts`)

- ✅ Properly configured with retry logic
- ✅ Exponential backoff with maximum delays
- ✅ Background refetching enabled
- ✅ Error handling for different status codes

### 🔄 **In Progress Migrations**

#### 1. **Media Files (High Priority)**

- ⏳ **useMediaFiles.ts** - Direct `mediaFilesService` calls
- ⏳ **ChapterQueueService.ts** - Direct database access
- ⏳ **ChapterScreen.tsx** - Direct `mediaFilesService` calls for media availability

### ⏳ **Pending Migrations**

#### 1. **Sync and Status (Medium Priority)**

- ⏳ **SyncProgressModal.tsx** - Direct `localDataService` calls for counts
- ⏳ **OnboardingSyncService.ts** - Direct database access for verification
- ⏳ **syncStore.ts** - Direct database access for status checks

#### 2. **Onboarding (Low Priority)**

- ⏳ **useDatabaseStatus.ts** - Direct `DatabaseManager` calls
- ⏳ **DatabaseOnboarding.tsx** - Direct database initialization

## Current Data Flow Status

### ✅ **TanStack Query Pattern (Best Practice)**

```typescript
// BibleBooksScreen.tsx - ✅ Migrated
const {
  data: books = [],
  isLoading: booksLoading,
  error: booksError,
  refetch: refetchBooks,
  isRefetching,
} = useBooksQuery();

// ChapterScreen.tsx - ✅ Migrated
const {
  chapters,
  loading,
  error,
  selectedChapter,
  isRefetching,
  fetchChapters,
  selectChapter,
  clearSelection,
} = useChaptersWithMetadata(book.id);

// VersesScreen.tsx - ✅ Migrated
const {
  data: versesWithTexts = [],
  isLoading: loading,
  error: versesError,
  refetch: refetchVerses,
  isRefetching,
} = useVersesWithTextsQuery(chapter.id, currentTextVersion?.id);
```

### ❌ **Direct Database Access (Needs Migration)**

```typescript
// useMediaFiles.ts - ❌ Needs migration
const files = await mediaFilesService.getMediaFiles(filters, sort); // Direct call

// ChapterQueueService.ts - ❌ Needs migration
const mediaFiles = await mediaFilesService.getMediaFilesByChapterId(chapterId); // Direct call

// SyncProgressModal.tsx - ❌ Needs migration
const hasData = await localDataService.isDataAvailable(); // Direct call
```

## Next Steps

### 🟡 **High Priority (Core Functionality)**

#### 1. **Create Media Files Query Hooks**

```typescript
// src/features/media/hooks/useMediaFilesQueries.ts
export const useMediaFilesQuery = (
  filters?: MediaFileFilters,
  sort?: MediaFileSort
) => {
  return useQuery({
    queryKey: ['media-files', filters, sort],
    queryFn: () => mediaFilesService.getMediaFiles(filters, sort),
    staleTime: 5 * 60 * 1000,
  });
};

export const useMediaFilesByChapterQuery = (chapterId: string) => {
  return useQuery({
    queryKey: ['media-files', 'chapter', chapterId],
    queryFn: () => mediaFilesService.getMediaFilesByChapterId(chapterId),
    enabled: !!chapterId,
    staleTime: 5 * 60 * 1000,
  });
};
```

#### 2. **Update useMediaFiles.ts**

```typescript
// Replace direct service calls with TanStack Query hooks
export const useMediaFiles = (
  filters?: MediaFileFilters,
  sort?: MediaFileSort
) => {
  const {
    data: files = [],
    isLoading,
    error,
    refetch,
  } = useMediaFilesQuery(filters, sort);

  return {
    files,
    loading: isLoading,
    error: error?.message || null,
    refreshFiles: refetch,
  };
};
```

### 🟢 **Medium Priority (Background Services)**

#### 3. **Create Data Status Query Hooks**

```typescript
// src/shared/hooks/useDataStatusQueries.ts
export const useDataStatusQuery = () => {
  return useQuery({
    queryKey: ['data-status'],
    queryFn: async () => {
      const [booksCount, chaptersCount, versesCount] = await Promise.all([
        localDataService.getBooksCount(),
        localDataService.getChaptersCount(),
        localDataService.getVersesCount(),
      ]);

      return {
        booksCount,
        chaptersCount,
        versesCount,
        hasData: booksCount > 0 && chaptersCount > 0 && versesCount > 0,
      };
    },
    staleTime: 1 * 60 * 1000,
  });
};
```

## Benefits Achieved

### 1. **Consistent Data Management**

- ✅ All Bible data (books, chapters, verses) flows through TanStack Query
- ✅ Automatic caching and background refetching
- ✅ Consistent error handling and retry logic

### 2. **Performance Improvements**

- ✅ Reduced database calls through smart caching
- ✅ Background data updates
- ✅ Optimized re-renders
- ✅ Eliminated redundant verse text loading

### 3. **Developer Experience**

- ✅ Consistent API across Bible data fetching
- ✅ Built-in loading and error states
- ✅ Automatic cache invalidation
- ✅ Simplified data flow in VersesScreen

### 4. **Reliability**

- ✅ Intelligent retry logic
- ✅ Data validation
- ✅ Comprehensive error handling
- ✅ Better type safety

## Testing Status

### ✅ **Completed Tests**

- ✅ TanStack Query hooks functionality
- ✅ BibleBooksScreen migration
- ✅ ChapterScreen migration
- ✅ VersesScreen migration
- ✅ Error handling and retry logic

### ⏳ **Pending Tests**

- ⏳ Media files query hooks
- ⏳ Integration testing across all screens
- ⏳ Performance testing with large datasets

## Conclusion

**Progress**: 75% Complete (3 of 4 critical screens migrated)

**Next Priority**: Create and implement media files query hooks to complete the high-priority migrations.

**Target**: 100% TanStack Query usage for all database data access by end of migration.

The critical Bible data flow migration is now complete! All user-facing Bible screens now use TanStack Query for consistent, performant, and reliable data management. The remaining migrations will complete the data layer transformation.
