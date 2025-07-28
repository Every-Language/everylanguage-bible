import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { useCurrentVersions } from '@/features/languages/hooks/useLanguageSelection';

import type { ViewStyle } from 'react-native';

interface TrackDetailsCollapsedProps {
  style?: ViewStyle; // For animated styles passed from parent
}

export const TrackDetailsCollapsed: React.FC<TrackDetailsCollapsedProps> = ({
  style,
}) => {
  const { theme } = useTheme();
  const { state } = useMediaPlayer();
  const { currentAudioVersion } = useCurrentVersions();

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
        </View>
        <Text
          style={[
            styles.collapsedLanguage,
            { color: theme.colors.textSecondary },
          ]}>
          {currentAudioVersion?.name || 'None'}
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
    height: 60, // Increased height for better spacing
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 8, // Add horizontal padding for better spacing
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

  collapsedLanguage: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
});
