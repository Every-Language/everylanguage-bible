// Audio feature types
export interface AudioTrack {
  id: string;
  title: string;
  description?: string;
  duration_seconds: number;
  audio_file_url: string;
  book_name: string;
  chapter_number?: number;
  verse_number?: number;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface VerseDisplayData {
  verseNumber: number;
  text: string;
  isCurrentVerse: boolean;
  startTime: number;
  endTime: number;
}

export interface QueueItem {
  id: string;
  type: 'chapter' | 'verse' | 'book';
  data: AudioTrack | any; // Will be more specific when we define chapter/verse types
  addedAt: string;
}

export interface Queue {
  items: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;
}

export interface PlaybackState {
  isPlaying: boolean;
  position: number;
  duration: number;
  currentTrack: AudioTrack | null;
  volume: number;
  playbackRate: number;
}

export type ContentMode = 'text' | 'queue';

export type RepeatMode = 'none' | 'one' | 'all';

export type PlayMode = 'normal' | 'queue';
