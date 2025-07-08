// Type aliases for database types (placeholder until actual schema is available)
export type Chapter = {
  id: string;
  book_name: string;
  chapter_number: number;
  title: string;
  audio_file_url: string;
  duration_seconds: number;
  language: string;
  created_at: string;
  updated_at: string;
};

export type Passage = {
  id: string;
  chapter_id: string;
  start_verse: number;
  end_verse: number;
  start_time_seconds: number;
  end_time_seconds: number;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Playlist = {
  id: string;
  title: string;
  description: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

// Queue item types
export type QueueItemType = 'chapter' | 'passage' | 'playlist';

export interface QueueItem {
  id: string;
  type: QueueItemType;
  data: Chapter | Passage | Playlist;
  addedAt: Date;
  priority?: number; // For reordering within the same queue
}

// Queue types
export interface Queue {
  items: QueueItem[];
  currentIndex: number;
  isActive: boolean;
}

export interface QueueState {
  userQueue: Queue;
  automaticQueue: Queue;
  isUserQueueActive: boolean; // Whether user queue has priority
}

// Queue actions
export interface QueueActions {
  // User queue management
  addToUserQueueFront: (item: Omit<QueueItem, 'id' | 'addedAt'>) => void;
  addToUserQueueBack: (item: Omit<QueueItem, 'id' | 'addedAt'>) => void;
  removeFromUserQueue: (index: number) => void;
  reorderUserQueue: (fromIndex: number, toIndex: number) => void;
  clearUserQueue: () => void;

  // Automatic queue management
  populateAutomaticQueue: (startingChapterId: string) => void;
  clearAutomaticQueue: () => void;

  // Queue navigation
  playNext: () => Promise<boolean>;
  playPrevious: () => Promise<boolean>;
  getCurrentItem: () => QueueItem | null;

  // Queue state
  setUserQueueActive: (active: boolean) => void;
  getActiveQueue: () => Queue;
  getQueueLength: () => number;
}

// Helper functions
export function createQueueItem(
  type: QueueItemType,
  data: Chapter | Passage | Playlist,
  priority?: number
): QueueItem {
  return {
    id: `${type}-${data.id}-${Date.now()}`,
    type,
    data,
    addedAt: new Date(),
    ...(priority !== undefined && { priority }),
  };
}

export function getQueueItemDisplayName(item: QueueItem): string {
  switch (item.type) {
    case 'chapter': {
      const chapter = item.data as Chapter;
      return `${chapter.book_name} ${chapter.chapter_number}`;
    }
    case 'passage': {
      const passage = item.data as Passage;
      return passage.title;
    }
    case 'playlist': {
      const playlist = item.data as Playlist;
      return playlist.title;
    }
    default:
      return 'Unknown Item';
  }
}

export function getQueueItemDuration(item: QueueItem): number {
  switch (item.type) {
    case 'chapter': {
      const chapter = item.data as Chapter;
      return chapter.duration_seconds;
    }
    case 'passage': {
      const passage = item.data as Passage;
      return passage.end_time_seconds - passage.start_time_seconds;
    }
    case 'playlist': {
      // For playlists, we'd need to calculate total duration from all items
      // This is a placeholder - would need to be implemented based on playlist structure
      return 0;
    }
    default:
      return 0;
  }
}
