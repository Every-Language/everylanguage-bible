// Mock the database module
jest.mock('../index');

import { databaseService, GenesisSeedData, BibleRepository } from '../index';

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await databaseService.initialize();
  });

  afterAll(async () => {
    await databaseService.close();
  });

  describe('Database Connection', () => {
    it('should initialize database successfully', () => {
      expect(databaseService.isReady()).toBe(true);
    });

    it('should provide database instance', () => {
      const db = databaseService.getDatabase();
      expect(db).toBeDefined();
    });
  });

  describe('Genesis Seed Data', () => {
    let seedData: GenesisSeedData;
    let repository: BibleRepository;

    beforeEach(() => {
      seedData = new GenesisSeedData();
      repository = new BibleRepository();
    });

    afterEach(async () => {
      try {
        await seedData.clearGenesisSeedData();
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should seed Genesis data successfully', async () => {
      await seedData.seedGenesis();

      // Verify book was created
      const book = await repository.getBookById('genesis');
      expect(book).toBeDefined();
      expect(book?.name).toBe('Genesis');
      expect(book?.testament).toBe('old');
    });

    it('should create Genesis chapter with verses', async () => {
      await seedData.seedGenesis();

      // Get chapter with audio
      const chapterWithAudio = await repository.getChapterWithAudio(
        'genesis',
        1
      );
      expect(chapterWithAudio).toBeDefined();
      expect(chapterWithAudio?.chapterNumber).toBe(1);
      expect(chapterWithAudio?.verses).toHaveLength(5); // Genesis 1:1-5
      expect(chapterWithAudio?.audioTracks).toHaveLength(1);
    });

    it('should have correct verse timing data', async () => {
      await seedData.seedGenesis();

      const verses = await repository.getVersesByChapter('genesis-1');

      // Verify verse 1 timing (0-15 seconds)
      const verse1 = verses.find(v => v.verseNumber === 1);
      expect(verse1?.audioStartTime).toBe(0);
      expect(verse1?.audioEndTime).toBe(15);

      // Verify verse 2 timing (15-35 seconds)
      const verse2 = verses.find(v => v.verseNumber === 2);
      expect(verse2?.audioStartTime).toBe(15);
      expect(verse2?.audioEndTime).toBe(35);
    });

    it('should retrieve primary audio track', async () => {
      await seedData.seedGenesis();

      const audioTrack = await repository.getPrimaryAudioTrack('genesis-1');
      expect(audioTrack).toBeDefined();
      expect(audioTrack?.quality).toBe('high');
      expect(audioTrack?.duration).toBe(390); // 6.5 minutes
    });
  });
});
