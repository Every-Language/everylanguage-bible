import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { ToggleButtons, useHeader } from '@/shared';

import { Fonts } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { useHorizontalSlideAnimation } from '@/shared/hooks';
import { PlaylistContentSwitcher } from '../components/playlist-screen';
import {
  MockPlaylistRepository,
  type PlaylistItem,
} from '../services/data/playlistRepository';
import type { PlaylistMode } from '../types';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface PlaylistsScreenProps {
  // No props needed - options menu handled by MainNavigator
}

export const PlaylistsScreen: React.FC<PlaylistsScreenProps> = () => {
  const [currentMode, setCurrentMode] = useState<PlaylistMode>('my-playlists');
  const { colors } = useTheme();
  const { setCurrentScreen, setBottomContent } = useHeader();

  // Repository instance
  const playlistRepository = useMemo(() => new MockPlaylistRepository(), []);

  // Get playlist data from repository
  const playlistData = useMemo(
    () => playlistRepository.getPlaylistData(),
    [playlistRepository]
  );

  // Use the horizontal slide animation hook with proper configuration
  const { slideAnimation, gestureHandler, updateAnimation } =
    useHorizontalSlideAnimation({
      onModeChange: (newMode: string) =>
        setCurrentMode(newMode as PlaylistMode),
      modes: ['my-playlists', 'study-bible', 'meeting-pattern'],
      currentMode,
    });

  // Update animation when mode changes externally
  useEffect(() => {
    updateAnimation(currentMode);
  }, [currentMode, updateAnimation]);

  // Set up header
  useEffect(() => {
    setCurrentScreen('playlists');
  }, [setCurrentScreen]);

  // Handle mode change from toggle buttons
  const handleModeChange = useCallback((mode: PlaylistMode) => {
    setCurrentMode(mode);
  }, []);

  // Handle playlist press
  const handlePlaylistPress = useCallback((playlist: PlaylistItem) => {
    console.log('Selected playlist:', playlist.title);
    // TODO: Navigate to playlist detail or start playing
  }, []);

  // Define toggle button options
  const toggleOptions = [
    { key: 'my-playlists' as PlaylistMode, label: 'My Playlists' },
    { key: 'study-bible' as PlaylistMode, label: 'Study Bible' },
    { key: 'meeting-pattern' as PlaylistMode, label: 'Meeting Pattern' },
  ];

  // Create toggle buttons for header
  const toggleButtons = useMemo(
    () => (
      <ToggleButtons
        options={toggleOptions}
        selectedKey={currentMode}
        onSelect={handleModeChange}
        testID='playlists-mode-toggle'
        height={28}
        fontSize={Fonts.size.xs}
      />
    ),
    [currentMode, handleModeChange]
  );

  // Update header content with toggle buttons
  useEffect(() => {
    setBottomContent(toggleButtons);
  }, [setBottomContent, toggleButtons]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  });

  return (
    <View style={styles.container}>
      {/* Content Area with Swipe Support */}
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        enableTrackpadTwoFingerGesture={false}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-20, 20]}>
        <Animated.View style={{ flex: 1 }}>
          <PlaylistContentSwitcher
            myPlaylists={playlistData['my-playlists']}
            studyBible={playlistData['study-bible']}
            meetingPattern={playlistData['meeting-pattern']}
            onItemPress={handlePlaylistPress}
            slideAnimation={slideAnimation}
          />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};
