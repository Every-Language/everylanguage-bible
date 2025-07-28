import { useCallback, useRef } from 'react';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { audioService } from '../services/AudioService';
import { MediaTrack as MediaFeatureTrack } from '../types';

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
  url: track.url || '',
  isPlaying: false,
});

export interface UseAudioServiceOptions {
  autoPlay?: boolean;
  onError?: (error: string) => void;
  onLoad?: (duration: number) => void;
}

export const useAudioService = (options: UseAudioServiceOptions = {}) => {
  const { state, actions } = useMediaPlayer();
  const { onError } = options;
  const isInitialized = useRef(false);

  // Initialize audio service only once
  if (!isInitialized.current) {
    // Set up callbacks to sync state with audio service
    const callbacks = {
      onPlay: () => {
        // Ensure context state matches audio service state
        if (!state.isPlaying) {
          actions.play();
        }
        // logger.info('Audio service: Play callback triggered');
      },
      onPause: () => {
        // Ensure context state matches audio service state
        if (state.isPlaying) {
          actions.pause();
        }
        // logger.info('Audio service: Pause callback triggered');
      },
      onStop: () => {
        // Ensure context state matches audio service state
        if (state.isPlaying || state.currentTrack) {
          actions.stop();
        }
        // logger.info('Audio service: Stop callback triggered');
      },
      onLoad: (duration: number) => {
        options.onLoad?.(duration);
        // logger.info('Audio service: Load callback triggered', { duration });
      },
      onError: (error: string) => {
        options.onError?.(error);
        // logger.error('Audio service: Error callback triggered', { error });
      },
      onProgress: (position: number) => {
        // Only update progress, not play/pause state
        actions.updateProgress(position);
      },
      onEnd: () => {
        // logger.info('Audio service: Track ended');
      },
    };

    audioService.setCallbacks(callbacks);
    isInitialized.current = true;
    // logger.info('Audio service hook initialized');
  }

  // Handle seek changes
  const handleSeek = useCallback(async (time: number) => {
    if (audioService.isLoaded()) {
      try {
        await audioService.seekTo(time);
      } catch {
        // logger.error('Failed to seek audio:', _error);
      }
    }
  }, []);

  // Enhanced actions that work with the audio service
  const enhancedActions = {
    ...actions,
    seekTo: handleSeek,
    setCurrentTrack: async (track: MediaPlayerTrack) => {
      actions.setCurrentTrack(track);

      // Load the track in the audio service
      if (track.url) {
        try {
          const adaptedTrack = adaptTrackForAudioService(track);
          await audioService.loadAudio(adaptedTrack);

          if (options.autoPlay) {
            await audioService.play();
            actions.play();
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to load track';
          // logger.error('Failed to load track in audio service:', {
          //   trackId: track.id,
          //   error: error,
          // });
          onError?.(errorMessage);
        }
      }
    },
    play: async () => {
      // Optimistic UI update - update state immediately
      actions.play();

      if (audioService.isLoaded()) {
        try {
          await audioService.play();
          // Audio service callbacks will handle state sync
        } catch (error) {
          // logger.error('Failed to play audio:', error);
          // Revert optimistic update on error
          actions.pause();
          onError?.(
            error instanceof Error ? error.message : 'Failed to play audio'
          );
        }
      }
      // If audio not loaded, the optimistic update is sufficient
    },
    pause: async () => {
      // Optimistic UI update - update state immediately
      actions.pause();

      if (audioService.isLoaded()) {
        try {
          await audioService.pause();
          // Audio service callbacks will handle state sync
        } catch {
          // logger.error('Failed to pause audio:', error);
          // Revert optimistic update on error
          actions.play();
        }
      }
      // If audio not loaded, the optimistic update is sufficient
    },
    stop: async () => {
      if (audioService.isLoaded()) {
        try {
          await audioService.stop();
          actions.stop();
        } catch {
          // logger.error('Failed to stop audio:', error);
        }
      } else {
        actions.stop(); // Fallback to context-only action
      }
    },
  };

  // Get current audio service state
  const getAudioServiceState = useCallback(() => {
    return audioService.getState();
  }, []);

  // Check if audio service is ready
  const isAudioServiceReady = useCallback(() => {
    return audioService.isLoaded();
  }, []);

  // Get current track from audio service
  const getCurrentAudioTrack = useCallback(() => {
    return audioService.getCurrentTrack();
  }, []);

  return {
    state,
    actions: enhancedActions,
    audioServiceState: getAudioServiceState(),
    isAudioServiceReady: isAudioServiceReady(),
    currentAudioTrack: getCurrentAudioTrack(),
  };
};
