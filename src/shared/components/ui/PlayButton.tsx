import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/hooks';
import { useUnifiedMediaPlayer } from '@/features/media/hooks/useUnifiedMediaPlayer';

export type PlayableType = 'book' | 'chapter' | 'verse';

interface PlayButtonProps {
  /** The type of content being played */
  type: PlayableType;
  /** The ID of the content (e.g., book ID, chapter ID, verse ID) */
  id: string;
  /** Optional size for the button (default: 'medium') */
  size?: 'small' | 'medium' | 'large';
  /** Optional onPress handler for custom logic */
  onPress?: () => void;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Custom style overrides */
  style?: ViewStyle;
  /** Whether to show animated audio signal when playing (default: true) */
  showAudioSignal?: boolean;
}

// Animated Audio Signal Component
const AnimatedAudioSignal: React.FC<{ size: number; color: string }> = ({
  size,
  color,
}) => {
  const animation1 = useSharedValue(0);
  const animation2 = useSharedValue(0);
  const animation3 = useSharedValue(0);

  useEffect(() => {
    // Create staggered animation for the three bars
    animation1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      true
    );

    animation2.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      true
    );

    animation3.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 400 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 400 })
      ),
      -1,
      true
    );
  }, [animation1, animation2, animation3]);

  const bar1Style = useAnimatedStyle(() => ({
    height: interpolate(animation1.value, [0, 1], [size * 0.3, size * 0.8]),
  }));

  const bar2Style = useAnimatedStyle(() => ({
    height: interpolate(animation2.value, [0, 1], [size * 0.3, size * 0.9]),
  }));

  const bar3Style = useAnimatedStyle(() => ({
    height: interpolate(animation3.value, [0, 1], [size * 0.3, size * 0.7]),
  }));

  const barWidth = Math.max(2, size * 0.15);
  const barSpacing = Math.max(1, size * 0.1);

  return (
    <Animated.View style={audioSignalStyles.container}>
      <Animated.View
        style={[
          audioSignalStyles.bar,
          {
            width: barWidth,
            backgroundColor: color,
            marginRight: barSpacing,
          },
          bar1Style,
        ]}
      />
      <Animated.View
        style={[
          audioSignalStyles.bar,
          {
            width: barWidth,
            backgroundColor: color,
            marginRight: barSpacing,
          },
          bar2Style,
        ]}
      />
      <Animated.View
        style={[
          audioSignalStyles.bar,
          {
            width: barWidth,
            backgroundColor: color,
          },
          bar3Style,
        ]}
      />
    </Animated.View>
  );
};

// Separate styles for AnimatedAudioSignal
const audioSignalStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: 1,
  },
});

export const PlayButton: React.FC<PlayButtonProps> = ({
  id,
  size = 'medium',
  onPress,
  disabled = false,
  style,
  showAudioSignal = true,
}) => {
  const { theme } = useTheme();
  const { state: mediaState } = useUnifiedMediaPlayer();

  // Check if this content is currently playing
  const isCurrentlyPlaying =
    mediaState.currentTrack?.id === id && mediaState.isPlaying;

  const sizeConfig = {
    small: {
      buttonSize: 24,
      iconSize: 16,
    },
    medium: {
      buttonSize: 32,
      iconSize: 20,
    },
    large: {
      buttonSize: 40,
      iconSize: 24,
    },
  };

  const config = sizeConfig[size];

  const styles = StyleSheet.create({
    playButton: {
      backgroundColor: disabled
        ? theme.colors.border
        : isCurrentlyPlaying
          ? theme.colors.success
          : theme.colors.primary,
      borderRadius: config.buttonSize / 2,
      width: config.buttonSize,
      height: config.buttonSize,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: disabled ? 0.5 : 1,
    },
  });

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.playButton, style]}
      onPress={handlePress}
      disabled={disabled}>
      {isCurrentlyPlaying && showAudioSignal ? (
        <AnimatedAudioSignal
          size={config.iconSize}
          color={theme.colors.textInverse}
        />
      ) : (
        <MaterialIcons
          name={isCurrentlyPlaying ? 'pause' : 'play-arrow'}
          size={config.iconSize}
          color={theme.colors.textInverse}
        />
      )}
    </TouchableOpacity>
  );
};
