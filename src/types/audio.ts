import { Database } from '@everylanguage/shared-types';

// Type aliases for the database types
export type AudioRecording =
  Database['public']['Tables']['audio_recordings']['Row'];
export type TranslationSegment =
  Database['public']['Tables']['translation_segments']['Row'];
export type AudioRecordingInsert =
  Database['public']['Tables']['audio_recordings']['Insert'];
export type TranslationSegmentInsert =
  Database['public']['Tables']['translation_segments']['Insert'];

// Core segment types for internal use
export interface AudioSegment {
  id: string; // translation_segment id
  segmentNumber: number; // Calculated from segment order
  text: string; // original_text or translated_text
  startTime: number; // start_time_seconds
  endTime: number; // end_time_seconds
  duration: number; // endTime - startTime
  confidence?: number | undefined; // confidence_score
  speakerId?: string | undefined; // speaker_id
}

export interface AudioChapter {
  audioRecording: AudioRecording;
  segments: AudioSegment[];
  chapterNumber: number; // Parsed from title or metadata
  bookName: string; // Parsed from title or metadata
  totalSegments: number;
  totalDuration: number;
  language: string; // original_language or target_language
}

// UI-facing types that use "verse" terminology for user display
export interface VerseDisplayData {
  verseNumber: number; // Same as segmentNumber, but for UI
  text: string;
  startTime: number;
  endTime: number;
  duration: number;
  isCurrentVerse: boolean;
}

// Position tracking types
export interface SegmentPosition {
  segmentNumber: number;
  timeInSegment: number; // How many seconds into this segment
  progressInSegment: number; // 0-1 progress through this segment
  progressInChapter: number; // 0-1 progress through entire chapter
}

export interface SegmentRange {
  startSegment: number;
  endSegment: number;
  startTime: number;
  endTime: number;
}

// Audio player state types
export interface AudioPlayerState {
  currentRecording?: AudioRecording;
  currentChapter?: AudioChapter;
  currentSegment?: AudioSegment;
  currentTime: number;
  totalTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isLoading: boolean;
  error?: string;
}

// Auto-scroll state for segment tracking
export interface SegmentScrollState {
  isAutoScrollEnabled: boolean;
  isUserScrolling: boolean;
  lastAutoScrollTime: number;
  scrollToSegmentTimeout?: ReturnType<typeof setTimeout>;
}

// Utility class for segment calculations
export class SegmentCalculator {
  private segments: TranslationSegment[];
  private averageSegmentDuration: number;

  constructor(segments: TranslationSegment[]) {
    this.segments = segments.sort(
      (a, b) => a.start_time_seconds - b.start_time_seconds
    );
    this.averageSegmentDuration = this.calculateAverageSegmentDuration();
  }

  private calculateAverageSegmentDuration(): number {
    if (this.segments.length === 0) return 30; // default 30 seconds

    const totalDuration = this.segments.reduce(
      (sum, segment) =>
        sum + (segment.end_time_seconds - segment.start_time_seconds),
      0
    );
    return totalDuration / this.segments.length;
  }

  getCurrentSegment(currentTime: number): AudioSegment | undefined {
    // Find the segment that contains the current time
    const activeSegment = this.segments.find(
      segment =>
        currentTime >= segment.start_time_seconds &&
        currentTime < segment.end_time_seconds
    );

    if (activeSegment) {
      return this.dbSegmentToAudioSegment(activeSegment);
    }

    // If no exact match, find the closest segment
    const firstSegment = this.segments[0];
    if (firstSegment && currentTime <= firstSegment.start_time_seconds) {
      return this.dbSegmentToAudioSegment(firstSegment);
    }

    const lastSegment = this.segments[this.segments.length - 1];
    if (lastSegment && currentTime >= lastSegment.end_time_seconds) {
      return this.dbSegmentToAudioSegment(lastSegment);
    }

    // Find the segment just before the current time
    for (let i = this.segments.length - 1; i >= 0; i--) {
      const segment = this.segments[i];
      if (segment && currentTime >= segment.start_time_seconds) {
        return this.dbSegmentToAudioSegment(segment);
      }
    }

    return undefined;
  }

