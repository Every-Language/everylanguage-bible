# hasLocalData Analysis and Best Practices

## Current Implementation Analysis

### 1. **How hasLocalData is Currently Calculated**

#### **Data Source:**

```typescript
// src/shared/services/database/LocalDataService.ts
async isDataAvailable(): Promise<boolean> {
  const count = await this.getBooksCount();
  return count > 0;
}
```

#### **Update Points:**

1. **Database Initialization** (syncStore.ts:100):

   ```typescript
   const hasData = await localDataService.isDataAvailable();
   get().setHasLocalData(hasData);
   ```

2. **Data Clearing** (syncStore.ts:186):
   ```typescript
   setHasLocalData(false);
   ```

#### **Missing Update Points:**

- ❌ **After successful sync operations** (`syncNow`, `forceFullSync`)
- ❌ **After partial data updates**
- ❌ **After data corruption detection**
- ❌ **After database migrations**

### 2. **Current Issues with hasLocalData**

#### **Problem 1: Incomplete Data Detection**

```typescript
// Current: Only checks books count
async isDataAvailable(): Promise<boolean> {
  const count = await this.getBooksCount();
  return count > 0;
}

// Issues:
// - Doesn't check chapters or verses
// - Doesn't verify data integrity
// - Doesn't check for partial data
// - Single point of failure (if books table is corrupted)
```

#### **Problem 2: Stale State After Sync**

```typescript
// syncNow() and forceFullSync() don't update hasLocalData
syncNow: async () => {
  // ... sync operations ...
  await bibleSync.syncAll();

  // ❌ Missing: Update hasLocalData after successful sync
  // const hasData = await localDataService.isDataAvailable();
  // setHasLocalData(hasData);
};
```

#### **Problem 3: No Real-time Validation**

```typescript
// hasLocalData is only checked during initialization
// No ongoing validation or health checks
// No detection of data corruption during app usage
```

#### **Problem 4: Binary State**

```typescript
// hasLocalData is just true/false
// Doesn't provide granular information about:
// - Which tables have data
// - Data completeness percentage
// - Data health status
```

## Best Practices Recommendations

### 1. **Enhanced Data Availability Detection**

#### **Multi-Table Validation:**

```typescript
async isDataAvailable(): Promise<{
  hasData: boolean;
  details: {
    books: { count: number; hasData: boolean };
    chapters: { count: number; hasData: boolean };
    verses: { count: number; hasData: boolean };
    verseTexts: { count: number; hasData: boolean };
  };
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
}> {
  try {
    const [booksCount, chaptersCount, versesCount, verseTextsCount] = await Promise.all([
      this.getBooksCount(),
      this.getChaptersCount(),
      this.getVersesCount(),
      this.getVerseTextsCount(),
    ]);

    const details = {
      books: { count: booksCount, hasData: booksCount > 0 },
      chapters: { count: chaptersCount, hasData: chaptersCount > 100 }, // Minimum expected
      verses: { count: versesCount, hasData: versesCount > 1000 }, // Minimum expected
      verseTexts: { count: verseTextsCount, hasData: verseTextsCount > 0 },
    };

    const hasData = details.books.hasData && details.chapters.hasData && details.verses.hasData;

    // Calculate overall health
    const totalRecords = booksCount + chaptersCount + versesCount;
    const expectedMin = 66 + 1000 + 1000; // Minimum expected records
    const percentage = (totalRecords / expectedMin) * 100;

    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
    if (percentage >= 95) overallHealth = 'excellent';
    else if (percentage >= 80) overallHealth = 'good';
    else if (percentage >= 50) overallHealth = 'warning';
    else overallHealth = 'critical';

    return { hasData, details, overallHealth };
  } catch (error) {
    logger.error('Error checking data availability:', error);
    return {
      hasData: false,
      details: {
        books: { count: 0, hasData: false },
        chapters: { count: 0, hasData: false },
        verses: { count: 0, hasData: false },
        verseTexts: { count: 0, hasData: false },
      },
      overallHealth: 'critical',
    };
  }
}
```

### 2. **Enhanced SyncStore State**

#### **Granular State Management:**

```typescript
export interface SyncState {
  isInitialized: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  lastSyncAt: string | null;

  // Enhanced data availability
  hasLocalData: boolean;
  dataHealth: {
    books: { count: number; hasData: boolean };
    chapters: { count: number; hasData: boolean };
    verses: { count: number; hasData: boolean };
    verseTexts: { count: number; hasData: boolean };
  };
  overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
  lastHealthCheck: string | null;

  isOnboardingMode: boolean;
  error: string | null;
}
```

### 3. **Automatic Health Checks**

#### **Periodic Validation:**

