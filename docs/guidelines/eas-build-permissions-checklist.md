# EAS Build Permissions Checklist

## Pre-Build Checklist

### ✅ Required Assets

- [ ] App icon (icon.png) - 1024x1024px
- [ ] Adaptive icon (adaptive-icon.png) - 1024x1024px (Android)
- [ ] Splash screen (splash.png) - 1284x2778px recommended
- [ ] Notification icon (notification-icon.png) - 96x96px (optional)
- [ ] Notification sound (notification-sound.wav) (optional)

### ✅ App Configuration

- [ ] `app.json` has valid bundle identifier/package name
- [ ] All plugin configurations are correct
- [ ] Background modes are properly configured
- [ ] Permission descriptions are clear and accurate

### ✅ Dependencies

- [ ] All dependencies are installed (`npm install` or `yarn install`)
- [ ] No conflicting dependency versions
- [ ] All required Expo SDK packages are included

## Permission Configuration

### iOS Permissions

- [ ] `UIBackgroundModes` includes required modes:
  - [ ] `background-fetch`
  - [ ] `background-processing`
  - [ ] `audio`
  - [ ] `remote-notification`
- [ ] All privacy descriptions are provided:
  - [ ] `NSMicrophoneUsageDescription`
  - [ ] `NSLocationUsageDescription`
  - [ ] `NSLocalNetworkUsageDescription`
  - [ ] `NSUserTrackingUsageDescription`

### Android Permissions

- [ ] Core permissions are included:
  - [ ] `INTERNET`
  - [ ] `ACCESS_NETWORK_STATE`
  - [ ] `WAKE_LOCK`
  - [ ] `FOREGROUND_SERVICE`
  - [ ] `RECEIVE_BOOT_COMPLETED`
  - [ ] `VIBRATE`
- [ ] Storage permissions (if needed):
  - [ ] `WRITE_EXTERNAL_STORAGE` (deprecated, use scoped storage)
  - [ ] `READ_EXTERNAL_STORAGE` (deprecated, use scoped storage)

### Plugin Configuration

- [ ] `expo-notifications` is properly configured
- [ ] `expo-audio` has `microphonePermission: false`
- [ ] `expo-background-task` has correct background modes
- [ ] `expo-location` has proper permission descriptions
- [ ] `expo-file-system` has correct permission settings

## Development Build Specific

### ✅ Development Profile

- [ ] `eas.json` has proper development configuration
- [ ] iOS simulator builds are enabled for development
- [ ] Android APK builds are configured
- [ ] Environment variables are set correctly

### ✅ Code Changes

- [ ] PermissionsService handles development builds gracefully
- [ ] Background tasks are disabled in development mode
- [ ] Error handling is in place for missing permissions
- [ ] Fallback behavior is implemented

## Build Commands

### Quick Build Commands

```bash
# iOS Development Build
eas build --profile development --platform ios

# Android Development Build
eas build --profile development --platform android

# Both Platforms
eas build --profile development
```

### Validation Commands

```bash
# Check project configuration
npx expo config --type introspect

# Validate dependencies
npx expo doctor

# Check for common issues
npm run lint
npm run type-check
```

## Common Issues & Solutions

### ❌ Build Fails Due to Missing Assets

**Solution**: Remove asset references from `app.json` or add placeholder assets

### ❌ Permission Denied Errors

**Solution**: Ensure all permission descriptions are provided and accurate

### ❌ Background Task Registration Fails

**Solution**: Background tasks are not supported in development builds - handle gracefully

### ❌ Plugin Configuration Errors

**Solution**: Check plugin documentation and ensure all required fields are provided

### ❌ Dependency Conflicts

**Solution**: Update to compatible versions and resolve conflicts

## Testing Permissions

### After Build Installation

1. **Launch the app** and check for permission requests
2. **Test notification permissions** - should request on first use
3. **Test audio playback** - should work in background
4. **Test file downloads** - should work with proper permissions
5. **Test location features** - should request location permission

### Permission States to Test

- [ ] All permissions granted
- [ ] Some permissions denied
- [ ] All permissions denied
- [ ] Permissions revoked after initial grant

## Troubleshooting

### Build Logs

- Check EAS dashboard for detailed build logs
- Look for permission-related errors
- Verify all assets are found

### Runtime Issues

- Use `expo-logs` to view runtime logs
- Check permission status in app settings
- Verify background task registration

### Platform-Specific Issues

- **iOS**: Check Info.plist configuration
- **Android**: Check AndroidManifest.xml permissions
- **Development**: Ensure development-specific code paths

## Best Practices

### Permission Requests

- Request permissions when needed, not all at once
- Provide clear explanations for each permission
- Handle permission denials gracefully
- Offer alternative functionality when possible

### Development vs Production

- Use different permission strategies for development and production
- Disable background tasks in development
- Provide fallbacks for missing permissions
- Test both permission scenarios

### User Experience

- Don't block app functionality for non-critical permissions
- Provide clear feedback on permission status
- Offer easy access to app settings
- Implement graceful degradation

## Resources

- [Expo Permissions Documentation](https://docs.expo.dev/versions/latest/sdk/permissions/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [iOS Permission Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios/user-interaction/requesting-permission/)
- [Android Permission Guidelines](https://developer.android.com/training/permissions/requesting)
