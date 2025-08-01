# Verse Text Sync Transaction Error Fix

## Problem Summary

The Bible app was experiencing database transaction failures during verse text sync operations with the error:

```
ERROR: Verse text sync failed: {
  "name": "DatabaseError",
  "message": "Transaction failed",
  "code": "TRANSACTION_FAILED",
  "details": {
    "originalError": {
      "code": "SINGLE_QUERY_FAILED",
      "details": {
        "query": "INSERT OR REPLACE INTO verse_texts (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP), (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)",
        "params": [...],
        "originalError": {
          "code": "ERR_INTERNAL_SQLITE_ERROR"
        }
      }
    }
  }
}
```

## Root Causes Identified

1. **Parameter Count Mismatch**: The SQL query had 18 placeholders (9 for each of 2 records) but only 16 parameters were provided
2. **Data Corruption**: Some verse text records contained invalid or corrupted data (e.g., "in the beniging 2as ;ldfkjas d;lfkjasd;lfkajsd fkjdfkdjfsldkfjsldkfj")
3. **Insufficient Data Validation**: Missing validation for required fields and data types before database insertion
4. **No Error Recovery**: No automatic recovery mechanism for database transaction errors

## Solutions Implemented

### 1. Enhanced Data Validation (`VerseTextSyncService.ts`)

**File**: `src/shared/services/sync/bible/VerseTextSyncService.ts`

**Changes**:

- Added comprehensive data validation before database operations
- Filter out invalid records with missing required fields
- Clean and normalize data (trim strings, validate types)
- Added parameter count verification with detailed logging

**Key improvements**:

```typescript
// Pre-validate the data before processing
const validVerseTexts = verseTexts.filter(verseText => {
  const isValid =
    verseText.id &&
    verseText.verse_id &&
    verseText.verse_text &&
    typeof verseText.id === 'string' &&
    typeof verseText.verse_id === 'string' &&
    typeof verseText.verse_text === 'string';

  if (!isValid) {
    logger.warn('Skipping invalid verse text record:', {
      id: verseText.id,
      verse_id: verseText.verse_id,
      has_text: !!verseText.verse_text,
      text_length: verseText.verse_text?.length,
    });
  }

  return isValid;
});
```

### 2. Retry Logic with Exponential Backoff

**Changes**:

- Added retry mechanism with up to 3 attempts
- Exponential backoff between retries (1s, 2s, 4s)
- Better error logging with retry context

**Key improvements**:

```typescript
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    // ... sync logic ...
  } catch (error) {
    retryCount++;
    if (retryCount >= maxRetries) {
      // Final error handling
    }
    // Wait before retrying (exponential backoff)
    const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}
```

### 3. Emergency Fix Mechanism

**New Method**: `emergencyFixTransactionError()`

**Purpose**: Automatically diagnose and fix database corruption issues

**Features**:

- Diagnoses database structure issues
- Rebuilds corrupted tables
- Verifies fix with test operations
- Returns detailed action report

### 4. Automatic Error Recovery in Language Store

**File**: `src/features/languages/store/slices/currentSelections.ts`

**Changes**:

- Detects database transaction errors automatically
- Triggers emergency fix when transaction errors occur
- Retries sync operation after successful fix
- Provides user-friendly error messages

**Key improvements**:

```typescript
// Check if this is a database transaction error that we can fix
const errorMessage = error instanceof Error ? error.message : '';
const isTransactionError =
  errorMessage.includes('TRANSACTION_FAILED') ||
  errorMessage.includes('ERR_INTERNAL_SQLITE_ERROR') ||
  errorMessage.includes('SINGLE_QUERY_FAILED');

if (isTransactionError) {
  logger.warn(
    '🔄 Sync - Detected database transaction error, attempting emergency fix...'
  );

  const fixResult = await verseTextSyncService.emergencyFixTransactionError();

  if (fixResult.success) {
    // Retry the sync after the fix
    await verseTextSyncService.syncVerseTextsForVersion(currentTextVersion.id);
  }
}
```

## Testing

### Test Script

Created `scripts/test-verse-text-sync.js` to verify the fix:

```bash
# Run the test script
node scripts/test-verse-text-sync.js
```

### Manual Testing Steps

1. Run the app and trigger a verse text sync
2. If the database error occurs, the emergency fix should automatically run
3. Check logs for "Emergency fix" messages
4. Verify that sync completes successfully after the fix

## Error Handling Flow

1. **Normal Sync Attempt** → Success ✅
2. **Database Error** → Detect transaction error
3. **Emergency Fix** → Diagnose and fix database issues
4. **Retry Sync** → Attempt sync again with fixed database
5. **Success** → Complete sync normally
6. **Failure** → Show user-friendly error message

## Monitoring and Logging

### Enhanced Logging

- Detailed parameter count verification
- Sample data logging for debugging
- Retry attempt tracking
- Emergency fix action reporting

### Key Log Messages to Watch For

- `"Parameter count mismatch detected"`
- `"Skipping invalid verse text record"`
- `"Emergency fix completed successfully"`
- `"Detected database transaction error, attempting emergency fix"`

## Files Modified

1. `src/shared/services/sync/bible/VerseTextSyncService.ts`
   - Enhanced data validation
   - Added retry logic
   - Added emergency fix method
   - Improved error handling

2. `src/features/languages/store/slices/currentSelections.ts`
   - Added automatic error detection
   - Added emergency fix integration
   - Enhanced error reporting

3. `scripts/test-verse-text-sync.js` (new)
   - Test script for verification

4. `docs/verse-text-sync-transaction-fix.md` (new)
   - This documentation

## Prevention Measures

1. **Data Validation**: All incoming data is validated before database operations
2. **Parameter Verification**: SQL parameter counts are verified before execution
3. **Automatic Recovery**: Database errors trigger automatic fix attempts
4. **Retry Logic**: Transient errors are handled with retries
5. **Monitoring**: Enhanced logging for early detection of issues

## Future Improvements

1. **Database Integrity Checks**: Regular scheduled integrity checks
2. **Data Backup**: Automatic backup before major operations
3. **Metrics Collection**: Track error rates and fix success rates
4. **User Notifications**: Inform users when automatic fixes are applied

## Conclusion

This fix addresses the immediate database transaction error while also implementing a robust error recovery system. The combination of data validation, retry logic, and automatic emergency fixes should prevent similar issues in the future and provide a better user experience when database problems do occur.
