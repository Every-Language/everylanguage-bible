import { useRef, useEffect, useMemo, useState } from 'react';
import { useMediaPlayer } from '@/shared/hooks/useMediaPlayerFromStore';
import { audioService, type AudioServiceState } from '../services/AudioService';
import { MediaTrack as MediaFeatureTrack } from '../types';
import { logger } from '@/shared/utils/logger';

// Type adapter to convert between MediaTrack types
type MediaPlayerTrack = {
  id: string;
  title: string;
  subtitle: string;
  duration: number;
  currentTime: number;
  url?: string;
  book?: string;
  chapter?: string;
  verse?: string;
};

const adaptTrackForAudioService = (
  track: MediaPlayerTrack
): MediaFeatureTrack => ({
  id: track.id,
  title: track.title,
  subtitle: track.subtitle,
  duration: track.duration,
  currentTime: track.currentTime,
  isPlaying: false,
  ...(track.url && { url: track.url }),
});

export interface UseUnifiedMediaPlayerOptions {
  autoPlay?: boolean;
  onError?: (error: string) => void;
  onLoad?: (duration: number) => void;
}

export interface UnifiedMediaPlayerState {
  // Track information
  currentTrack: MediaPlayerTrack | null;

  // Playback state (from audio service - single source of truth)
  isPlaying: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  position: number;
  duration: number;

  // UI state (from store)
  isExpanded: boolean;
  volume: number;
  playbackRate: number;

  // Queue state (from store)
  queue: MediaPlayerTrack[];
  currentIndex: number;
  repeatMode: 'none' | 'one' | 'all';
  shuffleMode: boolean;

  // Error state
  error: string | null;
}

export interface UnifiedMediaPlayerActions {
  // Track management
  setCurrentTrack: (track: MediaPlayerTrack) => Promise<void>;

  // Playback controls
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  seekTo: (time: number) => Promise<void>;

  // Audio controls
  setVolume: (volume: number) => Promise<void>;
  setPlaybackRate: (rate: number) => Promise<void>;

  // UI controls
  expand: () => void;
  collapse: () => void;
  toggleExpanded: () => void;

  // Queue management
  setQueue: (tracks: MediaPlayerTrack[]) => void;
  addToQueue: (track: MediaPlayerTrack) => void;
  removeFromQueue: (trackId: string) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;

  // Error handling
  clearError: () => void;
}

