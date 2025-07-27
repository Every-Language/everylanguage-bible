import { useEffect, useCallback, useRef } from 'react';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { audioService, AudioServiceCallbacks } from '../services/AudioService';
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
  isPlaying: false, // This will be managed by the audio service
});

export interface UseAudioServiceOptions {
  autoPlay?: boolean;
  onError?: (error: string) => void;
  onLoad?: (duration: number) => void;
}

export const useAudioService = (options: UseAudioServiceOptions = {}) => {
  const { state, actions } = useMediaPlayer();
  const { autoPlay = false, onError, onLoad } = options;
  const isInitialized = useRef(false);

  // Set up audio service callbacks
  const setupCallbacks = useCallback(() => {
    const callbacks: AudioServiceCallbacks = {
      onPlay: () => {
        actions.play();
        logger.info('Audio service: Play callback triggered');
      },
      onPause: () => {
        actions.pause();
        logger.info('Audio service: Pause callback triggered');
      },
      onStop: () => {
        actions.stop();
        logger.info('Audio service: Stop callback triggered');
      },
      onLoad: (duration: number) => {
        // Get current track from state at the time of callback
        const currentTrack = state.currentTrack;
        if (currentTrack) {
          actions.updateProgress(0);
          onLoad?.(duration);
          logger.info('Audio service: Load callback triggered', { duration });
        }
      },
      onError: (error: string) => {
        onError?.(error);
        logger.error('Audio service: Error callback triggered', { error });
      },
      onProgress: (position: number) => {
        actions.updateProgress(position);
      },
      onEnd: () => {
        // Handle track end - could trigger next track or stop
        logger.info('Audio service: Track ended');
      },
    };

    audioService.setCallbacks(callbacks);
  }, [actions, onError, onLoad]); // Removed state.currentTrack from dependencies

  // Initialize audio service
  useEffect(() => {
    if (!isInitialized.current) {
      setupCallbacks();
      isInitialized.current = true;
      logger.info('Audio service hook initialized');
    }
  }, [setupCallbacks]);

  // Handle track changes
  useEffect(() => {
    const loadTrack = async () => {
      if (!state.currentTrack?.url) {
        return;
      }

      try {
        const adaptedTrack = adaptTrackForAudioService(state.currentTrack);
        await audioService.loadAudio(adaptedTrack);

        if (autoPlay) {
          await audioService.play();
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to load track';
        logger.error('Failed to load track in audio service:', {
          trackId: state.currentTrack?.id,
          error,
        });
        onError?.(errorMessage);
      }
    };

    loadTrack();
  }, [state.currentTrack?.id, state.currentTrack?.url, autoPlay, onError]);

  // Handle play/pause state changes
  useEffect(() => {
    const handlePlaybackStateChange = async () => {
      if (!audioService.isLoaded()) {
        return;
      }

      try {
        if (state.isPlaying && !audioService.isPlaying()) {
          await audioService.play();
        } else if (!state.isPlaying && audioService.isPlaying()) {
          await audioService.pause();
        }
      } catch (error) {
        logger.error('Failed to sync playback state:', error);
      }
    };

    handlePlaybackStateChange();
  }, [state.isPlaying]);

  // Handle volume changes
  useEffect(() => {
    const handleVolumeChange = async () => {
      if (audioService.isLoaded()) {
        try {
          await audioService.setVolume(state.volume);
        } catch (error) {
          logger.error('Failed to set volume:', error);
        }
      }
    };

    handleVolumeChange();
  }, [state.volume]);

  // Handle playback rate changes
  useEffect(() => {
    const handlePlaybackRateChange = async () => {
      if (audioService.isLoaded()) {
        try {
          await audioService.setPlaybackRate(state.playbackRate);
        } catch (error) {
          logger.error('Failed to set playback rate:', error);
        }
      }
    };

    handlePlaybackRateChange();
  }, [state.playbackRate]);

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
      // The track loading will be handled by the useEffect above
    },
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
      } else {
        actions.play(); // Fallback to context-only action
      }
    },
    pause: async () => {
      if (audioService.isLoaded()) {
        try {
          await audioService.pause();
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
