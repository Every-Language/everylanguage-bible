# Media Player Synchronization - Chapter Tracking & Audio Signals

## Overview

This document explains how the app tracks which chapter is currently playing and ensures proper synchronization between the MediaPlayerSheet and PlayButton components, including the new animated audio signal feature.

## Chapter Tracking System

### 1. Track ID Format

The app uses a consistent track ID format to identify which chapter is playing:

```typescript
// Format: `${bookId}-${chapterId}`
const trackId = `${book.id}-${chapter.id}`;

// Example: "genesis-1" for Genesis Chapter 1
```

### 2. Track Creation in ChapterScreen

```typescript
const createTrackFromChapter = (
  chapter: ChapterWithMetadata,
  mediaFiles?: {
    mediaFiles: Array<{ local_path: string }>;
    totalDuration: number;
    hasAudioFiles: boolean;
  }
): MediaTrack | null => {
  return {
    id: `${book.id}-${chapter.id}`, // ← Consistent ID format
    title: `${book.name} - Chapter ${chapter.chapter_number}`,
    subtitle: `${chapter.total_verses} verses • ${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, '0')}`,
    duration: totalDuration,
    currentTime: 0,
    book: book.name,
    chapter: `Chapter ${chapter.chapter_number}`,
    url: mediaFile.local_path,
  };
};
```

### 3. PlayButton ID Matching

```typescript
// In ChapterCard.tsx
<PlayButton
  type='chapter'
  id={`${chapter.book_id}-${chapter.id}`} // ← Same format as track ID
  onPress={handlePlayPress}
/>

// In PlayButton.tsx
const isCurrentlyPlaying =
  mediaState.currentTrack?.id === id && mediaState.isPlaying; // ← Exact match
```

## Synchronization Flow

### 1. User Interaction Flow

```
User taps PlayButton on ChapterCard
↓
ChapterCard calls onPlay(chapter)
↓
ChapterScreen.handlePlayChapter() creates track with ID: `${book.id}-${chapter.id}`
↓
mediaActions.setCurrentTrack(track) updates Zustand store
↓
AudioService loads and plays audio
↓
AudioService emits 'stateChanged' event with isPlaying: true
↓
useUnifiedMediaPlayer receives event and updates state
↓
All components using useUnifiedMediaPlayer re-render
↓
PlayButton shows animated audio signal (isCurrentlyPlaying = true)
↓
MediaPlayerSheet appears and shows current track info
```

### 2. State Synchronization

```typescript
// useUnifiedMediaPlayer.ts - Single source of truth
const unifiedState: UnifiedMediaPlayerState = useMemo(
  () => ({
    // Track information (from store)
    currentTrack: storeState.currentTrack, // Contains the track ID

    // Playback state (from audio service - single source of truth)
    isPlaying: audioServiceState.isPlaying, // Actual audio state
    isLoaded: audioServiceState.isLoaded,
    isLoading: audioServiceState.isLoading,
    position: audioServiceState.position,
    duration: audioServiceState.duration,
    // ... other state
  }),
  [storeState, audioServiceState]
);
```

### 3. Component State Updates

```typescript
// PlayButton.tsx - Checks if this specific content is playing
const isCurrentlyPlaying =
  mediaState.currentTrack?.id === id && mediaState.isPlaying;

// MediaPlayerSheet.tsx - Shows current track info
const { state } = useUnifiedMediaPlayer();
// state.currentTrack contains the currently playing track
// state.isPlaying contains the actual playback state
```

## Animated Audio Signal

### 1. Implementation

The PlayButton now includes an animated audio signal that appears when the specific chapter is playing:

```typescript
// AnimatedAudioSignal Component
const AnimatedAudioSignal: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => {
  // Three animated bars with staggered timing
  const animation1 = useSharedValue(0);
  const animation2 = useSharedValue(0);
  const animation3 = useSharedValue(0);

  // Staggered animation sequence
  useEffect(() => {
    animation1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      true
    );
    // ... similar for animation2 and animation3
  }, []);

  return (
    <Animated.View style={audioSignalStyles.container}>
      <Animated.View style={[audioSignalStyles.bar, bar1Style]} />
      <Animated.View style={[audioSignalStyles.bar, bar2Style]} />
      <Animated.View style={[audioSignalStyles.bar, bar3Style]} />
    </Animated.View>
  );
};
```

### 2. Usage in PlayButton

```typescript
export const PlayButton: React.FC<PlayButtonProps> = ({
  id,
  showAudioSignal = true, // Default: true
  // ... other props
}) => {
  const isCurrentlyPlaying =
    mediaState.currentTrack?.id === id && mediaState.isPlaying;

  return (
    <TouchableOpacity onPress={handlePress}>
      {isCurrentlyPlaying && showAudioSignal ? (
        <AnimatedAudioSignal
          size={config.iconSize}
          color={theme.colors.textInverse}
        />
      ) : (
        <MaterialIcons
          name={isCurrentlyPlaying ? 'pause' : 'play-arrow'}
          size={config.iconSize}
          color={theme.colors.textInverse}
        />
      )}
    </TouchableOpacity>
  );
};
```

### 3. MediaPlayerSheet Exclusion

The MediaPlayerSheet does NOT show the audio signal because:

1. **Different Purpose**: MediaPlayerSheet is for global controls, not chapter-specific indicators
2. **Clean Interface**: The sheet shows track info and controls, not playing indicators
3. **Consistent Design**: Uses standard play/pause icons for clarity

```typescript
// MediaControls.tsx - Always uses standard icons
<TouchableOpacity onPress={handlePlayPause}>
  <MaterialIcons
    name={state.isPlaying ? 'pause' : 'play-arrow'}
    size={compact ? 28 : 40}
    color={theme.colors.background}
  />
</TouchableOpacity>
```

