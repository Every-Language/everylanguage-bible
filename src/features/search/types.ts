// Search feature types
export interface SearchResult {
  id: string;
  type: 'book' | 'chapter' | 'verse' | 'audio';
  title: string;
  description?: string;
  book_name: string;
  chapter_number?: number;
  verse_number?: number;
  text?: string;
  audio_file_url?: string;
  duration_seconds?: number;
  relevanceScore: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
  highlightedText?: string;
}

export interface SearchQuery {
  term: string;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchFilters {
  books?: string[];
  testament?: 'old' | 'new';
  language?: string;
  hasAudio?: boolean;
  contentType?: ('book' | 'chapter' | 'verse' | 'audio')[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: SearchQuery;
  executionTime: number;
}

export type SearchStatus = 'idle' | 'searching' | 'success' | 'error';

export interface SearchState {
  query: string;
  results: SearchResult[];
  status: SearchStatus;
  error?: string;
  hasSearched: boolean;
}
