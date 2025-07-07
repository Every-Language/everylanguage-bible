import {
  AudioRecording,
  TranslationSegment,
  AudioChapter,
  SegmentCalculator,
  createAudioChapter,
  VerseDisplayData,
  AudioSegment,
  SegmentPosition,
} from '@/types/audio';

// Helper function to parse recording ID and extract book/chapter info
function parseRecordingId(
  recordingId: string
): { bookName: string; bookId: string; chapter: number } | null {
  // Handle patterns like "john-1", "deuteronomy-8", "1-timothy-3"
  const parts = recordingId.split('-');

  if (parts.length < 2) {
    return null;
  }

  // Get chapter number (last part)
  const chapterStr = parts[parts.length - 1];
  if (!chapterStr) {
    return null;
  }
  const chapter = parseInt(chapterStr, 10);

  if (isNaN(chapter)) {
    return null;
  }

  // Get book ID and name (everything before the last dash)
  const bookId = parts.slice(0, -1).join('-');
  const bookName = bookId
    .split('-')
    .map(word =>
      word && word.length > 0
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(' ');

  return { bookName, bookId, chapter };
}

// Generate mock verse text for any book/chapter/verse
function generateMockVerseText(
  bookName: string,
  _chapter: number,
  verse: number
): string {
  const verseTexts = [
    `In the beginning was the Word, and the Word was with God, and the Word was God.`,
    `He was in the beginning with God.`,
    `All things were made through him, and without him was not any thing made that was made.`,
    `In him was life, and the life was the light of men.`,
    `The light shines in the darkness, and the darkness has not overcome it.`,
    `There was a man sent from God, whose name was John.`,
    `He came as a witness, to bear witness about the light, that all might believe through him.`,
    `He was not the light, but came to bear witness about the light.`,
    `The true light, which gives light to everyone, was coming into the world.`,
    `He was in the world, and the world was made through him, yet the world did not know him.`,
    `He came to his own, and his own people did not receive him.`,
    `But to all who did receive him, who believed in his name, he gave the right to become children of God.`,
    `Who were born, not of blood nor of the will of the flesh nor of the will of man, but of God.`,
    `And the Word became flesh and dwelt among us, and we have seen his glory.`,
    `Glory as of the only Son from the Father, full of grace and truth.`,
    `John bore witness about him, and cried out, "This was he of whom I said."`,
  ];

  // Use a consistent but varied approach to verse text
  const index = (verse - 1) % verseTexts.length;
  const baseText = verseTexts[index] || verseTexts[0] || 'Default verse text';

  // Add some variation based on book/chapter to make it feel different
  if (bookName.toLowerCase().includes('deuteronomy')) {
    return `And the Lord said: ${baseText}`;
  } else if (bookName.toLowerCase().includes('psalm')) {
    return `Praise the Lord! ${baseText}`;
  } else if (bookName.toLowerCase().includes('matthew')) {
    return `Jesus said: ${baseText}`;
  }

  return baseText;
}

// Service interface for dependency injection
export interface IAudioService {
  // Fetch audio recordings (chapters)
  getAudioRecordings(): Promise<AudioRecording[]>;
  getAudioRecordingById(id: string): Promise<AudioRecording | null>;

  // Fetch translation segments (verses) for a recording
  getTranslationSegments(recordingId: string): Promise<TranslationSegment[]>;

  // Get complete chapter data
  getAudioChapter(recordingId: string): Promise<AudioChapter | null>;

  // Search and filter
  searchAudioRecordings(query: string): Promise<AudioRecording[]>;
  getAudioRecordingsByLanguage(language: string): Promise<AudioRecording[]>;
  getAudioRecordingsByBook(bookName: string): Promise<AudioRecording[]>;
}

// Main AudioService implementation
export class AudioService implements IAudioService {
  private cache: Map<string, AudioChapter> = new Map();
  // private dbClient: any; // Replace with actual database client

  // constructor(dbClient?: any) {
  //   this.dbClient = dbClient;
  // }

  // Fetch all audio recordings
  async getAudioRecordings(): Promise<AudioRecording[]> {
    // TODO: Replace with actual database call
    // return await this.dbClient.from('audio_recordings').select('*');
    return [];
  }

  // Fetch specific audio recording by ID
  async getAudioRecordingById(id: string): Promise<AudioRecording | null> {
    // Parse the recording ID to extract book and chapter info
    const parsed = parseRecordingId(id);
    if (!parsed) {
      return null;
    }

    const { bookName, chapter } = parsed;

    // Generate mock recording data
    const mockRecording: AudioRecording = {
      id,
      title: `${bookName} Chapter ${chapter}`,
      audio_file_url: `https://example.com/${parsed.bookId}-${chapter}.mp3`,
      original_language: 'en',
      target_language: 'en',
      duration_seconds: 600 + chapter * 30, // Vary duration based on chapter
      description: `The book of ${bookName}, Chapter ${chapter}`,
      status: 'active',
      user_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return mockRecording;
  }

  // Fetch translation segments for a specific recording
  async getTranslationSegments(
    recordingId: string
  ): Promise<TranslationSegment[]> {
    const parsed = parseRecordingId(recordingId);
    if (!parsed) {
      return [];
    }

    const { bookName, chapter } = parsed;

    // Generate mock verse count (varying by chapter for realism)
    const baseVerseCount = 15;
    const variation = (chapter * 7) % 20; // Pseudo-random variation
    const verseCount = baseVerseCount + variation;

    const segments: TranslationSegment[] = [];

    for (let verse = 1; verse <= verseCount; verse++) {
      // Each verse is about 15-25 seconds long
      const startTime = (verse - 1) * 20;
      const duration = 15 + (verse % 10); // Vary duration 15-24 seconds
      const endTime = startTime + duration;

      const segment: TranslationSegment = {
        id: `${recordingId}-verse-${verse}`,
        start_time_seconds: startTime,
        end_time_seconds: endTime,
        original_text: generateMockVerseText(bookName, chapter, verse),
        translated_text: generateMockVerseText(bookName, chapter, verse),
        confidence_score: 0.95 + Math.random() * 0.05, // High confidence
        speaker_id: 'narrator-1',
        recording_id: recordingId,
        created_at: new Date().toISOString(),
      };

      segments.push(segment);
    }

    return segments;
  }

  // Get complete chapter data with segments
  async getAudioChapter(recordingId: string): Promise<AudioChapter | null> {
    try {
      // Check cache first
      if (this.cache.has(recordingId)) {
        return this.cache.get(recordingId)!;
      }

      // Fetch recording and segments
      const [recording, segments] = await Promise.all([
        this.getAudioRecordingById(recordingId),
        this.getTranslationSegments(recordingId),
      ]);

      if (!recording) {
        return null;
      }

      // Create chapter object
      const chapter = createAudioChapter(recording, segments);

      // Cache the result
      this.cache.set(recordingId, chapter);

      return chapter;
    } catch (error) {
      console.error('Error getting audio chapter:', error);
      return null;
    }
  }

  // Search audio recordings
  async searchAudioRecordings(_query: string): Promise<AudioRecording[]> {
    // TODO: Replace with actual database call
    // const { data } = await this.dbClient
    //   .from('audio_recordings')
    //   .select('*')
    //   .ilike('title', `%${query}%`);
    // return data || [];
    return [];
  }

  // Get recordings by language
  async getAudioRecordingsByLanguage(
    _language: string
  ): Promise<AudioRecording[]> {
    // TODO: Replace with actual database call
    // const { data } = await this.dbClient
    //   .from('audio_recordings')
    //   .select('*')
    //   .eq('target_language', language);
    // return data || [];
    return [];
  }

  // Get recordings by book name
  async getAudioRecordingsByBook(_bookName: string): Promise<AudioRecording[]> {
    // TODO: Replace with actual database call
    // const { data } = await this.dbClient
    //   .from('audio_recordings')
    //   .select('*')
    //   .ilike('title', `${bookName}%`);
    // return data || [];
    return [];
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cached chapter
  getCachedChapter(recordingId: string): AudioChapter | null {
    return this.cache.get(recordingId) || null;
  }
}

// Helper class for working with chapters in the UI
export class ChapterUIHelper {
  private calculator: SegmentCalculator;
  private chapter: AudioChapter;

  constructor(chapter: AudioChapter) {
    this.chapter = chapter;
    this.calculator = new SegmentCalculator(
      chapter.segments.map(seg => ({
        id: seg.id,
        start_time_seconds: seg.startTime,
        end_time_seconds: seg.endTime,
        original_text: seg.text,
        translated_text: seg.text,
        confidence_score: seg.confidence || null,
        speaker_id: seg.speakerId || null,
        recording_id: chapter.audioRecording.id,
        created_at: null,
      }))
    );
  }

  // Get verse display data for UI
  getVerseDisplayData(currentTime: number): VerseDisplayData[] {
    return this.calculator.getVerseDisplayData(currentTime);
  }

  // Get current segment for audio player
  getCurrentSegment(currentTime: number): AudioSegment | undefined {
    return this.calculator.getCurrentSegment(currentTime);
  }

  // Get segment position for progress tracking
  getCurrentSegmentPosition(currentTime: number): SegmentPosition | undefined {
    return this.calculator.getCurrentSegmentPosition(currentTime);
  }

  // Get segment by verse number (for seeking)
  getSegmentByVerseNumber(verseNumber: number): AudioSegment | undefined {
    return this.calculator.getSegmentByNumber(verseNumber);
  }

  // Get chapter metadata
  getChapterInfo() {
    return {
      title: this.chapter.audioRecording.title,
      bookName: this.chapter.bookName,
      chapterNumber: this.chapter.chapterNumber,
      totalVerses: this.chapter.totalSegments,
      totalDuration: this.chapter.totalDuration,
      language: this.chapter.language,
    };
  }

  // Format time for display
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Get progress percentage
  getProgressPercentage(currentTime: number): number {
    if (this.chapter.totalDuration === 0) return 0;
    return Math.min(100, (currentTime / this.chapter.totalDuration) * 100);
  }
}

// Default service instance
export const audioService = new AudioService();
