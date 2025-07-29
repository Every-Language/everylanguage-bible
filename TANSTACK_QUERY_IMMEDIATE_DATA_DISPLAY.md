# TanStack Query Immediate Data Display Implementation

## Overview

This document outlines the implementation of immediate data display using TanStack Query, where the app always attempts to show data from the database first, and only shows a sync button after 3 retry attempts if no data is found.

## Key Changes Made

### 1. **TanStack Query Hooks Updated**

#### **useBooksQuery()**

```typescript
// Before: Threw error if no books found and hasLocalData was true
if (books.length === 0 && hasLocalData) {
  throw new Error('No books found. Please try syncing again.');
}

// After: Always return books, even if empty
return books;
```

#### **useChaptersQuery()**

```typescript
// Before: Threw error if no chapters found and hasLocalData was true
if (chapters.length === 0 && hasLocalData) {
  throw new Error('No chapters found for this book. Please try syncing again.');
}

// After: Always return chapters, even if empty
return chapters;
```

#### **useVersesQuery() & useVersesWithTextsQuery()**

```typescript
// Before: Threw error if no verses found and hasLocalData was true
if (verses.length === 0 && hasLocalData) {
  throw new Error(
    'No verses found for this chapter. Please try syncing again.'
  );
}

// After: Always return verses, even if empty
return verses;
```

### 2. **Retry Logic Simplified**

All queries now use consistent retry logic:

```typescript
retry: (failureCount, error) => {
  // Retry up to 3 times for any database errors
  if (failureCount >= 3) return false;

  // Always retry for the first 3 attempts
  return true;
},
retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
```

### 3. **UI Components Updated**

#### **BibleBooksScreen.tsx**

```typescript
// Show sync button if no data after 3 retry attempts or if there's an error
const shouldShowSyncButton = (booksError && filteredAndSortedBooks.length === 0) ||
  (!booksLoading && !isRefetching && filteredAndSortedBooks.length === 0);

if (shouldShowSyncButton) {
  return (
    <View style={styles.errorContainer}>
      <MaterialIcons name='cloud-download' size={48} color={theme.colors.textSecondary} />
      <Text style={styles.errorText}>
        {booksError instanceof Error ? booksError.message : 'No Bible data available'}
      </Text>
      <Text style={styles.syncDescription}>
        Download Bible content to start reading
      </Text>
      <TouchableOpacity onPress={handleRefresh}>
        <Text>Retry</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleSyncData}>
        <Text>Download Bible Data</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### **ChapterScreen.tsx**

```typescript
// Show sync button if no data after 3 retry attempts or if there's an error
const shouldShowSyncButton = (error && chapters.length === 0) ||
  (!loading && !isRefetching && chapters.length === 0);

if (shouldShowSyncButton) {
  return (
    <View style={styles.errorContainer}>
      <MaterialIcons name='cloud-download' size={48} color={theme.colors.textSecondary} />
      <Text style={styles.errorText}>
        {error || 'No chapters available for this book'}
      </Text>
      <Text style={styles.syncDescription}>
        Download Bible content to view chapters
      </Text>
      <TouchableOpacity onPress={fetchChapters}>
        <Text>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### **VersesScreen.tsx**

```typescript
// Show sync button if no data after 3 retry attempts or if there's an error
const shouldShowSyncButton = (versesError && versesWithTexts.length === 0) ||
  (!loading && !isRefetching && versesWithTexts.length === 0);

if (shouldShowSyncButton) {
  return (
    <View style={styles.errorContainer}>
      <MaterialIcons name='cloud-download' size={48} color={theme.colors.textSecondary} />
      <Text style={styles.errorText}>
        {versesError instanceof Error ? versesError.message : 'No verses available for this chapter'}
      </Text>
      <Text style={styles.syncDescription}>
        Download Bible content to view verses
      </Text>
      <TouchableOpacity onPress={() => refetchVerses()}>
        <Text>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Data Flow

### **New Flow:**

```
1. App starts → TanStack Query attempts to fetch data from database
2. If data exists → Display immediately
3. If no data → Retry up to 3 times with exponential backoff
4. After 3 failed attempts → Show sync button with download option
5. User clicks sync → Download Bible data
6. Data downloaded → TanStack Query automatically refetches and displays
```

### **Benefits:**

- **Immediate Display**: Data shows instantly if available in database
- **No Sync Check**: App doesn't wait for sync status before showing data
- **Graceful Degradation**: Shows helpful UI when no data is available
- **Consistent Retry Logic**: 3 attempts with exponential backoff
- **User-Friendly**: Clear messaging about downloading content

## Error Handling

### **Database Errors:**

- Retry up to 3 times with exponential backoff
- Show sync button after all retries exhausted

### **Empty Data:**

- Don't treat as error
- Show sync button to download content
- Provide clear messaging about what's missing

### **Network Errors:**

- Same retry logic as database errors
- Fallback to sync button for manual download

## User Experience

### **First Launch (No Data):**

1. App loads quickly
2. Shows "No Bible data available" message
3. Prominent "Download Bible Data" button
4. Clear explanation of what will be downloaded

### **Subsequent Launches (Data Available):**

1. App loads quickly
2. Data displays immediately from cache/database
3. Background refresh if needed
4. No sync checks blocking display

### **Data Refresh:**

1. Pull-to-refresh available on all screens
2. Retry button for immediate retry
3. Sync button for full data download

## Configuration

### **Query Settings:**

```typescript
staleTime: 15 * 60 * 1000, // 15 minutes for books
staleTime: 10 * 60 * 1000, // 10 minutes for chapters
staleTime: 5 * 60 * 1000,  // 5 minutes for verses
retry: (failureCount, error) => failureCount < 3,
retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
```

### **UI Settings:**

- Consistent sync button styling across all screens
- Clear messaging about what data is missing
- Retry and download options always available
- Loading states during retry attempts

## Testing Scenarios

### **Test Cases:**

1. **Fresh Install**: No data → Show sync button
2. **Partial Data**: Some books but no chapters → Show sync for missing data
3. **Full Data**: All data available → Display immediately
4. **Database Error**: Corrupted database → Retry 3 times → Show sync
5. **Network Error**: No internet → Retry 3 times → Show sync
6. **Mixed State**: Some data available, some missing → Show available data + sync for missing

### **Expected Behavior:**

- App always attempts to display data first
- No blocking sync checks
- Consistent retry behavior
- Clear user guidance for missing data
- Smooth transition from empty to populated state

## Migration Notes

### **Breaking Changes:**

- Removed `hasLocalData` dependency from query logic
- Changed error handling to not throw on empty data
- Updated UI to handle empty states consistently

### **Backward Compatibility:**

- All existing TanStack Query hooks maintain same API
- UI components still receive same data structure
- Error handling is more graceful

### **Performance Impact:**

- Faster initial load (no sync checks)
- Better caching behavior
- Reduced unnecessary error states
- More responsive UI

This implementation ensures the app always prioritizes displaying available data immediately while providing a clear path for users to download missing content when needed.
