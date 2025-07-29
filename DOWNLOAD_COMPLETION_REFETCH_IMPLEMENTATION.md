# Download Completion Refetch Implementation

## Overview

This document outlines the implementation to ensure that when downloads complete, all relevant TanStack Query caches are properly invalidated to trigger refetches that check if the chapter has audio available.

## Problem Statement

Previously, when audio files were downloaded for a chapter, the download completion logic only invalidated Bible-related queries (chapters, verses, etc.) but did not invalidate media files queries. This meant that:

1. **Audio availability checks were not refreshed** - Components using `useChapterAudioInfo` or similar hooks would not see the newly downloaded audio files
2. **UI state was stale** - Download modals and audio availability indicators would not update to reflect the new audio files
3. **Inconsistent data** - The app would show different states for audio availability depending on which component was rendering

## Solution Implemented

### 1. Created Media Files TanStack Query Hooks

**File**: `src/features/media/hooks/useMediaFilesQueries.ts`

Created comprehensive TanStack Query hooks for all media files operations:

```typescript
// Media Files Query Keys
export const mediaFilesQueryKeys = {
  all: ['media-files'] as const,
  list: (filters?: MediaFileFilters, sort?: MediaFileSort) =>
    [...mediaFilesQueryKeys.all, 'list', filters, sort] as const,
  byId: (id: string) => [...mediaFilesQueryKeys.all, 'id', id] as const,
  byChapter: (chapterId: string) => [...mediaFilesQueryKeys.all, 'chapter', chapterId] as const,
  audioAvailability: (chapterId: string) => [...mediaFilesQueryKeys.all, 'audio-availability', chapterId] as const,
} as const;

// Available hooks:
- useMediaFilesQuery(filters?, sort?)
- useMediaFileQuery(id)
- useMediaFilesByChapterQuery(chapterId)
- useChapterAudioAvailabilityQuery(chapterId)
```

### 2. Enhanced Chapter Audio Info Hook

**File**: `src/features/media/hooks/useChapterAudioInfo.ts`

Created a TanStack Query version of the chapter audio info hook while maintaining backward compatibility:

```typescript
// New TanStack Query hook
export const useChapterAudioInfoQuery = (chapterId: string, autoRefresh = false, refreshInterval = 30000)

// Legacy hook for backward compatibility
export const useChapterAudioInfo = (chapterId: string, autoRefresh = false, refreshInterval = 30000)
```

### 3. Updated Download Completion Logic

**File**: `src/features/downloads/components/ChapterDownloadModal.tsx`

Enhanced the download completion callback to invalidate all relevant queries:

```typescript
onSuccess: () => {
  logger.info('All downloads completed successfully');

  // Invalidate TanStack Query caches to update chapter data
  try {
    // Bible queries
    queryClient.invalidateQueries({
      queryKey: bibleQueryKeys.chapter(chapterId),
    });
    queryClient.invalidateQueries({
      queryKey: bibleQueryKeys.verses(chapterId),
    });
    queryClient.invalidateQueries({
      queryKey: bibleQueryKeys.versesWithTexts(chapterId),
    });
    queryClient.invalidateQueries({
      queryKey: bibleQueryKeys.verseTexts(chapterId),
    });

    // Media files queries
    queryClient.invalidateQueries({
      queryKey: mediaFilesQueryKeys.byChapter(chapterId),
    });
    queryClient.invalidateQueries({
      queryKey: mediaFilesQueryKeys.audioAvailability(chapterId),
    });
    queryClient.invalidateQueries({ queryKey: mediaFilesQueryKeys.all });

    // Chapter audio info queries
    queryClient.invalidateQueries({
      queryKey: chapterAudioInfoQueryKeys.byChapter(chapterId),
    });
    queryClient.invalidateQueries({ queryKey: chapterAudioInfoQueryKeys.all });

    logger.info('TanStack Query caches invalidated for chapter:', chapterId);
  } catch (error) {
    logger.error('Failed to invalidate TanStack Query caches:', error);
  }
};
```

### 4. Updated Media Hooks Exports

**File**: `src/features/media/hooks/index.ts`

