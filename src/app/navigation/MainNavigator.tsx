import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BibleScreen } from '@/features/bible/screens';
import { ChapterCard } from '@/features/bible/components';
import { ThemeDemoScreen } from '@/features/theme';
import { PlayerOverlay } from '@/features/audio/components/PlayerOverlay';
import { MainHeaderWrapper } from '@/shared';
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
  const [showThemeDemo, setShowThemeDemo] = useState(false);
  const {
    currentRecording,
    currentChapter,
    setCurrentAudio,
    initializeBibleBooks,
  } = audioStore;

  // Options menu state
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<
    'profile' | 'language' | 'settings' | 'help' | 'login' | 'theme-demo' | null
  >(null);

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
    playerOverlayContainer: {
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

  const handleThemeDemoBack = () => {
    setShowThemeDemo(false);
  };

  const handleThemeDemoPress = () => {
    setShowThemeDemo(true);
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

  // Options menu handlers
  const handleOptionsOpen = () => {
    setShowOptionsPanel(true);
  };

  const handleOptionsClose = () => {
    setShowOptionsPanel(false);
  };

  const handleOpenSubMenu = (
    subMenuType:
      | 'profile'
      | 'language'
      | 'settings'
      | 'help'
      | 'login'
      | 'theme-demo'
      | null
  ) => {
    setShowOptionsPanel(false);

    if (subMenuType === null) {
      return;
    }

    if (subMenuType === 'theme-demo') {
      // Handle theme demo navigation
      handleThemeDemoPress();
      return;
    }

    setActiveSubMenu(subMenuType);
  };

  const handleCloseSubMenu = () => {
    setActiveSubMenu(null);
  };

  return (
    <>
      <MainHeaderWrapper
        onTitlePress={() => console.log('Bible title pressed')}
        onBiblePress={() => console.log('Bible button pressed')}
        onPlaylistsPress={() => console.log('Playlists button pressed')}
        onOptionsPress={handleOptionsOpen}>
        <View style={styles.container}>
          {showThemeDemo ? (
            <ThemeDemoScreen onBack={handleThemeDemoBack} />
          ) : (
            <BibleScreen
              _onChapterSelect={handleChapterSelect}
              _onVerseSelect={handleVerseSelect}
              _onThemeDemoPress={handleThemeDemoPress}
              showOptionsPanel={showOptionsPanel}
              onOptionsClose={handleOptionsClose}
              onOpenSubMenu={handleOpenSubMenu}
              activeSubMenu={activeSubMenu}
              onCloseSubMenu={handleCloseSubMenu}
            />
          )}

          {/* Player Overlay - Show when we have a current recording */}
          {currentRecording && (
            <View style={styles.playerOverlayContainer}>
              <PlayerOverlay testID='main-player-overlay' />
            </View>
          )}
        </View>
      </MainHeaderWrapper>

      {/* Chapter Card - renders above header and content */}
      <ChapterCard
        onChapterSelect={handleChapterSelect}
        onVerseSelect={handleVerseSelect}
      />
    </>
  );
};
