# Downloads Feature

The Downloads feature provides a comprehensive download management system for Bible audio files using Expo FileSystem. It supports resumable downloads, progress tracking, batch operations, and offline storage.

## Features

- ✅ **Resumable Downloads**: Downloads can be paused and resumed
- ✅ **Progress Tracking**: Real-time download progress with visual indicators
- ✅ **Batch Downloads**: Download multiple files simultaneously
- ✅ **Direct URL Downloads**: Download files directly from any URL
- ✅ **Status Management**: Track download status (pending, downloading, completed, failed, paused, cancelled)
- ✅ **File Management**: Delete completed downloads and manage storage
- ✅ **Statistics**: View download statistics and success rates
- ✅ **Filtering**: Filter downloads by status
- ✅ **Error Handling**: Comprehensive error handling with retry mechanisms
- ✅ **Offline Storage**: Files stored locally for offline access

## Architecture

### Components

- **DownloadService**: Core service handling file downloads using Expo FileSystem
- **useDownloads**: React hook for managing download state and operations
- **DownloadsScreen**: Main screen displaying downloads with filtering and management
- **DownloadItem**: Individual download item component with progress and controls
- **DownloadStats**: Statistics display component
- **UrlDownloadForm**: Form component for downloading files directly from URLs

### File Structure

```
src/features/downloads/
├── components/
│   ├── DownloadItem.tsx      # Individual download display
│   ├── DownloadStats.tsx     # Statistics display
│   ├── UrlDownloadForm.tsx   # URL download form
│   └── index.ts
├── hooks/
│   ├── useDownloads.ts       # Main downloads hook
│   └── index.ts
├── screens/
│   ├── DownloadsScreen.tsx   # Main downloads screen
│   └── index.ts
├── services/
│   ├── downloadService.ts    # Core download service
│   └── index.ts
├── types/
│   └── index.ts             # TypeScript types
├── __tests__/
│   ├── downloadService.test.ts
│   └── UrlDownloadForm.test.tsx
├── index.ts                 # Feature exports
└── README.md
```

## Usage

### Basic Download

```typescript
import { useDownloads } from '@/features/downloads/hooks';

const MyComponent = () => {
  const { downloadFile, downloads, isLoading } = useDownloads();

  const handleDownload = async () => {
    try {
      await downloadFile(
        'audio/genesis/chapter1.m4a',
        'genesis_chapter1.m4a',
        {
          onProgress: (progress) => {
            console.log(`Download progress: ${progress.progress * 100}%`);
          },
          onComplete: (item) => {
            console.log('Download completed:', item.fileName);
          },
          onError: (error) => {
            console.error('Download failed:', error);
          },
        }
      );
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <View>
      <Button title="Download Chapter" onPress={handleDownload} />
      {isLoading && <Text>Downloading...</Text>}
    </View>
  );
};
```

### Direct URL Download

```typescript
import { UrlDownloadForm } from '@/features/downloads/components';

const MyComponent = () => {
  return (
    <UrlDownloadForm
      onDownloadStart={() => {
        console.log('Download started');
      }}
      onDownloadComplete={() => {
        console.log('Download completed');
      }}
    />
  );
};
```

### Direct URL Download with Service

```typescript
import { useDownloads } from '@/features/downloads/hooks';
import { downloadService } from '@/features/downloads/services';

const MyComponent = () => {
  const { downloadFile } = useDownloads();

  const handleDirectUrlDownload = async () => {
    try {
      // Step 1: Get signed URLs for external URLs
      const signedUrlsResult = await downloadService.getSignedUrlsForExternalUrls([
        'https://example.com/audio/chapter1.mp3',
        'https://example.com/audio/chapter2.mp3'
      ], 24); // 24 hours expiration

      // Step 2: Download files using signed URLs
      for (const [originalUrl, signedUrl] of Object.entries(signedUrlsResult.urls)) {
        await downloadFile(
          `direct://${signedUrl}`,
          'chapter.mp3',
          {
            onProgress: (progress) => {
              console.log(`Download progress: ${progress.progress * 100}%`);
            },
            onComplete: (item) => {
              console.log('Download completed:', item.fileName);
            },
            onError: (error) => {
              console.error('Download failed:', error);
            },
          }
        );
      }
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  return (
    <View>
      <Button title="Download from URL" onPress={handleDirectUrlDownload} />
    </View>
  );
};
```

### URL Download Workflow

The proper workflow for downloading from URLs follows this pattern:

1. **Get URLs**: User enters one or more URLs
2. **Sign URLs**: The system gets signed URLs from the API (if required)
3. **Download Files**: Files are downloaded using the signed URLs

```typescript
// Step 1: Get signed URLs for external URLs
const signedUrlsResult = await downloadService.getSignedUrlsForExternalUrls(
  ['https://example.com/audio1.mp3', 'https://example.com/audio2.mp3'],
  24
); // 24 hours expiration

// Step 2: Download files using signed URLs
for (const [originalUrl, signedUrl] of Object.entries(signedUrlsResult.urls)) {
  await downloadService.downloadFile(`direct://${signedUrl}`, 'my-audio.mp3');
}
```

### Batch Download

```typescript
const { downloadBatch } = useDownloads();

