# Download Service

A comprehensive file download service for React Native that handles downloading files from URLs and saving them locally with progress tracking, pause/resume functionality, and file management.

## Features

- ✅ Download files from URLs with progress tracking
- ✅ Pause and resume downloads
- ✅ Cancel active downloads
- ✅ File management (list, delete, get info)
- ✅ Automatic file type detection
- ✅ Duplicate file handling
- ✅ Error handling and retry logic
- ✅ React hook for easy integration
- ✅ TypeScript support

## Installation

The service uses `expo-file-system` which is already included in your project dependencies.

## Quick Start

### Using the Hook (Recommended)

```tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useDownload } from '@/shared/hooks/useDownload';

const DownloadComponent: React.FC = () => {
  const { isDownloading, progress, error, downloadFile, listDownloadedFiles } =
    useDownload();

  const handleDownload = async () => {
    const result = await downloadFile('https://example.com/file.pdf');

    if (result.success) {
      console.log('File downloaded:', result.details?.localUri);
    } else {
      console.error('Download failed:', result.error);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleDownload}>
        <Text>Download File</Text>
      </TouchableOpacity>

      {isDownloading && <Text>Progress: {progress.toFixed(1)}%</Text>}

      {error && <Text>Error: {error}</Text>}
    </View>
  );
};
```

### Using the Service Directly

```tsx
import DownloadService from '@/shared/services/download/DownloadService';

const downloadService = DownloadService.getInstance();

// Download a file
const result = await downloadService.downloadFile(
  'https://example.com/file.pdf',
  'my-file.pdf',
  {
    onProgress: progress => {
      console.log(`Download progress: ${progress.progress}%`);
    },
    timeout: 30000, // 30 seconds
    headers: {
      Authorization: 'Bearer token',
    },
  }
);

if (result.success) {
  console.log('File saved to:', result.details?.localUri);
}
```

## API Reference

### DownloadService

#### Methods

##### `downloadFile(url, fileName?, options?)`

Downloads a file from a URL and saves it locally.

**Parameters:**

- `url` (string): The URL to download from
- `fileName` (string, optional): Custom filename. If not provided, extracts from URL
- `options` (DownloadOptions, optional): Download configuration

**Returns:** `Promise<DownloadResult>`

**Example:**

```tsx
const result = await downloadService.downloadFile(
  'https://example.com/audio.mp3',
  'bible-chapter-1.mp3',
  {
    onProgress: progress => console.log(`${progress.progress}%`),
    timeout: 60000,
  }
);
```

##### `pauseDownload(url)`

Pauses an active download.

**Parameters:**

- `url` (string): The URL of the download to pause

**Returns:** `Promise<boolean>`

##### `resumeDownload(url, options?)`

Resumes a paused download.

**Parameters:**

- `url` (string): The URL of the download to resume
- `options` (DownloadOptions, optional): Download configuration

**Returns:** `Promise<DownloadResult>`

##### `cancelDownload(url)`

Cancels an active download.

**Parameters:**

- `url` (string): The URL of the download to cancel

**Returns:** `Promise<boolean>`

##### `getFileInfo(localUri)`

Gets information about a downloaded file.

**Parameters:**

- `localUri` (string): The local URI of the file

**Returns:** `Promise<DownloadDetails | null>`

##### `listDownloadedFiles()`

Lists all downloaded files.

**Returns:** `Promise<DownloadDetails[]>`

##### `deleteFile(localUri)`

Deletes a downloaded file.

**Parameters:**

- `localUri` (string): The local URI of the file to delete

**Returns:** `Promise<boolean>`

##### `clearAllDownloads()`

Deletes all downloaded files.

**Returns:** `Promise<boolean>`

##### `getTotalDownloadSize()`

Gets the total size of all downloaded files.

**Returns:** `Promise<number>`

##### `isDownloadActive(url)`

Checks if a download is active.

**Parameters:**

