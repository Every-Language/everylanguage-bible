/**
 * Bible Content Types (Placeholder)
 *
 * These types are placeholders for Bible content that will be replaced
 * with actual types from @everylanguage/shared-types (or other type api??) when the backend
 * team finalizes the Bible content schema.
 *
 * TODO: Replace with actual @everylanguage/shared-types when available
 *
 * @since 1.0.0
 */

import type { Tables } from '@everylanguage/shared-types';

// Use existing types from shared-types
export type User = Tables<'users'>;
export type LanguageEntity = Tables<'language_entities'>;
export type Region = Tables<'regions'>;

/**
 * Bible Book representation
 * TODO: Replace with actual schema when available
 */
export interface BibleBook {
  /** Unique identifier for the book */
  id: string;
  /** Book name in English */
  name: string;
  /** Book name in local language */
  local_name?: string;
  /** Testament classification */
  testament: 'old' | 'new';
  /** Total number of chapters in this book */
  chapter_count: number;
  /** Book order in the Bible (1-66) */
  book_order: number;
  /** Standard abbreviation (e.g., "Gen", "Matt") */
  abbreviation: string;
  /** Alternative abbreviations in various languages */
  alternative_abbreviations?: string[];
  /** Metadata for the book */
  created_at: string;
  updated_at: string;
}

/**
 * Bible Chapter representation with audio support
 * TODO: Replace with actual schema when available
 */
export interface BibleChapter {
  /** Unique identifier for the chapter */
  id: string;
  /** Reference to the parent book */
  book_id: string;
  /** Chapter number within the book */
  chapter_number: number;
  /** Total number of verses in this chapter */
  verse_count: number;
  /** Audio file URL for this chapter */
  audio_file_url?: string;
  /** Audio file duration in seconds */
  audio_duration?: number;
  /** Audio file size in bytes */
  audio_file_size?: number;
  /** Audio quality metadata */
  audio_quality?: 'low' | 'medium' | 'high';
  /** Language entity this audio is recorded in */
  audio_language_entity_id?: string;
  /** Whether audio is available offline */
  is_audio_downloaded?: boolean;
  /** Local file path for offline audio */
  local_audio_path?: string;
  /** Metadata */
  created_at: string;
  updated_at: string;
}

/**
 * Bible Verse representation with text support
 * TODO: Replace with actual schema when available
 */
export interface BibleVerse {
  /** Unique identifier for the verse */
  id: string;
  /** Reference to the parent chapter */
  chapter_id: string;
  /** Verse number within the chapter */
  verse_number: number;
  /** Verse text content */
  text: string;
  /** Language entity for the text */
  text_language_entity_id: string;
  /** Translation/version identifier */
  translation_id?: string;
  /** Start time in audio (seconds from chapter start) */
  audio_start_time?: number;
  /** End time in audio (seconds from chapter start) */
  audio_end_time?: number;
  /** Verse text formatting metadata */
  formatting?: {
    /** Words of Jesus in red */
    words_of_jesus?: boolean;
    /** Poetry/song formatting */
    is_poetry?: boolean;
    /** Text emphasis */
    emphasis?: string[];
  };
  /** Metadata */
  created_at: string;
  updated_at: string;
}

/**
 * Audio Track metadata for a chapter
 * TODO: Replace with actual schema when available
 */
export interface AudioTrack {
  /** Unique identifier for the track */
  id: string;
  /** Reference to the chapter */
  chapter_id: string;
  /** Language entity for the audio */
  language_entity_id: string;
  /** Audio file URL */
  url: string;
  /** Local file path if downloaded */
  local_path?: string;
  /** Audio duration in seconds */
  duration: number;
  /** File size in bytes */
  file_size: number;
  /** Audio quality */
  quality: 'low' | 'medium' | 'high';
  /** Audio format (e.g., 'mp3', 'aac') */
  format: string;
  /** Bitrate in kbps */
  bitrate: number;
  /** Whether this track is downloaded for offline use */
  is_downloaded: boolean;
  /** Download progress (0-100) */
  download_progress?: number;
  /** Speaker/narrator information */
  narrator?: {
    name: string;
    gender: 'male' | 'female';
    age_range?: string;
  };
  /** Metadata */
  created_at: string;
  updated_at: string;
}

/**
 * Verse Timestamp for precise audio navigation (TEMPORARY IMPLEMENTATION)
 * Required for verse-level audio synchronization per PRD
 *
 * TODO: Replace with actual VerseTimestamp type from @everylanguage module
 */
export interface VerseTimestamp_temp {
  /** Verse number within the chapter */
  verse_number: number;
  /** Start time in seconds from chapter beginning */
  start_time: number;
  /** End time in seconds from chapter beginning */
  end_time: number;
  /** Duration of the verse in seconds */
  duration: number;
  /** Text content for display during audio */
  text?: string;
  /** Language entity for the text (may differ from audio) */
  text_language_entity_id?: string;
}

/**
 * Chapter Audio with verse-level navigation support (TEMPORARY IMPLEMENTATION)
 * Combines audio track with precise verse timing data per PRD requirements
 *
 * TODO: Replace with actual ChapterAudio type from @everylanguage module
 */
export interface ChapterAudio_temp {
  /** The audio track for this chapter */
  audio_track: AudioTrack;
  /** Verse timestamps for navigation */
  verse_timestamps: VerseTimestamp_temp[];
  /** Chapter metadata */
  chapter: BibleChapter;
  /** Current verse being played/highlighted */
  current_verse?: number;
  /** Total number of verses in this chapter */
  total_verses: number;
}

/**
 * Verse Navigation Result (TEMPORARY IMPLEMENTATION)
 * Returned by verse navigation methods
 *
 * TODO: Replace with actual VerseNavigationResult type from @everylanguage module
 */
export interface VerseNavigationResult_temp {
  /** The verse number we navigated to */
  verse_number: number;
  /** Audio playback status after navigation */
  audio_status: {
    isLoaded: boolean;
    isPlaying?: boolean;
    positionMillis: number;
    durationMillis?: number;
  };
  /** Verse text for display */
  verse_text?: string;
  /** Whether this is the first verse */
  is_first_verse: boolean;
  /** Whether this is the last verse */
  is_last_verse: boolean;
}
