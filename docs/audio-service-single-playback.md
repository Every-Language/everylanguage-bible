# Audio Service - Single Audio Playback Implementation

## Overview

The AudioService has been enhanced to ensure robust single-audio playback throughout the application. This implementation prevents multiple audio files from playing simultaneously and provides better state management and error handling.

## Key Features

### 🔒 **Single Audio Guarantee**

- Only one audio file can be loaded and played at any time
- Automatic unloading of previous audio when loading new audio
- Race condition prevention for rapid audio loading operations

### 🛡️ **Robust State Management**

- Comprehensive state tracking for loading, playing, and error states
- Automatic state synchronization between AudioService and MediaPlayerContext
- Proper cleanup and disposal mechanisms

### ⚡ **Performance Optimizations**

- Early return for already-loaded tracks
- Efficient state updates with minimal re-renders
- Optimized progress tracking

## Implementation Details

### AudioService Enhancements

#### Race Condition Prevention

```typescript
private loadingPromise: Promise<void> | null = null;

async loadAudio(track: MediaTrack): Promise<void> {
  // Prevent race conditions - if already loading, wait for current operation
  if (this.loadingPromise) {
    await this.loadingPromise;
  }

  // If this is the same track and already loaded, just return
  if (this.currentTrack?.id === track.id && this.state.isLoaded) {
    return;
  }

  this.loadingPromise = this._loadAudioInternal(track);
  try {
    await this.loadingPromise;
  } finally {
    this.loadingPromise = null;
  }
}
```

#### Automatic Audio Stopping

```typescript
private async _loadAudioInternal(track: MediaTrack): Promise<void> {
  // Stop any currently playing audio and unload previous audio
  await this.stop();
  await this.unloadAudio();

  // Load new audio...
}
```

#### Enhanced State Management

```typescript
isLoaded(): boolean {
  return this.state.isLoaded && this.player?.isLoaded === true && !this.isDisposed;
}

isPlaying(): boolean {
  return this.state.isPlaying && this.player?.playing === true && !this.isDisposed;
}

isLoading(): boolean {
  return this.state.isLoading || this.loadingPromise !== null;
}
```

### MediaPlayerContext Synchronization

The MediaPlayerContext now automatically synchronizes with the AudioService state:

```typescript
useEffect(() => {
  const syncWithAudioService = () => {
    const audioState = audioService.getState();
    const currentAudioTrack = audioService.getCurrentTrack();

    setState(prev => ({
      ...prev,
      isPlaying: audioState.isPlaying,
      isLoading: audioState.isLoading,
      currentTrack: currentAudioTrack
        ? {
            // Map audio service track to context track
          }
        : null,
    }));
  };

  // Sync every 500ms
  const syncInterval = setInterval(syncWithAudioService, 500);
  return () => clearInterval(syncInterval);
}, []);
```

## Usage Patterns

### Loading New Audio

```typescript
// This will automatically stop any currently playing audio
await audioService.loadAudio(newTrack);
await audioService.play();
```

### Checking Current State

```typescript
if (audioService.isLoaded()) {
  // Audio is ready to play
}

if (audioService.isPlaying()) {
  // Audio is currently playing
}

if (audioService.isLoading()) {
  // Audio is currently loading
}
```

### Force Stopping All Audio

```typescript
// Emergency stop - useful for cleanup
await audioService.forceStop();
```

## Error Handling

### Graceful Error Recovery

- Failed audio loading automatically resets state
- Current track is cleared on errors
- Proper error propagation to callbacks

### Disposal Safety

- All operations check if service is disposed
- Proper cleanup of resources
- Prevention of operations on disposed service

## Testing

Comprehensive tests ensure single-audio playback:

```typescript
it('should ensure only one audio file is loaded at a time', async () => {
  await audioService.loadAudio(track1);
  await audioService.loadAudio(track2);

  expect(audioService.getCurrentTrack()?.id).toBe('track2');
  expect(audioService.isLoaded()).toBe(true);
});

it('should prevent race conditions when loading multiple tracks rapidly', async () => {
  const loadPromises = [
    audioService.loadAudio(track1),
    audioService.loadAudio(track2),
    audioService.loadAudio(track3),
  ];

  await Promise.all(loadPromises);
  expect(audioService.getCurrentTrack()?.id).toBe('track3');
});
```

## Integration with Background Downloads

The BackgroundDownloadsScreen now properly integrates with the enhanced audio service:

```typescript
const handlePlayAudio = async (download: any) => {
  // Handle play/pause for current track
  if (mediaState.currentTrack?.id === download.id) {
    if (mediaState.isPlaying) {
      await audioService.pause();
    } else {
      await audioService.play();
    }
    return;
  }

  // Load new track - automatically stops current audio
  const track = {
    /* track data */
  };
  mediaActions.setCurrentTrack(track);
  await audioService.loadAudio(track);
  await audioService.play();
};
```

## Benefits

1. **User Experience**: No overlapping audio playback
2. **Resource Management**: Efficient memory and CPU usage
3. **Reliability**: Robust error handling and state management
4. **Performance**: Optimized loading and state updates
5. **Maintainability**: Clear separation of concerns and comprehensive testing

## Migration Notes

- Existing code continues to work without changes
- Enhanced error handling provides better debugging information
- New methods available for advanced use cases
- Backward compatible with existing MediaPlayerContext usage
