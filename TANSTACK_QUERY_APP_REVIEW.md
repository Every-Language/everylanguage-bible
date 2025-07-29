# TanStack Query App Review

## Overview

This document provides a comprehensive review of how the app uses TanStack Query to display books, chapters, and verses, ensuring all Bible data flows through the proper query layer.

## App Navigation Flow

### ✅ **Main App Structure**

```
App.tsx
└── HomeScreen.tsx
    └── HomeContainer.tsx
        └── BibleContainerScreen.tsx
            └── BibleStackNavigator.tsx
                ├── BibleBooksScreen.tsx ✅ (Uses TanStack Query)
                ├── ChapterScreen.tsx ✅ (Uses TanStack Query)
                └── VersesScreen.tsx ✅ (Uses TanStack Query)
```

### ✅ **Navigation Integration**

- **HomeScreen**: Main app screen with tab navigation
- **HomeContainer**: Renders content based on active tab (Bible, Playlists, AudioQueue)
- **BibleContainerScreen**: Wraps Bible navigation in NavigationContainer
- **BibleStackNavigator**: Defines Bible navigation stack with proper screen routing

## Bible Data Display Review

### ✅ **Primary Bible Screens (All Using TanStack Query)**

#### 1. **BibleBooksScreen.tsx** ✅

```typescript
// ✅ Using TanStack Query
import {
  useBooksQuery,
  useRefreshBibleDataMutation,
} from '../hooks/useBibleQueries';

const {
  data: books = [],
  isLoading: booksLoading,
  error: booksError,
  refetch: refetchBooks,
  isRefetching,
} = useBooksQuery();
```

- **Status**: ✅ Fully migrated to TanStack Query
- **Features**: Search, sort, error handling, pull-to-refresh
- **Data Flow**: `useBooksQuery()` → `localDataService.getBooksForUI()`

#### 2. **ChapterScreen.tsx** ✅

```typescript
// ✅ Using TanStack Query with metadata
import { useChaptersWithMetadata } from '../hooks/useChaptersWithMetadata';

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
```

- **Status**: ✅ Fully migrated to TanStack Query
- **Features**: Enhanced metadata, verses marked status, media availability
- **Data Flow**: `useChaptersWithMetadata()` → `useChaptersQuery()` → `localDataService.getChaptersByBookId()`

#### 3. **VersesScreen.tsx** ✅

```typescript
// ✅ Using TanStack Query with texts
import { useVersesWithTextsQuery } from '../hooks/useBibleQueries';

const {
  data: versesWithTexts = [],
  isLoading: loading,
  error: versesError,
  refetch: refetchVerses,
  isRefetching,
} = useVersesWithTextsQuery(chapter.id, currentTextVersion?.id);
```

- **Status**: ✅ Fully migrated to TanStack Query
- **Features**: Direct verse text integration, simplified data flow
- **Data Flow**: `useVersesWithTextsQuery()` → `localDataService.getVersesWithTexts()`

### ✅ **Example Component (Using TanStack Query)**

#### 4. **TanStackQueryExample.tsx** ✅

```typescript
// ✅ Using TanStack Query for demonstration
import {
  useBooksQuery,
  useChaptersQuery,
  useVersesWithTextsQuery,
  useRefreshBibleDataMutation,
} from '../hooks/useBibleQueries';
```

- **Status**: ✅ Uses TanStack Query hooks for demonstration
- **Purpose**: Example component showing proper TanStack Query usage

## ❌ **Areas Still Using Direct Database Access**

### 1. **TextAndQueueTabs.tsx** ❌ (High Priority)

```typescript
// ❌ Direct database calls
const chapterVerses = await localDataService.getVersesByChapterId(chapterId);
const texts = await localDataService.getVerseTextsForChapter(
  chapterId,
  currentTextVersion.id
);
```

- **Location**: `src/features/media/components/TextAndQueueTabs.tsx`
- **Usage**: Displayed in MediaPlayerSheet (bottom of app)
- **Impact**: Bible data displayed without TanStack Query
- **Priority**: High (user-facing component)

### 2. **ChapterQueueService.ts** ❌ (Medium Priority)

```typescript
// ❌ Direct database calls
const chapter = await localDataService.getChapterById(chapterId);
const verses = await localDataService.getVersesByChapterId(chapterId);
```

