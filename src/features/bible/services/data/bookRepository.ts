export interface BookData {
  imagePath?: string;
  name: string;
  order: number;
  testament: 'old' | 'new';
}

export interface BookRepository {
  findBookByName(bookName: string): BookData | null;
  getImagePathFromBookName(bookName: string): string | null;
  getAllBooks(): BookData[];
}

// Mock implementation - will be replaced with database calls
export class MockBookRepository implements BookRepository {
  // This data will come from the database later
  private bookOrderMap: { [key: string]: number } = {
    Genesis: 1,
    Exodus: 2,
    Leviticus: 3,
    Numbers: 4,
    Deuteronomy: 5,
    Joshua: 6,
    Judges: 7,
    Ruth: 8,
    '1 Samuel': 9,
    '2 Samuel': 10,
    '1 Kings': 11,
    '2 Kings': 12,
    '1 Chronicles': 13,
    '2 Chronicles': 14,
    Ezra: 15,
    Nehemiah: 16,
    Esther: 17,
    Job: 18,
    Psalms: 19,
    Proverbs: 20,
    Ecclesiastes: 21,
    'Song of Solomon': 22,
    Isaiah: 23,
    Jeremiah: 24,
    Lamentations: 25,
    Ezekiel: 26,
    Daniel: 27,
    Hosea: 28,
    Joel: 29,
    Amos: 30,
    Obadiah: 31,
    Jonah: 32,
    Micah: 33,
    Nahum: 34,
    Habakkuk: 35,
    Zephaniah: 36,
    Haggai: 37,
    Zechariah: 38,
    Malachi: 39,
    Matthew: 40,
    Mark: 41,
    Luke: 42,
    John: 43,
    Acts: 44,
    Romans: 45,
    '1 Corinthians': 46,
    '2 Corinthians': 47,
    Galatians: 48,
    Ephesians: 49,
    Philippians: 50,
    Colossians: 51,
    '1 Thessalonians': 52,
    '2 Thessalonians': 53,
    '1 Timothy': 54,
    '2 Timothy': 55,
    Titus: 56,
    Philemon: 57,
    Hebrews: 58,
    James: 59,
    '1 Peter': 60,
    '2 Peter': 61,
    '1 John': 62,
    '2 John': 63,
    '3 John': 64,
    Jude: 65,
    Revelation: 66,
  };

  private nameMap: { [key: string]: string } = {
    '1 Samuel': '1-samuel',
    '2 Samuel': '2-samuel',
    '1 Kings': '1-kings',
    '2 Kings': '2-kings',
    '1 Chronicles': '1-chronicles',
    '2 Chronicles': '2-chronicles',
    'Song of Solomon': 'song-of-solomon',
    '1 Corinthians': '1-corinthians',
    '2 Corinthians': '2-corinthians',
    '1 Thessalonians': '1-thessalonians',
    '2 Thessalonians': '2-thessalonians',
    '1 Timothy': '1-timothy',
    '2 Timothy': '2-timothy',
    '1 Peter': '1-peter',
    '2 Peter': '2-peter',
    '1 John': '1-john',
    '2 John': '2-john',
    '3 John': '3-john',
  };

  findBookByName(bookName: string): BookData | null {
    if (!bookName) return null;

    const order = this.bookOrderMap[bookName];
    if (!order) return null;

    const imagePath = this.getImagePathFromBookName(bookName);
    return {
      name: bookName,
      order,
      testament: order <= 39 ? 'old' : 'new',
      ...(imagePath && { imagePath }),
    };
  }

  getImagePathFromBookName(bookName: string): string | null {
    if (!bookName) return null;

    const order = this.bookOrderMap[bookName];
    if (!order) return null;

    const paddedOrder = order.toString().padStart(2, '0');
    const fileName =
      this.nameMap[bookName] || bookName.toLowerCase().replace(/\s+/g, '-');
    return `${paddedOrder}_${fileName}.png`;
  }

  getAllBooks(): BookData[] {
    return Object.entries(this.bookOrderMap).map(([name, order]) => {
      const imagePath = this.getImagePathFromBookName(name);
      return {
        name,
        order,
        testament: order <= 39 ? 'old' : 'new',
        ...(imagePath && { imagePath }),
      };
    });
  }
}

// Export singleton instance
export const bookRepository = new MockBookRepository();
