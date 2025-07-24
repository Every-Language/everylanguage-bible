# URL Signing and Download Logging

This document describes the comprehensive logging system implemented for the URL signing and download processes in the Bible app.

## 🔐 URL Signing Logs

The URL signing process includes detailed logging at every step to help debug issues and monitor the signing workflow.

### Log Format

All URL signing logs are prefixed with `🔐 [URL Signing]` for easy identification.

### Logged Information

#### 1. Process Start

```
🔐 [URL Signing] Starting URL signing process...
🔐 [URL Signing] URLs to sign: [ 'https://example.com/audio1.mp3', 'https://example.com/audio2.mp3' ]
🔐 [URL Signing] Expiration hours: 24
```

#### 2. Authentication

```
🔐 [URL Signing] Authentication successful, session found
🔐 [URL Signing] Session user ID: test-user-id
```

#### 3. Edge Function Request

```
🔐 [URL Signing] Calling Supabase Edge Function: get-download-urls
🔐 [URL Signing] Request body: {
  "filePaths": [
    "https://example.com/audio1.mp3",
    "https://example.com/audio2.mp3"
  ],
  "expirationHours": 24
}
```

#### 4. Edge Function Response

```
🔐 [URL Signing] Edge function response data: {
  "success": true,
  "urls": {
    "https://example.com/audio1.mp3": "https://signed.example.com/audio1.mp3",
    "https://example.com/audio2.mp3": "https://signed.example.com/audio2.mp3"
  },
  "expiresIn": 86400,
  "totalFiles": 2,
  "successfulUrls": 2
}
🔐 [URL Signing] Edge function error: null
```

#### 5. Success Confirmation

```
🔐 [URL Signing] Successfully received signed URLs
🔐 [URL Signing] Number of signed URLs: 2
🔐 [URL Signing] Signed URLs mapping: {
  'https://example.com/audio1.mp3': 'https://signed.example.com/audio1.mp3',
  'https://example.com/audio2.mp3': 'https://signed.example.com/audio2.mp3'
}
🔐 [URL Signing] Expiration info: { expiresIn: 86400, totalFiles: 2, successfulUrls: 2 }
```

#### 6. Error Handling

```
🔐 [URL Signing] Edge function error: {
  "message": "Invalid request",
  "name": "EdgeFunctionError"
}
🔐 [URL Signing] Exception during signing process: Error: Invalid request
🔐 [URL Signing] Error stack: Error: Invalid request
```

#### 7. Fallback Behavior

```
🔐 [URL Signing] Falling back to original URLs due to signing failure
🔐 [URL Signing] Fallback URLs mapping: { 'https://example.com/audio.mp3': 'https://example.com/audio.mp3' }
```

## 📥 Download Logs

The download process also includes comprehensive logging to track file downloads.

### Log Format

All download logs are prefixed with `📥 [Download]` for easy identification.

### Logged Information

#### 1. Download Start

```
📥 [Download] Starting file download...
📥 [Download] File path: direct://https://signed.example.com/audio1.mp3
📥 [Download] File name: audio1.mp3
📥 [Download] Options: { onProgress: [Function], onComplete: [Function], onError: [Function] }
📥 [Download] Generated ID: abc123
📥 [Download] Local path: file:///data/user/0/.../downloads/audio1.mp3
📥 [Download] Created download item: { id: 'abc123', filePath: '...', fileName: '...', ... }
```

#### 2. URL Processing

```
📥 [Download] Direct URL download detected: https://signed.example.com/audio1.mp3
📥 [Download] Creating download resumable for: https://signed.example.com/audio1.mp3
```

#### 3. Progress Updates

```
📥 [Download] Progress update: {
  progress: 0.25,
  percentage: "25.0%",
  bytesWritten: 1048576,
  totalBytes: 4194304
}
```

#### 4. Download Completion

```
📥 [Download] Download completed successfully!
📥 [Download] Final URI: file:///data/user/0/.../downloads/audio1.mp3
```

#### 5. Error Handling

```
📥 [Download] Download failed: Error: Network error
📥 [Download] Error details: Network error
📥 [Download] Error stack: Error: Network error
```

#### 6. Cleanup

```
📥 [Download] Cleaning up download resumable for ID: abc123
```

## 📱 UI Logs

The UI components also log important events during the download process.

### Log Format

All UI logs are prefixed with `📱 [UI]` for easy identification.

### Logged Information

#### 1. URL Signing Process

```
📱 [UI] Starting URL signing process for URLs: [ 'https://example.com/audio1.mp3' ]
📱 [UI] Number of URLs to sign: 1
📱 [UI] Signing result received: {
  success: true,
  totalFiles: 1,
  successfulUrls: 1,
  fallback: false
}
```

#### 2. Download Process

```
📱 [UI] Starting download for: {
  originalUrl: 'https://example.com/audio1.mp3',
  signedUrl: 'https://signed.example.com/audio1.mp3',
  fileName: 'audio1.mp3',
  filePath: 'direct://https://signed.example.com/audio1.mp3'
}
```

#### 3. Error Handling

```
📱 [UI] Signing failed - success is false
📱 [UI] Using fallback URLs - signing API may be unavailable
```

## How to Use the Logs

### 1. Debug URL Signing Issues

Look for logs starting with `🔐 [URL Signing]` to understand:

- What URLs are being sent for signing
- Authentication status
- API request details
- Response from the signing endpoint
- Any errors or fallback behavior

### 2. Debug Download Issues

Look for logs starting with `📥 [Download]` to understand:

- File download initialization
- Progress updates
- Completion status
- Error details

### 3. Debug UI Issues

Look for logs starting with `📱 [UI]` to understand:

- User interactions
- State changes
- Error handling in the UI

### 4. Filter Logs

You can filter logs in your development console:

- **URL Signing**: Filter by `🔐 [URL Signing]`
- **Downloads**: Filter by `📥 [Download]`
- **UI**: Filter by `📱 [UI]`

## Example Debugging Scenarios

### Scenario 1: URL Signing Fails

```
🔐 [URL Signing] API call failed with status: 401
🔐 [URL Signing] Error response: {"error":"Unauthorized"}
```

**Solution**: Check authentication token and user session.

### Scenario 2: Download Fails

```
📥 [Download] Download failed: Error: Network error
📥 [Download] Error details: Network error
```

**Solution**: Check network connectivity and URL accessibility.

### Scenario 3: Fallback Behavior

```
🔐 [URL Signing] Falling back to original URLs due to signing failure
📱 [UI] Using fallback URLs - signing API may be unavailable
```

**Solution**: The system is working but the signing API is unavailable. Downloads will proceed with original URLs.

## Testing the Logging

Run the logging tests to verify the logging system:

```bash
npm test -- --testPathPattern=urlSigningLogs.test.ts
```

This will demonstrate all the logging functionality and verify that logs are being generated correctly.
