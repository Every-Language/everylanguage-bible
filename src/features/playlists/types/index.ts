export interface Playlist {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface PlaylistsState {
  playlists: Playlist[];
  loading: boolean;
  error: string | null;
  selectedPlaylist: Playlist | null;
} 