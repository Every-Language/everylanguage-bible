# Database Data Flow Review

## Overview

This document provides a comprehensive review of how data flows from the database to the UI and identifies all areas that need to be migrated to use TanStack Query for consistent data management.

## Current Data Flow Analysis

### ✅ **Areas Already Using TanStack Query**

1. **Bible Data (Partially)**:
   - `useBibleQueries.ts` - Enhanced TanStack Query hooks for Bible data
   - `BibleBooksScreenOptimized.tsx` - Uses `useBooksQuery()`
   - `VersesScreenOptimized.tsx` - Uses `useVersesWithTextsQuery()`

2. **Query Client Configuration**:
   - `src/shared/services/query/queryClient.ts` - Properly configured with retry logic

### ❌ **Areas Still Using Direct Database Access**

#### 1. **Bible Screens (Critical)**

- `BibleBooksScreen.tsx` - Uses `useBibleBooks()` (old hook)
- `ChapterScreen.tsx` - Uses `useChapters()` (old hook)
- `VersesScreen.tsx` - Uses `useVerses()` (old hook)

#### 2. **Media Files (High Priority)**

- `useMediaFiles.ts` - Direct `mediaFilesService` calls
- `ChapterQueueService.ts` - Direct database access
- `ChapterScreen.tsx` - Direct `mediaFilesService` calls

#### 3. **Sync and Status Checks (Medium Priority)**

- `SyncProgressModal.tsx` - Direct `localDataService` calls for counts
- `OnboardingSyncService.ts` - Direct database access for verification
- `syncStore.ts` - Direct database access for status checks

#### 4. **Onboarding (Low Priority)**

- `useDatabaseStatus.ts` - Direct `DatabaseManager` calls
- `DatabaseOnboarding.tsx` - Direct database initialization

## Data Flow Patterns Identified

### Pattern 1: Direct Service Calls (❌ Needs Migration)

```typescript
// Current pattern in BibleBooksScreen.tsx
const { books, loading, error } = useBibleBooks(); // Old hook with direct service calls

// Current pattern in VersesScreen.tsx
const { verses, loading, error } = useVerses(chapter.id); // Old hook
const textsMap = await localDataService.getVerseTextsForChapter(
  chapter.id,
  currentTextVersion.id
); // Direct call
```

### Pattern 2: Direct Database Service Calls (❌ Needs Migration)

```typescript
// Current pattern in useMediaFiles.ts
const files = await mediaFilesService.getMediaFiles(filters, sort);

// Current pattern in SyncProgressModal.tsx
const hasData = await localDataService.isDataAvailable();
const bookCount = await localDataService.getBooksCount();
```

### Pattern 3: TanStack Query Pattern (✅ Best Practice)

```typescript
// Target pattern
const {
  data: books = [],
  isLoading: booksLoading,
  error: booksError,
  refetch: refetchBooks,
} = useBooksQuery();
```

## Migration Priority Matrix

### 🔴 **Critical Priority (User-Facing Screens)**

1. **BibleBooksScreen.tsx** → Use `useBooksQuery()`
2. **ChapterScreen.tsx** → Use `useChaptersQuery()`
3. **VersesScreen.tsx** → Use `useVersesWithTextsQuery()`

### 🟡 **High Priority (Core Functionality)**

4. **useMediaFiles.ts** → Create `useMediaFilesQuery()` hooks
5. **ChapterQueueService.ts** → Create `useChapterQueueQuery()` hooks
6. **Media availability checks** → Create `useMediaAvailabilityQuery()` hooks

### 🟢 **Medium Priority (Background Services)**

7. **SyncProgressModal.tsx** → Create `useDataStatusQuery()` hooks
8. **OnboardingSyncService.ts** → Create `useSyncStatusQuery()` hooks
9. **syncStore.ts** → Create `useSyncStateQuery()` hooks

### 🔵 **Low Priority (System Services)**

10. **useDatabaseStatus.ts** → Create `useDatabaseStatusQuery()` hooks
11. **DatabaseOnboarding.tsx** → Create `useDatabaseInitQuery()` hooks

## Detailed Migration Plan

### Phase 1: Bible Screens Migration (Critical)

#### 1.1 Update BibleBooksScreen.tsx

```typescript
// Replace this:
import { useBibleBooks } from '../hooks/useBibleBooks';
const { books, loading, error } = useBibleBooks();

// With this:
import { useBooksQuery } from '../hooks/useBibleQueries';
const {
  data: books = [],
  isLoading: loading,
  error: booksError,
  refetch: refetchBooks,
} = useBooksQuery();
```

#### 1.2 Update ChapterScreen.tsx

