# Media File Integration for Downloads

This document explains how downloads are automatically saved to the media file table when they complete.

## Overview

When downloads complete, they are automatically saved to the `media_files` table in the local database. This ensures that downloaded audio files are properly tracked and can be used by the media player and other features in the app.

## How It Works

### 1. Download Completion Flow

The media file integration works through the following flow:

1. **Download Initiation**: A download is started using either:
   - `useDownloads` hook's `downloadFile` method
   - Background download service
   - Direct download service calls

2. **Download Progress**: The download progresses and updates are tracked

3. **Download Completion**: When a download completes:
   - The file is saved to the local file system
   - The download status is updated to 'completed'
   - **Media file integration is triggered** (if enabled)

4. **Media File Creation**: The completed download is automatically added to the `media_files` table with:
   - File metadata from the original search result
   - Local file path and size information
   - Chapter and verse information
   - Language and version details

5. **Automatic Verses Sync**: After media file creation, the system automatically searches for corresponding media file verses data:
   - Compares the media file's `uuid` with `media_file_id` in the `media_files_verses` table
   - Downloads any available verses timing data from the remote database
   - Stores the verses data locally for offline playback

### 2. Integration Points

#### useDownloads Hook

The `useDownloads` hook now includes media file integration options:

```typescript
const { downloadFile } = useDownloads();

await downloadFile(filePath, fileName, {
  // Standard download options
  onProgress: progress => {
    /* ... */
  },
  onComplete: item => {
    /* ... */
  },
  onError: error => {
    /* ... */
  },

  // Media file integration options
  addToMediaFiles: true,
  originalSearchResult: searchResult,
  mediaFileOptions: {
    chapterId: 'chapter_1',
    mediaType: 'audio',
    uploadStatus: 'completed',
    publishStatus: 'published',
    checkStatus: 'checked',
    version: 1,
    syncVersesData: true, // Automatically sync verses data after download (default: true)
  },
});
```

#### Background Download Service

The background download service automatically handles media file integration when metadata is provided:

```typescript
await backgroundDownloadService.addToBackgroundQueue(filePath, fileName, {
  addToMediaFiles: true,
  originalSearchResults: [searchResult],
  mediaFileOptions: {
    chapterId: 'chapter_1',
    mediaType: 'audio',
  },
});
```

#### Chapter Download Modal

The `ChapterDownloadModal` component automatically enables media file integration for chapter downloads:

```typescript
<ChapterDownloadModal
  visible={true}
  book={book}
  chapterTitle="Chapter 1"
  chapterId="chapter_1"
  onClose={() => {}}
/>
```

### 3. Automatic Verses Data Sync

When a download completes and is added to the media files table, the system automatically searches for corresponding verses timing data:

#### How Verses Sync Works

1. **Media File Creation**: After a download completes, the media file is created in the local `media_files` table
2. **Verses Search**: The system uses the media file's `id` (uuid) to search for matching records in the remote `media_files_verses` table
3. **Data Download**: If verses data is found, it's downloaded and stored locally
4. **Offline Access**: The verses timing data is now available for offline playback and navigation

#### Verses Data Structure

The verses data includes timing information for each verse in the audio file:

```typescript
interface LocalMediaFileVerse {
  id: string;
  media_file_id: string; // References the media file's uuid
  verse_id: string; // References the verse in the bible
  start_time_seconds: number; // When this verse starts in the audio
  created_at: string;
  updated_at: string;
  synced_at: string;
}
```

#### Controlling Verses Sync

You can control whether verses sync happens automatically:

```typescript
// Enable verses sync (default)
mediaFileOptions: {
  syncVersesData: true,
}

// Disable verses sync
mediaFileOptions: {
  syncVersesData: false,
}
```

### 4. Media File Data Structure

When a download completes, the following data is saved to the `media_files` table:

```typescript
interface LocalMediaFile {
  id: string; // Unique identifier (from search result)
  language_entity_id: string; // Language entity ID
  sequence_id: string; // Sequence identifier
  media_type: string; // 'audio', 'video', etc.
  local_path: string; // Local file path
  remote_path: string; // Original remote path
  file_size: number; // File size in bytes
  duration_seconds: number; // Duration in seconds
  upload_status: string; // 'completed', 'pending', etc.
  publish_status: string; // 'published', 'draft', etc.
  check_status: string; // 'checked', 'unchecked', etc.
  version: number; // Version number
  chapter_id: string; // Associated chapter ID
  verses: string; // JSON string of verse information
  created_at: string; // Creation timestamp
  updated_at: string; // Last update timestamp
  deleted_at: string | null; // Deletion timestamp (if deleted)
}
```

