/**
 * Full Player View Component
 *
 * Complete audio player interface with comprehensive controls and verse navigation.
 * Based on the Flutter implementation approach with mode-aware functionality.
 *
 * Features:
 * - Complete audio controls (play, pause, stop, seek, speed)
 * - Interactive verse list with real-time highlighting
 * - Chapter navigation and cross-book navigation
 * - Audio settings (volume, speed, language switching)
 * - Playlist mode support
 * - Background playback controls
 * - Accessibility support
 *
 * @since 1.0.0
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  usePlayerState,
  useVerseState,
  useCurrentVerse,
  usePlaybackPosition,
  useVerseNavigation,
  useChapterNavigation,
  useAudioActions,
} from '@/shared/store/audioStore';
import {
  PlayIcon,
  PauseIcon,
  SkipForwardIcon,
  SkipBackwardIcon,
  VolumeUpIcon,
  ChevronDownIcon,
} from '@/shared/components/ui/icons/AudioIcons';
import type { PlaybackSpeed } from '@/features/audio/types';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import { Colors } from '@/shared/constants/colors';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface FullPlayerViewProps {
  /** Whether the full player is visible */
  isVisible: boolean;
  /** Current slide progress (0-1) */
  slideProgress: number;
  /** Callback when user swipes to minimize */
  onMinimize: () => void;
  /** Callback when user closes the player */
  onClose: () => void;
  /** Whether sliding is enabled */
  canSlide?: boolean;
}

