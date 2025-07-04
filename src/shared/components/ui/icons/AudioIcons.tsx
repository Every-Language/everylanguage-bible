import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface IconProps {
  size?: number;
  color?: string;
}

export const PlayIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <View
    style={[
      styles.playIcon,
      {
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
      },
    ]}>
    <View
      style={[
        styles.triangle,
        {
          borderLeftColor: color,
          borderLeftWidth: size * 0.4,
          borderTopWidth: size * 0.23,
          borderBottomWidth: size * 0.23,
        },
      ]}
    />
  </View>
);

export const PauseIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <View style={[styles.pauseIcon, { width: size * 0.6, height: size }]}>
    <View
      style={[
        styles.pauseBar,
        {
          width: size * 0.15,
          height: size * 0.5,
          backgroundColor: color,
        },
      ]}
    />
    <View
      style={[
        styles.pauseBar,
        {
          width: size * 0.15,
          height: size * 0.5,
          backgroundColor: color,
        },
      ]}
    />
  </View>
);

// Previous Chapter Button - «
export const PreviousChapterIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <Text
    style={[
      styles.textIcon,
      { fontSize: size * 1.3, color: color || '#000', marginTop: -3 },
    ]}>
    «
  </Text>
);

// Previous Verse Button - ‹
export const PreviousVerseIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <Text
    style={[
      styles.textIcon,
      { fontSize: size * 1.3, color: color || '#000', marginTop: -3 },
    ]}>
    ‹
  </Text>
);

// Next Verse Button - ›
export const NextVerseIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <Text
    style={[
      styles.textIcon,
      { fontSize: size * 1.3, color: color || '#000', marginTop: -3 },
    ]}>
    ›
  </Text>
);

// Next Chapter Button - »
export const NextChapterIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <Text
    style={[
      styles.textIcon,
      { fontSize: size * 1.3, color: color || '#000', marginTop: -3 },
    ]}>
    »
  </Text>
);

export const ChevronDownIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <View
    style={[
      styles.chevronDown,
      {
        borderTopColor: color,
        borderTopWidth: size * 0.15,
        borderLeftWidth: size * 0.2,
        borderRightWidth: size * 0.2,
        width: size * 0.4,
        height: size * 0.2,
      },
    ]}
  />
);

export const PlusIcon: React.FC<IconProps> = ({
  size = 24,
  color = '#000',
}) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
    {/* Horizontal line */}
    <View
      style={[
        styles.plusLine,
        {
          width: size * 0.6,
          height: size * 0.08,
          backgroundColor: color,
        },
      ]}
    />
    {/* Vertical line */}
    <View
      style={[
        styles.plusLine,
        {
          position: 'absolute',
          width: size * 0.08,
          height: size * 0.6,
          backgroundColor: color,
        },
      ]}
    />
  </View>
);

export const MoreIcon: React.FC<IconProps> = ({
  size = 20,
  color = '#000',
}) => {
  const dotSize = size * 0.15;
  const spacing = size * 0.2;

  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          marginHorizontal: spacing / 2,
        }}
      />
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          marginHorizontal: spacing / 2,
        }}
      />
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: color,
          marginHorizontal: spacing / 2,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  playIcon: {
    // Container for the triangle
  },
  triangle: {
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pauseIcon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2, // Small padding to bring bars closer
  },
  pauseBar: {
    borderRadius: 1,
  },
  textIcon: {
    fontWeight: '900',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    color: '#000',
  },
  chevronDown: {
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  plusLine: {
    borderRadius: 1,
  },
});
