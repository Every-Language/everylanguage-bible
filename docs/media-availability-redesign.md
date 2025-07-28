# Media Availability Redesign

## Overview

The `getChaptersMediaAvailability` function has been redesigned to return three possible values instead of a simple boolean:

- **`complete`**: All verses in the chapter are covered by media files
- **`partial`**: Some verses in the chapter are covered by media files, but not all
- **`none`**: No media files exist for the chapter

## Implementation Details

### Database Query Changes

The function now queries the `media_files` table with a JOIN to the `chapters` table to get:

- `chapter_id`
- `start_verse_id`
- `end_verse_id`
- `total_verses`

### Verse Coverage Calculation

For each media file, the function:

1. Parses the `start_verse_id` and `end_verse_id` from format like "gen-1-1" and "gen-1-31"
2. Splits each ID by "-" and extracts the 3rd element (index 2) as the verse number
3. Calculates the number of verses covered: `endVerse - startVerse + 1`
4. Sums up all covered verses across all media files for the chapter
5. Compares total covered verses to the chapter's `total_verses`

### Availability Status Logic

- **`none`**: No media files found OR total covered verses = 0
- **`partial`**: Total covered verses > 0 AND < total_verses
- **`complete`**: Total covered verses >= total_verses

## UI Changes

### ChapterCard Component

The `ChapterCard` component now displays different icons based on availability:

- **Complete** (`check-circle`): Green checkmark icon
- **Partial** (`warning`): Orange warning icon
- **None** (`cloud-off`): Gray cloud-off icon

### ChapterScreen Modal Logic

The chapter download modal now shows for:

- `none` status: No media files available
- `partial` status: Some media files available but incomplete

Previously, the modal only showed for completely unavailable chapters.

## Type Changes

### New Enum

```typescript
export enum MediaAvailabilityStatus {
  NONE = 'none',
  PARTIAL = 'partial',
  COMPLETE = 'complete',
}
```

### Updated Interfaces

- `ChapterWithMetadata` now uses `mediaAvailability: MediaAvailabilityStatus` instead of `isAvailable: boolean`
- `getChaptersMediaAvailability` returns `Map<string, MediaAvailabilityStatus>` instead of `Map<string, boolean>`

## Benefits

1. **Better User Experience**: Users can see at a glance if a chapter has partial or complete media coverage
2. **More Accurate Information**: Distinguishes between no media files vs. incomplete coverage
3. **Improved Download Decisions**: Users can prioritize downloading chapters with partial coverage to complete them
4. **Visual Clarity**: Different icons make it easy to understand the availability state

## Migration Notes

- Existing code using `isAvailable` boolean should be updated to use `mediaAvailability` enum
- The modal behavior has changed to show for both `none` and `partial` states
- Database queries are more complex but provide more accurate information
