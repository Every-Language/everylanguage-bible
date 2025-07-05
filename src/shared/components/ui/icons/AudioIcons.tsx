import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
  style?: ViewStyle | TextStyle;
}

// Constants
const TRANSPARENT = 'transparent';

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipIcon: {
    marginTop: -3,
  },
  chevronIcon: {
    marginTop: -2,
  },
  playTriangle: {
    borderTopColor: TRANSPARENT,
    borderBottomColor: TRANSPARENT,
    borderRightColor: TRANSPARENT,
  },
  pauseBar: {
    borderLeftColor: TRANSPARENT,
    borderRightColor: TRANSPARENT,
  },
  playTriangleBase: {
    width: 0,
    height: 0,
  },
  pauseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export const PlayIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View
      style={[
        styles.playTriangle,
        styles.playTriangleBase,
        {
          borderLeftWidth: size * 0.7,
          borderTopWidth: size * 0.4,
          borderBottomWidth: size * 0.4,
          borderLeftColor: color,
        },
      ]}
    />
  </View>
);

export const PauseIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <View style={[styles.iconContainer, { width: size, height: size }]}>
    <View style={styles.pauseContainer}>
      <View
        style={[
          styles.pauseBar,
          {
            width: size * 0.25,
            height: size * 0.7,
            borderTopWidth: size * 0.7,
            borderTopColor: color,
            marginRight: size * 0.1,
          },
        ]}
      />
      <View
        style={[
          styles.pauseBar,
          {
            width: size * 0.25,
            height: size * 0.7,
            borderTopWidth: size * 0.7,
            borderTopColor: color,
          },
        ]}
      />
    </View>
  </View>
);

export const SkipForwardIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={[styles.skipIcon, { fontSize: size, color }]}>⏭</Text>;

export const SkipBackwardIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={[styles.skipIcon, { fontSize: size, color }]}>⏮</Text>;

export const FastForwardIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={[styles.skipIcon, { fontSize: size, color }]}>⏩</Text>;

export const RewindIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={[styles.skipIcon, { fontSize: size, color }]}>⏪</Text>;

export const VolumeUpIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={{ fontSize: size, color }}>🔊</Text>;

export const VolumeDownIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={{ fontSize: size, color }}>🔉</Text>;

export const VolumeMuteIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={{ fontSize: size, color }}>🔇</Text>;

export const ChevronUpIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
  style,
}) => (
  <Text style={[styles.chevronIcon, { fontSize: size, color }, style]}>^</Text>
);

export const CloseIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={[styles.chevronIcon, { fontSize: size, color }]}>×</Text>;

// Backward compatibility aliases for existing components
export const PreviousChapterIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={[styles.skipIcon, { fontSize: size, color }]}>⏮</Text>;

export const NextChapterIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => <Text style={[styles.skipIcon, { fontSize: size, color }]}>⏭</Text>;

export const PreviousVerseIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <Text style={[styles.chevronIcon, { fontSize: size * 1.3, color }]}>‹</Text>
);

export const NextVerseIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <Text style={[styles.chevronIcon, { fontSize: size * 1.3, color }]}>›</Text>
);

export const ChevronDownIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
  style,
}) => (
  <Text style={[styles.chevronIcon, { fontSize: size, color }, style]}>⌄</Text>
);