```typescript
// Replace this:
import { useChapters } from '../hooks/useChapters';
const { chapters, loading, error } = useChapters(book.id);

// With this:
import { useChaptersQuery } from '../hooks/useBibleQueries';
const {
  data: chapters = [],
  isLoading: loading,
  error: chaptersError,
  refetch: refetchChapters,
} = useChaptersQuery(book.id);
```

#### 1.3 Update VersesScreen.tsx

```typescript
// Replace this:
import { useVerses } from '../hooks/useVerses';
const { verses, loading, error } = useVerses(chapter.id);
const textsMap = await localDataService.getVerseTextsForChapter(...);

// With this:
import { useVersesWithTextsQuery } from '../hooks/useBibleQueries';
const {
  data: versesWithTexts = [],
  isLoading: loading,
  error: versesError,
  refetch: refetchVerses,
} = useVersesWithTextsQuery(chapter.id, currentTextVersion?.id);
```

### Phase 2: Media Files Migration (High Priority)

#### 2.1 Create Media Files Query Hooks

```typescript
// src/features/media/hooks/useMediaFilesQueries.ts
export const useMediaFilesQuery = (
  filters?: MediaFileFilters,
  sort?: MediaFileSort
) => {
  return useQuery({
    queryKey: ['media-files', filters, sort],
    queryFn: () => mediaFilesService.getMediaFiles(filters, sort),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMediaFileQuery = (id: string) => {
  return useQuery({
    queryKey: ['media-files', id],
    queryFn: () => mediaFilesService.getMediaFileById(id),
    enabled: !!id,
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

#### 2.2 Update useMediaFiles.ts

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

### Phase 3: Sync and Status Migration (Medium Priority)

#### 3.1 Create Data Status Query Hooks

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
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};
```

#### 3.2 Update SyncProgressModal.tsx

```typescript
// Replace direct calls with TanStack Query
const { data: dataStatus } = useDataStatusQuery();
const hasData = dataStatus?.hasData || false;
```

## Implementation Strategy

### Step 1: Create Missing Query Hooks

1. **Media Files Queries**: `useMediaFilesQueries.ts`
2. **Data Status Queries**: `useDataStatusQueries.ts`
3. **Sync Status Queries**: `useSyncStatusQueries.ts`

### Step 2: Migrate Screens

1. **BibleBooksScreen.tsx** → Use `useBooksQuery()`
2. **ChapterScreen.tsx** → Use `useChaptersQuery()`
3. **VersesScreen.tsx** → Use `useVersesWithTextsQuery()`

### Step 3: Migrate Services

1. **useMediaFiles.ts** → Use media files query hooks
2. **ChapterQueueService.ts** → Create query hooks for queue operations
3. **SyncProgressModal.tsx** → Use data status query hooks

### Step 4: Update Navigation

1. **BibleStackNavigator.tsx** → Replace old screens with optimized versions
2. **App.tsx** → Ensure QueryClientProvider is properly configured

## Benefits of Complete Migration

### 1. **Consistent Data Management**

- All data flows through TanStack Query
- Automatic caching and background refetching
- Consistent error handling and retry logic

### 2. **Performance Improvements**

- Reduced database calls through smart caching
- Background data updates
- Optimistic updates for better UX

### 3. **Developer Experience**

- Consistent API across all data fetching
- Built-in loading and error states
- Automatic cache invalidation

### 4. **Reliability**

- Intelligent retry logic
- Data validation
- Comprehensive error handling

## Current Status Summary

### ✅ **Completed**

- Enhanced TanStack Query hooks for Bible data
- Optimized BibleBooksScreen
- Query client configuration
- Retry logic and error handling

### 🔄 **In Progress**

- Migration of remaining Bible screens
- Creation of media files query hooks

### ⏳ **Pending**

- Migration of sync and status services
- Migration of onboarding services
- Complete integration testing

## Next Steps

1. **Immediate**: Migrate BibleBooksScreen, ChapterScreen, and VersesScreen
2. **Short-term**: Create and implement media files query hooks
3. **Medium-term**: Migrate sync and status services
4. **Long-term**: Complete integration testing and performance optimization

## Conclusion

The current data flow has a mix of TanStack Query usage and direct database access. To ensure all data passes through TanStack Query before being displayed to the UI, we need to:

1. **Migrate all user-facing screens** to use TanStack Query hooks
2. **Create query hooks for all data services** (media files, sync status, etc.)
3. **Replace direct database calls** with appropriate query hooks
4. **Ensure consistent error handling and retry logic** across all data fetching

This migration will provide a consistent, performant, and reliable data layer throughout the application.
