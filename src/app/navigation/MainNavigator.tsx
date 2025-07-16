import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BibleBooksScreen, SearchScreen } from '@/features/bible/screens';
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

  // Search screen state
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Set up John 1 as default when app starts (flow mode with empty queue)
  useEffect(() => {
    const initializeDefaultAudio = async () => {
      // Initialize Bible books data first
      initializeBibleBooks();

      // Start with empty queue (flow mode) - no queue initialization

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

          // Load John 1 but don't start playing (flow mode)
          await setCurrentAudio(johnRecordingId);
          console.log(
            'Initialized with John 1 in flow mode - verse data should now be populated'
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
      const queueStore = useQueueStore.getState();
      const playMode = queueStore.getPlayMode();

      // If in queue mode, check if we should switch to flow mode or add to queue
      if (playMode === 'queue') {
        const { userQueue } = queueStore;

        // If only one item in queue (the currently playing one), switch to flow mode
        if (userQueue.items.length === 1) {
          // Remove the current item from queue and clear automatic queue to ensure flow mode
          queueStore.removeFromUserQueue(
            userQueue.currentIndex >= 0 ? userQueue.currentIndex : 0
          );
          queueStore.clearAutomaticQueue(); // Prevent getCurrentItem() from moving automatic items back
          console.log(
            '🔄 MODE TRANSITION: Switched from queue mode to flow mode (removed last item, playing new selection)'
          );

          // Play directly in flow mode
          const recordingId = getRecordingId(book, chapter);
          await setCurrentAudio(recordingId);
          audioStore.play();
          console.log('Selected chapter:', `${book.name} ${chapter}`);
          return;
        }

        // Multiple items in queue, add to front as before
        const chapterData = {
          id: getRecordingId(book, chapter),
          book_name: book.name,
          chapter_number: chapter,
          title: `${book.name} Chapter ${chapter}`,
          audio_file_url: `https://example.com/${getRecordingId(book, chapter)}.mp3`,
          duration_seconds: 600 + chapter * 30,
          language: 'en',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queueStore.addToUserQueueFront({
          type: 'chapter',
          data: chapterData,
        });

        console.log(
          `Added ${book.name} Chapter ${chapter} to front of queue (queue mode)`
        );

        // Play the newly added item (now at front of queue)
        const currentItem = queueStore.getCurrentItem();
        if (currentItem) {
          await audioStore.playFromQueueItem(currentItem, true);
          audioStore.play();
        }
        return;
      }

      // Flow mode: play directly
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
      const queueStore = useQueueStore.getState();
      const playMode = queueStore.getPlayMode();

      // If in queue mode, check if we should switch to flow mode or add to queue
      if (playMode === 'queue') {
        const { userQueue } = queueStore;

        // If only one item in queue (the currently playing one), switch to flow mode
        if (userQueue.items.length === 1) {
          // Remove the current item from queue and clear automatic queue to ensure flow mode
          queueStore.removeFromUserQueue(
            userQueue.currentIndex >= 0 ? userQueue.currentIndex : 0
          );
          queueStore.clearAutomaticQueue(); // Prevent getCurrentItem() from moving automatic items back
          console.log(
            '🔄 MODE TRANSITION: Switched from queue mode to flow mode (removed last item, playing new selection)'
          );

          // Play directly in flow mode
          const recordingId = getRecordingId(book, chapter);
          await setCurrentAudio(recordingId);
          const versePosition = (verse - 1) * 20; // Start from verse 1 = 0 seconds
          audioStore.seek(versePosition);
          audioStore.play();
          console.log(
            `Playing ${book.name} ${chapter}:${verse} at position ${versePosition}s`
          );
          return;
        }

        // Multiple items in queue, add to front as before
        const recordingId = getRecordingId(book, chapter);
        const versePosition = (verse - 1) * 20; // Start from verse 1 = 0 seconds
        const chapterDuration = 600 + chapter * 30; // Estimated chapter duration

        const passageData = {
          id: `${recordingId}-from-verse-${verse}`,
          chapter_id: recordingId,
          start_verse: verse,
          end_verse: 30, // Assume chapter ends at verse 30 (fallback)
          start_time_seconds: versePosition,
          end_time_seconds: chapterDuration,
          title: `${book.name} Chapter ${chapter} (from verse ${verse})`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        queueStore.addToUserQueueFront({
          type: 'passage',
          data: passageData,
        });

        console.log(
          `Added ${book.name} Chapter ${chapter} verse ${verse} passage to front of queue (queue mode)`
        );

        // Play the newly added passage (now at front of queue)
        const currentItem = queueStore.getCurrentItem();
        if (currentItem) {
          await audioStore.playFromQueueItem(currentItem, true);
          audioStore.play();
        }
        return;
      }

      // Flow mode: play directly
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

  const handleSearchOpen = () => {
    setIsSearchVisible(true);
  };

  const handleSearchClose = () => {
    setIsSearchVisible(false);
  };

  return (
    <View style={styles.container}>
      <BibleBooksScreen
        onChapterSelect={handleChapterSelect}
        onVerseSelect={handleVerseSelect}
        onSearchPress={handleSearchOpen}
      />

      {/* Mini Player Overlay - Show when we have a current recording */}
      {currentRecording && (
        <View style={styles.miniPlayerContainer}>
          <MiniPlayer testID='main-mini-player' />
        </View>
      )}

      {/* Search Screen Overlay */}
      <SearchScreen
        isVisible={isSearchVisible}
        onClose={handleSearchClose}
        onChapterSelect={handleChapterSelect}
        onVerseSelect={handleVerseSelect}
      />
    </View>
  );
};
