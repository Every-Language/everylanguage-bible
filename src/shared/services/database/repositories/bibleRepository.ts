import { eq, and, asc } from 'drizzle-orm';
import { databaseService } from '../database';
import {
  booksTable,
  chaptersTable,
  versesTable,
  audioTracksTable,
  type Book,
  type Chapter,
  type Verse,
  type AudioTrack,
  type ChapterWithAudio,
  type VerseWithTiming,
} from '../schema';

/**
 * Bible Content Repository
 * Provides high-level query methods for Bible content and audio data
 */
export class BibleRepository {
  private get db() {
    return databaseService.getDatabase();
  }

  /**
   * Get all books in the Bible
   */
  async getAllBooks(): Promise<Book[]> {
    return await this.db
      .select()
      .from(booksTable)
      .orderBy(asc(booksTable.bookOrder));
  }

  /**
   * Get a specific book by ID
   */
  async getBookById(bookId: string): Promise<Book | null> {
    const result = await this.db
      .select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get all chapters for a book
   */
  async getChaptersByBook(bookId: string): Promise<Chapter[]> {
    return await this.db
      .select()
      .from(chaptersTable)
      .where(eq(chaptersTable.bookId, bookId))
      .orderBy(asc(chaptersTable.chapterNumber));
  }

  /**
   * Get a specific chapter with all related data
   */
  async getChapterWithAudio(
    bookId: string,
    chapterNumber: number
  ): Promise<ChapterWithAudio | null> {
    // Get the chapter
    const chapterResult = await this.db
      .select()
      .from(chaptersTable)
      .where(
        and(
          eq(chaptersTable.bookId, bookId),
          eq(chaptersTable.chapterNumber, chapterNumber)
        )
      )
      .limit(1);

    if (!chapterResult[0]) {
      return null;
    }

    const chapter = chapterResult[0];

    // Get related data in parallel
    const [verses, audioTracks, book] = await Promise.all([
      this.getVersesByChapter(chapter.id),
      this.getAudioTracksByChapter(chapter.id),
      this.getBookById(bookId),
    ]);

    return {
      ...chapter,
      verses,
      audioTracks,
      book: book!,
    };
  }

  /**
   * Get all verses for a chapter
   */
  async getVersesByChapter(chapterId: string): Promise<Verse[]> {
    return await this.db
      .select()
      .from(versesTable)
      .where(eq(versesTable.chapterId, chapterId))
      .orderBy(asc(versesTable.verseNumber));
  }

  /**
   * Get verses with timing data for audio navigation
   */
  async getVersesWithTiming(chapterId: string): Promise<VerseWithTiming[]> {
    const result = await this.db
      .select({
        verse: versesTable,
        chapter: chaptersTable,
      })
      .from(versesTable)
      .innerJoin(chaptersTable, eq(versesTable.chapterId, chaptersTable.id))
      .where(eq(versesTable.chapterId, chapterId))
      .orderBy(asc(versesTable.verseNumber));

    return result.map(row => ({
      ...row.verse,
      chapter: row.chapter,
    }));
  }

  /**
   * Get a specific verse by number
   */
  async getVerseByNumber(
    chapterId: string,
    verseNumber: number
  ): Promise<Verse | null> {
    const result = await this.db
      .select()
      .from(versesTable)
      .where(
        and(
          eq(versesTable.chapterId, chapterId),
          eq(versesTable.verseNumber, verseNumber)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get audio tracks for a chapter
   */
  async getAudioTracksByChapter(chapterId: string): Promise<AudioTrack[]> {
    return await this.db
      .select()
      .from(audioTracksTable)
      .where(eq(audioTracksTable.chapterId, chapterId));
  }

  /**
   * Get the primary audio track for a chapter (highest quality)
   */
  async getPrimaryAudioTrack(
    chapterId: string,
    languageEntityId?: string
  ): Promise<AudioTrack | null> {
    const whereConditions = [eq(audioTracksTable.chapterId, chapterId)];

    if (languageEntityId) {
      whereConditions.push(
        eq(audioTracksTable.languageEntityId, languageEntityId)
      );
    }

    const results = await this.db
      .select()
      .from(audioTracksTable)
      .where(and(...whereConditions));

    // Prioritize: high > medium > low quality
    const qualityOrder = { high: 3, medium: 2, low: 1 };
    results.sort(
      (a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0)
    );

    return results[0] || null;
  }

  /**
   * Search verses by text content
   */
  async searchVerses(
    searchTerm: string,
    limit = 50
  ): Promise<VerseWithTiming[]> {
    const result = await this.db
      .select({
        verse: versesTable,
        chapter: chaptersTable,
      })
      .from(versesTable)
      .innerJoin(chaptersTable, eq(versesTable.chapterId, chaptersTable.id))
      .where(eq(versesTable.text, `%${searchTerm}%`)) // Note: This is a simple search, real implementation would use FTS
      .limit(limit);

    return result.map(row => ({
      ...row.verse,
      chapter: row.chapter,
    }));
  }

  /**
   * Get verse count for a chapter
   */
  async getVerseCount(chapterId: string): Promise<number> {
    const result = await this.db
      .select()
      .from(versesTable)
      .where(eq(versesTable.chapterId, chapterId));

    return result.length;
  }

  /**
   * Check if audio is downloaded for a chapter
   */
  async isAudioDownloaded(chapterId: string): Promise<boolean> {
    const chapter = await this.db
      .select({ isAudioDownloaded: chaptersTable.isAudioDownloaded })
      .from(chaptersTable)
      .where(eq(chaptersTable.id, chapterId))
      .limit(1);

    return chapter[0]?.isAudioDownloaded || false;
  }
}
