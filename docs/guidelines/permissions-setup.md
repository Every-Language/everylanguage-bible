# Permissions Setup Guide

## Overview

This guide covers the complete permissions configuration and implementation for the Every Language Bible App. The app requires specific permissions for audio playback, notifications, file storage, and background sync functionality.

## Required Permissions

### iOS Permissions

#### 1. Background Modes

- **background-fetch**: For background content synchronization
- **background-processing**: For background download processing
- **audio**: For background audio playback
- **remote-notification**: For push notification handling

#### 2. Privacy Permissions

- **NSMicrophoneUsageDescription**: Clarifies that microphone is not used
- **NSAppTransportSecurity**: Secure network communication
- **NSLocalNetworkUsageDescription**: For content synchronization
- **NSUserTrackingUsageDescription**: Privacy compliance

### Android Permissions

#### 1. Core Permissions

- **INTERNET**: Network connectivity
- **ACCESS_NETWORK_STATE**: Network status monitoring
- **WAKE_LOCK**: Keep device awake during background tasks
- **FOREGROUND_SERVICE**: Background service execution
- **RECEIVE_BOOT_COMPLETED**: Auto-start background sync
- **VIBRATE**: Notification vibration

#### 2. Storage Permissions

- **WRITE_EXTERNAL_STORAGE**: Download and store content
- **READ_EXTERNAL_STORAGE**: Access downloaded content

## Implementation Architecture

### 1. PermissionsService

The core service that manages all permission-related functionality:

```typescript
// Singleton service for permission management
const permissionsService = PermissionsService.getInstance();

// Initialize on app startup
await permissionsService.initialize();

// Check current permissions
const permissions = await permissionsService.checkAllPermissions();

// Request specific permissions
const notificationStatus =
  await permissionsService.requestNotificationPermissions();
```

### 2. usePermissions Hook

React hook for easy permission management in components:

```typescript
const {
  permissions,
  isLoading,
  requestAllPermissions,
  areCriticalPermissionsGranted,
  showPermissionExplanation,
} = usePermissions();
```

### 3. PermissionsManager Component

UI component for permission management:

```typescript
<PermissionsManager
  showOnlyMissing={true}
  onPermissionsGranted={handleSuccess}
  onPermissionsDenied={handlePartial}
/>
```

## Permission Types

### 1. Notifications

- **Purpose**: Push notifications for content updates and reminders
- **Request Method**: `requestNotificationPermissions()`
- **Fallback**: App continues without notifications

### 2. Audio

- **Purpose**: Background audio playback for Bible content
- **Request Method**: Automatic (granted by default in managed workflow)
- **Fallback**: Audio only plays in foreground

### 3. Storage

- **Purpose**: Download and store Bible content locally
- **Request Method**: Automatic (granted by default in managed workflow)
- **Fallback**: No offline content storage

### 4. Background Sync

- **Purpose**: Automatic content synchronization
- **Request Method**: Automatic (depends on build type)
- **Fallback**: Manual sync only

## Integration Points

### 1. App Initialization

Permissions are initialized during app startup:

```typescript
// In App.tsx
const initializeApp = useCallback(async () => {
  // Initialize permissions service first
  await permissionsService.initialize();

  // Continue with other initialization
  await checkOnboardingStatus();
}, []);
```

### 2. Onboarding Flow

Permissions are requested during onboarding:

```typescript
// In onboarding flow
<PermissionsScreen
  onComplete={handleOnboardingComplete}
  onSkip={handleSkipPermissions}
/>
```

### 3. Feature-Specific Requests

Some features request permissions when needed:

```typescript
// Audio playback
const { permissions } = usePermissions();
if (!permissions.audio.granted) {
  showPermissionExplanation('audio');
  return;
}

// Notifications
const handleEnableNotifications = async () => {
  const result = await requestNotificationPermissions();
  if (result.granted) {
    // Enable notification features
  }
};
```

## User Experience

### 1. Permission Request Flow

1. **App Launch**: Permissions are checked automatically
2. **Onboarding**: Users are guided through permission requests
3. **Feature Use**: Permissions are requested when needed
4. **Settings Access**: Users can manage permissions in app settings

### 2. Graceful Degradation

The app continues to function with limited permissions:

- **No Notifications**: App works without push notifications
- **No Background Audio**: Audio only plays in foreground
- **No Storage**: No offline content storage
- **No Background Sync**: Manual sync only

### 3. User Guidance

Clear explanations for each permission:

- **Notifications**: "Get notified about new Bible content and updates"
- **Audio**: "Listen to Bible audio in the background"
- **Storage**: "Download and store content for offline use"
- **Background Sync**: "Keep content updated automatically"

## Testing

### 1. Development Testing

```bash
# Test on iOS Simulator
npm run ios

# Test on Android Emulator
npm run android

# Test on physical device
npm start
```

### 2. Permission Testing Scenarios

- **All Permissions Granted**: Full functionality
- **Some Permissions Denied**: Limited functionality
- **All Permissions Denied**: Basic functionality only
- **Permissions Revoked**: Graceful handling

### 3. Background Testing

- **Background Audio**: Test audio continues in background
- **Background Downloads**: Test downloads continue when app is backgrounded
- **Background Sync**: Test content sync in background

## Troubleshooting

### Common Issues

#### 1. Permissions Not Requested

**Cause**: Permissions service not initialized
**Solution**: Ensure `permissionsService.initialize()` is called during app startup

#### 2. Background Audio Not Working

**Cause**: Missing background modes in app.json
**Solution**: Verify `UIBackgroundModes` includes `"audio"`

#### 3. Notifications Not Received

**Cause**: Notification permissions denied
**Solution**: Guide user to app settings to enable notifications

#### 4. Storage Access Denied

**Cause**: File system permissions not granted
**Solution**: Check if app has access to document directory

### Debug Commands

```bash
# Check current permissions
npx expo doctor

# Validate app configuration
npx expo config --type introspect

# Test permissions on device
npx expo start --tunnel
```

## Security Considerations

### 1. Minimal Permissions

Only request permissions that are absolutely necessary:

- No camera access
- No microphone access (except for audio playback)
- No location access
- No contact access

### 2. Privacy Compliance

- Clear permission explanations
- No tracking across apps
- Secure network communication
- Local data storage only

### 3. User Control

- Users can revoke permissions anytime
- App continues to function with limited permissions
- Clear settings access for permission management

## Best Practices

### 1. Permission Timing

- Request permissions when needed, not all at once
- Explain why each permission is needed
- Provide clear benefits for granting permissions

### 2. User Experience

- Graceful degradation when permissions are denied
- Clear feedback on permission status
- Easy access to app settings

### 3. Error Handling

- Handle permission errors gracefully
- Provide alternative functionality when possible
- Clear error messages and solutions

### 4. Testing

- Test all permission scenarios
- Test on both iOS and Android
- Test with different permission combinations

## Future Considerations

### 1. New Permissions

As the app evolves, new permissions may be needed:

- **Camera**: For future features (unlikely for Bible app)
- **Location**: For region-specific content (if needed)
- **Contacts**: For sharing features (if implemented)

### 2. Platform Changes

Stay updated with platform permission changes:

- iOS permission changes
- Android permission changes
- Expo SDK updates

### 3. User Feedback

Monitor user feedback on permissions:

- Permission grant rates
- User complaints about permissions
- Feature usage with/without permissions
