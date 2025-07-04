import { eq, asc } from 'drizzle-orm';
import { databaseService } from '../database';
import {
  booksTable,
  chaptersTable,
  versesTable,
  audioTracksTable,
  type NewBook,
  type NewChapter,
  type NewVerse,
  type NewAudioTrack,
} from '../schema';

/**
 * Seed data for Genesis Chapter 1
 * Provides realistic Bible content and verse timing data for testing
 */
export class GenesisSeedData {
  private get db() {
    return databaseService.getDatabase();
  }

  /**
   * Seed Genesis book and chapter 1 with verse timing data
   * This matches the test data used in our audio service tests
   */
  async seedGenesis(): Promise<void> {
    console.log('🌱 Seeding Genesis data...');

    try {
      // 1. Create Genesis book
      const genesisBook: NewBook = {
        id: 'genesis',
        name: 'Genesis',
        localName: 'Genesis',
        testament: 'old',
        chapterCount: 50,
        bookOrder: 1,
        abbreviation: 'Gen',
        alternativeAbbreviations: JSON.stringify(['Gn', 'Ge']),
      };

      await this.db
        .insert(booksTable)
        .values(genesisBook)
        .onConflictDoNothing();

      // 2. Create Genesis Chapter 1
      const genesisChapter1: NewChapter = {
        id: 'genesis-1',
        bookId: 'genesis',
        chapterNumber: 1,
        verseCount: 31,
        audioFileUrl: 'https://example.com/genesis-1.mp3',
        audioDuration: 390, // 6.5 minutes
        audioFileSize: 3900000, // ~3.9MB
        audioQuality: 'high',
        audioLanguageEntityId: 'english-us',
        isAudioDownloaded: false,
        localAudioPath: null,
      };

      await this.db
        .insert(chaptersTable)
        .values(genesisChapter1)
        .onConflictDoNothing();

      // 3. Create Genesis 1:1-5 verses with precise timing (matching our test data)
      const genesis1Verses: NewVerse[] = [
        {
          id: 'genesis-1-1',
          chapterId: 'genesis-1',
          verseNumber: 1,
          text: 'In the beginning God created the heavens and the earth.',
          textLanguageEntityId: 'english-us',
          translationId: 'bsb',
          audioStartTime: 0,
          audioEndTime: 15,
          audioDuration: 15,
        },
        {
          id: 'genesis-1-2',
          chapterId: 'genesis-1',
          verseNumber: 2,
          text: 'Now the earth was formless and empty, darkness was over the surface of the deep, and the Spirit of God was hovering over the waters.',
          textLanguageEntityId: 'english-us',
          translationId: 'bsb',
          audioStartTime: 15,
          audioEndTime: 35,
          audioDuration: 20,
        },
        {
          id: 'genesis-1-3',
          chapterId: 'genesis-1',
          verseNumber: 3,
          text: 'And God said, "Let there be light," and there was light.',
          textLanguageEntityId: 'english-us',
          translationId: 'bsb',
          audioStartTime: 35,
          audioEndTime: 50,
          audioDuration: 15,
        },
        {
          id: 'genesis-1-4',
          chapterId: 'genesis-1',
          verseNumber: 4,
          text: 'God saw that the light was good, and he separated the light from the darkness.',
          textLanguageEntityId: 'english-us',
          translationId: 'bsb',
          audioStartTime: 50,
          audioEndTime: 70,
          audioDuration: 20,
        },
        {
          id: 'genesis-1-5',
          chapterId: 'genesis-1',
          verseNumber: 5,
          text: 'God called the light "day," and the darkness he called "night." And there was evening, and there was morning—the first day.',
          textLanguageEntityId: 'english-us',
          translationId: 'bsb',
          audioStartTime: 70,
          audioEndTime: 90,
          audioDuration: 20,
        },
      ];

      await this.db
        .insert(versesTable)
        .values(genesis1Verses)
        .onConflictDoNothing();

      // 4. Create audio track for Genesis 1
      const genesisAudioTrack: NewAudioTrack = {
        id: 'genesis-1-audio-english-high',
        chapterId: 'genesis-1',
        languageEntityId: 'english-us',
        url: 'https://example.com/genesis-1.mp3',
        localPath: null,
        duration: 390, // 6.5 minutes
        fileSize: 3900000, // ~3.9MB
        quality: 'high',
        format: 'mp3',
        bitrate: 128,
        isDownloaded: false,
        downloadProgress: null,
        narrator: JSON.stringify({
          name: 'David Cochran Heath',
          gender: 'male',
          age_range: 'adult',
        }),
      };

      await this.db
        .insert(audioTracksTable)
        .values(genesisAudioTrack)
        .onConflictDoNothing();

      console.log('✅ Genesis seed data created successfully');
    } catch (error) {
      console.error('❌ Failed to seed Genesis data:', error);
      throw error;
    }
  }

  /**
   * Get the seeded Genesis chapter data for testing
   * Returns data in the format expected by our audio service
   */
  async getSeededGenesisChapterData() {
    const chapter = await this.db
      .select()
      .from(chaptersTable)
      .where(eq(chaptersTable.id, 'genesis-1'))
      .limit(1);

    const verses = await this.db
      .select()
      .from(versesTable)
      .where(eq(versesTable.chapterId, 'genesis-1'))
      .orderBy(asc(versesTable.verseNumber));

    const audioTrack = await this.db
      .select()
      .from(audioTracksTable)
      .where(eq(audioTracksTable.chapterId, 'genesis-1'))
      .limit(1);

    return {
      chapter: chapter[0],
      verses,
      audioTrack: audioTrack[0],
    };
  }

  /**
   * Clear all Genesis seed data
   */
  async clearGenesisSeedData(): Promise<void> {
    console.log('🧹 Clearing Genesis seed data...');

    try {
      // Delete in reverse order of creation (due to foreign keys)
      await this.db
        .delete(audioTracksTable)
        .where(eq(audioTracksTable.chapterId, 'genesis-1'));
      await this.db
        .delete(versesTable)
        .where(eq(versesTable.chapterId, 'genesis-1'));
      await this.db
        .delete(chaptersTable)
        .where(eq(chaptersTable.id, 'genesis-1'));
      await this.db.delete(booksTable).where(eq(booksTable.id, 'genesis'));

      console.log('✅ Genesis seed data cleared');
    } catch (error) {
      console.error('❌ Failed to clear Genesis seed data:', error);
      throw error;
    }
  }
}
