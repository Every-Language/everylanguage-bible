# Queue System Implementation

## Overview

The queue system provides a sophisticated audio playback management system with two types of queues:

1. **User Queue**: User-generated queue items that take priority over automatic queue
2. **Automatic Queue**: Automatically populated with the next 5 chapters following the currently playing chapter

## Architecture

### Types (`src/types/queue.ts`)

- `QueueItem`: Represents a single item in the queue (chapter, passage, or playlist)
- `Queue`: Contains an array of queue items with current index and active state
- `QueueState`: Manages both user and automatic queues with priority system

### Store (`src/shared/store/queueStore.ts`)

The queue store provides the following functionality:

#### User Queue Management

- `addToUserQueueFront()`: Add item to the front of user queue
- `addToUserQueueBack()`: Add item to the back of user queue
- `removeFromUserQueue()`: Remove item at specific index
- `reorderUserQueue()`: Reorder items in user queue
- `clearUserQueue()`: Clear all items from user queue

#### Automatic Queue Management

- `populateAutomaticQueue()`: Populate with next 5 chapters from a starting point
- `clearAutomaticQueue()`: Clear automatic queue

#### Queue Navigation

- `playNext()`: Move to next item in active queue
- `playPrevious()`: Move to previous item in active queue
- `getCurrentItem()`: Get current item from active queue

#### Queue State

- `setUserQueueActive()`: Set whether user queue has priority
- `getActiveQueue()`: Get the currently active queue
- `getQueueLength()`: Get length of active queue

## Integration with Audio Store

The audio store (`src/shared/store/audioStore.ts`) has been updated to integrate with the queue system:

- `playNext()` and `playPrevious()` methods now check the queue system first
- `playFromQueueItem()` method to start playing from a specific queue item
- Automatic queue repopulation when user queue items start playing

## Usage Examples

### Adding a Chapter to User Queue

```typescript
import { useQueueStore } from '@/shared/store';

const queueStore = useQueueStore();

const chapter = {
  id: 'john-1',
  book_name: 'John',
  chapter_number: 1,
  title: 'John Chapter 1',
  audio_file_url: 'https://example.com/john-1.mp3',
  duration_seconds: 600,
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Add to front of queue
queueStore.addToUserQueueFront({
  type: 'chapter',
  data: chapter,
});

// Add to back of queue
queueStore.addToUserQueueBack({
  type: 'chapter',
  data: chapter,
});
```

### Adding a Passage to Queue

```typescript
const passage = {
  id: 'passage-1',
  chapter_id: 'john-1',
  start_verse: 1,
  end_verse: 5,
  start_time_seconds: 0,
  end_time_seconds: 120,
  title: 'John 1:1-5',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

queueStore.addToUserQueueBack({
  type: 'passage',
  data: passage,
});
```

### Adding a Playlist to Queue

```typescript
const playlist = {
  id: 'playlist-1',
  title: 'Gospel of John',
  description: 'Complete Gospel of John',
  user_id: 'user-1',
  is_public: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

queueStore.addToUserQueueBack({
  type: 'playlist',
  data: playlist,
});
```

### Queue Navigation

```typescript
// Navigate to next item
const success = await queueStore.playNext();

// Navigate to previous item
const success = await queueStore.playPrevious();

// Get current item
const currentItem = queueStore.getCurrentItem();
```

## Queue Priority System

1. **User Queue Priority**: If user queue has items, it takes priority over automatic queue
2. **Automatic Queue Fallback**: When user queue is empty, automatic queue is used
3. **Automatic Repopulation**: When a user queue item starts playing, automatic queue is cleared and repopulated with next 5 chapters

## Future Enhancements

- **Passage Playback**: Implement seeking to specific start/end times for passages
- **Playlist Expansion**: Expand playlists into individual queue items
- **Queue Persistence**: Save queue state across app sessions
- **Queue Sharing**: Share queues between users
- **Smart Queue**: AI-powered queue suggestions based on user preferences

## Database Integration

The current implementation uses placeholder types for database entities. When the actual database schema is available, update the types in `src/types/queue.ts` to use the real database types:

```typescript
export type Chapter = Database['public']['Tables']['chapters']['Row'];
export type Passage = Database['public']['Tables']['passages']['Row'];
export type Playlist = Database['public']['Tables']['playlists']['Row'];
```