## Usage Examples

### 1. Basic Download with Media File Integration

```typescript
import { useDownloads } from '../hooks/useDownloads';

const MyComponent = () => {
  const { downloadFile } = useDownloads();

  const handleDownload = async () => {
    const searchResult = {
      id: 'audio_123',
      language_entity_id: 'lang_456',
      sequence_id: 'seq_789',
      media_type: 'audio',
      file_size: 1024000,
      duration_seconds: 120,
      chapter_id: 'chapter_1',
      start_verse_id: 'chapter_1_1',
      end_verse_id: 'chapter_1_10',
    };

    await downloadFile('https://example.com/audio.mp3', 'chapter_1.mp3', {
      addToMediaFiles: true,
      originalSearchResult: searchResult,
      mediaFileOptions: {
        chapterId: 'chapter_1',
        mediaType: 'audio',
      },
    });
  };

  return <Button onPress={handleDownload} title="Download" />;
};
```

### 2. Batch Downloads with Media File Integration

```typescript
const { downloadBatch } = useDownloads();

const handleBatchDownload = async () => {
  const files = [
    { filePath: 'https://example.com/audio1.mp3', fileName: 'chapter_1_1.mp3' },
    { filePath: 'https://example.com/audio2.mp3', fileName: 'chapter_1_2.mp3' },
  ];

  const searchResults = [
    { id: 'audio_1', language_entity_id: 'lang_1' /* ... */ },
    { id: 'audio_2', language_entity_id: 'lang_1' /* ... */ },
  ];

  await downloadBatch(files, {
    addToMediaFiles: true,
    originalSearchResults: searchResults,
    mediaFileOptions: {
      chapterId: 'chapter_1',
      mediaType: 'audio',
    },
  });
};
```

### 3. URL Download Form with Media File Integration

```typescript
<UrlDownloadForm
  onDownloadComplete={() => console.log('Download completed')}
  addToMediaFiles={true}
  originalSearchResults={[searchResult]}
  mediaFileOptions={{
    chapterId: 'chapter_1',
    mediaType: 'audio',
  }}
/>
```

## Error Handling

The media file integration includes comprehensive error handling:

1. **Database Connection Errors**: If the database is not available, the download still completes but media file creation fails
2. **Missing Data**: If search result data is incomplete, fallback values are generated
3. **Duplicate Files**: If a media file already exists, it's updated with new local path and file size
4. **Validation Errors**: Invalid media file data is logged and the operation fails gracefully

## Testing

The media file integration is thoroughly tested with the following test cases:

- ✅ Single download completion saves to media files table
- ✅ Batch download completion saves multiple files
- ✅ Existing media files are updated correctly
- ✅ Missing search result data is handled gracefully
- ✅ Error conditions are handled properly

Run the tests with:

```bash
npm test -- --testPathPattern=mediaFileIntegration.test.ts
```

## Configuration

### Enabling Media File Integration

Media file integration is enabled by default for:

- Chapter downloads via `ChapterDownloadModal`
- Background downloads with appropriate metadata
- Manual downloads with `addToMediaFiles: true`

### Disabling Media File Integration

To disable media file integration for a specific download:

```typescript
await downloadFile(filePath, fileName, {
  addToMediaFiles: false, // Disable media file integration
  // ... other options
});
```

## Troubleshooting

### Common Issues

1. **Downloads not appearing in media files table**
   - Check that `addToMediaFiles` is set to `true`
   - Verify that `originalSearchResult` is provided
   - Check database connection and table existence

2. **Media file creation fails**
   - Check logs for validation errors
   - Verify search result data structure
   - Ensure database is properly initialized

3. **Duplicate media files**
   - The system automatically handles duplicates by updating existing records
   - Check that the `id` field is consistent across downloads

### Debugging

Enable debug logging to troubleshoot media file integration:

```typescript
import { logger } from '@/shared/utils/logger';

// Debug logs will show:
// - Media file creation attempts
// - Validation results
// - Database operations
// - Error details
```

## Future Enhancements

Planned improvements to the media file integration:

1. **Automatic Metadata Extraction**: Extract metadata from audio files
2. **Batch Processing Optimization**: Improve performance for large batch downloads
3. **Sync Integration**: Integrate with cloud sync for media files
4. **Advanced Validation**: More sophisticated validation rules
5. **Media File Relationships**: Support for related media files (e.g., chapters in a book)
