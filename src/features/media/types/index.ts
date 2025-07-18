export interface MediaTrack {
  id: string;
  title: string;
  subtitle?: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  url?: string;
}

export interface MediaPlayerState {
  currentTrack: MediaTrack | null;
  isPlaying: boolean;
  loading: boolean;
  error: string | null;
  volume: number;
  playbackRate: number;
}
