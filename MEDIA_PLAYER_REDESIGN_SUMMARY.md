# Media Player Redesign Summary

## Problem Analysis

The "Maximum update depth exceeded" error was caused by a **circular dependency loop** between the AudioService callbacks and the Zustand store updates. Here's the problematic flow:

1. **AudioService** calls `onPlaybackStatusUpdate` → triggers `onProgress` callback
2. **onProgress callback** calls `actions.updateProgress()` → updates Zustand store
3. **Zustand store** has `subscribeToAudioService()` → calls `syncWithAudioService()` every 1 second
4. **syncWithAudioService** calls `audioService.getState()` and updates store again
5. **Store updates** trigger re-renders → `useAudioService` hook re-creates callbacks
6. **Re-created callbacks** are set on AudioService → cycle repeats

### Root Causes

1. **Dual state management**: Both AudioService and Zustand store managed the same state
2. **Circular callbacks**: AudioService callbacks updated store, store synced back to AudioService
3. **Frequent re-renders**: Store updates every second + progress updates every 250ms
4. **Callback recreation**: `useCallback` dependencies caused callbacks to be recreated frequently

## Solution Architecture

### 1. Event-Based AudioService

**Before**: Callback-based state updates

```typescript
// Old approach - circular dependencies
setCallbacks({
  onProgress: position => actions.updateProgress(position),
  onPlay: () => actions.play(),
  onPause: () => actions.pause(),
  // ... more callbacks
});
```

**After**: Event-based system with subscribers

```typescript
// New approach - unidirectional flow
audioService.subscribe(event => {
  switch (event.type) {
    case 'stateChanged':
      setAudioServiceState(event.state);
      break;
    case 'trackEnded':
      storeActions.stop();
      break;
    case 'error':
      onError?.(event.error);
      break;
  }
});
```

### 2. Single Source of Truth

**AudioService** is now the single source of truth for:

- Playback state (`isPlaying`, `isLoaded`, `isLoading`)
- Audio position and duration
- Audio-specific errors

**Zustand Store** manages:

- UI state (`isExpanded`, `volume`, `playbackRate`)
- Queue management
- Track metadata

### 3. Unified Media Player Hook

Created `useUnifiedMediaPlayer` that:

- Combines store and audio service state
- Provides a single, consistent interface
- Eliminates the need for complex synchronization
- Prevents circular dependencies

```typescript
const { state, actions } = useUnifiedMediaPlayer({
  autoPlay: false,
  onError: error => Alert.alert('Error', error),
});

// state contains unified data from both sources
// actions work with both store and audio service
```

## Key Changes

### AudioService.ts

- ✅ Removed callback-based state updates
- ✅ Added event-based subscription system
- ✅ Simplified state management
- ✅ Better error handling
- ✅ Cleaner API

### mediaPlayerStore.ts

- ✅ Removed `syncWithAudioService` mechanism
- ✅ Removed `subscribeToAudioService`
- ✅ Simplified to only manage UI state
- ✅ No more circular dependencies

### useUnifiedMediaPlayer.ts (NEW)

- ✅ Single interface for both store and audio service
- ✅ Event-based state synchronization
- ✅ Optimistic UI updates
- ✅ Proper error handling
- ✅ Type-safe implementation

### Component Updates

- ✅ Updated `MediaPlayerSheet` to use unified hook
- ✅ Updated `AudioPlayerExample` to use unified hook
- ✅ Updated `ChapterScreen` to use unified hook
- ✅ Removed old `useAudioService` usage

## Benefits

### 1. **Eliminated Infinite Loops**

- No more circular dependencies
- Unidirectional data flow
- Predictable state updates

### 2. **Better Performance**

- Reduced re-renders
- No more frequent store updates
- Optimized event handling

### 3. **Cleaner Architecture**

- Single source of truth for each concern
- Clear separation of responsibilities
- Easier to debug and maintain

### 4. **Improved Developer Experience**

- Single hook for all media player needs
- Type-safe interfaces
- Better error handling

### 5. **Future-Proof**

- Easy to extend with new features
- Modular design
- Testable components

## Migration Guide

### For Components Using Media Player

**Before:**

```typescript
import { useAudioService } from '@/features/media/hooks/useAudioService';

const { state, actions, audioServiceState, isAudioServiceReady } =
  useAudioService({
    autoPlay: false,
    onError: error => console.error(error),
    onLoad: duration => console.log(duration),
  });
```

**After:**

```typescript
import { useUnifiedMediaPlayer } from '@/features/media/hooks/useUnifiedMediaPlayer';

const { state, actions } = useUnifiedMediaPlayer({
  autoPlay: false,
  onError: error => console.error(error),
});
```

### State Access

**Before:**

```typescript
// Separate state objects
const isPlaying = state.isPlaying; // from store
const audioIsPlaying = audioServiceState.isPlaying; // from audio service
```

**After:**

```typescript
// Unified state
const isPlaying = state.isPlaying; // from audio service (single source of truth)
const isExpanded = state.isExpanded; // from store
```

### Actions

**Before:**

```typescript
// Actions might not sync properly
await actions.play(); // might not update audio service
```

**After:**

```typescript
// Actions work with both store and audio service
await actions.play(); // updates both store and audio service
```

## Testing

The new architecture is much easier to test:

1. **AudioService**: Test events and state changes
2. **Store**: Test UI state management
3. **Unified Hook**: Test integration and state synchronization
4. **Components**: Test with unified state and actions

## Conclusion

This redesign successfully eliminates the "Maximum update depth exceeded" error by:

1. **Breaking the circular dependency** between AudioService and store
2. **Establishing a single source of truth** for each type of state
3. **Creating a unified interface** that's easier to use and maintain
4. **Improving performance** by reducing unnecessary re-renders
5. **Making the codebase more maintainable** with clear separation of concerns

The new architecture is more robust, performant, and easier to work with while maintaining all existing functionality.