## Chapter Transition Handling

### 1. When Next Chapter Starts

```typescript
// When user plays a different chapter
const handlePlayChapter = async (chapter: ChapterWithMetadata) => {
  // Check if this chapter is currently playing
  const currentTrackId = `${book.id}-${chapter.id}`;
  const isCurrentlyPlaying =
    mediaState.currentTrack?.id === currentTrackId && mediaState.isPlaying;

  if (isCurrentlyPlaying) {
    // Pause current chapter
    await mediaActions.pause();
    return;
  }

  // Create new track for different chapter
  const track = createTrackFromChapter(chapter, mediaFilesData);
  if (track) {
    mediaActions.setCurrentTrack(track); // Updates currentTrack.id
    mediaActions.play();
  }
};
```

### 2. State Updates During Transition

```
Previous chapter: "genesis-1" playing
User taps: "genesis-2" PlayButton
↓
mediaActions.setCurrentTrack(newTrack) // ID: "genesis-2"
↓
Zustand store updates: currentTrack.id = "genesis-2"
↓
AudioService loads new audio
↓
AudioService emits stateChanged with isPlaying: true
↓
All PlayButtons re-render:
  - "genesis-1" PlayButton: isCurrentlyPlaying = false (shows play icon)
  - "genesis-2" PlayButton: isCurrentlyPlaying = true (shows audio signal)
↓
MediaPlayerSheet updates to show new track info
```

## Error Handling & Edge Cases

### 1. Track ID Mismatch Prevention

```typescript
// Ensure consistent ID format across all components
const createTrackId = (bookId: string, chapterId: string) =>
  `${bookId}-${chapterId}`;

// Use in track creation
id: createTrackId(book.id, chapter.id),

// Use in PlayButton
id: createTrackId(chapter.book_id, chapter.id),
```

### 2. State Consistency

```typescript
// PlayButton checks both track ID and playing state
const isCurrentlyPlaying =
  mediaState.currentTrack?.id === id && mediaState.isPlaying;

// This ensures:
// - Correct chapter is identified
// - Audio is actually playing (not just loaded)
// - UI stays in sync with audio state
```

### 3. Audio Service State Synchronization

```typescript
// AudioService emits events for all state changes
private setState(updates: Partial<AudioServiceState>) {
  const previousState = { ...this.state };
  this.state = { ...this.state, ...updates };

  // Only emit if state actually changed
  if (JSON.stringify(previousState) !== JSON.stringify(this.state)) {
    this.emit({ type: 'stateChanged', state: this.state });
  }
}
```

## Testing Synchronization

### 1. Test Cases

```typescript
describe('Media Player Synchronization', () => {
  it('should show audio signal only on currently playing chapter', () => {
    // Mock media player state
    const mockState = {
      currentTrack: { id: 'genesis-1' },
      isPlaying: true,
    };

    // Test PlayButton for genesis-1 (should show audio signal)
    const playButton1 = render(<PlayButton id="genesis-1" />);
    expect(playButton1.getByTestId('audio-signal')).toBeTruthy();

    // Test PlayButton for genesis-2 (should show play icon)
    const playButton2 = render(<PlayButton id="genesis-2" />);
    expect(playButton2.getByTestId('play-icon')).toBeTruthy();
  });

  it('should update all components when track changes', () => {
    // Simulate track change
    act(() => {
      mediaActions.setCurrentTrack({ id: 'genesis-2' });
      mediaActions.play();
    });

    // Verify all components update
    expect(screen.getByTestId('genesis-1-play-button')).toHaveTextContent('play');
    expect(screen.getByTestId('genesis-2-play-button')).toHaveTextContent('audio-signal');
  });
});
```

### 2. Manual Testing Checklist

- [ ] Play a chapter → Audio signal appears on that chapter's PlayButton
- [ ] Play a different chapter → Audio signal moves to new chapter
- [ ] Pause audio → Audio signal disappears, shows pause icon
- [ ] Resume audio → Audio signal reappears
- [ ] MediaPlayerSheet shows correct track info
- [ ] Multiple PlayButtons on screen stay in sync
- [ ] Audio signal animation is smooth and continuous

## Performance Considerations

### 1. Efficient Re-renders

```typescript
// PlayButton only re-renders when relevant state changes
const isCurrentlyPlaying =
  mediaState.currentTrack?.id === id && mediaState.isPlaying;

// This prevents unnecessary re-renders when:
// - Different chapter starts playing
// - Volume changes
// - UI state changes (expanded/collapsed)
```

### 2. Animation Performance

```typescript
// AnimatedAudioSignal uses native animations
const animation1 = useSharedValue(0);
// withRepeat, withTiming, withSequence run on UI thread
// No JavaScript bridge calls during animation
```

## Future Enhancements

1. **Queue Support**: Track which chapters are queued vs currently playing
2. **Playlist Integration**: Support for chapter playlists with visual indicators
3. **Progress Indicators**: Show chapter progress in PlayButton
4. **Custom Audio Signals**: Allow different audio signal styles per content type
5. **Accessibility**: Screen reader support for playing state

## Conclusion

The synchronization system ensures that:

1. **Exact Chapter Tracking**: Each chapter has a unique track ID
2. **Real-time Updates**: All components stay in sync with audio state
3. **Visual Feedback**: Animated audio signals clearly indicate playing state
4. **Consistent Behavior**: MediaPlayerSheet and PlayButton work together seamlessly
5. **Performance**: Efficient updates without unnecessary re-renders

This creates a cohesive user experience where users can easily identify which chapter is playing and control playback from multiple interface points.