```typescript
// Add to syncStore
checkDataHealth: async () => {
  const { setDataHealth, setOverallHealth, setLastHealthCheck } = get();

  try {
    const healthData = await localDataService.isDataAvailable();

    setDataHealth(healthData.details);
    setOverallHealth(healthData.overallHealth);
    setLastHealthCheck(new Date().toISOString());

    // Update hasLocalData based on overall health
    setHasLocalData(healthData.hasData);

    return healthData;
  } catch (error) {
    logger.error('Health check failed:', error);
    throw error;
  }
},
```

### 4. **Sync Operations Enhancement**

#### **Update hasLocalData After Sync:**

```typescript
syncNow: async () => {
  const { setSyncing, setSyncProgress, setError, isInitialized, checkDataHealth } = get();

  if (!isInitialized) {
    throw new Error('Database not initialized');
  }

  try {
    logger.info('SyncStore: Starting sync...');
    setError(null);
    setSyncing(true);
    setSyncProgress({ table: 'books', recordsSynced: 0, totalRecords: 0, isComplete: false });

    await bibleSync.syncAll();

    // ✅ Update last sync time
    const lastSync = await localDataService.getLastSyncedAt();
    set({ lastSyncAt: lastSync });

    // ✅ Update data health after successful sync
    await checkDataHealth();

    logger.info('SyncStore: Sync completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('SyncStore: Sync failed:', error);
    setError(errorMessage);
    throw error;
  } finally {
    setSyncing(false);
    setSyncProgress(null);
  }
},
```

### 5. **Real-time Data Validation**

#### **Query-Level Validation:**

```typescript
// Enhanced TanStack Query hooks with data validation
export const useBooksQuery = () => {
  const { isInitialized, checkDataHealth } = useSync();

  return useQuery({
    queryKey: bibleQueryKeys.books(),
    queryFn: async () => {
      const books = await localDataService.getBooksForUI();

      // Validate data health if books are empty
      if (books.length === 0) {
        await checkDataHealth();
      }

      return books;
    },
    enabled: isInitialized,
    staleTime: 15 * 60 * 1000,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};
```

### 6. **UI Integration**

#### **Enhanced Sync Status Display:**

```typescript
// Enhanced SyncStatus component
export const SyncStatus: React.FC = () => {
  const {
    hasLocalData,
    dataHealth,
    overallHealth,
    lastHealthCheck,
    checkDataHealth
  } = useSync();

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'excellent': return theme.colors.success;
      case 'good': return theme.colors.primary;
      case 'warning': return theme.colors.warning;
      case 'critical': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.healthIndicator}>
        <View style={[styles.dot, { backgroundColor: getHealthColor(overallHealth) }]} />
        <Text style={styles.healthText}>
          Data Health: {overallHealth.toUpperCase()}
        </Text>
      </View>

      {dataHealth && (
        <View style={styles.details}>
          <Text>Books: {dataHealth.books.count}</Text>
          <Text>Chapters: {dataHealth.chapters.count}</Text>
          <Text>Verses: {dataHealth.verses.count}</Text>
        </View>
      )}

      <TouchableOpacity onPress={checkDataHealth}>
        <Text>Refresh Health</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Implementation Priority

### **Phase 1: Critical Fixes (Immediate)**

1. ✅ Update `hasLocalData` after successful sync operations
2. ✅ Add multi-table validation to `isDataAvailable()`
3. ✅ Add error handling to data availability checks

### **Phase 2: Enhanced Features (Short-term)**

1. ✅ Implement granular data health tracking
2. ✅ Add periodic health checks
3. ✅ Enhance UI with health status display

### **Phase 3: Advanced Features (Long-term)**

1. ✅ Real-time data corruption detection
2. ✅ Automatic data repair mechanisms
3. ✅ Predictive health monitoring

## Migration Strategy

### **Backward Compatibility:**

```typescript
// Maintain existing hasLocalData boolean for backward compatibility
export const useSync = (): SyncContextType => {
  const {
    hasLocalData, // Boolean for backward compatibility
    dataHealth, // New granular data
    overallHealth, // New health status
    // ... other fields
  } = useSyncStore();

  return {
    hasLocalData, // Existing boolean API
    dataHealth, // New granular API
    overallHealth, // New health API
    // ... other fields
  };
};
```

### **Gradual Migration:**

1. **Week 1**: Implement enhanced `isDataAvailable()` with backward compatibility
2. **Week 2**: Update sync operations to refresh `hasLocalData`
3. **Week 3**: Add health checks and UI enhancements
4. **Week 4**: Implement real-time validation

## Benefits of Enhanced Implementation

### **Reliability:**

- Multi-table validation prevents false positives
- Real-time health monitoring
- Automatic detection of data corruption

### **User Experience:**

- Clear indication of data health status
- Detailed information about missing data
- Proactive health checks

### **Developer Experience:**

- Granular data health information
- Better debugging capabilities
- Predictable data state management

### **Performance:**

- Efficient health checks with caching
- Background validation without blocking UI
- Smart retry logic based on health status

This enhanced implementation provides a robust foundation for data availability management while maintaining backward compatibility and improving the overall user experience.