const handleBatchDownload = async () => {
  const files = [
    {
      filePath: 'audio/genesis/chapter1.m4a',
      fileName: 'genesis_chapter1.m4a',
    },
    {
      filePath: 'audio/genesis/chapter2.m4a',
      fileName: 'genesis_chapter2.m4a',
    },
    {
      filePath: 'audio/genesis/chapter3.m4a',
      fileName: 'genesis_chapter3.m4a',
    },
  ];

  const result = await downloadBatch(files);
  console.log(`Downloaded ${result.successful} of ${result.total} files`);
};
```

### Download Management

```typescript
const {
  pauseDownload,
  resumeDownload,
  cancelDownload,
  deleteDownload,
  clearCompletedDownloads,
  getDownloadsByStatus,
  getDownloadStats,
} = useDownloads();

// Pause a download
await pauseDownload(downloadId);

// Resume a paused download
await resumeDownload(downloadId);

// Cancel a download
await cancelDownload(downloadId);

// Delete a completed download
await deleteDownload(downloadId);

// Clear all completed downloads
await clearCompletedDownloads();

// Get downloads by status
const completedDownloads = getDownloadsByStatus('completed');
const failedDownloads = getDownloadsByStatus('failed');

// Get download statistics
const stats = getDownloadStats();
console.log(
  `Success rate: ${(stats.completedDownloads / stats.totalDownloads) * 100}%`
);
```

## API Reference

### DownloadService

#### Methods

- `getDownloadUrls(filePaths: string[], expirationHours?: number)`: Get signed URLs for downloads
- `downloadFile(filePath: string, fileName: string, options?: DownloadOptions)`: Download a single file
- `downloadBatch(files: Array<{filePath: string, fileName: string}>, options?: DownloadOptions)`: Download multiple files
- `pauseDownload(id: string)`: Pause a download
- `resumeDownload(id: string)`: Resume a paused download
- `cancelDownload(id: string)`: Cancel a download
- `deleteDownload(id: string)`: Delete a completed download
- `clearCompletedDownloads()`: Clear all completed downloads
- `getDownloadStats()`: Get download statistics
- `getAllDownloads()`: Get all downloads
- `getDownloadsByStatus(status: DownloadStatus)`: Get downloads by status

### useDownloads Hook

#### State

- `downloads: DownloadItem[]`: Array of all downloads
- `isLoading: boolean`: Loading state
- `error: string | null`: Error state

#### Methods

- `downloadFile(filePath: string, fileName: string, options?: DownloadOptions)`: Download a single file
- `downloadBatch(files: Array<{filePath: string, fileName: string}>, options?: DownloadOptions)`: Download multiple files
- `pauseDownload(id: string)`: Pause a download
- `resumeDownload(id: string)`: Resume a paused download
- `cancelDownload(id: string)`: Cancel a download
- `deleteDownload(id: string)`: Delete a completed download
- `clearCompletedDownloads()`: Clear all completed downloads
- `getDownloadsByStatus(status: DownloadStatus)`: Get downloads by status
- `getDownloadStats()`: Get download statistics
- `clearError()`: Clear error state
- `refresh()`: Refresh downloads list

### Types

```typescript
interface DownloadItem {
  id: string;
  filePath: string;
  fileName: string;
  localPath: string;
  fileSize?: number;
  status: DownloadStatus;
  progress: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  signedUrl?: string;
  expiresAt?: Date;
}

type DownloadStatus =
  | 'pending'
  | 'downloading'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

interface DownloadProgress {
  bytesWritten: number;
  contentLength: number;
  progress: number;
}

interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  onComplete?: (item: DownloadItem) => void;
  onError?: (error: string) => void;
  priority?: number;
}
```

## Integration

The Downloads feature is integrated into the main app navigation as a tab alongside Bible and Playlists. Users can access it through the HomeTabNavigator.

### Adding to Navigation

The Downloads tab is automatically included in the home navigation:

```typescript
// In HomeTabNavigator.tsx
const tabs: HomeTab[] = ['Bible', 'Playlists', 'Downloads'];

// In HomeContainer.tsx
case 'Downloads':
  return <DownloadsScreen />;
```

## Storage

Downloads are stored in the app's document directory under a `downloads/` folder:

```
FileSystem.documentDirectory + 'downloads/' + fileName
```

Files are automatically organized and can be accessed offline once downloaded.

## Error Handling

The feature includes comprehensive error handling:

- Network errors with retry mechanisms
- Authentication errors
- File system errors
- Invalid URLs
- Storage space issues

Errors are displayed to users with appropriate messaging and recovery options.

## Testing

Run tests for the downloads feature:

```bash
npm test -- --testPathPattern=downloads
```

## Dependencies

- `expo-file-system`: File system operations
- `@supabase/supabase-js`: Authentication and API calls
- React Native components for UI

## Future Enhancements

- Background download support
- Download queue management
- Network condition awareness
- Automatic retry with exponential backoff
- Download scheduling
- Cloud sync for download preferences
