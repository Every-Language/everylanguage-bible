# Audio Version Validation Implementation

## Overview

This document outlines the implementation of audio version validation to ensure that users have selected an appropriate audio version before downloading or playing audio content.

## Problem Statement

The app previously had significant gaps in enforcing audio version checking:

- No validation before downloads
- No validation before playback
- Hardcoded version usage instead of selected version
- Inconsistent version handling across components

## Solution Implemented

### 1. Audio Version Validation Service

**File**: `src/features/languages/services/audioVersionValidationService.ts`

A centralized service that provides:

- `validateAudioVersion()` - General validation
- `validateForDownload()` - Download-specific validation
- `validateForPlayback()` - Playback-specific validation
- `validateVersionForChapter()` - Chapter-specific validation with audio availability check

**Key Features**:

- Context-aware error messages
- Comprehensive validation logic
- Integration with media files service
- Proper error handling and logging

### 2. Audio Version Validation Hook

**File**: `src/features/media/hooks/useAudioVersionValidation.ts`

A React hook that provides:

- `validateForPlayback()` - Validates before audio playback
- `validateForDownload()` - Validates before downloads
- `getValidationError()` - Returns user-friendly error messages

### 3. Updated Components

#### ChapterDownloadModal

**File**: `src/features/downloads/components/ChapterDownloadModal.tsx`

**Changes**:

- Added audio version validation before search
- Added audio version validation before download
- Uses selected audio version instead of hardcoded version
- Displays validation errors in UI
- Prevents download when no valid audio version is selected

#### Unified Media Player

**File**: `src/features/media/hooks/useUnifiedMediaPlayer.ts`

**Changes**:

- Added audio version validation to `play()` method
- Prevents playback when no valid audio version is selected
- Provides clear error messages to users

#### VersesScreenOptimized

**File**: `src/features/bible/screens/VersesScreenOptimized.tsx`

**Changes**:

- Added audio version validation before showing download modal
- Only shows download modal when valid audio version is selected
- Prevents unnecessary download prompts

#### BackgroundDownloadsScreen

**File**: `src/features/downloads/screens/BackgroundDownloadsScreen.tsx`

**Changes**:

- Added audio version validation for playback
- Validation is handled through unified media player

### 4. Media Search Updates

**File**: `src/features/downloads/hooks/useMediaSearch.ts`

**Changes**:

- Updated to use provided version ID instead of hardcoded version
- More flexible version handling

## Validation Flow

### Download Flow

1. User attempts to download audio
2. System validates current audio version selection
3. If valid, checks audio availability for specific chapter
4. If available, proceeds with download using selected version
5. If invalid, shows error message and prevents download

### Playback Flow

1. User attempts to play audio
2. System validates current audio version selection
3. If valid, proceeds with playback
4. If invalid, shows error message and prevents playback

## Error Messages

The system provides context-aware error messages:

- **Download**: "Please select an audio version before downloading audio files."
- **Playback**: "Please select an audio version before playing audio."
- **General**: "Please select an audio version to continue."
- **Invalid Version**: "Selected audio version is invalid. Please choose a different version."
- **No Audio Available**: "No audio files available for this chapter in the selected version."

## Testing

**File**: `src/features/languages/services/__tests__/audioVersionValidationService.test.ts`

Comprehensive test coverage for:

- Valid audio version validation
- Null audio version handling
- Invalid audio version properties
- Download and playback validation
- Chapter-specific validation

## Benefits

1. **User Experience**: Clear guidance when audio version is not selected
2. **Data Integrity**: Ensures downloads use correct audio version
3. **Error Prevention**: Prevents failed downloads and playback attempts
4. **Consistency**: Unified validation across all audio-related features
5. **Maintainability**: Centralized validation logic

## Future Enhancements

1. **Onboarding**: Add audio version selection to onboarding flow
2. **Quick Selection**: Add quick audio version selection from error messages
3. **Fallback Versions**: Implement fallback to default versions
4. **Caching**: Cache validation results for better performance
5. **Analytics**: Track validation failures for user experience insights

## Migration Notes

- Existing downloads will continue to work
- Users without selected audio versions will see validation errors
- No breaking changes to existing functionality
- Backward compatible with existing audio files
