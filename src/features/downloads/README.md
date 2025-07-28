# Downloads Feature

**IMPORTANT: This download system ALWAYS uses background downloads and NEVER performs direct downloads.**

All download operations go through the background queue system for consistency, reliability, and proper state management. This ensures:

- Resumable downloads using `FileSystem.createDownloadResumable`
- Background processing with Expo TaskManager
- Persistent storage with AsyncStorage
- Queue management with priority-based processing
- Retry logic with exponential backoff
- Media file integration

This feature provides comprehensive download management for the Bible app, including background downloads, progress tracking, and media file integration.

## Features

- **Background Downloads**: Downloads continue even when the app is in the background
- **Progress Tracking**: Real-time progress updates for all downloads
- **Retry Logic**: Automatic retry with exponential backoff for failed downloads
- **Media File Integration**: Automatic integration with local media files database
- **Batch Operations**: Support for downloading multiple files at once
- **Queue Management**: Priority-based download queue with pause/resume functionality

## Continue Downloads Functionality

The "Continue Download" feature has been enhanced to ensure **ALL** pending and failed downloads are processed:

### What it does:

1. **Retries ALL failed downloads**: Regardless of previous retry count, all failed downloads are retried
2. **Processes ALL pending downloads**: All pending and paused downloads are processed, not just a limited batch
3. **Resets retry counts**: Downloads that exceeded retry limits get a fresh start
4. **Batch processing**: Downloads are processed in batches to respect concurrent limits while ensuring all are handled

### Key improvements:

- **Complete processing**: No downloads are left behind due to batch size limits
- **Fresh retry attempts**: Failed downloads get their retry count reset for a new attempt
- **Comprehensive logging**: Detailed logs show exactly what was processed
- **Progress tracking**: Real-time updates on batch processing progress

### Usage:

```typescript
// Get summary of what will be processed
const summary = downloadService.getContinueDownloadsSummary();
console.log(
  `Will process ${summary.totalCount} downloads (${summary.pendingCount} pending, ${summary.failedCount} failed)`
);

// Continue all downloads
const result = await downloadService.continueDownloads();
console.log(
  `Processed ${result.processedCount} downloads (${result.successCount} succeeded, ${result.failedCount} failed, ${result.retriedCount} retried)`
);
```

### UI Integration:

The UI automatically shows:

- Total count of downloads to be processed
- Breakdown of pending vs failed downloads
- Real-time progress updates
- Clear indication of what will happen when "Continue Download" is clicked

## Unified Download Service

The `DownloadService` manages all download operations with the following key methods:

### Core Methods

#### `continueDownloads()`

Processes ALL pending and failed downloads:

- Retries all failed downloads (resets retry counts if needed)
- Processes all pending and paused downloads
- Returns comprehensive statistics

#### `processAllPendingDownloads()`

New method that processes ALL pending downloads in batches:

- Respects concurrent download limits
- Processes downloads in batches of `maxConcurrentDownloads`
- Ensures no downloads are left unprocessed

#### `retryFailedDownloads()`

Enhanced to retry ALL failed downloads:

- Resets retry counts for downloads that exceeded limits
- Adds all failed downloads back to the queue
- Provides fresh retry attempts

### Configuration

```typescript
// config.ts
export const downloadServiceConfig: DownloadServiceConfig = {
  maxConcurrentDownloads: 3, // Process 3 downloads at once
  retryAttempts: 3, // Default retry limit
  retryDelay: 1000, // Base delay between retries
};
```

## Persistent Download Store

The `PersistentDownloadStore` provides persistent storage for downloads with enhanced retry management:

### New Methods

#### `resetRetryCount(id: string)`

Resets the retry count for a specific download:

- Sets retry count to 0
- Clears last retry time
- Useful for giving failed downloads a fresh start

### Enhanced Methods

#### `updateDownload(id: string, updates: Partial<PersistentDownloadItem>)`

Enhanced to handle retry count resets and status updates.

## Usage Examples

### Basic Download

```typescript
import { downloadService } from '@/features/downloads/services';

// Download a single file
const downloadId = await downloadService.addToQueue(
  'https://example.com/file.mp3',
  'chapter_1.mp3',
  {
    priority: 1,
    addToMediaFiles: true,
    mediaFileOptions: {
      chapterId: 'genesis_1',
      mediaType: 'audio',
    },
  }
);
```

### Batch Download

```typescript
// Download multiple files
const files = [
  { filePath: 'https://example.com/file1.mp3', fileName: 'chapter_1.mp3' },
  { filePath: 'https://example.com/file2.mp3', fileName: 'chapter_2.mp3' },
];

const downloadIds = await downloadService.addBatchToQueue(files, {
  batchId: 'genesis_chapters',
  addToMediaFiles: true,
  mediaFileOptions: {
    chapterId: 'genesis_1',
    mediaType: 'audio',
  },
});
```

### Continue Downloads

```typescript
// Get summary of what will be processed
const summary = downloadService.getContinueDownloadsSummary();
console.log(
  `Will process ${summary.totalCount} downloads (${summary.pendingCount} pending, ${summary.failedCount} failed)`
);

// Continue all downloads
const result = await downloadService.continueDownloads();
console.log(
  `Processed ${result.processedCount} downloads (${result.successCount} succeeded, ${result.failedCount} failed, ${result.retriedCount} retried)`
);
```

### React Hook Usage

```typescript
import { useDownloads } from '@/features/downloads/hooks/useDownloads';

const { downloadFile, downloads, stats } = useDownloads();

// Download with media file integration
await downloadFile('https://example.com/file.mp3', 'chapter_1.mp3', {
  addToMediaFiles: true,
  originalSearchResult: mediaFileData,
  mediaFileOptions: {
    chapterId: 'genesis_1',
    mediaType: 'audio',
  },
});
```

## Architecture

The download system has been consolidated into a single, unified service that provides:

- **Resumable downloads** using `FileSystem.createDownloadResumable`
- **Background processing** with Expo TaskManager
- **Persistent storage** with AsyncStorage
- **Queue management** with priority-based processing
- **Retry logic** with exponential backoff
- **Media file integration** via `DownloadToMediaService`
- **Compatibility** with old API methods

This consolidation eliminates the complexity of managing multiple download systems and provides a single source of truth for all download operations.
