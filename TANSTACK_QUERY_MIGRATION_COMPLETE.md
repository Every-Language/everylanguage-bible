# TanStack Query Migration Complete

## Overview

This document provides a comprehensive review of the TanStack Query implementation across the entire app, ensuring all data fetching from the local database uses TanStack Query for consistent data management, caching, and performance.

## Migration Status Summary

### ✅ **FULLY MIGRATED TO TANSTACK QUERY**

#### 1. **Bible Data Queries** (`src/features/bible/hooks/useBibleQueries.ts`)

- ✅ `useBooksQuery()` - Fetch all books
- ✅ `useBookQuery(bookId)` - Fetch specific book
- ✅ `useChaptersQuery(bookId)` - Fetch chapters for a book
- ✅ `useChapterQuery(chapterId)` - Fetch specific chapter
- ✅ `useVersesQuery(chapterId, filters?, sort?)` - Fetch verses
- ✅ `useVerseTextsQuery(chapterId, textVersionId?)` - Fetch verse texts
- ✅ `useVersesWithTextsQuery(chapterId, textVersionId?)` - Fetch verses with texts
- ✅ `useVerseRangeQuery(chapterId, startVerse, endVerse)` - Fetch verse range
- ✅ `useVerseQuery(chapterId, verseNumber)` - Fetch specific verse
- ✅ `useMultipleChaptersWithVersesQuery(chapterIds)` - Bulk fetch chapters
- ✅ `useUpdateVerseTextMutation()` - Update verse text
- ✅ `useRefreshBibleDataMutation()` - Refresh all Bible data

#### 2. **Media Files Queries** (`src/features/media/hooks/useMediaFilesQueries.ts`)

- ✅ `useMediaFilesQuery(filters?, sort?)` - Fetch media files with filtering
- ✅ `useMediaFileQuery(id)` - Fetch specific media file
- ✅ `useMediaFilesByChapterQuery(chapterId)` - Fetch media files by chapter
- ✅ `useMediaFilesByLanguageQuery(languageEntityId)` - Fetch media files by language
- ✅ `useMediaFilesByUploadStatusQuery(uploadStatus)` - Fetch media files by upload status
- ✅ `useMediaFilesByPublishStatusQuery(publishStatus)` - Fetch media files by publish status
- ✅ `useChapterAudioAvailabilityQuery(chapterId)` - Check audio availability for chapter

#### 3. **Data Status Queries** (`src/shared/hooks/useDataStatusQueries.ts`)

- ✅ `useDataAvailabilityQuery()` - Check if data is available
- ✅ `useDataCountsQuery()` - Get data counts for all tables
- ✅ `useDatabaseHealthQuery()` - Get database health status
- ✅ `useLastSyncQuery()` - Get last sync timestamp

#### 4. **Updated Hook Wrappers** (`src/shared/hooks/useMediaFiles.ts`)

- ✅ `useMediaFiles()` - Now uses `useMediaFilesQuery()`
- ✅ `useMediaFile()` - Now uses `useMediaFileQuery()`
- ✅ `useMediaFilesByChapter()` - Now uses `useMediaFilesByChapterQuery()`
- ✅ `useMediaFilesByLanguage()` - Now uses `useMediaFilesByLanguageQuery()`
- ✅ `useMediaFilesByUploadStatus()` - Now uses `useMediaFilesByUploadStatusQuery()`
- ✅ `useMediaFilesByPublishStatus()` - Now uses `useMediaFilesByPublishStatusQuery()`

#### 5. **Bible Screens** (All Using TanStack Query)

- ✅ **BibleBooksScreen.tsx** - Uses `useBooksQuery()`
- ✅ **ChapterScreen.tsx** - Uses `useChaptersWithMetadata()` (which uses `useChaptersQuery()`)
- ✅ **VersesScreen.tsx** - Uses `useVersesWithTextsQuery()`
- ✅ **TextAndQueueTabs.tsx** - Uses `useVersesWithTextsQuery()`

#### 6. **Sync and Status Components**

- ✅ **SyncProgressModal.tsx** - Uses `useDataAvailabilityQuery()` and `useDataCountsQuery()`

### ✅ **QUERY CLIENT CONFIGURATION**

#### **Optimized Configuration** (`src/shared/services/query/queryClient.ts`)

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error) => {
        // Intelligent retry logic
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false; // Don't retry 4xx errors
          }
        }
        return failureCount < 3; // Retry up to 3 times
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'always',
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      onError: error => {
        logger.error('Mutation error:', error);
      },
    },
  },
});
```

## Data Flow Patterns

### ✅ **Correct TanStack Query Flow**

```
User Action → Component → TanStack Query Hook → LocalDataService → Database
```

**Examples:**

1. **BibleBooksScreen**: User opens app → `useBooksQuery()` → `getBooksForUI()` → SQLite
2. **ChapterScreen**: User selects book → `useChaptersWithMetadata()` → `getChaptersByBookId()` → SQLite
3. **VersesScreen**: User selects chapter → `useVersesWithTextsQuery()` → `getVersesWithTexts()` → SQLite
4. **TextAndQueueTabs**: User opens media player → `useVersesWithTextsQuery()` → `getVersesWithTexts()` → SQLite
5. **SyncProgressModal**: Check data status → `useDataCountsQuery()` → `getBooksCount()` → SQLite

### ✅ **Consistent Query Key Organization**

```typescript
// Bible Query Keys
export const bibleQueryKeys = {
  all: ['bible'] as const,
  books: () => [...bibleQueryKeys.all, 'books'] as const,
  book: (id: string) => [...bibleQueryKeys.books(), id] as const,
  chapters: (bookId: string) =>
    [...bibleQueryKeys.book(bookId), 'chapters'] as const,
  // ... more organized keys
};

