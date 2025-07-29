import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { useMediaPlayer } from '@/shared/hooks';

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
}

export const PlayButton: React.FC<PlayButtonProps> = ({
  id,
  size = 'medium',
  onPress,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const { state: mediaState } = useMediaPlayer();

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
      <MaterialIcons
        name={isCurrentlyPlaying ? 'pause' : 'play-arrow'}
        size={config.iconSize}
        color={theme.colors.textInverse}
      />
    </TouchableOpacity>
  );
};
