import { useCallback, useRef, useEffect, useMemo } from 'react';
import { useMediaPlayer } from '@/shared/hooks/useMediaPlayerFromStore';
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
  isPlaying: false,
  ...(track.url && { url: track.url }),
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

  // Subscribe to audio service events
  useEffect(() => {
    if (!isInitialized.current) {
      const unsubscribe = audioService.subscribe(event => {
        switch (event.type) {
          case 'stateChanged': {
            // Sync audio service state to store
            const audioState = event.state;

            // Update playing state
            if (state.isPlaying !== audioState.isPlaying) {
              if (audioState.isPlaying) {
                actions.play();
              } else {
                actions.pause();
              }
            }

            // Update progress if track exists
            if (
              state.currentTrack &&
              audioState.position !== state.currentTrack.currentTime
            ) {
              actions.updateProgress(audioState.position);
            }

            // Update track duration if it changed
            if (
              state.currentTrack &&
              audioState.duration !== state.currentTrack.duration
            ) {
              actions.setCurrentTrack({
                ...state.currentTrack,
                duration: audioState.duration,
              });
            }

            // Handle loading state
            if (audioState.isLoading && !state.currentTrack) {
              // Track is loading but not set in store yet
              const currentAudioTrack = audioService.getCurrentTrack();
              if (currentAudioTrack) {
                const trackData: MediaPlayerTrack = {
                  id: currentAudioTrack.id,
                  title: currentAudioTrack.title,
                  subtitle: currentAudioTrack.subtitle || '',
                  duration: currentAudioTrack.duration,
                  currentTime: currentAudioTrack.currentTime,
                };

                if (currentAudioTrack.url) {
                  trackData.url = currentAudioTrack.url;
                }

                actions.setCurrentTrack(trackData);
              }
            }
            break;
          }

          case 'trackEnded':
            // Handle track end - could trigger next track or stop
            actions.stop();
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
  }, [state.isPlaying, state.currentTrack, actions, onError]);

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
  const enhancedActions = useMemo(
    () => ({
      ...actions,
      seekTo: handleSeek,
      setCurrentTrack: async (track: MediaPlayerTrack) => {
        // Ensure track starts from the beginning
        const trackWithZeroTime = {
          ...track,
          currentTime: 0,
        };

        // Update store immediately for optimistic UI
        actions.setCurrentTrack(trackWithZeroTime);

        // Load the track in the audio service
        if (track.url) {
          try {
            const adaptedTrack = adaptTrackForAudioService(trackWithZeroTime);
            const loadOptions =
              options.autoPlay !== undefined
                ? { autoPlay: options.autoPlay }
                : {};
            await audioService.loadAudio(adaptedTrack, loadOptions);
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
      play: async () => {
        // Optimistic UI update - update state immediately
        actions.play();

        if (audioService.isLoaded()) {
          try {
            await audioService.play();
            // Audio service events will handle state sync
          } catch (error) {
            logger.error('Failed to play audio:', error);
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
            // Audio service events will handle state sync
          } catch (error) {
            logger.error('Failed to pause audio:', error);
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
          } catch (error) {
            logger.error('Failed to stop audio:', error);
          }
        } else {
          actions.stop(); // Fallback to context-only action
        }
      },
    }),
    [actions, handleSeek, options.autoPlay, onError]
  );

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
