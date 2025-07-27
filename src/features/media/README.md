# Media Feature - Audio Service

This module provides a comprehensive audio service for playing local audio files in the Bible app using Expo Audio.

## Features

- **Local Audio Playback**: Play audio files stored locally on the device
- **Background Playback**: Audio continues playing when app is in background
- **Volume Control**: Adjust volume from 0.0 to 1.0
- **Playback Rate**: Control playback speed from 0.25x to 4x
- **Seeking**: Jump to specific positions in the audio
- **Progress Tracking**: Real-time progress updates
- **Error Handling**: Comprehensive error handling with retry logic
- **File Validation**: Validate audio files before playback
- **Integration**: Seamless integration with existing MediaPlayerContext

## Architecture

### Core Components

1. **AudioService** (`services/AudioService.ts`)
   - Main service class that handles all audio operations
   - Uses Expo Audio for native audio playback
   - Manages audio state and provides callbacks

2. **useAudioService Hook** (`hooks/useAudioService.ts`)
   - React hook that integrates AudioService with MediaPlayerContext
   - Provides enhanced actions that work with the audio service
   - Handles state synchronization between service and context

3. **Audio Utilities** (`utils/audioUtils.ts`)
   - File validation and metadata utilities
   - Retry logic for audio loading
   - Audio file information helpers

## Usage

### Basic Usage

```typescript
import { useAudioService } from '@/features/media/hooks/useAudioService';
import { MediaTrack } from '@/shared/context/MediaPlayerContext';

const MyComponent = () => {
  const { state, actions, audioServiceState } = useAudioService({
    autoPlay: false,
    onError: (error) => console.error('Audio error:', error),
    onLoad: (duration) => console.log('Audio loaded:', duration),
  });

  const handlePlayAudio = async () => {
    const track: MediaTrack = {
      id: 'audio-1',
      title: 'Bible Chapter 1',
      subtitle: 'Genesis 1',
      duration: 180, // seconds
      currentTime: 0,
      url: '/path/to/audio/file.mp3',
    };

    await actions.setCurrentTrack(track);
    await actions.play();
  };

  return (
    <View>
      <Text>Is Playing: {state.isPlaying ? 'Yes' : 'No'}</Text>
      <Text>Progress: {state.currentTrack?.currentTime || 0}s</Text>
      <TouchableOpacity onPress={handlePlayAudio}>
        <Text>Play Audio</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Advanced Usage

```typescript
import { audioService } from '@/features/media/services/AudioService';

// Direct service usage
const handleAdvancedAudio = async () => {
  try {
    // Load audio file
    await audioService.loadAudio(track);

    // Set volume
    await audioService.setVolume(0.8);

    // Set playback rate
    await audioService.setPlaybackRate(1.5);

    // Play audio
    await audioService.play();

    // Seek to specific position
    await audioService.seekTo(30); // 30 seconds

    // Pause
    await audioService.pause();

    // Stop and reset
    await audioService.stop();
  } catch (error) {
    console.error('Audio operation failed:', error);
  }
};
```

### Audio File Requirements

The audio service supports various audio formats supported by Expo Audio:

- **MP3** (recommended)
- **WAV**
- **AAC**
- **M4A**
- **FLAC** (Android only)

### File Paths

For local files, use the following path formats:

```typescript
// Android
const androidPath = 'file:///storage/emulated/0/Download/audio.mp3';

// iOS
const iosPath = 'file:///var/mobile/Containers/Data/Application/.../audio.mp3';

// Expo FileSystem
const expoPath = `${FileSystem.documentDirectory}audio.mp3`;
```

## API Reference

### AudioService

#### Methods

- `loadAudio(track: MediaTrack): Promise<void>`
  - Load an audio file for playback
  - Validates the file before loading
  - Supports retry logic for failed loads

- `play(): Promise<void>`
  - Start audio playback
  - Throws error if no audio is loaded

- `pause(): Promise<void>`
  - Pause audio playback
  - No-op if no audio is loaded

- `stop(): Promise<void>`
  - Stop playback and reset position to 0
  - No-op if no audio is loaded

- `seekTo(position: number): Promise<void>`
  - Seek to specific position in seconds
  - Position is clamped between 0 and duration

- `setVolume(volume: number): Promise<void>`
  - Set volume (0.0 to 1.0)
  - Volume is clamped to valid range

- `setPlaybackRate(rate: number): Promise<void>`
  - Set playback speed (0.25x to 4x)
  - Rate is clamped to valid range

- `setMuted(muted: boolean): Promise<void>`
  - Mute or unmute audio
  - Temporarily sets volume to 0 when muted

#### Properties

- `getState(): AudioServiceState`
  - Get current audio service state

- `isLoaded(): boolean`
  - Check if audio is currently loaded

- `isPlaying(): boolean`
  - Check if audio is currently playing

- `getPosition(): number`
  - Get current playback position in seconds

- `getDuration(): number`
  - Get total audio duration in seconds

### useAudioService Hook

#### Options

```typescript
interface UseAudioServiceOptions {
  autoPlay?: boolean; // Auto-play when track is loaded
  onError?: (error: string) => void; // Error callback
  onLoad?: (duration: number) => void; // Load callback
}
```

#### Return Value

```typescript
{
  state: MediaPlayerState,           // Current media player state
  actions: EnhancedActions,          // Enhanced actions with audio service
  audioServiceState: AudioServiceState, // Current audio service state
  isAudioServiceReady: boolean,      // Whether audio service is ready
  currentAudioTrack: MediaTrack | null, // Current track from audio service
}
```

## Error Handling

The audio service includes comprehensive error handling:

1. **File Validation**: Checks file existence, size, and format
2. **Retry Logic**: Automatically retries failed operations with exponential backoff
3. **Error Callbacks**: Provides error callbacks for UI feedback
4. **Graceful Degradation**: Falls back to context-only actions when audio service fails

### Common Errors

- `File does not exist`: Audio file path is invalid
- `File is empty or corrupted`: Audio file is not valid
- `File size too small/large`: File size is outside acceptable range
- `Failed to load audio`: General loading error
- `No audio loaded`: Attempting to play without loading audio first

## Performance Considerations

1. **Memory Management**: Audio files are automatically unloaded when new files are loaded
2. **Progress Updates**: Progress is updated every 100ms for smooth UI updates
3. **Background Playback**: Audio continues in background with proper mode configuration
4. **File Validation**: Files are validated before loading to prevent crashes

## Integration with Existing Code

The audio service is designed to work seamlessly with the existing `MediaPlayerContext`:

1. **State Synchronization**: Audio service state is synchronized with context state
2. **Action Enhancement**: Context actions are enhanced to work with audio service
3. **Backward Compatibility**: Falls back to context-only behavior when audio service is unavailable
4. **Type Safety**: Full TypeScript support with proper type definitions

## Example Implementation

See `AudioPlayerExample.tsx` for a complete example of how to use the audio service in a React component.

## Troubleshooting

### Audio Not Playing

1. Check file path is correct and accessible
2. Verify file format is supported
3. Ensure audio permissions are granted
4. Check device volume is not muted

### Performance Issues

1. Use appropriate file sizes (1KB - 1GB recommended)
2. Consider audio compression for large files
3. Monitor memory usage with multiple audio files

### Background Playback Issues

1. Ensure audio mode is properly configured
2. Check device background app refresh settings
3. Verify audio session is not interrupted by other apps
