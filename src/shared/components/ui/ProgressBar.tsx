import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableWithoutFeedback } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

interface VerseMarker {
  verseNumber: number;
  startTime: number;
  endTime: number;
}

interface ProgressBarProps {
  currentTime: number; // in seconds
  totalTime: number; // in seconds
  onSeek?: ((time: number) => void) | undefined; // callback for seeking
  seekable?: boolean; // whether user can interact to seek
  testID?: string;
  verseMarkers?: VerseMarker[]; // Verse timing data for seeking
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  totalTime,
  onSeek,
  seekable = false,
  testID,
  verseMarkers = [],
}) => {
  const { colors, isDark } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragVerseNumber, setDragVerseNumber] = useState<number | null>(null);
  const progressBarRef = useRef<View>(null);

  // Animated values for drag functionality
  const dragProgress = useSharedValue(0);
  const startDragProgress = useSharedValue(0);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? Math.min(currentTime / totalTime, 1) : 0;

  // Find current verse based on time
  const getCurrentVerse = (time: number): VerseMarker | null => {
    return (
      verseMarkers.find(
        verse => time >= verse.startTime && time < verse.endTime
      ) || null
    );
  };

  // Get progress position for a specific verse (with simple endpoint logic)
  const getProgressForVerse = (verseNumber: number): number => {
    if (verseMarkers.length === 0 || totalTime === 0) return 0;

    const verse = verseMarkers.find(v => v.verseNumber === verseNumber);
    if (!verse) return 0;

    // Simple endpoint logic
    if (verseNumber === 1) return 0; // First verse always at start
    if (verseNumber === verseMarkers[verseMarkers.length - 1]?.verseNumber)
      return 1; // Last verse at end

    return verse.startTime / totalTime;
  };

  const currentVerse = getCurrentVerse(currentTime);
  const currentVerseNumber = dragVerseNumber || currentVerse?.verseNumber || 1;

  // Update drag progress when currentTime changes (but not during dragging)
  React.useEffect(() => {
    if (!isDragging && currentVerse) {
      // Subtract 1 from verse number for bead positioning to align correctly
      const positioningVerse = Math.max(1, currentVerse.verseNumber - 1);
      const verseProgress = getProgressForVerse(positioningVerse);
      dragProgress.value = verseProgress;
    }
  }, [currentVerse?.verseNumber, isDragging, dragProgress, totalTime]);

  // Update progress when not dragging - with endpoint correction for alignment
  React.useEffect(() => {
    if (!isDragging) {
      // Use simple progress for both bead and track to ensure alignment
      dragProgress.value = progress;
    }
  }, [progress, isDragging, dragProgress]);

  const handlePress = (event: any) => {
    if (
      !seekable ||
      !onSeek ||
      totalTime === 0 ||
      trackWidth === 0 ||
      verseMarkers.length === 0
    )
      return;

    const { locationX } = event.nativeEvent;
    const clickProgress = Math.max(0, Math.min(locationX / trackWidth, 1));

    // Find the closest verse to the click position
    if (verseMarkers.length === 0) return;

    let closestVerse = verseMarkers[0]!;
    let closestDistance = Math.abs(
      getProgressForVerse(verseMarkers[0]!.verseNumber) - clickProgress
    );

    for (const verse of verseMarkers) {
      const verseProgress = getProgressForVerse(verse.verseNumber);
      const distance = Math.abs(verseProgress - clickProgress);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestVerse = verse;
      }
    }

    // Seek to the closest verse
    if (closestVerse) {
      // Trigger haptic feedback for tap-to-seek
      triggerSeekHapticFeedback();
      onSeek(closestVerse.startTime);
    }
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setTrackWidth(width);
  };

  // Simple functions for runOnJS calls
  const setDraggingTrue = () => setIsDragging(true);
  const setDraggingFalse = () => setIsDragging(false);
  const setDragVerse = (verseNum: number) => setDragVerseNumber(verseNum);
  const clearDragVerse = () => setDragVerseNumber(null);

  // Haptic feedback functions with different intensities
  const triggerSeekHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  };

  const triggerFinalSeekHapticFeedback = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Debounced haptic feedback to prevent too many rapid calls
  const lastHapticTime = useRef<number>(0);
  const triggerDebouncedHaptic = () => {
    const now = Date.now();
    if (now - lastHapticTime.current > 50) {
      // 50ms debounce
      lastHapticTime.current = now;
      triggerSeekHapticFeedback();
    }
  };

  // Final seek function - only called at end of drag
  const finalSeekToVerse = (verseNum: number) => {
    const verse = verseMarkers.find(v => v.verseNumber === verseNum);
    if (verse && onSeek) {
      // Trigger haptic feedback for final seek
      triggerFinalSeekHapticFeedback();
      onSeek(verse.startTime);
    }
  };

  // Simplified drag gesture handler (back to working version)
  const dragGestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: () => {
        startDragProgress.value = dragProgress.value;
        runOnJS(setDraggingTrue)();

        // Set initial drag verse
        const currentVerseNum = currentVerse?.verseNumber || 1;
        runOnJS(setDragVerse)(currentVerseNum);
      },
      onActive: event => {
        if (trackWidth > 0 && verseMarkers.length > 0) {
          const deltaX = event.translationX;
          const progressDelta = deltaX / trackWidth;
          const newProgress = Math.max(
            0,
            Math.min(1, startDragProgress.value + progressDelta)
          );

          // Simple verse finding based on progress (back to working version)
          const timeAtProgress = newProgress * totalTime;

          // Find verse at this time - only update verse number, don't seek
          for (let i = 0; i < verseMarkers.length; i++) {
            const verse = verseMarkers[i]!;
            if (
              timeAtProgress >= verse.startTime &&
              timeAtProgress < verse.endTime
            ) {
              const newVerseNumber = verse.verseNumber;

              // Only update verse number display if different
              if (newVerseNumber !== dragVerseNumber) {
                runOnJS(setDragVerse)(newVerseNumber);

                // Trigger debounced haptic feedback when crossing verse boundaries
                runOnJS(triggerDebouncedHaptic)();

                // Position bead to align with elapsed progress border
                const verseProgress = verse.startTime / totalTime;
                dragProgress.value = verseProgress;
              }
              break;
            }
          }
        }
      },
      onEnd: () => {
        // Only seek once at the end of the drag
        if (dragVerseNumber !== null) {
          runOnJS(finalSeekToVerse)(dragVerseNumber);
        }

        runOnJS(setDraggingFalse)();
        runOnJS(clearDragVerse)();
      },
    });

  // Animated style for the progress track - uses same progress as bead
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${dragProgress.value * 100}%`, // Use same value as bead positioning
  }));

  // Animated style for the bead position (snaps to verse positions)
  const animatedBeadStyle = useAnimatedStyle(() => {
    // Position bead center exactly on the progress border edge
    const leftPosition =
      trackWidth > 0
        ? dragProgress.value * trackWidth - 6 - trackWidth / verseMarkers.length
        : -6; // Center bead on progress position, offset by one verse length
    return {
      left: leftPosition,
      transform: [{ scale: isDragging ? 1.2 : 1.0 }],
    };
  });

  // Calculate remaining time
  const remainingTime = totalTime - currentTime;

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      paddingVertical: Dimensions.spacing.sm,
    },
    seekBarContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 40,
      justifyContent: 'center',
    },
    timeText: {
      fontSize: Fonts.size.xs,
      color: colors.secondary,
      fontFamily: 'monospace',
      minWidth: 40, // Slightly smaller to save space
    },
    trackWrapper: {
      flex: 1,
      marginHorizontal: Dimensions.spacing.xs, // Minimal equal margins for centering
      justifyContent: 'center',
      position: 'relative',
      paddingHorizontal: 0, // No horizontal padding - use all available space
    },
    trackContainer: {
      height: 4, // Thinner track
      width: '100%', // Ensure track uses full width of wrapper
      backgroundColor: isDark ? '#404040' : '#D0D0D0',
      borderRadius: 2,
      position: 'relative',
    },
    progressTrack: {
      height: '100%',
      backgroundColor: isDark ? '#FFFFFF' : '#333333',
      borderRadius: 2,
    },
    bead: {
      width: 12, // Smaller bead
      height: 12,
      borderRadius: 6,
      backgroundColor: isDragging
        ? colors.primary
        : isDark
          ? '#FFFFFF'
          : '#333333',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 3,
    },
    dragArea: {
      position: 'absolute',
      width: 44, // Slightly larger touch area to compensate for no padding
      height: 40,
      top: -18, // Center on the thinner track (40/2 - 4/2 = 18)
      left: -22, // Center the touch area on the bead (44/2 = 22)
      justifyContent: 'center',
      alignItems: 'center',
    },
    verseLabel: {
      position: 'absolute',
      top: -8, // Hover just above the bead
      left: 0,
      right: 0,
      fontSize: Fonts.size.xs, // Smaller font size
      color: colors.primary,
      fontWeight: '600',
      textAlign: 'center',
      // Removed background, padding, and border for clean look
    },
  });

  return (
    <View style={styles.container} testID={testID}>
      {/* Seek Bar with Time Labels */}
      <View style={styles.seekBarContainer}>
        {/* Elapsed Time */}
        <Text style={[styles.timeText, { textAlign: 'left' }]}>
          {formatTime(currentTime)}
        </Text>

        {/* Track Wrapper */}
        <TouchableWithoutFeedback onPress={seekable ? handlePress : undefined}>
          <View style={styles.trackWrapper}>
            <View
              ref={progressBarRef}
              style={styles.trackContainer}
              onLayout={handleLayout}>
              {/* Progress Track - shows visual progress during drag */}
              <Animated.View
                style={[styles.progressTrack, animatedProgressStyle]}
              />

              {/* Bead with Verse Label - only shows when seekable */}
              {seekable && trackWidth > 0 && verseMarkers.length > 0 && (
                <PanGestureHandler
                  onGestureEvent={dragGestureHandler}
                  shouldCancelWhenOutside={false}
                  activeOffsetX={[-3, 3]}
                  activeOffsetY={[-15, 15]}>
                  <Animated.View style={[styles.dragArea, animatedBeadStyle]}>
                    {/* Verse Number Label - always visible */}
                    <Text style={styles.verseLabel}>{currentVerseNumber}</Text>

                    {/* Draggable Bead */}
                    <View style={styles.bead} />
                  </Animated.View>
                </PanGestureHandler>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Remaining Time */}
        <Text style={[styles.timeText, { textAlign: 'right' }]}>
          {formatTime(remainingTime)}
        </Text>
      </View>
    </View>
  );
};
