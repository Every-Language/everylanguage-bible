import { type Book } from '@/shared/utils';

export interface ChapterData {
  id: string;
  book_name: string;
  chapter_number: number;
  title: string;
  audio_file_url: string;
  duration_seconds: number;
  language: string;
  created_at: string;
  updated_at: string;
}

export class ChapterDataService {
  // Create chapter data compatible with queue system
  // This will be replaced with actual database calls later
  createChapterData(book: Book, chapterNumber: number): ChapterData {
    const bookId = book.name.toLowerCase().replace(/\s+/g, '-');
    const chapterId = `${bookId}-${chapterNumber}`;

    return {
      id: chapterId,
      book_name: book.name,
      chapter_number: chapterNumber,
      title: `${book.name} Chapter ${chapterNumber}`,
      audio_file_url: `https://example.com/${chapterId}.mp3`, // Mock URL - will be from database
      duration_seconds: 600 + chapterNumber * 30, // Mock duration - will be from database
      language: 'en', // Will be dynamic from user settings
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // Generate dummy verse count for a chapter
  // This will be replaced with actual database calls later
  getDummyVerseCount(chapterNumber: number): number {
    const seed = chapterNumber * 7;
    return 15 + (seed % 35);
  }

  // Generate dummy verse text
  // This will be replaced with actual database calls later
  getDummyVerseText(verseNumber: number): string {
    const verseTexts = [
      'In the beginning was the Word, and the Word was with God, and the Word was God.',
      'For God so loved the world that he gave his one and only Son.',
      'The Lord is my shepherd; I shall not want.',
      'And we know that in all things God works for the good of those who love him.',
      'Trust in the Lord with all your heart and lean not on your own understanding.',
      'Be strong and courageous. Do not be afraid; do not be discouraged.',
    ];

    const index = (verseNumber - 1) % verseTexts.length;
    return verseTexts[index] || 'Default verse text';
  }
}

// Export singleton instance
export const chapterDataService = new ChapterDataService();
