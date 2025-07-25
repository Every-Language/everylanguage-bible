// This will be replaced with actual database calls later
export interface VerseCountRepository {
  getChapterVerseCount(bookName: string, chapter: number): number;
}

// Mock implementation - will be replaced with database calls
export class MockVerseCountRepository implements VerseCountRepository {
  private verseCountMap: Record<string, Record<number, number>> = {
    John: { 1: 51, 2: 25, 3: 36, 4: 54, 5: 47, 6: 71 },
    Luke: { 1: 80, 2: 52, 3: 38, 4: 44, 5: 39 },
    Matthew: { 1: 25, 2: 23, 3: 17, 4: 25, 5: 48 },
    Mark: { 1: 45, 2: 28, 3: 35, 4: 41, 5: 43 },
    Galatians: { 1: 24, 2: 21, 3: 29, 4: 31, 5: 26, 6: 18 },
  };

  getChapterVerseCount(bookName: string, chapter: number): number {
    return this.verseCountMap[bookName]?.[chapter] || 35; // Default to 35 if not found
  }
}

// Export singleton instance
export const verseCountRepository = new MockVerseCountRepository();
