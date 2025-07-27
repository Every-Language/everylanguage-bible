import { useCallback, useRef } from 'react';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { audioService } from '../services/AudioService';
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
    // Set up minimal callbacks that don't update context state
    const callbacks = {
      onPlay: () => logger.info('Audio service: Play callback triggered'),
      onPause: () => logger.info('Audio service: Pause callback triggered'),
      onStop: () => logger.info('Audio service: Stop callback triggered'),
      onLoad: (duration: number) => {
        options.onLoad?.(duration);
        logger.info('Audio service: Load callback triggered', { duration });
      },
      onError: (error: string) => {
        options.onError?.(error);
        logger.error('Audio service: Error callback triggered', { error });
      },
      onProgress: (position: number) => {
        // Only update progress, not play/pause state
        actions.updateProgress(position);
      },
      onEnd: () => logger.info('Audio service: Track ended'),
    };

    audioService.setCallbacks(callbacks);
    isInitialized.current = true;
    logger.info('Audio service hook initialized');
  }

  // Handle seek changes
  const handleSeek = useCallback(async (time: number) => {
    if (audioService.isLoaded()) {
      try {
        await audioService.seekTo(time);
      } catch (error) {
        logger.error('Failed to seek audio:', error);
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
          logger.error('Failed to load track in audio service:', {
            trackId: track.id,
            error,
          });
          onError?.(errorMessage);
        }
      }
    },
    play: async () => {
      if (audioService.isLoaded()) {
        try {
          await audioService.play();
          actions.play();
        } catch (error) {
          logger.error('Failed to play audio:', error);
          onError?.(
            error instanceof Error ? error.message : 'Failed to play audio'
          );
        }
      } else {
        actions.play(); // Fallback to context-only action
      }
    },
    pause: async () => {
      if (audioService.isLoaded()) {
        try {
          await audioService.pause();
          actions.pause();
        } catch (error) {
          logger.error('Failed to pause audio:', error);
        }
      } else {
        actions.pause(); // Fallback to context-only action
      }
    },
    stop: async () => {
      if (audioService.isLoaded()) {
        try {
          await audioService.stop();
          actions.stop();
        } catch (error) {
          logger.error('Failed to stop audio:', error);
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
