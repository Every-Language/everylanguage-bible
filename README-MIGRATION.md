# Bible Feature Migration Guide: LocalDataService → PowerSync

This guide outlines the migration process from your custom SQLite LocalDataService to PowerSync for the Bible feature.

## Overview

Your PowerSync implementation is excellent and well-structured. The migration involves:

1. **Gradual transition** from LocalDataService to PowerSync-based services
2. **Maintaining backward compatibility** during the migration
3. **Performance optimization** for slower devices
4. **Proper error handling and fallbacks**

## Current Implementation Status

### ✅ Completed

- **PowerSync Infrastructure**: Well-designed connection manager, connector, and system
- **PowerSync Service**: Comprehensive `PowerSyncBibleService` with optimized queries
- **TanStack Query Integration**: Enhanced hooks for PowerSync data access
- **Migration Utilities**: Validation, fallback, and data comparison tools
- **Type Safety**: PowerSync schema types and interfaces

### 🔄 In Progress

- **Feature Migration**: Transitioning bible screens and components
- **Testing**: Validating data consistency between systems

## Migration Architecture

```typescript
// Before (Legacy)
LocalDataService → TanStack Query → UI Components

// After (PowerSync)
PowerSyncBibleService → TanStack Query → UI Components
                ↕️
        PowerSyncSystem → PowerSyncConnector → Supabase Backend
```

## File Structure (New)

```
src/features/bible/
├── services/
│   ├── bibleService.ts           # Legacy (to be deprecated)
│   ├── powerSyncBibleService.ts  # New PowerSync service ✅
│   └── index.ts                  # Exports both during migration
├── hooks/
│   ├── useBibleQueries.ts        # Legacy hooks
│   ├── usePowerSyncBibleQueries.ts # New PowerSync hooks ✅
│   └── index.ts                  # Exports both with prefixes
├── utils/
│   ├── migrationUtils.ts         # Migration helpers ✅
│   └── index.ts
└── types/
    └── index.ts                  # Enhanced with PowerSync types
```

## Step-by-Step Migration

### Phase 1: Infrastructure Setup ✅ COMPLETED

Your PowerSync infrastructure is ready:

- PowerSyncSystem with OP-SQLite
- PowerSyncConnector with Supabase integration
- PowerSyncConnectionManager with robust retry logic
- Sync rules properly configured

### Phase 2: Service Layer Migration ✅ COMPLETED

Created `PowerSyncBibleService` with:

- Comprehensive Bible data access methods
- Optimized queries for performance
- Proper error handling and logging
- Type safety with PowerSync schema

### Phase 3: Hook Layer Migration ✅ COMPLETED

Created `usePowerSyncBibleQueries.ts` with:

- TanStack Query integration
- Smart caching strategies
- Enhanced query keys
- Retry logic optimized for offline-first

### Phase 4: Component Migration 🔄 NEXT STEPS

#### A. Update Existing Components

**BibleBooksScreen.tsx** - Update to use PowerSync hooks:

```typescript
// Before
import { useBooksQuery } from '@/features/bible/hooks';

// After
import { useBooksQuery } from '@/features/bible/hooks/usePowerSyncBibleQueries';
// OR during transition
import { useBooksQuery } from '@/features/bible/hooks'; // Will use PowerSync version
```

#### B. Migration Strategy for Components

1. **Gradual Migration**: Update one screen at a time
2. **Fallback Support**: Use migration utilities for safe transitions
3. **Testing**: Validate each component works with PowerSync

#### C. Key Components to Update

1. **BibleBooksScreen** → Use `useBooksWithMetadataQuery`
2. **ChapterScreen** → Use `useChaptersWithMetadataQuery`
3. **VersesScreen** → Use `useVersesWithTextQuery`
4. **BookGrid/BookList** → Use PowerSync book types
5. **ChapterCard** → Use PowerSync chapter types

### Phase 5: Data Validation & Testing

Use migration utilities to ensure data consistency:

```typescript
import {
  validateMigrationReadiness,
  compareDataCounts,
  getMigrationStatus,
} from '@/features/bible/utils';

// Check if PowerSync is ready
const readiness = await validateMigrationReadiness();

// Compare data between systems
const comparison = await compareDataCounts();

// Get overall migration status
const status = await getMigrationStatus();
```