Added exports for all new TanStack Query hooks:

```typescript
export {
  useMediaFilesQuery,
  useMediaFileQuery,
  useMediaFilesByChapterQuery,
  useChapterAudioAvailabilityQuery,
  mediaFilesQueryKeys,
} from './useMediaFilesQueries';

export {
  useChapterAudioInfoQuery,
  useChapterAudioInfo as useChapterAudioInfoLegacy,
} from './useChapterAudioInfo';
```

## Query Invalidation Strategy

### 1. **Specific Chapter Queries**

- `bibleQueryKeys.chapter(chapterId)` - Chapter data
- `bibleQueryKeys.verses(chapterId)` - Verses for the chapter
- `bibleQueryKeys.versesWithTexts(chapterId)` - Verses with text content
- `bibleQueryKeys.verseTexts(chapterId)` - Verse text content
- `mediaFilesQueryKeys.byChapter(chapterId)` - Media files for the chapter
- `mediaFilesQueryKeys.audioAvailability(chapterId)` - Audio availability status
- `chapterAudioInfoQueryKeys.byChapter(chapterId)` - Chapter audio info

### 2. **Global Media Queries**

- `mediaFilesQueryKeys.all` - All media files queries (for filtered views)
- `chapterAudioInfoQueryKeys.all` - All chapter audio info queries

### 3. **Why This Strategy Works**

1. **Immediate Updates**: Specific chapter queries ensure the current chapter view updates immediately
2. **Global Consistency**: Global queries ensure any filtered views or lists also update
3. **Comprehensive Coverage**: All components that depend on audio availability will refetch their data
4. **Performance**: Only relevant queries are invalidated, not the entire cache

## Benefits Achieved

### 1. **Real-time Audio Availability Updates**

- When downloads complete, all components immediately reflect the new audio availability
- No need to manually refresh or restart the app
- Consistent state across all screens

### 2. **Improved User Experience**

- Download modals automatically close when audio becomes available
- Audio availability indicators update in real-time
- No confusion about whether audio is available

### 3. **Better Performance**

- TanStack Query provides intelligent caching and background refetching
- Reduced database calls through smart cache invalidation
- Optimized re-renders only when data actually changes

### 4. **Maintainability**

- Centralized query invalidation logic
- Consistent patterns across all media-related queries
- Easy to extend for future media types

## Testing

### 1. **Unit Tests**

**File**: `src/features/downloads/components/__tests__/ChapterDownloadModal.test.tsx`

Created comprehensive tests to verify:

- All relevant queries are invalidated when downloads complete
- Bible queries are properly invalidated
- Media files queries are properly invalidated
- Chapter audio info queries are properly invalidated

### 2. **Integration Testing**

To test the complete flow:

1. **Start with a chapter that has no audio**
   - Navigate to a chapter without downloaded audio
   - Verify download modal appears

2. **Download audio files**
   - Trigger download through the modal
   - Wait for download to complete

3. **Verify immediate updates**
   - Download modal should close automatically
   - Audio availability indicators should update
   - Any audio player components should show available audio

## Migration Path

### 1. **Immediate Benefits**

- Existing `useChapterAudioInfo` hook continues to work (backward compatibility)
- All new downloads automatically trigger proper cache invalidation
- No breaking changes to existing components

### 2. **Future Migration**

- Components can gradually migrate to use the new TanStack Query hooks
- Better performance and caching for media files operations
- Consistent data management patterns

### 3. **Recommended Next Steps**

1. Migrate `useMediaFiles` hooks to use TanStack Query
2. Update `ChapterQueueService` to use query hooks
3. Create mutations for media file operations (create, update, delete)

## Conclusion

This implementation ensures that when audio downloads complete, all relevant components automatically refetch their data to check for audio availability. The solution provides:

- **Immediate updates** when downloads complete
- **Consistent state** across all components
- **Better performance** through intelligent caching
- **Maintainable code** with centralized query management
- **Backward compatibility** for existing components

The download completion now properly triggers a comprehensive refetch that checks if the chapter has audio, ensuring a seamless user experience.