- `url` (string): The URL to check

**Returns:** `boolean`

##### `getActiveDownloads()`

Gets all active download URLs.

**Returns:** `string[]`

### useDownload Hook

The hook provides the same functionality as the service with React state management.

#### State

```tsx
interface UseDownloadState {
  isDownloading: boolean;
  progress: number;
  currentDownload: string | null;
  error: string | null;
}
```

#### Methods

All methods from the service are available, plus:

- `resetError()`: Clears the current error state

## Types

### DownloadProgress

```tsx
interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number; // 0-100
}
```

### DownloadDetails

```tsx
interface DownloadDetails {
  localUri: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  downloadDate: Date;
  originalUrl: string;
}
```

### DownloadOptions

```tsx
interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  timeout?: number; // in milliseconds
  headers?: Record<string, string>;
}
```

### DownloadResult

```tsx
interface DownloadResult {
  success: boolean;
  details?: DownloadDetails;
  error?: string;
}
```

## Advanced Usage

### Download with Custom Headers

```tsx
const result = await downloadFile('https://api.example.com/file', undefined, {
  headers: {
    Authorization: 'Bearer your-token',
    'User-Agent': 'BibleApp/1.0',
  },
});
```

### Handle Large Files

```tsx
const result = await downloadFile(
  'https://example.com/large-file.mp4',
  undefined,
  {
    onProgress: progress => {
      if (progress.progress % 10 === 0) {
        console.log(`Downloaded ${progress.progress}%`);
      }
    },
    timeout: 300000, // 5 minutes
  }
);
```

### File Management

```tsx
// List all downloaded files
const files = await listDownloadedFiles();
console.log('Downloaded files:', files);

// Get total storage used
const totalSize = await getTotalDownloadSize();
console.log('Total size:', formatFileSize(totalSize));

// Delete specific file
const success = await deleteFile(files[0].localUri);

// Clear all downloads
const cleared = await clearAllDownloads();
```

### Pause/Resume Downloads

```tsx
// Start download
const downloadPromise = downloadFile('https://example.com/file.mp3');

// Pause download (in another function/component)
const paused = await pauseDownload('https://example.com/file.mp3');

// Resume download
const result = await resumeDownload('https://example.com/file.mp3');
```

## Error Handling

The service provides comprehensive error handling:

```tsx
const result = await downloadFile('https://example.com/file.pdf');

if (!result.success) {
  console.error('Download failed:', result.error);
  // Handle error appropriately
} else {
  console.log('Download successful:', result.details);
}
```

Common error scenarios:

- Network connectivity issues
- Invalid URLs
- File system permission errors
- Timeout errors
- Server errors

## File Storage

Files are stored in the app's document directory under a `downloads/` folder:

- **iOS**: `Documents/downloads/`
- **Android**: `files/downloads/`

The service automatically creates the downloads directory if it doesn't exist.

## Best Practices

1. **Always check for existing files** before downloading to avoid duplicates
2. **Handle errors gracefully** and provide user feedback
3. **Use appropriate timeouts** for large files
4. **Monitor storage usage** and clean up old files
5. **Provide progress feedback** for better user experience
6. **Handle network connectivity** changes appropriately

## Example Component

See `DownloadExample.tsx` for a complete example component that demonstrates all features of the download service.

## Troubleshooting

### Common Issues

1. **Download fails immediately**
   - Check network connectivity
   - Verify URL is accessible
   - Check file system permissions

2. **Progress not updating**
   - Ensure `onProgress` callback is provided
   - Check for JavaScript errors in console

3. **Files not found after download**
   - Verify download completed successfully
   - Check file system permissions
   - Ensure sufficient storage space

4. **Pause/Resume not working**
   - Only works with active downloads
   - Resume must be called with same URL
   - Check for network interruptions

### Debug Mode

Enable debug logging by checking the console for detailed error messages and progress updates.
