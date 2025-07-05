import { loadBibleBooks } from '../bibleData';

// Mock the JSON data
jest.mock('../../../../assets/data/en.json', () => ({
  books: [
    {
      name: 'Genesis',
      chapters: [
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ],
    },
    {
      name: 'Exodus',
      chapters: ['Chapter 1', 'Chapter 2', 'Chapter 3'],
    },
    {
      name: '1 Samuel',
      chapters: ['Chapter 1', 'Chapter 2'],
    },
    {
      name: 'Song of Solomon',
      chapters: [
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
        'Chapter 6',
        'Chapter 7',
        'Chapter 8',
      ],
    },
    {
      name: 'Matthew',
      chapters: [
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
      ],
    },
    {
      name: '1 Corinthians',
      chapters: [
        'Chapter 1',
        'Chapter 2',
        'Chapter 3',
        'Chapter 4',
        'Chapter 5',
        'Chapter 6',
        'Chapter 7',
        'Chapter 8',
        'Chapter 9',
        'Chapter 10',
        'Chapter 11',
        'Chapter 12',
        'Chapter 13',
        'Chapter 14',
        'Chapter 15',
        'Chapter 16',
      ],
    },
  ],
}));

describe('bibleData', () => {
  describe('loadBibleBooks', () => {
    it('should load books with correct structure', () => {
      const books = loadBibleBooks();

      expect(books).toHaveLength(6);
      expect(books[0]).toEqual({
        id: '01',
        name: 'Genesis',
        testament: 'old',
        chapters: 5,
        order: 1,
        imagePath: '01_genesis.png',
      });
    });

    it('should assign correct testament based on order', () => {
      const books = loadBibleBooks();

      // All books in our mock should be old testament (order <= 39)
      // Since we only have 6 books in the mock, they're all old testament
      expect(books[0]?.testament).toBe('old');
      expect(books[1]?.testament).toBe('old');
      expect(books[2]?.testament).toBe('old');
      expect(books[3]?.testament).toBe('old');
      expect(books[4]?.testament).toBe('old');
      expect(books[5]?.testament).toBe('old');
    });

    it('should generate correct image paths for regular books', () => {
      const books = loadBibleBooks();

      expect(books[0]?.imagePath).toBe('01_genesis.png');
      expect(books[1]?.imagePath).toBe('02_exodus.png');
      expect(books[4]?.imagePath).toBe('05_matthew.png');
    });

    it('should generate correct image paths for special case books', () => {
      const books = loadBibleBooks();

      // 1 Samuel should be mapped to 1-samuel
      expect(books[2]?.imagePath).toBe('03_1-samuel.png');

      // Song of Solomon should be mapped to song-of-solomon
      expect(books[3]?.imagePath).toBe('04_song-of-solomon.png');

      // 1 Corinthians should be mapped to 1-corinthians
      expect(books[5]?.imagePath).toBe('06_1-corinthians.png');
    });

    it('should assign sequential order numbers', () => {
      const books = loadBibleBooks();

      expect(books[0]?.order).toBe(1);
      expect(books[1]?.order).toBe(2);
      expect(books[2]?.order).toBe(3);
      expect(books[3]?.order).toBe(4);
      expect(books[4]?.order).toBe(5);
      expect(books[5]?.order).toBe(6);
    });

    it('should assign padded IDs', () => {
      const books = loadBibleBooks();

      expect(books[0]?.id).toBe('01');
      expect(books[1]?.id).toBe('02');
      expect(books[2]?.id).toBe('03');
      expect(books[3]?.id).toBe('04');
      expect(books[4]?.id).toBe('05');
      expect(books[5]?.id).toBe('06');
    });

    it('should count chapters correctly', () => {
      const books = loadBibleBooks();

      expect(books[0]?.chapters).toBe(5); // Genesis has 5 chapters in mock
      expect(books[1]?.chapters).toBe(3); // Exodus has 3 chapters in mock
      expect(books[2]?.chapters).toBe(2); // 1 Samuel has 2 chapters in mock
      expect(books[3]?.chapters).toBe(8); // Song of Solomon has 8 chapters in mock
      expect(books[4]?.chapters).toBe(5); // Matthew has 5 chapters in mock
      expect(books[5]?.chapters).toBe(16); // 1 Corinthians has 16 chapters in mock
    });

    it('should handle books with spaces in names', () => {
      const books = loadBibleBooks();

      // Books with spaces should have hyphens in image path
      expect(books[2]?.imagePath).toBe('03_1-samuel.png');
      expect(books[3]?.imagePath).toBe('04_song-of-solomon.png');
      expect(books[5]?.imagePath).toBe('06_1-corinthians.png');
    });

    it('should handle books with multiple words', () => {
      const books = loadBibleBooks();

      // Song of Solomon should be converted to song-of-solomon
      expect(books[3]?.imagePath).toBe('04_song-of-solomon.png');
    });

    it('should handle numbered books correctly', () => {
      const books = loadBibleBooks();

      // 1 Samuel should be converted to 1-samuel
      expect(books[2]?.imagePath).toBe('03_1-samuel.png');

      // 1 Corinthians should be converted to 1-corinthians
      expect(books[5]?.imagePath).toBe('06_1-corinthians.png');
    });
  });
});
