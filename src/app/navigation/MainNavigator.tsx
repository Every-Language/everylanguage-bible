import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { MiniPlayer } from '@/features/audio/components/MiniPlayer';
import { type Book } from '@/shared/utils';
import { useAudioStore, useTheme } from '@/shared/store';

export const MainNavigator: React.FC = () => {
  const { colors } = useTheme();
  const audioStore = useAudioStore();
  const {
    currentBook,
    currentChapter,
    isPlaying,
    currentPosition,
    totalDuration,
    setCurrentAudio,
    togglePlayPause,
    playNext,
    playPrevious,
    previousVerse,
    nextVerse,
    seek,
    close,
  } = audioStore;

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
  });

  const handleChapterSelect = (book: Book, chapter: number) => {
    setCurrentAudio(book, chapter);
    audioStore.play();
    console.log('Selected chapter:', `${book.name} ${chapter}`);
  };

  const handleVerseSelect = (book: Book, chapter: number, verse: number) => {
    // Set the current audio to the chapter
    setCurrentAudio(book, chapter);

    // Calculate verse position (assuming ~20 seconds per verse)
    const versePosition = (verse - 1) * 20; // Start from verse 1 = 0 seconds

    // Seek to the verse position
    audioStore.seek(versePosition);

    // Start playback
    audioStore.play();

    console.log(
      `Playing ${book.name} ${chapter}:${verse} at position ${versePosition}s`
    );
  };

  const handlePlayPause = () => {
    togglePlayPause();
  };

  const handlePreviousChapter = () => {
    playPrevious();
  };

  const handleNextChapter = () => {
    playNext();
  };

  const handlePreviousVerse = () => {
    previousVerse();
  };

  const handleNextVerse = () => {
    nextVerse();
  };

  const handleExpand = () => {
    // In a real app, this would open the full player
    console.log('Expand player');
  };

  return (
    <View style={styles.container}>
      <BibleBooksScreen
        onChapterSelect={handleChapterSelect}
        onVerseSelect={handleVerseSelect}
      />

      {/* Mini Player Overlay */}
      {currentBook && currentChapter && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer
            title={currentBook.name}
            subtitle={`Chapter ${currentChapter}`}
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
            onClose={close}
            testID='main-mini-player'
          />
        </View>
      )}
    </View>
  );
};
