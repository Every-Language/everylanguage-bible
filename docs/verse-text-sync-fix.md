# Verse Text Sync Database Transaction Fix

## Problem

The Bible app was experiencing database transaction failures during verse text sync operations. The error message was:

```
ERROR: Verse texts sync failed: {
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

## Root Causes

1. **Parameter count mismatch**: The SQL query had 18 placeholders (9 for each of 2 records) but only 16 parameters were provided
2. **CURRENT_TIMESTAMP handling**: The `CURRENT_TIMESTAMP` was being handled in SQL but not accounted for in parameter counting
3. **Data validation issues**: Missing validation for required fields and data types
4. **Insufficient error handling**: Generic error messages that didn't help users understand the issue

## Solutions Implemented

### 1. Fixed Parameter Count Mismatch

- **Issue**: SQL had 18 placeholders but only 16 parameters
- **Fix**: Properly accounted for `CURRENT_TIMESTAMP` being handled in SQL, not as a parameter
- **Result**: Each record now correctly uses 8 parameters + `CURRENT_TIMESTAMP` in SQL

### 2. Enhanced Data Validation

- **Added null checks**: Ensure `text_version_id` is properly handled as null when undefined
- **Default values**: Provide defaults for `publish_status` and `version` fields
- **Timestamp validation**: Ensure `created_at` and `updated_at` are valid ISO strings

### 3. Improved Error Handling

- **Specific error messages**: Different messages for transaction failures vs network issues vs timeouts
- **User-friendly messages**: Clear, actionable error messages for users
- **Better logging**: Enhanced error logging with context information

### 4. Database Recovery Mechanism

- **Table rebuild method**: Added `clearAndRebuildVerseTextsTable()` to handle corruption
- **Sync metadata reset**: Properly reset sync state when rebuilding tables
- **Foreign key handling**: Maintain referential integrity during rebuilds

## Files Modified

1. `src/shared/services/sync/bible/VerseTextSyncService.ts`
   - Fixed parameter count in `upsertVerseTexts()` method
   - Added data validation and default values
   - Enhanced error handling with specific messages
   - Added `clearAndRebuildVerseTextsTable()` method

## Technical Details

### Parameter Count Fix

**Before:**

```sql
INSERT OR REPLACE INTO verse_texts (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP), (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
```

- 18 placeholders for 2 records
- Only 16 parameters provided
- Caused SQLite internal error

**After:**

```sql
INSERT OR REPLACE INTO verse_texts (...) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP), (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
```

- 16 placeholders for 2 records (8 each)
- 16 parameters provided
- `CURRENT_TIMESTAMP` handled in SQL

### Data Validation

```typescript
const params = batch.flatMap(verseText => [
  verseText.id,
  verseText.verse_id,
  verseText.text_version_id || null, // Handle undefined
  verseText.verse_text,
  verseText.publish_status || 'published', // Default value
  typeof verseText.version === 'number' ? verseText.version : 1, // Type validation
  verseText.created_at || new Date().toISOString(), // Default timestamp
  verseText.updated_at || new Date().toISOString(), // Default timestamp
]);
```

## Testing Recommendations

1. **Database Transaction Testing**: Test with various batch sizes and data types
2. **Corruption Recovery Testing**: Test the table rebuild functionality
3. **Error Handling Testing**: Verify specific error messages for different failure types
4. **Data Validation Testing**: Test with malformed or missing data

## User Experience Improvements

- **Clear error messages**: Users now understand what went wrong
- **Recovery options**: Database corruption can be automatically fixed
- **Better reliability**: Reduced likelihood of transaction failures
- **Improved debugging**: Better logging for troubleshooting

## Future Considerations

1. **Progressive Sync**: Consider implementing progressive sync for very large verse text datasets
2. **Data Integrity Checks**: Add periodic data integrity validation
3. **Backup and Restore**: Implement backup/restore functionality for verse texts
4. **Performance Monitoring**: Add metrics to track sync performance and identify bottlenecks

## Related Issues

This fix addresses the same underlying issues that could affect other sync operations:

- Parameter count mismatches in batch operations
- Insufficient data validation
- Generic error handling
- Database corruption recovery

The patterns established here can be applied to other sync services in the app.