// Media Files Query Keys
export const mediaFilesQueryKeys = {
  all: ['media-files'] as const,
  list: (filters?, sort?) =>
    [...mediaFilesQueryKeys.all, 'list', filters, sort] as const,
  byChapter: (chapterId: string) =>
    [...mediaFilesQueryKeys.all, 'chapter', chapterId] as const,
  // ... more organized keys
};

// Data Status Query Keys
export const dataStatusQueryKeys = {
  all: ['data-status'] as const,
  availability: () => [...dataStatusQueryKeys.all, 'availability'] as const,
  counts: () => [...dataStatusQueryKeys.all, 'counts'] as const,
  // ... more organized keys
};
```

## Benefits Achieved

### 1. **Performance Improvements**

- ✅ **Automatic Caching**: All data is cached with appropriate stale times
- ✅ **Background Refetching**: Data stays fresh without blocking UI
- ✅ **Optimized Re-renders**: Only components with changed data re-render
- ✅ **Parallel Data Fetching**: Multiple queries run in parallel when possible

### 2. **User Experience Enhancements**

- ✅ **Single Loading State**: No more multiple loading indicators
- ✅ **Automatic Error Retry**: Failed requests retry automatically
- ✅ **Pull-to-refresh**: Built-in refresh functionality
- ✅ **Optimistic Updates**: Instant UI feedback for mutations

### 3. **Developer Experience**

- ✅ **Type-safe Queries**: Full TypeScript support
- ✅ **DevTools Integration**: Enhanced debugging capabilities
- ✅ **Consistent Patterns**: Standardized data fetching approach
- ✅ **Easy Testing**: Query hooks are easily testable

### 4. **Data Consistency**

- ✅ **Centralized Data Management**: All data flows through TanStack Query
- ✅ **Automatic Cache Invalidation**: Related data updates automatically
- ✅ **Background Sync**: Data stays fresh with background refetching
- ✅ **Error Handling**: Consistent error handling across all queries

## Query Configuration by Data Type

### **Bible Content** (Long-lived, rarely changes)

- **Stale Time**: 15 minutes
- **GC Time**: 30 minutes
- **Retry**: 3 attempts with exponential backoff

### **Media Files** (Medium-lived, may change)

- **Stale Time**: 5 minutes
- **GC Time**: 15 minutes
- **Retry**: 3 attempts with exponential backoff

### **Audio Availability** (Short-lived, frequently checked)

- **Stale Time**: 2 minutes
- **GC Time**: 10 minutes
- **Retry**: 2 attempts with shorter backoff

### **Data Status** (Short-lived, frequently checked)

- **Stale Time**: 1-2 minutes
- **GC Time**: 5 minutes
- **Retry**: 2-3 attempts with exponential backoff

## Migration Strategy Used

### **Phase 1: Foundation** ✅

- [x] Query client configuration
- [x] Basic query hooks
- [x] App integration

### **Phase 2: Core Features** ✅

- [x] Bible-specific query hooks
- [x] Media files query hooks
- [x] Data status query hooks
- [x] Hook wrapper updates

### **Phase 3: Component Migration** ✅

- [x] Bible screens migration
- [x] Media components migration
- [x] Sync components migration
- [x] Hook compatibility maintenance

### **Phase 4: Optimization** ✅

- [x] Query key organization
- [x] Retry logic optimization
- [x] Cache invalidation strategies
- [x] Performance monitoring

## Usage Examples

### **Basic Query Usage**

```typescript
const { data: books, isLoading, error } = useBooksQuery();
```

### **Query with Parameters**

```typescript
const { data: chapters } = useChaptersQuery(bookId);
```

### **Query with Filters and Sort**

```typescript
const { data: verses } = useVersesQuery(chapterId, filters, sort);
```

### **Manual Refetching**

```typescript
const { refetch } = useVersesQuery(chapterId);
const handleRefresh = () => refetch();
```

### **Mutation Usage**

```typescript
const updateVerseMutation = useUpdateVerseTextMutation();
const handleUpdate = () => {
  updateVerseMutation.mutate({
    verseId: 'verse-1',
    textVersionId: 'version-1',
    verseText: 'Updated text',
  });
};
```

## Best Practices Implemented

### 1. **Query Key Organization**

- Hierarchical query keys for easy cache management
- Consistent naming conventions
- Proper parameter serialization

### 2. **Error Handling**

- Intelligent retry logic based on error types
- User-friendly error messages
- Graceful degradation

### 3. **Performance Optimization**

- Appropriate stale times for different data types
- Background refetching for data freshness
- Optimized cache invalidation

### 4. **Type Safety**

- Full TypeScript support
- Proper type inference
- Runtime type validation

## Conclusion

The app now has **100% TanStack Query coverage** for all data fetching from the local database. This provides:

- **Consistent data management** across all components
- **Automatic caching and background refetching** for better performance
- **Built-in error handling and retry logic** for resilience
- **Type-safe queries** with full TypeScript support
- **Optimized user experience** with loading states and pull-to-refresh

All components now follow the same data flow pattern, making the codebase more maintainable and providing a better user experience with faster data access and automatic background updates.
