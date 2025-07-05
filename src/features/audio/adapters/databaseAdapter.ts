import type { VerseTimestamp_temp, ChapterAudio_temp } from '../types';

import {
  BibleRepository,
  type Verse,
  type ChapterWithAudio,
} from '@/shared/services/database';

/**
 * Database Adapter Service
 * Bridges temporary audio types with real database types
 */
export class DatabaseAdapter {
  private bibleRepository: BibleRepository;

  constructor() {
    this.bibleRepository = new BibleRepository();
  }

  /**
   * Convert database verses to temporary VerseTimestamp format
   */
  convertVersesToTimestamps(verses: Verse[]): VerseTimestamp_temp[] {
    return verses.map(verse => ({
      verse_number: verse.verseNumber,
      start_time: verse.audioStartTime || 0,
      end_time: verse.audioEndTime || 0,
      duration: verse.audioDuration || 0,
      text: verse.text,
      text_language_entity_id: verse.textLanguageEntityId,
    }));
  }

  /**
   * Convert database ChapterWithAudio to temporary ChapterAudio format
   */
  convertChapterToAudioFormat(
    chapterWithAudio: ChapterWithAudio
  ): ChapterAudio_temp {
    const verse_timestamps = this.convertVersesToTimestamps(
      chapterWithAudio.verses
    );
    const primaryAudioTrack = chapterWithAudio.audioTracks[0];

    return {
      audio_track: {
        id: primaryAudioTrack?.id || `${chapterWithAudio.id}-audio`,
        chapter_id: chapterWithAudio.id,
        language_entity_id:
          primaryAudioTrack?.languageEntityId ||
          chapterWithAudio.audioLanguageEntityId ||
          '',
        url: primaryAudioTrack?.url || chapterWithAudio.audioFileUrl || '',
        local_path:
          primaryAudioTrack?.localPath || chapterWithAudio.localAudioPath || '',
        duration:
          primaryAudioTrack?.duration || chapterWithAudio.audioDuration || 0,
        file_size:
          primaryAudioTrack?.fileSize || chapterWithAudio.audioFileSize || 0,
        quality:
          primaryAudioTrack?.quality ||
          chapterWithAudio.audioQuality ||
          'medium',
        format: primaryAudioTrack?.format || 'mp3',
        bitrate: primaryAudioTrack?.bitrate || 128,
        is_downloaded:
          primaryAudioTrack?.isDownloaded ||
          chapterWithAudio.isAudioDownloaded ||
          false,
        download_progress: primaryAudioTrack?.downloadProgress || 0,
        narrator: primaryAudioTrack?.narrator
          ? JSON.parse(primaryAudioTrack.narrator)
          : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      verse_timestamps,
      chapter: {
        id: chapterWithAudio.id,
        book_id: chapterWithAudio.bookId,
        chapter_number: chapterWithAudio.chapterNumber,
        verse_count: chapterWithAudio.verseCount,
        audio_file_url: chapterWithAudio.audioFileUrl ?? '',
        audio_duration: chapterWithAudio.audioDuration ?? 0,
        audio_file_size: chapterWithAudio.audioFileSize ?? 0,
        audio_quality: chapterWithAudio.audioQuality ?? 'medium',
        audio_language_entity_id: chapterWithAudio.audioLanguageEntityId ?? '',
        is_audio_downloaded: chapterWithAudio.isAudioDownloaded ?? false,
        local_audio_path: chapterWithAudio.localAudioPath ?? '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },

      total_verses: chapterWithAudio.verseCount,
    };
  }

  /**
   * Get chapter audio data from database in temp format
   */
  async getChapterAudio(
    bookId: string,
    chapterNumber: number
  ): Promise<ChapterAudio_temp | null> {
    try {
      const chapterWithAudio = await this.bibleRepository.getChapterWithAudio(
        bookId,
        chapterNumber
      );

      if (!chapterWithAudio) {
        return null;
      }

      return this.convertChapterToAudioFormat(chapterWithAudio);
    } catch {
      return null;
    }
  }
}