  getCurrentSegmentPosition(currentTime: number): SegmentPosition | undefined {
    const currentSegment = this.getCurrentSegment(currentTime);
    if (!currentSegment) return undefined;

    const timeInSegment = currentTime - currentSegment.startTime;
    const progressInSegment = Math.min(
      1,
      timeInSegment / currentSegment.duration
    );

    // Calculate chapter progress based on total segments
    const lastSegment = this.segments[this.segments.length - 1];
    const totalDuration = lastSegment?.end_time_seconds || currentTime;
    const progressInChapter = Math.min(1, currentTime / totalDuration);

    return {
      segmentNumber: currentSegment.segmentNumber,
      timeInSegment,
      progressInSegment,
      progressInChapter,
    };
  }

  getAllSegments(): AudioSegment[] {
    return this.segments.map(segment => this.dbSegmentToAudioSegment(segment));
  }

  // Convert to UI-friendly verse display data
  getVerseDisplayData(currentTime: number): VerseDisplayData[] {
    const currentSegment = this.getCurrentSegment(currentTime);
    const currentSegmentNumber = currentSegment?.segmentNumber;

    return this.segments.map((segment, index) => {
      const segmentNumber = index + 1;
      return {
        verseNumber: segmentNumber, // UI shows as verse number
        text: segment.translated_text || segment.original_text || '',
        startTime: segment.start_time_seconds,
        endTime: segment.end_time_seconds,
        duration: segment.end_time_seconds - segment.start_time_seconds,
        isCurrentVerse: segmentNumber === currentSegmentNumber,
      };
    });
  }

  private dbSegmentToAudioSegment(segment: TranslationSegment): AudioSegment {
    // Calculate segment number based on segment order
    const segmentNumber = this.segments.indexOf(segment) + 1;

    return {
      id: segment.id,
      segmentNumber,
      text: segment.translated_text || segment.original_text || '',
      startTime: segment.start_time_seconds,
      endTime: segment.end_time_seconds,
      duration: segment.end_time_seconds - segment.start_time_seconds,
      confidence: segment.confidence_score || undefined,
      speakerId: segment.speaker_id || undefined,
    };
  }

  getSegmentByNumber(segmentNumber: number): AudioSegment | undefined {
    const segmentIndex = segmentNumber - 1;
    const segment = this.segments[segmentIndex];
    return segment ? this.dbSegmentToAudioSegment(segment) : undefined;
  }

  getSegmentRange(
    startSegment: number,
    endSegment: number
  ): SegmentRange | undefined {
    const startDbSegment = this.segments[startSegment - 1];
    const endDbSegment = this.segments[endSegment - 1];

    if (!startDbSegment || !endDbSegment) return undefined;

    return {
      startSegment,
      endSegment,
      startTime: startDbSegment.start_time_seconds,
      endTime: endDbSegment.end_time_seconds,
    };
  }

  getTotalDuration(): number {
    const lastSegment = this.segments[this.segments.length - 1];
    return lastSegment?.end_time_seconds || 0;
  }

  getTotalSegments(): number {
    return this.segments.length;
  }

  // Get segment by time for seeking
  getSegmentByTime(time: number): AudioSegment | undefined {
    return this.getCurrentSegment(time);
  }
}

// Helper functions for parsing audio recording metadata
export function parseBookAndChapter(title: string): {
  bookName: string;
  chapterNumber: number;
} {
  // Parse titles like "Genesis Chapter 1", "Matthew 5", etc.
  const matches = title.match(/^(.+?)\s+(?:Chapter\s+)?(\d+)$/i);
  if (matches && matches[1] && matches[2]) {
    return {
      bookName: matches[1].trim(),
      chapterNumber: parseInt(matches[2], 10),
    };
  }

  // Fallback - treat entire title as book name
  return {
    bookName: title,
    chapterNumber: 1,
  };
}

export function createAudioChapter(
  audioRecording: AudioRecording,
  translationSegments: TranslationSegment[]
): AudioChapter {
  const { bookName, chapterNumber } = parseBookAndChapter(audioRecording.title);
  const calculator = new SegmentCalculator(translationSegments);
  const segments = calculator.getAllSegments();

  return {
    audioRecording,
    segments,
    chapterNumber,
    bookName,
    totalSegments: segments.length,
    totalDuration: calculator.getTotalDuration(),
    language: audioRecording.target_language,
  };
}
