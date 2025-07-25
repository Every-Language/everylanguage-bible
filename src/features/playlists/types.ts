// Playlists feature types
export interface PlaylistItem {
  id: string;
  title: string;
  description: string;
  iconPath: string;
  category: PlaylistCategory;
  items?: PlaylistContent[];
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface PlaylistContent {
  id: string;
  type: 'chapter' | 'verse' | 'book';
  book_name: string;
  chapter_number?: number;
  verse_number?: number;
  order: number;
}

export type PlaylistCategory =
  | 'my-playlists'
  | 'study-bible'
  | 'meeting-pattern';

export type PlaylistMode = PlaylistCategory;

export interface CreatePlaylistRequest {
  title: string;
  description: string;
  category: PlaylistCategory;
  iconPath?: string;
}

export interface UpdatePlaylistRequest extends Partial<CreatePlaylistRequest> {
  id: string;
}