export const useUnifiedMediaPlayer = (
  options: UseUnifiedMediaPlayerOptions = {}
): { state: UnifiedMediaPlayerState; actions: UnifiedMediaPlayerActions } => {
  const { state: storeState, actions: storeActions } = useMediaPlayer();
  const { onError } = options;

  // Local state for audio service state
  const [audioServiceState, setAudioServiceState] = useState<AudioServiceState>(
    {
      isLoaded: false,
      isPlaying: false,
      isLoading: false,
      error: null,
      duration: 0,
      position: 0,
      volume: 1.0,
      playbackRate: 1.0,
      isMuted: false,
    }
  );

  const isInitialized = useRef(false);

  // Subscribe to audio service events
  useEffect(() => {
    if (!isInitialized.current) {
      const unsubscribe = audioService.subscribe(event => {
        switch (event.type) {
          case 'stateChanged':
            setAudioServiceState(event.state);

            // Handle errors
            if (event.state.error) {
              onError?.(event.state.error);
            }
            break;

          case 'trackEnded':
            // Handle track end - could trigger next track or stop
            storeActions.stop();
            break;

          case 'error':
            // Handle errors
            onError?.(event.error);
            break;
        }
      });

      isInitialized.current = true;

      // Return cleanup function
      return unsubscribe;
    }
  }, [onError, storeActions]);

  // Unified state that combines store and audio service state
  const unifiedState: UnifiedMediaPlayerState = useMemo(
    () => ({
      // Track information (from store)
      currentTrack: storeState.currentTrack,

      // Playback state (from audio service - single source of truth)
      isPlaying: audioServiceState.isPlaying,
      isLoaded: audioServiceState.isLoaded,
      isLoading: audioServiceState.isLoading,
      position: audioServiceState.position,
      duration: audioServiceState.duration,

      // UI state (from store)
      isExpanded: storeState.isExpanded,
      volume: storeState.volume,
      playbackRate: storeState.playbackRate,

      // Queue state (from store)
      queue: storeState.queue,
      currentIndex: storeState.currentIndex,
      repeatMode: storeState.repeatMode,
      shuffleMode: storeState.shuffleMode,

      // Error state (from audio service)
      error: audioServiceState.error,
    }),
    [storeState, audioServiceState]
  );

  // Enhanced actions that work with both store and audio service
  const unifiedActions: UnifiedMediaPlayerActions = useMemo(
    () => ({
      // Track management
      setCurrentTrack: async (track: MediaPlayerTrack) => {
        // Ensure track starts from the beginning
        const trackWithZeroTime = {
          ...track,
          currentTime: 0,
        };

        // Update store immediately for optimistic UI
        storeActions.setCurrentTrack(trackWithZeroTime);

        // Load the track in the audio service
        if (track.url) {
          try {
            const adaptedTrack = adaptTrackForAudioService(trackWithZeroTime);
            await audioService.loadAudio(adaptedTrack);

            if (options.autoPlay) {
              await audioService.play();
            }
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to load track';
            logger.error('Failed to load track in audio service:', {
              trackId: track.id,
              error: error,
            });
            onError?.(errorMessage);
          }
        }
      },

      // Playback controls
      play: async () => {
        if (audioService.isLoaded()) {
          try {
            await audioService.play();
          } catch (error) {
            logger.error('Failed to play audio:', error);
            onError?.(
              error instanceof Error ? error.message : 'Failed to play audio'
            );
          }
        }
      },

      pause: async () => {
        if (audioService.isLoaded()) {
          try {
            await audioService.pause();
          } catch (error) {
            logger.error('Failed to pause audio:', error);
          }
        }
      },

      stop: async () => {
        if (audioService.isLoaded()) {
          try {
            await audioService.stop();
          } catch (error) {
            logger.error('Failed to stop audio:', error);
          }
        }
        storeActions.stop();
      },

      seekTo: async (time: number) => {
        if (audioService.isLoaded()) {
          try {
            await audioService.seekTo(time);
          } catch (error) {
            logger.error('Failed to seek audio:', error);
          }
        }
      },

      // Audio controls
      setVolume: async (volume: number) => {
        storeActions.setVolume(volume);
        if (audioService.isLoaded()) {
          try {
            await audioService.setVolume(volume);
          } catch (error) {
            logger.error('Failed to set volume:', error);
          }
        }
      },

      setPlaybackRate: async (rate: number) => {
        storeActions.setPlaybackRate(rate);
        if (audioService.isLoaded()) {
          try {
            await audioService.setPlaybackRate(rate);
          } catch (error) {
            logger.error('Failed to set playback rate:', error);
          }
        }
      },

      // UI controls (store only)
      expand: storeActions.expand,
      collapse: storeActions.collapse,
      toggleExpanded: storeActions.toggleExpanded,

      // Queue management (store only)
      setQueue: storeActions.setQueue,
      addToQueue: storeActions.addToQueue,
      removeFromQueue: storeActions.removeFromQueue,
      nextTrack: storeActions.nextTrack,
      previousTrack: storeActions.previousTrack,
      toggleRepeat: storeActions.toggleRepeat,
      toggleShuffle: storeActions.toggleShuffle,

      // Error handling
      clearError: storeActions.clearError,
    }),
    [storeActions, options.autoPlay, onError]
  );

  return {
    state: unifiedState,
    actions: unifiedActions,
  };
};
