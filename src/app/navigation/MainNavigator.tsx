import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { MiniPlayer } from '@/features/audio/components/MiniPlayer';
import { type Book } from '@/shared/utils';
import { useAudioStore, useTheme, useQueueStore } from '@/shared/store';

// Helper function to convert Book and chapter to recording ID
const getRecordingId = (book: Book, chapter: number): string => {
  // Create a recording ID based on book name and chapter
  // Convert book name to a consistent format for recording IDs
  const bookId = book.name.toLowerCase().replace(/\s+/g, '-');
  return `${bookId}-${chapter}`;
};

export const MainNavigator: React.FC = () => {
  const { colors } = useTheme();
  const audioStore = useAudioStore();
  const {
    currentRecording,
    currentChapter,
    setCurrentAudio,
    initializeBibleBooks,
  } = audioStore;
  const { initializeDefaultQueue } = useQueueStore();

  // Set up Galatians 1 as default when app starts
  useEffect(() => {
    const initializeDefaultAudio = async () => {
      // Initialize Bible books data first
      initializeBibleBooks();

      // Initialize the queue with Galatians 1 and Luke 1
      initializeDefaultQueue();

      // Only set default if no proper chapter is loaded (ignore mock recording)
      if (!currentChapter) {
        try {
          // Create a Galatians 1 recording ID
          const galatiansBook: Book = {
            id: '48', // Book ID is the order number padded
            name: 'Galatians',
            chapters: 6,
            testament: 'new',
            imagePath: '48_galatians.png',
            order: 48, // Galatians is the 48th book
          };
          const galatiansRecordingId = getRecordingId(galatiansBook, 1);

          // Load Galatians 1 but don't start playing
          await setCurrentAudio(galatiansRecordingId);
          console.log(
            'Initialized with Galatians 1 - verse data should now be populated'
          );
        } catch (error) {
          console.error('Failed to initialize default audio:', error);
        }
      }
    };

    initializeDefaultAudio();
  }, [
    currentRecording,
    currentChapter,
    setCurrentAudio,
    initializeBibleBooks,
    initializeDefaultQueue,
  ]);

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

  const handleChapterSelect = async (book: Book, chapter: number) => {
    try {
      const recordingId = getRecordingId(book, chapter);
      await setCurrentAudio(recordingId);
      audioStore.play();
      console.log('Selected chapter:', `${book.name} ${chapter}`);
    } catch (error) {
      console.error('Failed to select chapter:', error);
    }
  };

  const handleVerseSelect = async (
    book: Book,
    chapter: number,
    verse: number
  ) => {
    try {
      // Set the current audio to the chapter
      const recordingId = getRecordingId(book, chapter);
      await setCurrentAudio(recordingId);

      // Calculate verse position (assuming ~20 seconds per verse)
      const versePosition = (verse - 1) * 20; // Start from verse 1 = 0 seconds

      // Seek to the verse position
      audioStore.seek(versePosition);

      // Start playback
      audioStore.play();

      console.log(
        `Playing ${book.name} ${chapter}:${verse} at position ${versePosition}s`
      );
    } catch (error) {
      console.error('Failed to select verse:', error);
    }
  };

  return (
    <View style={styles.container}>
      <BibleBooksScreen
        onChapterSelect={handleChapterSelect}
        onVerseSelect={handleVerseSelect}
      />

      {/* Mini Player Overlay - Show when we have a current recording */}
      {currentRecording && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer testID='main-mini-player' />
        </View>
      )}
    </View>
  );
};
