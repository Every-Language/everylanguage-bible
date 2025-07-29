# Language Selection Store Timeout Fix

## Problem

The Language Selection Store initialization was timing out after 5000ms (5 seconds) when there was no cached language data available. This caused the app to fail during startup with the error:

```
Language Selection Store initialization timed out after 5000ms
```

## Root Cause

The issue occurred because:

1. The initialization service had a 5-second timeout for the Language Selection Store
2. When no cached language data exists, the store needs to perform a full sync from the server
3. The sync operation can take much longer than 5 seconds, especially on slow connections
4. The sync operation had no internal timeout protection

## Solution

### 1. Increased Initialization Timeout

**File**: `src/shared/services/initialization/InitializationService.ts`

- Increased timeout from 5000ms to 15000ms for Language Selection Store initialization
- Added comment explaining the longer timeout for language sync operations

### 2. Made Language Hierarchy Loading Non-Blocking

**File**: `src/features/languages/store/combinedStore.ts`

- Modified `initializeCombinedLanguageSelectionStore()` to make language hierarchy loading non-blocking
- The hierarchy loading now starts in the background and doesn't block app startup
- Added proper error handling for background operations

### 3. Added Timeout Protection to Sync Operations

**File**: `src/features/languages/services/domain/languageService.ts`

- Added 8-second timeout to `syncLanguageEntities()` method
- Added fallback mechanism to use cached data if sync fails
- Improved error logging and handling

### 4. Enhanced Language Hierarchy Loading

**File**: `src/features/languages/store/slices/languageHierarchy.ts`

- Added 10-second timeout to `loadLanguageHierarchy()` method
- Implemented retry logic (up to 2 retries) for network-related errors
- Added user-friendly error messages for different failure scenarios
- Updated TypeScript interfaces to support retry parameter

### 5. Updated Type Definitions

**Files**:

- `src/features/languages/types/store.ts`
- `src/features/languages/hooks/useLanguageSelection.ts`
- Updated interfaces and hooks to support the new retry parameter

## Key Improvements

### Performance

- **Non-blocking initialization**: App starts faster by not waiting for language sync
- **Background loading**: Language hierarchy loads in background after app is ready
- **Cached data fallback**: Uses local cache if sync fails

### Reliability

- **Multiple timeouts**: Added timeouts at multiple levels to prevent hanging
- **Retry mechanism**: Automatically retries failed network operations
- **Graceful degradation**: App continues to work even if language sync fails

### User Experience

- **Faster app startup**: No longer blocked by language sync
- **Better error messages**: User-friendly messages for different failure types
- **Progressive loading**: Language data loads progressively as needed

## Testing

The changes ensure that:

1. App startup is not blocked by language sync operations
2. Language data loads in the background after app is ready
3. Users can use the app even if language sync fails
4. Proper error messages are shown for different failure scenarios
5. Retry logic handles temporary network issues

## Backward Compatibility

All changes maintain backward compatibility:

- Existing API interfaces remain the same (with optional retry parameter)
- Existing functionality continues to work
- No breaking changes to public APIs
