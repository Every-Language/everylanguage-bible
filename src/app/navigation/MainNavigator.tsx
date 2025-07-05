import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { MiniPlayer } from '@/features/audio/components/MiniPlayer';
import { AudioPlayerWidget } from '@/features/audio/components/AudioPlayerWidget';
import { type Book } from '@/shared/utils';
import {
  useIsPlaying,
  usePlaybackPosition,
  useChapterNavigation,
  useAudioActions,
  useTheme,
} from '@/shared/store';

export const MainNavigator: React.FC = () => {
  const { colors } = useTheme();
  const isPlaying = useIsPlaying();
  const { position: currentPosition, duration: totalDuration } =
    usePlaybackPosition();
  const { currentBookId, currentChapterNumber } = useChapterNavigation();
  const {
    loadChapter,
    play,
    pause,
    nextChapter,
    previousChapter,
    nextVerse,
    previousVerse,
    seek,
    stop,
  } = useAudioActions();

  const handleClose = async () => {
    try {
      await stop();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to stop audio:', error);
      }
    }
  };

  // Demo state for testing the new AudioPlayerWidget
  const [showNewPlayer, setShowNewPlayer] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    miniPlayerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
    },
    demoButton: {
      position: 'absolute',
      top: 60,
      right: 20,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      zIndex: 2000,
    },
    demoButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontSize: 12,
    },
  });

  const handleChapterSelect = async (book: Book, chapter: number) => {
    try {
      await loadChapter(book.id, chapter);
      await play();

      // Show the new player when a chapter is selected
      setShowNewPlayer(true);
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to load chapter:', error);
      }
    }
  };

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await pause();
      } else {
        await play();
      }
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to toggle playback:', error);
      }
    }
  };

  const handlePreviousChapter = async () => {
    try {
      await previousChapter();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to go to previous chapter:', error);
      }
    }
  };

  const handleNextChapter = async () => {
    try {
      await nextChapter();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to go to next chapter:', error);
      }
    }
  };

  const handlePreviousVerse = async () => {
    try {
      await previousVerse();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to go to previous verse:', error);
      }
    }
  };

  const handleNextVerse = async () => {
    try {
      await nextVerse();
    } catch (error) {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.error('Failed to go to next verse:', error);
      }
    }
  };

  const handleExpand = () => {
    // In a real app, this would open the full player
    // TODO: Implement audio player expansion
  };

  const toggleDemoPlayer = () => {
    setShowNewPlayer(!showNewPlayer);
  };

  return (
    <View style={styles.container}>
      <BibleBooksScreen onChapterSelect={handleChapterSelect} />

      {/* Demo Button for Testing New AudioPlayerWidget */}
      <TouchableOpacity style={styles.demoButton} onPress={toggleDemoPlayer}>
        <Text style={styles.demoButtonText}>
          {showNewPlayer ? 'Hide' : 'Test'} Audio Widget
        </Text>
      </TouchableOpacity>

      {/* Legacy Mini Player Overlay */}
      {currentBookId && currentChapterNumber && !showNewPlayer && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            title={currentBookId}
            subtitle={`Chapter ${currentChapterNumber}`}
            isPlaying={isPlaying}
            currentTime={currentPosition}
            totalTime={totalDuration}
            onPlayPause={handlePlayPause}
            onPreviousChapter={handlePreviousChapter}
            onNextChapter={handleNextChapter}
            onPreviousVerse={handlePreviousVerse}
            onNextVerse={handleNextVerse}
            onSeek={seek}
            onExpand={handleExpand}
            onClose={handleClose}
            testID='main-mini-player'
          />
        </View>
      )}

      {/* NEW: AudioPlayerWidget for Testing */}
      {showNewPlayer && (
        <AudioPlayerWidget
          initialMode='mini'
          canDismiss={true}
          onModeChange={mode => {
            if (mode === 'hidden') {
              setShowNewPlayer(false);
            }
          }}
        />
      )}
    </View>
  );
};
