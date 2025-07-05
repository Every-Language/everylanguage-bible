import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableWithoutFeedback } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';

interface ProgressBarProps {
  currentTime: number; // in seconds
  totalTime: number; // in seconds
  onSeek?: ((time: number) => void) | undefined; // callback for seeking
  seekable?: boolean; // whether user can interact to seek
  testID?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  totalTime,
  onSeek,
  seekable = false,
  testID,
}) => {
  const { colors, isDark } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const progressBarRef = useRef<View>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? Math.min(currentTime / totalTime, 1) : 0;

  const handlePress = (event: any) => {
    if (!seekable || !onSeek || totalTime === 0 || trackWidth === 0) return;

    const { locationX } = event.nativeEvent;
    const newProgress = Math.max(0, Math.min(locationX / trackWidth, 1));
    const newTime = newProgress * totalTime;
    onSeek(Math.max(0, Math.min(newTime, totalTime)));
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setTrackWidth(width);
  };

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
      height: 40, // Larger touch area
      justifyContent: 'center',
    },
    timeText: {
      fontSize: Fonts.size.xs,
      color: colors.secondary,
      fontFamily: 'monospace', // Consistent width for time display
      minWidth: 45, // Ensure consistent spacing
    },
    trackWrapper: {
      flex: 1,
      marginHorizontal: Dimensions.spacing.sm,
      justifyContent: 'center',
    },
    trackContainer: {
      height: 6,
      backgroundColor: isDark ? '#404040' : '#D0D0D0', // Light gray for unplayed
      borderRadius: 3,
      overflow: 'visible', // Allow bead to overflow
    },
    progressTrack: {
      height: '100%',
      backgroundColor: isDark ? '#FFFFFF' : '#333333', // Dark for elapsed
      borderRadius: 3,
    },
    bead: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: isDark ? '#FFFFFF' : '#333333', // Same color as progress
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 4,
      top: -5, // Center vertically on the track
    },
  });

  const beadLeftPosition = trackWidth > 0 ? progress * trackWidth - 8 : 0; // -8 to center the bead

  return (
    <View style={styles.container} testID={testID}>
      {/* Seek Bar with Time Labels on Same Level */}
      <View style={styles.seekBarContainer}>
        {/* Elapsed Time */}
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

        {/* Track Wrapper */}
        <TouchableWithoutFeedback onPress={seekable ? handlePress : undefined}>
          <View style={styles.trackWrapper}>
            <View
              ref={progressBarRef}
              style={styles.trackContainer}
              onLayout={handleLayout}>
              {/* Progress Track */}
              <View
                style={[styles.progressTrack, { width: `${progress * 100}%` }]}
              />

              {/* Bead (Thumb) */}
              {seekable && trackWidth > 0 && (
                <View
                  style={[
                    styles.bead,
                    {
                      left: beadLeftPosition,
                    },
                  ]}
                />
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>

        {/* Remaining Time */}
        <Text style={styles.timeText}>-{formatTime(remainingTime)}</Text>
      </View>
    </View>
  );
};
