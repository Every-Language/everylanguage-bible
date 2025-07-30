# Media Player Unification - Architecture & Implementation

## Overview

This document outlines the unified media player architecture that ensures all media controls and actions use the `useUnifiedMediaPlayer` hook with proper Zustand store and TanStack Query integration.

## Architecture Components

### 1. Unified Media Player Hook (`useUnifiedMediaPlayer`)

**Location**: `src/features/media/hooks/useUnifiedMediaPlayer.ts`

**Purpose**: Provides a unified interface that combines:

- Zustand store state management
- Audio service integration
- TanStack Query for data fetching
- Error handling and state synchronization

**Key Features**:

- Single source of truth for media state
- Optimistic UI updates
- Proper error handling
- Background audio support
- State persistence

### 2. Zustand Store (`mediaPlayerStore`)

**Location**: `src/shared/store/mediaPlayerStore.ts`

**Purpose**: Manages persistent media player state including:

- Current track information
- Playback state
- Queue management
- UI state (expanded/collapsed)
- Volume and playback rate settings

### 3. Audio Service (`AudioService`)

**Location**: `src/features/media/services/AudioService.ts`

**Purpose**: Handles native audio playback using Expo Audio:

- File loading and validation
- Playback controls
- Progress tracking
- Error handling with retry logic

### 4. TanStack Query Integration

**Location**: `src/features/media/hooks/useChapterAudioInfo.ts`

**Purpose**: Provides efficient data fetching for:

- Chapter audio availability
- Media file metadata
- Caching and background updates

## Updated Components

All media-related components have been updated to use `useUnifiedMediaPlayer`:

### ✅ Updated Components

1. **MediaControls** (`src/features/media/components/MediaControls.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Handles play/pause, seek, skip controls

2. **VersesScreen** (`src/features/bible/screens/VersesScreen.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Handles verse and chapter playback

3. **VersesScreenOptimized** (`src/features/bible/screens/VersesScreenOptimized.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Optimized verse playback with TanStack Query

4. **TextAndQueueTabs** (`src/features/media/components/TextAndQueueTabs.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Displays current track information

5. **TrackDetails** (`src/features/media/components/TrackDetails.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Shows track information and controls

6. **TrackDetailsCollapsed** (`src/features/media/components/TrackDetailsCollapsed.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Compact track display

7. **PlayButton** (`src/shared/components/ui/PlayButton.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Universal play/pause button component

8. **ChapterQueueExample** (`src/features/media/components/ChapterQueueExample.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Chapter queue management

9. **BackgroundDownloadsScreen** (`src/features/downloads/screens/BackgroundDownloadsScreen.tsx`)
   - ✅ Uses `useUnifiedMediaPlayer`
   - ✅ Download management with playback

10. **MediaPlayerSheet** (`src/features/media/components/MediaPlayerSheet.tsx`)
    - ✅ Uses `useUnifiedMediaPlayer`
    - ✅ Bottom sheet media player interface

### ✅ Already Using Unified Architecture

- **AudioPlayerExample** - Already using `useUnifiedMediaPlayer`
- **ChapterScreen** - Already using `useUnifiedMediaPlayer`

## Data Flow

### 1. User Interaction Flow

```
User taps play → Component calls useUnifiedMediaPlayer →
setCurrentTrack() → Zustand store update → AudioService load →
TanStack Query fetch (if needed) → Audio playback starts
```

### 2. State Synchronization Flow

```
AudioService events → useUnifiedMediaPlayer → Zustand store →
Component re-renders → UI updates
```

### 3. Data Fetching Flow

```
Component needs audio data → TanStack Query →
ChapterQueueService → MediaFilesService →
Database → Cached response → Component updates
```

## Key Benefits

### 1. **Consistency**

- All components use the same media player interface
- Unified state management across the app
- Consistent error handling

### 2. **Performance**

- TanStack Query provides efficient caching
- Optimistic UI updates for better UX
- Background data fetching

### 3. **Reliability**

- Proper error handling and retry logic
- State persistence across app sessions
- Background audio support

### 4. **Maintainability**

- Single source of truth for media state
- Clear separation of concerns
- Type-safe interfaces

## Usage Examples

### Basic Usage

```typescript
import { useUnifiedMediaPlayer } from '@/features/media/hooks/useUnifiedMediaPlayer';

const MyComponent = () => {
  const { state, actions } = useUnifiedMediaPlayer({
    autoPlay: false,
    onError: (error) => console.error('Media error:', error),
  });

  const handlePlay = async () => {
    const track = {
      id: 'chapter-1',
      title: 'Genesis Chapter 1',
      subtitle: 'Bible Study',
      duration: 180,
      currentTime: 0,
      url: '/path/to/audio.mp3',
    };

    await actions.setCurrentTrack(track);
    await actions.play();
  };

  return (
    <View>
      <Text>Playing: {state.currentTrack?.title}</Text>
      <Text>Progress: {state.position}s / {state.duration}s</Text>
      <TouchableOpacity onPress={handlePlay}>
        <Text>Play</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### With TanStack Query

```typescript
import { useChapterMediaFiles } from '@/features/media/hooks/useChapterAudioInfo';

const ChapterComponent = () => {
  const { data: mediaFiles } = useChapterMediaFiles(chapterId);
  const { actions } = useUnifiedMediaPlayer();

  const handlePlayChapter = async () => {
    if (mediaFiles?.hasAudioFiles) {
      const track = createTrackFromMediaFiles(mediaFiles);
      await actions.setCurrentTrack(track);
      await actions.play();
    }
  };

  return (
    <PlayButton
      type="chapter"
      id={chapterId}
      onPress={handlePlayChapter}
      disabled={!mediaFiles?.hasAudioFiles}
    />
  );
};
```

## Error Handling

The unified media player provides comprehensive error handling:

```typescript
const { state, actions } = useUnifiedMediaPlayer({
  onError: error => {
    // Handle media errors
    Alert.alert('Playback Error', error);
  },
});

// Errors are automatically handled for:
// - File loading failures
// - Playback errors
// - Network issues
// - Invalid audio files
```

## Testing

All components should be tested with the unified media player:

```typescript
// Mock the unified media player for testing
jest.mock('@/features/media/hooks/useUnifiedMediaPlayer', () => ({
  useUnifiedMediaPlayer: () => ({
    state: {
      currentTrack: mockTrack,
      isPlaying: false,
      // ... other state
    },
    actions: {
      setCurrentTrack: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      // ... other actions
    },
  }),
}));
```

## Migration Checklist

- ✅ All components updated to use `useUnifiedMediaPlayer`
- ✅ Zustand store properly integrated
- ✅ TanStack Query integration complete
- ✅ Error handling implemented
- ✅ Type safety maintained
- ✅ Performance optimizations in place
- ✅ Background audio support working
- ✅ State persistence configured

## Future Enhancements

1. **Queue Management**: Enhanced queue operations with drag-and-drop
2. **Playlist Support**: Create and manage playlists
3. **Audio Effects**: Equalizer and audio filters
4. **Offline Support**: Better offline playback handling
5. **Analytics**: Track playback statistics
6. **Accessibility**: Enhanced accessibility features

## Conclusion

The unified media player architecture ensures consistent, reliable, and performant media playback across the entire application. All components now use the same interface, providing a seamless user experience while maintaining code quality and maintainability.
