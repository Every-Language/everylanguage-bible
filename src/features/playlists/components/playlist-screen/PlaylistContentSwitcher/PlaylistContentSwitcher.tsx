import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { PlaylistItem } from '@/features/playlists/services/data/playlistRepository';
import { PlaylistView } from '../PlaylistView';
import { createPlaylistContentSwitcherStyles } from './PlaylistContentSwitcher.styles';

export interface PlaylistContentSwitcherProps {
  myPlaylists: PlaylistItem[];
  studyBible: PlaylistItem[];
  meetingPattern: PlaylistItem[];
  onItemPress: (item: PlaylistItem) => void;
  slideAnimation: Animated.SharedValue<number>;
}

export const PlaylistContentSwitcher: React.FC<
  PlaylistContentSwitcherProps
> = ({
  myPlaylists,
  studyBible,
  meetingPattern,
  onItemPress,
  slideAnimation,
}) => {
  const styles = createPlaylistContentSwitcherStyles();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${slideAnimation.value * -33.333}%` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <View style={styles.viewContainer}>
          <PlaylistView
            items={myPlaylists}
            title='My Playlists'
            onItemPress={onItemPress}
          />
        </View>
        <View style={styles.viewContainer}>
          <PlaylistView
            items={studyBible}
            title='Study the Bible'
            onItemPress={onItemPress}
          />
        </View>
        <View style={styles.viewContainer}>
          <PlaylistView
            items={meetingPattern}
            title='Meeting Pattern'
            onItemPress={onItemPress}
          />
        </View>
      </Animated.View>
    </View>
  );
};
