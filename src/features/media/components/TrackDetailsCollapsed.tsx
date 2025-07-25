import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';

interface TrackDetailsCollapsedProps {
  style?: any; // For animated styles passed from parent
}

export const TrackDetailsCollapsed: React.FC<TrackDetailsCollapsedProps> = ({
  style,
}) => {
  const { theme } = useTheme();
  const { state } = useMediaPlayer();

  if (!state.currentTrack) return null;

  return (
    <Animated.View style={[styles.collapsedTrackInfo, style]}>
      <View style={styles.collapsedContent}>
        <View style={styles.trackInfoLeft}>
          <Text
            style={[styles.collapsedTitle, { color: theme.colors.text }]}
            numberOfLines={1}>
            {state.currentTrack.title}
          </Text>
          <Text
            style={[
              styles.collapsedSubtitle,
              { color: theme.colors.textSecondary },
            ]}
            numberOfLines={1}>
            {state.currentTrack.subtitle}
          </Text>
        </View>
        <Text
          style={[
            styles.collapsedLanguage,
            { color: theme.colors.textSecondary },
          ]}>
          {/* TODO: Add language display when available */}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  collapsedTrackInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    justifyContent: 'center',
    marginTop: 10,
  },
  collapsedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  trackInfoLeft: {
    flex: 1,
    marginRight: 12,
  },
  collapsedTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  collapsedSubtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  collapsedLanguage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
});