interface VerseListItemProps {
  verse: import('@/features/audio/types').VerseTimestamp_temp;
  isCurrentVerse: boolean;
  isHighlighted: boolean;
  onPress: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const VERSE_LIST_HEIGHT = 200;

// ============================================================================
// Verse List Item Component
// ============================================================================

const VerseListItem: React.FC<VerseListItemProps> = React.memo(
  ({ verse, isCurrentVerse, isHighlighted, onPress }) => {
    const itemStyle = [
      styles.verseItem,
      isCurrentVerse && styles.currentVerseItem,
      isHighlighted && styles.highlightedVerseItem,
    ];

    const textStyle = [
      styles.verseText,
      isCurrentVerse && styles.currentVerseText,
    ];

    return (
      <Pressable
        style={itemStyle}
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
        <View style={styles.verseHeader}>
          <Text
            style={[
              styles.verseNumber,
              isCurrentVerse && styles.currentVerseNumber,
            ]}>
            {verse.verse_number}
          </Text>
          <Text style={styles.verseTiming}>
            {Math.floor(verse.start_time / 60)}:
            {(verse.start_time % 60).toFixed(0).padStart(2, '0')}
          </Text>
        </View>
        <Text style={textStyle} numberOfLines={2}>
          {verse.text || 'No text available'}
        </Text>
      </Pressable>
    );
  }
);

VerseListItem.displayName = 'VerseListItem';

// ============================================================================
// Full Player View Component
// ============================================================================

export const FullPlayerView: React.FC<FullPlayerViewProps> = ({
  isVisible,
  slideProgress,
  onMinimize,
  onClose,
  canSlide = true,
}) => {
  const insets = useSafeAreaInsets();

  // Global state
  const playerState = usePlayerState();
  const verseState = useVerseState();
  const currentVerse = useCurrentVerse();
  const { position, duration } = usePlaybackPosition();
  const { canGoToNextVerse, canGoToPreviousVerse, currentVerseNumber } =
    useVerseNavigation();
  const {
    canGoToNextChapter,
    canGoToPreviousChapter,
    currentBookId,
    currentChapterNumber,
  } = useChapterNavigation();

  // Actions
  const {
    play,
    pause,
    stop,
    seek,
    skipForward,
    skipBackward,
    goToVerse,
    nextVerse,
    previousVerse,
    nextChapter,
    previousChapter,
    setPlaybackSpeed,
  } = useAudioActions();

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
    return `${book_id.toUpperCase()} Chapter ${chapter_number}`;
  }, [playerState.currentChapter]);

  const displaySubtitle = useMemo(() => {
    if (!currentVerse) return 'No verse selected';
    return `Verse ${currentVerse.verse_number} of ${verseState.verses.length}`;
  }, [currentVerse, verseState.verses.length]);

  // ========================================================================
  // Gesture Handlers
  // ========================================================================

  const panGesture = Gesture.Pan()
    .enabled(canSlide)
    .onStart(() => {
      scale.value = withSpring(0.98);
    })
    .onUpdate(event => {
      // Handle downward swipe for minimize
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd(event => {
      scale.value = withSpring(1);

      const velocity = event.velocityY;
      const translation = event.translationY;

      // Determine action based on gesture
      if (translation > 100 || velocity > 800) {
        // Swipe down or fast downward velocity -> minimize
        translateY.value = withSpring(SCREEN_HEIGHT);
        runOnJS(onMinimize)();
      } else {
        // Return to original position
        translateY.value = withSpring(0);
      }
    });

  // ========================================================================
  // Event Handlers
  // ========================================================================

  const handlePlayPause = useCallback(async () => {
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
      Alert.alert('Error', 'Failed to toggle playback');
    }
  }, [playerState.isPlaying, play, pause]);

  const handleStop = useCallback(async () => {
    try {
      await stop();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error stopping playback:', error);
      }
      Alert.alert('Error', 'Failed to stop playback');
    }
  }, [stop]);

  const handleSeek = useCallback(
    async (newPosition: number) => {
      try {
        await seek(newPosition);
      } catch (error) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Error seeking:', error);
        }
      }
    },
    [seek]
  );

  const handleSkipBackward = useCallback(async () => {
    try {
      await skipBackward(10);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error skipping backward:', error);
      }
    }
  }, [skipBackward]);

  const handleSkipForward = useCallback(async () => {
    try {
      await skipForward(10);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error skipping forward:', error);
      }
    }
  }, [skipForward]);

  const handleVersePress = useCallback(
    async (verseNumber: number) => {
      try {
        await goToVerse(verseNumber);
      } catch (error) {
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.error('Error navigating to verse:', error);
        }
      }
    },
    [goToVerse]
  );

  const handleNextVerse = useCallback(async () => {
    try {
      await nextVerse();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error going to next verse:', error);
      }
    }
  }, [nextVerse]);

  const handlePreviousVerse = useCallback(async () => {
    try {
      await previousVerse();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error going to previous verse:', error);
      }
    }
  }, [previousVerse]);

  const handleNextChapter = useCallback(async () => {
    try {
      await nextChapter();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error going to next chapter:', error);
      }
    }
  }, [nextChapter]);

  const handlePreviousChapter = useCallback(async () => {
    try {
      await previousChapter();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Error going to previous chapter:', error);
      }
    }
  }, [previousChapter]);

  const handleSpeedChange = useCallback(async () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.findIndex(
      speed => speed === playerState.playbackSpeed
    );
    const nextIndex =
      currentIndex >= 0 ? (currentIndex + 1) % speeds.length : 0;
    const newSpeed = speeds[nextIndex] ?? 1.0;

    try {
      await setPlaybackSpeed(newSpeed as PlaybackSpeed);
    } catch {
      // Error changing playback speed
    }
  }, [playerState.playbackSpeed, setPlaybackSpeed]);

  // ========================================================================
  // Animated Styles
  // ========================================================================

  const animatedContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(slideProgress, [0, 1], [0, 1]);

    const transform = [
      { translateY: translateY.value },
      { scale: scale.value },
    ];

    return {
      opacity,
      transform,
    };
  });

  // ========================================================================
  // Render Helpers
  // ========================================================================

  const renderVerseItem = useCallback(
    ({
      item,
    }: {
      item: import('@/features/audio/types').VerseTimestamp_temp;
    }) => (
      <VerseListItem
        verse={item}
        isCurrentVerse={item.verse_number === currentVerseNumber}
        isHighlighted={item.verse_number === verseState.highlightedVerseNumber}
        onPress={() => handleVersePress(item.verse_number)}
      />
    ),
    [currentVerseNumber, verseState.highlightedVerseNumber, handleVersePress]
  );

  // ========================================================================
  // Render
  // ========================================================================

  if (!isVisible || !playerState.currentChapter) {
    return null;
  }

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <View style={styles.content}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Header Actions */}
            <View style={styles.headerActions}>
              <Pressable style={styles.headerButton} onPress={onMinimize}>
                <ChevronDownIcon size={24} color={Colors.text.inverse} />
              </Pressable>

              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {displayTitle}
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {displaySubtitle}
                </Text>
              </View>

              <Pressable style={styles.headerButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
          </View>

          {/* Main Player Area */}
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}>
            {/* Chapter Artwork */}
            <View style={styles.artworkContainer}>
              <View style={styles.artwork}>
                <Text style={styles.artworkEmoji}>📖</Text>
              </View>

              {/* Status Indicators */}
              <View style={styles.statusRow}>
                {playerState.isBuffering && (
                  <Text style={styles.statusText}>Buffering...</Text>
                )}
                {playerState.isBackgroundPlaybackEnabled && (
                  <Text style={styles.statusText}>🎧 Background</Text>
                )}
                <Text style={styles.statusText}>
                  Speed: {playerState.playbackSpeed}x
                </Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressSection}>
              <ProgressBar
                currentTime={position}
                totalTime={duration}
                onSeek={handleSeek}
                seekable={true}
              />
              <View style={styles.timeRow}>
                <Text style={styles.timeText}>{formattedPosition}</Text>
                <Text style={styles.timeText}>{formattedDuration}</Text>
              </View>
            </View>

            {/* Main Controls */}
            <View style={styles.mainControls}>
              <Pressable
                style={styles.controlButton}
                onPress={handleSkipBackward}>
                <SkipBackwardIcon size={32} color={Colors.text.inverse} />
                <Text style={styles.controlLabel}>-10s</Text>
              </Pressable>

              <Pressable
                style={styles.controlButton}
                onPress={handlePreviousVerse}
                disabled={!canGoToPreviousVerse}>
                <Text
                  style={[
                    styles.verseControlText,
                    !canGoToPreviousVerse && styles.disabledText,
                  ]}>
                  ← Verse
                </Text>
              </Pressable>

              <Pressable
                style={[styles.controlButton, styles.primaryButton]}
                onPress={handlePlayPause}>
                {playerState.isPlaying ? (
                  <PauseIcon size={40} color={Colors.text.inverse} />
                ) : (
                  <PlayIcon size={40} color={Colors.text.inverse} />
                )}
              </Pressable>

              <Pressable
                style={styles.controlButton}
                onPress={handleNextVerse}
                disabled={!canGoToNextVerse}>
                <Text
                  style={[
                    styles.verseControlText,
                    !canGoToNextVerse && styles.disabledText,
                  ]}>
                  Verse →
                </Text>
              </Pressable>

              <Pressable
                style={styles.controlButton}
                onPress={handleSkipForward}>
                <SkipForwardIcon size={32} color={Colors.text.inverse} />
                <Text style={styles.controlLabel}>+10s</Text>
              </Pressable>
            </View>

            {/* Secondary Controls */}
            <View style={styles.secondaryControls}>
              <Pressable style={styles.secondaryButton} onPress={handleStop}>
                <Text style={styles.stopIcon}>■</Text>
                <Text style={styles.secondaryLabel}>Stop</Text>
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={handleSpeedChange}>
                <Text style={styles.speedText}>
                  {playerState.playbackSpeed}x
                </Text>
                <Text style={styles.secondaryLabel}>Speed</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton}>
                <VolumeUpIcon size={20} color={Colors.interactive.disabled} />
                <Text style={styles.secondaryLabel}>Volume</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton}>
                <Text style={styles.settingsIcon}>⚙️</Text>
                <Text style={styles.secondaryLabel}>Settings</Text>
              </Pressable>
            </View>

            {/* Chapter Navigation */}
            <View style={styles.chapterNavigation}>
              <Pressable
                style={[
                  styles.chapterButton,
                  !canGoToPreviousChapter && styles.disabledButton,
                ]}
                onPress={handlePreviousChapter}
                disabled={!canGoToPreviousChapter}>
                <Text
                  style={[
                    styles.chapterButtonText,
                    !canGoToPreviousChapter && styles.disabledText,
                  ]}>
                  ← Previous Chapter
                </Text>
              </Pressable>

              <Text style={styles.currentChapterText}>
                {currentBookId} {currentChapterNumber}
              </Text>

              <Pressable
                style={[
                  styles.chapterButton,
                  !canGoToNextChapter && styles.disabledButton,
                ]}
                onPress={handleNextChapter}
                disabled={!canGoToNextChapter}>
                <Text
                  style={[
                    styles.chapterButtonText,
                    !canGoToNextChapter && styles.disabledText,
                  ]}>
                  Next Chapter →
                </Text>
              </Pressable>
            </View>

            {/* Verse List */}
            <View style={styles.verseListContainer}>
              <Text style={styles.verseListTitle}>Verses</Text>
              <FlatList
                data={verseState.verses}
                renderItem={renderVerseItem}
                keyExtractor={item => item.verse_number.toString()}
                style={styles.verseList}
                showsVerticalScrollIndicator={false}
                getItemLayout={(_, index) => ({
                  length: 80,
                  offset: 80 * index,
                  index,
                })}
                initialScrollIndex={
                  currentVerseNumber ? Math.max(0, currentVerseNumber - 1) : 0
                }
              />
            </View>
          </ScrollView>
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.text.primary,
  },

  content: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },

  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.text.secondary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.inverse,
    marginBottom: 4,
  },

  headerSubtitle: {
    fontSize: 14,
    color: Colors.interactive.disabled,
  },

  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.inverse,
  },

  scrollContainer: {
    flex: 1,
  },

  artworkContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  artwork: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  artworkEmoji: {
    fontSize: 80,
    color: Colors.primary,
  },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },

  statusText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },

  progressSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },

  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  timeText: {
    fontSize: 14,
    color: Colors.interactive.disabled,
  },

  mainControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  primaryButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
  },

  controlLabel: {
    fontSize: 12,
    color: Colors.interactive.disabled,
    marginTop: 4,
  },

  verseControlText: {
    fontSize: 14,
    color: Colors.text.inverse,
    fontWeight: '500',
  },

  disabledText: {
    color: Colors.text.secondary,
  },

  secondaryControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    marginBottom: 32,
  },

  secondaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },

  secondaryLabel: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },

  speedText: {
    fontSize: 16,
    color: Colors.interactive.disabled,
    fontWeight: '600',
  },

  stopIcon: {
    fontSize: 20,
    color: Colors.interactive.disabled,
  },

  settingsIcon: {
    fontSize: 20,
    color: Colors.interactive.disabled,
  },

  chapterNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },

  chapterButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },

  disabledButton: {
    backgroundColor: Colors.text.primary,
  },

  chapterButtonText: {
    fontSize: 14,
    color: Colors.text.inverse,
    fontWeight: '500',
  },

  currentChapterText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },

  verseListContainer: {
    paddingHorizontal: 20,
    marginBottom: 40,
  },

  verseListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.inverse,
    marginBottom: 16,
  },

  verseList: {
    maxHeight: VERSE_LIST_HEIGHT,
  },

  verseItem: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  currentVerseItem: {
    backgroundColor: Colors.interactive.pressed,
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  highlightedVerseItem: {
    backgroundColor: Colors.primaryLight,
  },

  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  currentVerseNumber: {
    color: Colors.text.inverse,
  },

  verseTiming: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },

  verseText: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.interactive.disabled,
  },

  currentVerseText: {
    color: Colors.text.inverse,
  },
});

export default FullPlayerView;
