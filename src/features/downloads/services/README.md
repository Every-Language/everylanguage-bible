# Download Service - Refactored Architecture

## Overview

The download service has been refactored into a clean, modular architecture with clear separation of concerns. This makes the code more maintainable, testable, and easier to understand.

## Architecture

### Core Components

#### 1. **DownloadService** (`downloadService.ts`)

- **Purpose**: Main public API for download operations
- **Responsibilities**:
  - Provides a clean interface for all download operations
  - Delegates to specialized services
  - Handles high-level business logic
  - Exposes utility methods for statistics and status

#### 2. **DownloadManager** (`downloadManager.ts`)

- **Purpose**: Core download state management and file operations
- **Responsibilities**:
  - Manages download state (pending, downloading, completed, etc.)
  - Handles file system operations
  - Manages concurrent downloads
  - Tracks download progress
  - Handles pause/resume/cancel operations

#### 3. **UrlSigningService** (`urlSigningService.ts`)

- **Purpose**: Handles secure URL generation for downloads
- **Responsibilities**:
  - Generates signed URLs for secure downloads
  - Manages URL expiration
  - Handles authentication with Supabase
  - Validates URL validity

#### 4. **Configuration** (`config.ts`)

- **Purpose**: Centralized configuration management
- **Responsibilities**:
  - Defines service configuration
  - Environment-specific overrides
  - Centralized constants

#### 5. **Types** (`types.ts`)

- **Purpose**: Type definitions for the download service
- **Responsibilities**:
  - Defines all interfaces and types
  - Ensures type safety across the service

## Usage

### Basic Download

```typescript
import { downloadService } from '@/features/downloads/services';

// Download a single file
const download = await downloadService.downloadFile(
  'https://example.com/file.mp3',
  'audio.mp3',
  {
    onProgress: progress => {
      console.log(`Download progress: ${progress.progress * 100}%`);
    },
    onComplete: item => {
      console.log('Download completed:', item.localPath);
    },
    onError: error => {
      console.error('Download failed:', error);
    },
  }
);
```

### Batch Downloads

```typescript
// Download multiple files
const result = await downloadService.downloadBatch([
  { filePath: 'https://example.com/file1.mp3', fileName: 'audio1.mp3' },
  { filePath: 'https://example.com/file2.mp3', fileName: 'audio2.mp3' },
]);

console.log(`Downloaded ${result.successful} of ${result.total} files`);
```

### Download Management

```typescript
// Pause a download
await downloadService.pauseDownload(downloadId);

// Resume a paused download
await downloadService.resumeDownload(downloadId);

// Cancel a download
await downloadService.cancelDownload(downloadId);

// Delete a download and its file
await downloadService.deleteDownload(downloadId);
```

### Statistics and Queries

```typescript
// Get download statistics
const stats = downloadService.getDownloadStats();
console.log(`Total downloads: ${stats.totalDownloads}`);

// Get downloads by status
const activeDownloads = downloadService.getDownloadsByStatus('downloading');
const completedDownloads = downloadService.getDownloadsByStatus('completed');

// Check if download is active
const isActive = downloadService.isDownloadActive(downloadId);

// Get counts
const activeCount = downloadService.getActiveDownloadsCount();
const completedCount = downloadService.getCompletedDownloadsCount();
```

## React Hook Usage

```typescript
import { useDownloads } from '@/features/downloads/hooks';

const MyComponent = () => {
  const {
    downloads,
    isLoading,
    error,
    stats,
    downloadFile,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
    getDownloadsByStatus,
    refreshDownloads
  } = useDownloads();

  const handleDownload = async () => {
    try {
      await downloadFile('https://example.com/file.mp3', 'audio.mp3');
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleDownload} disabled={isLoading}>
        Download File
      </button>

      {downloads.map(download => (
        <div key={download.id}>
          <span>{download.fileName}</span>
          <span>{download.status}</span>
          <span>{download.progress * 100}%</span>

          {download.status === 'downloading' && (
            <button onClick={() => pauseDownload(download.id)}>
              Pause
            </button>
          )}

          {download.status === 'paused' && (
            <button onClick={() => resumeDownload(download.id)}>
              Resume
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
```

## Configuration

The service can be configured through the `downloadServiceConfig`:

```typescript
import { downloadServiceConfig } from '@/features/downloads/services';

// Access configuration
console.log(downloadServiceConfig.maxConcurrentDownloads);
console.log(downloadServiceConfig.downloadsDirectory);

// Get configuration from service
const config = downloadService.getConfig();
```

## Error Handling

The service provides comprehensive error handling:

```typescript
try {
  await downloadService.downloadFile(filePath, fileName);
} catch (error) {
  // Error is properly typed and includes detailed information
  console.error('Download failed:', error.message);

  // Check specific error types
  if (error.message.includes('Authentication required')) {
    // Handle authentication error
  } else if (error.message.includes('Failed to get signed URL')) {
    // Handle URL signing error
  }
}
```

## Benefits of the Refactored Architecture

### 1. **Separation of Concerns**

- Each service has a single, well-defined responsibility
- Easy to understand and maintain
- Clear boundaries between different functionalities

### 2. **Modularity**

- Services can be used independently
- Easy to test individual components
- Simple to extend or modify specific functionality

### 3. **Type Safety**

- Comprehensive TypeScript types
- Better IDE support and autocomplete
- Reduced runtime errors

### 4. **Maintainability**

- Clean, readable code structure
- Consistent error handling
- Well-documented interfaces

### 5. **Testability**

- Each service can be unit tested independently
- Easy to mock dependencies
- Clear input/output contracts

### 6. **Extensibility**

- Easy to add new features
- Simple to modify existing functionality
- Clear extension points

## Migration from Old Service

The refactored service maintains backward compatibility:

```typescript
// Old usage (still works)
import { downloadService } from '@/features/downloads/services';

// New usage (recommended)
import { downloadService } from '@/features/downloads/services';
import { useDownloads } from '@/features/downloads/hooks';
```

All existing functionality is preserved, but now with a cleaner, more maintainable architecture.