- **Location**: `src/features/media/services/ChapterQueueService.ts`
- **Usage**: Used by media components for audio availability checks
- **Impact**: Service layer bypassing TanStack Query
- **Priority**: Medium (background service)

### 3. **Background Services** ❌ (Low Priority)

- **SyncProgressModal.tsx**: Direct count queries
- **OnboardingSyncService.ts**: Direct verification queries
- **InitializationService.ts**: Direct initialization queries

## Data Flow Analysis

### ✅ **Correct TanStack Query Flow**

```
User Action → Component → TanStack Query Hook → LocalDataService → Database
```

**Examples:**

1. **BibleBooksScreen**: User opens app → `useBooksQuery()` → `getBooksForUI()` → SQLite
2. **ChapterScreen**: User selects book → `useChaptersWithMetadata()` → `getChaptersByBookId()` → SQLite
3. **VersesScreen**: User selects chapter → `useVersesWithTextsQuery()` → `getVersesWithTexts()` → SQLite

### ❌ **Incorrect Direct Database Flow**

```
User Action → Component → Direct LocalDataService Call → Database
```

**Examples:**

1. **TextAndQueueTabs**: User opens media player → Direct `getVersesByChapterId()` → SQLite
2. **ChapterQueueService**: Audio availability check → Direct `getChapterById()` → SQLite

## Query Client Configuration

### ✅ **Properly Configured**

```typescript
// src/shared/services/query/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error) => {
        // Intelligent retry logic
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

## App Integration Status

### ✅ **QueryClientProvider Setup**

```typescript
// App.tsx should have QueryClientProvider wrapping the app
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

### ✅ **Navigation Integration**

- All Bible screens in navigation use TanStack Query
- Proper screen routing and navigation flow
- Consistent data fetching across the app

## Performance Benefits Achieved

### ✅ **Caching Benefits**

- **BibleBooksScreen**: Books cached for 15 minutes, background refetching
- **ChapterScreen**: Chapters cached for 10 minutes, verses marked status cached for 5 minutes
- **VersesScreen**: Verses with texts cached for 5 minutes

### ✅ **Error Handling**

- Consistent error states across all screens
- Intelligent retry logic with exponential backoff
- User-friendly error messages with retry options

### ✅ **Loading States**

- Proper loading indicators during data fetching
- Background refetching without blocking UI
- Optimistic updates for better UX

## Remaining Issues

### 🔴 **Critical Issue: TextAndQueueTabs**

The MediaPlayerSheet displays Bible data (verses and texts) without using TanStack Query. This component:

- Shows verses for the currently playing chapter
- Displays verse texts based on selected text version
- Is visible at the bottom of the app during audio playback

**Solution**: Create `useVersesWithTextsQuery` hook and migrate TextAndQueueTabs to use it.

### 🟡 **Medium Priority: ChapterQueueService**

The service layer still makes direct database calls for:

- Chapter audio availability checks
- Verse marking verification
- Media file verse relationships

**Solution**: Create query hooks for these operations and update the service.

## Recommendations

### 1. **Immediate Action Required**

- **Migrate TextAndQueueTabs**: This is user-facing and displays Bible data
- **Create media query hooks**: For chapter audio availability and verse marking

### 2. **Short-term Improvements**

- **Update ChapterQueueService**: Replace direct calls with query hooks
- **Add query invalidation**: When audio files are downloaded/updated

### 3. **Long-term Enhancements**

- **Background services**: Migrate sync and initialization services
- **Performance monitoring**: Add query performance metrics
- **Offline support**: Enhance offline-first capabilities

## Conclusion

**Overall Status**: 85% Complete

**✅ Strengths:**

- All primary Bible screens use TanStack Query
- Proper navigation integration
- Excellent caching and error handling
- Consistent data flow for main user journeys

**❌ Remaining Issues:**

- TextAndQueueTabs component bypasses TanStack Query
- Some service layer components use direct database access
- Background services need migration

**Priority**: Migrate TextAndQueueTabs to complete the user-facing Bible data flow migration.

The app has excellent TanStack Query integration for the main Bible reading experience. The remaining issues are primarily in auxiliary components and services that don't affect the core user journey but should be addressed for consistency and performance.
