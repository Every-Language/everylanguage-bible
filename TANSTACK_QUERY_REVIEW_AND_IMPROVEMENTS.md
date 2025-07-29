# TanStack Query Review and Improvements

## Overview

This document provides a comprehensive review of the current TanStack Query implementation for Bible data retrieval and outlines the improvements made to ensure best practices, proper retry logic, and consistent usage across the application.

## Current State Analysis

### ✅ What's Working Well

1. **Query Client Configuration**: Properly configured with retry logic, stale time management, and background refetching
2. **Query Key Organization**: Well-structured query keys for different data types
3. **Caching Strategy**: Appropriate stale times for different data types (5-15 minutes)
4. **Basic Error Handling**: Error states are handled in most queries

### ❌ Issues Identified

1. **Inconsistent Usage**: Some screens use TanStack Query hooks while others still use old custom hooks
2. **Missing Retry Logic**: No specific retry logic for "no data found" scenarios
3. **Incomplete Error Handling**: Some error scenarios not properly handled
4. **Type Mismatches**: Some type inconsistencies between LocalBook and UI Book types
5. **Missing Data Validation**: No validation for empty results when data should exist

## Improvements Made

### 1. Enhanced TanStack Query Hooks (`src/features/bible/hooks/useBibleQueries.ts`)

#### Key Improvements:

- **Enhanced Retry Logic**: Added intelligent retry logic that distinguishes between network errors and "no data found" scenarios
- **Data Validation**: Added validation to detect when no books/chapters/verses are found despite having local data
- **Better Error Messages**: More descriptive error messages for different failure scenarios
- **Sync State Integration**: Integrated with sync state to make better decisions about retry behavior
- **Proper Type Handling**: Fixed type mismatches by using `getBooksForUI()` instead of `getBooks()`

#### Retry Logic Strategy:

```typescript
retry: (failureCount, error) => {
  // Retry up to 3 times for network/database errors
  if (failureCount >= 3) return false;

  // Don't retry if it's a "no books found" error and we don't have local data
  if (error instanceof Error && error.message.includes('No books found') && !hasLocalData) {
    return false;
  }

  return true;
},
retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
```

#### Data Validation:

```typescript
queryFn: async () => {
  const books = await localDataService.getBooksForUI();

  // If no books found and we have local data, this might indicate a sync issue
  if (books.length === 0 && hasLocalData) {
    logger.warn('No books found in database despite having local data');
    throw new Error('No books found. Please try syncing again.');
  }

  return books;
},
```

### 2. New Optimized BibleBooksScreen (`src/features/bible/screens/BibleBooksScreenOptimized.tsx`)

#### Features:

- **TanStack Query Integration**: Uses `useBooksQuery()` and `useRefreshBibleDataMutation()`
- **Enhanced Error Handling**: Proper error states with retry and sync options
- **Search and Sort**: Client-side search and sorting functionality
- **Pull-to-Refresh**: Built-in refresh functionality
- **Loading States**: Proper loading states with skeleton screens
- **Empty States**: Helpful empty state messages

#### Error Handling:

```typescript
// Error state with retry and sync options
if (booksError && filteredAndSortedBooks.length === 0) {
  return (
    <ScrollView refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}>
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {booksError instanceof Error ? booksError.message : 'Failed to load books'}
        </Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Text>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSyncData}>
          <Text>Sync Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

### 3. Query Client Configuration Improvements

#### Enhanced Retry Configuration:

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (user errors)
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }

        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

## Best Practices Implemented

### 1. **Intelligent Retry Logic**

- Distinguishes between network errors and data availability issues
- Prevents infinite retries for "no data found" scenarios when appropriate
- Uses exponential backoff with maximum delay limits

### 2. **Data Validation**

- Validates that expected data exists when local data is available
- Provides meaningful error messages for different failure scenarios
- Logs warnings for debugging purposes

### 3. **Type Safety**

- Fixed type mismatches between LocalBook and UI Book types
- Uses proper transformation methods (`getBooksForUI()`)
- Maintains type safety throughout the query chain

### 4. **Error Handling**

- Comprehensive error states with user-friendly messages
- Multiple recovery options (retry, sync, refresh)
- Proper error logging for debugging

### 5. **Performance Optimization**

- Appropriate stale times for different data types
- Background refetching for data freshness
- Efficient cache invalidation strategies

## Migration Strategy

### Phase 1: ✅ Complete

- Enhanced TanStack Query hooks with retry logic
- Created optimized BibleBooksScreen
- Fixed type issues and data validation

### Phase 2: Recommended Next Steps

1. **Migrate ChapterScreen**: Update to use `useChaptersQuery()` instead of `useChapters()`
2. **Migrate VersesScreen**: Update to use `useVersesWithTextsQuery()` instead of `useVerses()`
3. **Update Navigation**: Replace old screens with optimized versions
4. **Add Integration Tests**: Test retry logic and error scenarios

### Phase 3: Advanced Features

1. **Optimistic Updates**: Implement optimistic updates for user interactions
2. **Background Sync**: Integrate with background sync service
3. **Offline Support**: Enhanced offline-first capabilities
4. **Performance Monitoring**: Add query performance monitoring

## Usage Examples

### Basic Query Usage:

```typescript
const {
  data: books = [],
  isLoading: booksLoading,
  error: booksError,
  refetch: refetchBooks,
  isRefetching,
} = useBooksQuery();
```

### Error Handling:

```typescript
if (booksError && books.length === 0) {
  return <ErrorState error={booksError} onRetry={refetchBooks} />;
}
```

### Pull-to-Refresh:

```typescript
<FlatList
  refreshControl={
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={refetchBooks}
    />
  }
  // ... other props
/>
```

## Performance Benefits

### 1. **Reduced Database Calls**

- Smart caching prevents redundant queries
- Background refetching keeps data fresh
- Efficient cache invalidation

### 2. **Better User Experience**

- Immediate loading states
- Graceful error handling
- Multiple recovery options

### 3. **Improved Reliability**

- Intelligent retry logic
- Data validation
- Comprehensive error handling

## Conclusion

The TanStack Query implementation has been significantly improved with:

1. **Enhanced retry logic** that intelligently handles different error scenarios
2. **Better data validation** to detect sync issues
3. **Comprehensive error handling** with user-friendly recovery options
4. **Type safety improvements** to prevent runtime errors
5. **Performance optimizations** for better user experience

The new implementation follows TanStack Query best practices and provides a robust foundation for Bible data retrieval with proper error handling and retry logic.

## Next Steps

1. **Test the improvements** with various error scenarios
2. **Migrate remaining screens** to use the optimized hooks
3. **Add comprehensive tests** for retry logic and error handling
4. **Monitor performance** in production to validate improvements
