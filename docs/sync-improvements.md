# Sync Service Improvements

This document describes the improvements made to the sync layer to support anonymous access and background synchronization.

## Key Features Added

### 1. Anonymous Access Support

- **Enhanced Error Handling**: The sync service now gracefully handles authentication errors and continues with anonymous access
- **RLS Policy Support**: Works with Supabase Row Level Security policies that allow anonymous access to Bible data
- **Automatic Fallback**: If authentication fails, the service automatically retries with anonymous access

### 2. Background Sync with Change Detection

- **Expo TaskManager Integration**: Uses Expo's background fetch to sync data when the app is in the background
- **Smart Change Detection**: Only syncs when there are actual changes in the remote database
- **Efficient Polling**: Checks for changes before initiating sync to avoid unnecessary operations

### 3. New Services and Hooks

#### BackgroundSyncService

- Manages background sync registration and execution
- Implements change detection logic
- Handles background task lifecycle

#### useBackgroundSync Hook

- React hook for managing background sync state
- Provides change detection status
- Offers controls for enabling/disabling background sync

## Usage

### Basic Usage

```typescript
// In your app component
import { useBackgroundSync } from '@/shared/hooks/useBackgroundSync';

function MyComponent() {
  const {
    hasRemoteChanges,
    isEnabled,
    checkForRemoteChanges,
    enableBackgroundSync,
    disableBackgroundSync,
  } = useBackgroundSync();

  // The hook automatically initializes background sync
  // and checks for changes periodically
}
```

### Manual Sync with Change Detection

```typescript
import { syncService } from '@/shared/services/database/SyncService';

// Check if there are changes before syncing
const hasChanges = await syncService.hasRemoteChanges('books');

if (hasChanges) {
  // Only sync if there are actual changes
  await syncService.syncAll();
}
```

### Background Sync Management

```typescript
import { backgroundSyncService } from '@/shared/services/database/BackgroundSyncService';

// Register background sync
await backgroundSyncService.registerBackgroundFetch();

// Check for changes
const hasChanges = await backgroundSyncService.checkForChanges();

// Unregister background sync
await backgroundSyncService.unregisterBackgroundFetch();
```

## Configuration

### App Configuration

The following plugins have been added to `app.json`:

- `expo-background-fetch`
- `expo-task-manager`

### iOS Background Modes

Background modes have been enabled for iOS:

- `background-fetch`
- `background-processing`

### Background Sync Settings

- **Minimum Interval**: 15 minutes
- **Batch Size**: 50 records (smaller for background operations)
- **Change Detection**: Queries only the ID and updated_at fields for efficiency

## Benefits

1. **Improved Performance**: Only syncs when necessary, reducing battery usage and network traffic
2. **Anonymous Access**: Works without user authentication, allowing Bible data access for all users
3. **Better UX**: Shows "Updates available" status when changes are detected
4. **Automatic Updates**: Background sync ensures data stays current without user intervention
5. **Offline-First**: Maintains offline-first architecture while providing seamless updates

## Error Handling

The improved sync service includes:

- Graceful authentication error handling
- Automatic retry with anonymous access
- Proper error logging and user feedback
- Fallback to manual sync if background sync fails

## Testing

A test suite has been created for the BackgroundSyncService to ensure reliability:

- Tests change detection logic
- Validates error handling
- Confirms proper singleton behavior

## Migration from Previous Version

The improvements are backward compatible. Existing sync functionality continues to work, with the following additions:

- Enhanced error handling for anonymous access
- New background sync capabilities
- Improved change detection

No breaking changes have been made to the existing API.
