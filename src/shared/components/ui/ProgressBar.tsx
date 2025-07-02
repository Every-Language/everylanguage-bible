import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
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
  const { colors } = useTheme();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? Math.min(currentTime / totalTime, 1) : 0;

  const handlePress = (event: any) => {
    if (!seekable || !onSeek || totalTime === 0) return;

    const { locationX } = event.nativeEvent;
    const { width } = event.currentTarget.measure
      ? { width: 300 } // fallback width
      : { width: 300 };

    // Calculate the time based on touch position
    const newTime = (locationX / width) * totalTime;
    onSeek(Math.max(0, Math.min(newTime, totalTime)));
  };

  const styles = StyleSheet.create({
    container: {
      width: '100%',
      paddingVertical: Dimensions.spacing.sm,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.xs,
    },
    timeText: {
      fontSize: Fonts.size.xs,
      color: colors.secondary,
      minWidth: 35,
      textAlign: 'center',
    },
    progressBarContainer: {
      flex: 1,
      height: 4,
      backgroundColor: colors.secondary + '30',
      borderRadius: 2,
      marginHorizontal: Dimensions.spacing.sm,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 2,
    },
    seekableBar: {
      paddingVertical: Dimensions.spacing.xs, // Increase touch area
    },
  });

  const ProgressBarComponent = seekable ? TouchableOpacity : View;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>

        <ProgressBarComponent
          style={[styles.progressBarContainer, seekable && styles.seekableBar]}
          onPress={seekable ? handlePress : undefined}
          activeOpacity={seekable ? 0.7 : 1}>
          <View style={styles.progressBarContainer}>
            <View
              style={[styles.progressBar, { width: `${progress * 100}%` }]}
            />
          </View>
        </ProgressBarComponent>

        <Text style={styles.timeText}>{formatTime(totalTime)}</Text>
      </View>
    </View>
  );
};
