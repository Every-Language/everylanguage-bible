# Sync Architecture

## Overview

The sync system has been optimized and reorganized for better maintainability and performance, particularly for bible content which rarely changes.

## Structure

```
src/shared/services/sync/
├── types.ts                     # Common sync types and interfaces
├── index.ts                     # Main exports
└── bible/
    └── BibleSyncService.ts       # Optimized for rarely-changing bible content
```

## Services

### BibleSyncService

**Purpose**: Handles syncing of bible content (books, chapters, verses) which changes very rarely.

**Optimizations**:

- **Version-based syncing**: Uses content versions instead of just timestamps
- **Update checking**: `needsUpdate()` method checks for changes before syncing
- **Caching**: Caches version check results for 1 hour to reduce API calls
- **Reduced frequency**: Background checks every 4 hours instead of 15 minutes
- **Conservative approach**: Only syncs when actually needed
- **Smaller batches**: Uses 500-record batches for mobile optimization

**Key Methods**:

- `needsUpdate()`: Check if content needs updating without syncing
- `syncAll()`: Smart sync that checks for updates first
- `forceFullSync()`: Force complete resync when needed
- `hasRemoteChanges()`: Check specific table for changes

### Future: UserDataSyncService

**Purpose**: Will handle frequently changing user data (preferences, bookmarks, etc.)

**Strategy**: Will use timestamp-based syncing with higher frequency checks.

## Context Integration

### SyncContext

Updated to use `BibleSyncService` with optimizations:

- Checks for updates on app start without forcing sync
- Shows "up to date" status when no sync needed
- Adds `checkForUpdates()` method for manual checks

### BackgroundSyncService

**Location**: `src/shared/services/sync/BackgroundSyncService.ts`

Optimized for bible content:

- Checks every 4 hours instead of 15 minutes
- Rate limits checks (15-minute cooldown)
- Uses smaller batch sizes (100 records) for background sync
- Only syncs when `needsUpdate()` returns true

## Benefits

1. **Reduced API calls**: Version checking and caching prevent unnecessary requests
2. **Better UX**: Users see "up to date" status instead of syncing every time
3. **Battery efficiency**: Less frequent background checks
4. **Bandwidth savings**: Only syncs when actually needed
5. **Scalability**: Ready for adding user data sync with different strategies
6. **Maintainability**: Clear separation between bible content and future user data

## Usage

```typescript
import { bibleSync } from '@/shared/services/sync';

// Check for updates without syncing
const updateCheck = await bibleSync.needsUpdate();
if (updateCheck.needsUpdate) {
  console.log('Updates available for:', updateCheck.tables);
}

// Smart sync (checks first, then syncs if needed)
await bibleSync.syncAll();

// Force complete resync
await bibleSync.forceFullSync();
```

## Migration

The old `SyncService` has been replaced with `BibleSyncService`. All imports have been updated automatically. The API is largely compatible, with these improvements:

- More intelligent syncing behavior
- Better performance for rarely-changing data
- Clearer separation of concerns
- Ready for future user data sync service
