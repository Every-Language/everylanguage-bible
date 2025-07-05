/**
 * Mini Player View Component
 *
 * Compact audio player that displays essential controls and information.
 * Based on the Flutter implementation approach with sliding panel integration.
 *
 * Features:
 * - Compact design with essential controls
 * - Real-time verse information display
 * - Smooth animations and transitions
 * - Tap to expand to full player
 * - Background playback indicators
 * - Accessibility support
 *
 * @since 1.0.0
 */

import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  usePlayerState,
  useCurrentVerse,
  usePlaybackPosition,
  useAudioActions,
} from '@/shared/store/audioStore';
import {
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  SkipBackwardIcon,
} from '@/shared/components/ui/icons/AudioIcons';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { Colors } from '@/shared/constants/colors';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface MiniPlayerViewProps {
  /** Whether the mini player is visible */
  isVisible: boolean;
  /** Current slide progress (0-1) */
  slideProgress: number;
  /** Callback when user taps to expand */
  onExpand: () => void;
  /** Callback when user swipes to dismiss */
  onDismiss: () => void;
  /** Whether sliding is enabled */
  canSlide?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const MINI_PLAYER_HEIGHT = 80;
const MINI_PLAYER_PADDING = 16;

// ============================================================================
// Mini Player View Component
// ============================================================================

export const MiniPlayerView: React.FC<MiniPlayerViewProps> = ({
  isVisible,
  slideProgress,
  onExpand,
  onDismiss,
  canSlide = true,
}) => {
  // Global state
  const playerState = usePlayerState();
  const currentVerse = useCurrentVerse();
  const { position, duration } = usePlaybackPosition();
  const { play, pause, skipForward, skipBackward } = useAudioActions();

  // Animation values
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // ========================================================================
  // Computed Values
  // ========================================================================

  const formattedPosition = useMemo(() => {
    const minutes = Math.floor(position / 60);
    const seconds = Math.floor(position % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [position]);

  const formattedDuration = useMemo(() => {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [duration]);

  const displayTitle = useMemo(() => {
    if (!playerState.currentChapter) return 'No Chapter Loaded';

    const { book_id, chapter_number } = playerState.currentChapter.chapter;
    return `${book_id} ${chapter_number}`;
  }, [playerState.currentChapter]);

  const displaySubtitle = useMemo(() => {
    if (!currentVerse) return 'Select a verse to begin';

    const verseText = currentVerse.text || '';
    const truncatedText =
      verseText.length > 60 ? `${verseText.substring(0, 60)}...` : verseText;

    return `Verse ${currentVerse.verse_number}: ${truncatedText}`;
  }, [currentVerse]);

  // ========================================================================
  // Gesture Handlers
  // ========================================================================

  const panGesture = Gesture.Pan()
    .enabled(canSlide)
    .onStart(() => {
      scale.value = withSpring(0.95);
    })
    .onUpdate(event => {
      // Handle vertical swipe for expand/dismiss
      if (Math.abs(event.translationY) > Math.abs(event.translationX)) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(event => {
      scale.value = withSpring(1);

      const velocity = event.velocityY;
      const translation = event.translationY;

      // Determine action based on gesture
      if (translation < -50 || velocity < -500) {
        // Swipe up or fast upward velocity -> expand
        translateY.value = withSpring(0);
        runOnJS(onExpand)();
      } else if (translation > 50 || velocity > 500) {
        // Swipe down or fast downward velocity -> dismiss
        translateY.value = withSpring(MINI_PLAYER_HEIGHT);
        runOnJS(onDismiss)();
      } else {
        // Return to original position
        translateY.value = withSpring(0);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onExpand)();
  });

  const combinedGesture = Gesture.Race(panGesture, tapGesture);

  // ========================================================================
  // Animated Styles
  // ========================================================================

  const animatedContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(slideProgress, [0, 1], [1, 0]);

    const transform = [
      { translateY: translateY.value },
      { scale: scale.value },
    ];

    return {
      opacity,
      transform,
    };
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    const opacity = interpolate(slideProgress, [0, 0.3], [1, 0]);

    return { opacity };
  });

  // ========================================================================
  // Event Handlers
  // ========================================================================

  const handlePlayPause = async () => {
    try {
      if (playerState.isPlaying) {
        await pause();
      } else {
        await play();
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error toggling playback:', error);
      }
    }
  };

  const handleSkipBackward = async () => {
    try {
      await skipBackward(10);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error skipping backward:', error);
      }
    }
  };

  const handleSkipForward = async () => {
    try {
      await skipForward(10);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error skipping forward:', error);
      }
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  if (!isVisible || !playerState.currentChapter) {
    return null;
  }

  return (
    <GestureDetector gesture={combinedGesture}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <View style={styles.gradient}>
          {/* Progress Bar */}
          <Animated.View
            style={[styles.progressContainer, animatedProgressStyle]}>
            <ProgressBar currentTime={position} totalTime={duration} />
          </Animated.View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Album Art / Chapter Indicator */}
            <View style={styles.artworkContainer}>
              <View style={styles.artwork}>
                <Text style={styles.artworkText}>
                  {displayTitle.substring(0, 2).toUpperCase()}
                </Text>
              </View>

              {/* Status Indicators */}
              <View style={styles.statusContainer}>
                {playerState.isBuffering && (
                  <View style={styles.statusIndicator}>
                    <Text style={styles.statusText}>•••</Text>
                  </View>
                )}
                {playerState.isBackgroundPlaybackEnabled && (
                  <View style={styles.statusIndicator}>
                    <Text style={styles.statusText}>🎧</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Track Information */}
            <View style={styles.trackInfo}>
              <Text style={styles.title} numberOfLines={1}>
                {displayTitle}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {displaySubtitle}
              </Text>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {formattedPosition} / {formattedDuration}
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <Pressable
                style={styles.controlButton}
                onPress={handleSkipBackward}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <SkipBackwardIcon size={24} color={Colors.text.inverse} />
              </Pressable>

              <Pressable
                style={[styles.controlButton, styles.playButton]}
                onPress={handlePlayPause}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                {playerState.isPlaying ? (
                  <PauseIcon size={28} color={Colors.text.inverse} />
                ) : (
                  <PlayIcon size={28} color={Colors.text.inverse} />
                )}
              </Pressable>

              <Pressable
                style={styles.controlButton}
                onPress={handleSkipForward}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <SkipForwardIcon size={24} color={Colors.text.inverse} />
              </Pressable>
            </View>
          </View>

          {/* Expand Indicator */}
          <View style={styles.expandIndicator}>
            <View style={styles.expandHandle} />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MINI_PLAYER_HEIGHT,
    backgroundColor: Colors.text.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: Colors.audio.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },

  gradient: {
    flex: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },

  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: MINI_PLAYER_PADDING,
    paddingTop: 8,
    paddingBottom: 8,
  },

  artworkContainer: {
    position: 'relative',
    marginRight: 12,
  },

  artwork: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  artworkText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.inverse,
  },

  statusContainer: {
    position: 'absolute',
    top: -4,
    right: -4,
    flexDirection: 'row',
  },

  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },

  statusText: {
    fontSize: 10,
    color: Colors.text.inverse,
    fontWeight: 'bold',
  },

  trackInfo: {
    flex: 1,
    marginRight: 12,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.inverse,
    marginBottom: 2,
  },

  subtitle: {
    fontSize: 14,
    color: Colors.interactive.disabled,
    marginBottom: 4,
  },

  timeContainer: {
    flexDirection: 'row',
  },

  timeText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },

  playButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 8,
  },

  expandIndicator: {
    position: 'absolute',
    top: 6,
    left: '50%',
    transform: [{ translateX: -12 }],
    width: 24,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  expandHandle: {
    width: 24,
    height: 3,
    backgroundColor: Colors.text.secondary,
    borderRadius: 1.5,
  },
});

export default MiniPlayerView;
