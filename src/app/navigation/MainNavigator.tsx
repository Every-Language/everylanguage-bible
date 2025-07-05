import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BibleBooksScreen } from '@/features/bible/screens/BibleBooksScreen';
import { MiniPlayer } from '@/features/audio/components/MiniPlayer';
import { type Book } from '@/shared/utils';
import { useAudioStore, useTheme } from '@/shared/store';

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

  // Set up John 1 as default when app starts
  useEffect(() => {
    const initializeDefaultAudio = async () => {
      // Initialize Bible books data first
      initializeBibleBooks();

      // Only set default if no proper chapter is loaded (ignore mock recording)
      if (!currentChapter) {
        try {
          // Create a John 1 recording ID
          const johnBook: Book = {
            id: '43', // Book ID is the order number padded
            name: 'John',
            chapters: 21,
            testament: 'new',
            imagePath: '43_john.png',
            order: 43, // John is the 43rd book
          };
          const johnRecordingId = getRecordingId(johnBook, 1);

          // Load John 1 but don't start playing
          await setCurrentAudio(johnRecordingId);
          console.log(
            'Initialized with John 1 - verse data should now be populated'
          );
        } catch (error) {
          console.error('Failed to initialize default audio:', error);
        }
      }
    };

    initializeDefaultAudio();
  }, [currentRecording, currentChapter, setCurrentAudio, initializeBibleBooks]);

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