## Usage Examples

### Before (Legacy)

```typescript
// Legacy hook usage
const { data: books, isLoading } = useBooksQuery();
const { data: chapters } = useChaptersQuery(bookId);
const { data: verses } = useVersesQuery(chapterId);
```

### After (PowerSync)

```typescript
// PowerSync hook usage - enhanced with metadata
const { data: books, isLoading } = useBooksWithMetadataQuery();
const { data: chapters } = useChaptersWithMetadataQuery(bookId);
const { data: versesWithText } = useVersesWithTextQuery(
  chapterId,
  textVersionId
);

// Additional PowerSync capabilities
const { data: audioVersions } = useAudioVersionsQuery(languageId);
const { data: mediaFiles } = useMediaFilesQuery(chapterId);
const { data: stats } = useDatabaseStatsQuery();
```

### Fallback Pattern (During Migration)

```typescript
import { withFallback } from '@/features/bible/utils';

const books = await withFallback(
  () => powerSyncBibleService.getBooks(),
  () => localDataService.getBooksForUI(),
  'fetch books'
);
```

## Performance Benefits

PowerSync + TanStack Query provides significant performance improvements for slower devices:

### 1. **Optimized Caching**

- Smart query invalidation
- Background data refresh
- Memory-efficient garbage collection

### 2. **Reduced Database Queries**

- Intelligent stale time configuration
- Query deduplication
- Efficient data sharing between components

### 3. **Enhanced User Experience**

- Instant UI feedback with cached data
- Proper loading and error states
- Optimistic updates for mutations

### 4. **Offline-First Architecture**

- PowerSync handles sync automatically
- TanStack Query provides offline caching
- Graceful degradation when offline

## Testing Checklist

### Data Consistency

- [ ] Books count matches between systems
- [ ] Chapters count matches between systems
- [ ] Verses count matches between systems
- [ ] Text versions are properly synced
- [ ] Audio versions are properly synced

### Functionality

- [ ] Book browsing works correctly
- [ ] Chapter navigation functions
- [ ] Verse reading displays properly
- [ ] Search functionality works
- [ ] Media playback integration works

### Performance

- [ ] Initial load times are acceptable
- [ ] Scrolling performance is smooth
- [ ] Memory usage is optimized
- [ ] Battery usage is reasonable

## Migration Commands

```bash
# 1. Test migration readiness
npm run test:migration

# 2. Validate data consistency
npm run validate:powersync

# 3. Run gradual migration
npm run migrate:bible-feature

# 4. Rollback if needed
npm run rollback:migration
```

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**: Switch back to legacy hooks in components
2. **Data Verification**: Use migration utilities to verify data integrity
3. **Issue Analysis**: Check PowerSync logs and connection status
4. **Gradual Re-migration**: Address issues and try again

## Key Benefits of This Migration

### 1. **Simplified Data Access**

- Single PowerSync service instead of complex LocalDataService
- Consistent API across all Bible data types
- Built-in error handling and retry logic

### 2. **Better Performance**

- TanStack Query optimizations for slower devices
- PowerSync's efficient sync algorithms
- Reduced memory footprint

### 3. **Enhanced Offline Experience**

- PowerSync handles offline scenarios automatically
- TanStack Query provides intelligent caching
- Graceful degradation and recovery

### 4. **Future-Proof Architecture**

- PowerSync supports real-time sync
- Easy to add new data types
- Scalable for additional features

### 5. **Developer Experience**

- Type-safe queries with PowerSync schema
- Clear separation of concerns
- Easy testing and debugging

## Next Steps

1. **Start with Books**: Migrate `BibleBooksScreen` first
2. **Add Validation**: Use migration utilities to verify
3. **Proceed Gradually**: One component at a time
4. **Monitor Performance**: Track metrics during migration
5. **Clean Up**: Remove legacy code after successful migration

## Support

- Check PowerSync logs for sync issues
- Use migration utilities for data validation
- Test on slower devices throughout migration
- Maintain fallback mechanisms until migration complete

This migration will significantly improve your app's performance, especially on slower devices, while providing a more robust and maintainable architecture for future development.
