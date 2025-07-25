// Bible feature types
export interface Book {
  id: string;
  name: string;
  chapters: number;
  testament: 'old' | 'new';
  order: number;
  imagePath?: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  book_name: string;
  chapter_number: number;
  verse_count: number;
  audio_file_url?: string;
  duration_seconds?: number;
  language: string;
}

export interface Verse {
  id: string;
  book_id: string;
  chapter_id: string;
  book_name: string;
  chapter_number: number;
  verse_number: number;
  text: string;
  audio_file_url?: string;
  start_time?: number;
  end_time?: number;
  language: string;
}

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  description?: string;
}

export type Testament = 'old' | 'new';

export type ViewMode = 'chapters' | 'verses';

export interface BookSearchResult {
  book: Book;
  relevanceScore: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
}
