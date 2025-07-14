import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Text,
  StyleSheet,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { type Book } from '@/shared/utils';
import { Fonts, Dimensions } from '@/shared/constants';
import {
  useChapterCardStore,
  useQueueStore,
  useAudioStore,
} from '@/shared/store';
import type { ViewMode } from '@/shared/store/chapterCardStore';
import {
  useTheme,
  useTranslation,
  useHorizontalSlideAnimation,
} from '@/shared/hooks';
import { ToggleButtons, BookImage } from '@/shared/components/ui';
import { PlayIcon, PlusIcon } from '@/shared/components/ui/icons/AudioIcons';

interface ChapterCardProps {
  onChapterSelect: (book: Book, chapter: number) => void;
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
}

// Chapter Item Component (styled like VerseView items but without shadows)
interface ChapterItemProps {
  chapterNumber: number;
  verseCount: number;
  onPlay: () => void;
  onAddToQueue: () => void;
  onSwipeToVerse: () => void;
  testID?: string;
}

const ChapterItem: React.FC<ChapterItemProps> = ({
  chapterNumber,
  verseCount,
  onPlay,
  onAddToQueue,
  onSwipeToVerse,
  testID,
}) => {
  const { colors } = useTheme();

  // Gesture handler for swipe left detection
  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: (_, context) => {
        context['shouldHandle'] = false;
      },
      onActive: (event, context) => {
        const deltaX = Math.abs(event.translationX);
        const deltaY = Math.abs(event.translationY);

        // Only handle if this is clearly a horizontal gesture and moving left
        if (deltaX > 20 && deltaX > deltaY * 2 && event.translationX < -20) {
          context['shouldHandle'] = true;
        }
      },
      onEnd: (event, context) => {
        if (context['shouldHandle'] && event.translationX < -50) {
          // Swipe left detected - trigger verse view
          runOnJS(onSwipeToVerse)();
        }
      },
    });

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      activeOffsetX={[-10, 10]}
      failOffsetY={[-20, 20]}>
      <Animated.View>
        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor: colors.background,
              borderColor: colors.primary + '20',
            },
          ]}
          testID={testID}
          onPress={onSwipeToVerse}
          activeOpacity={0.98}>
          <View style={styles.cardContent}>
            <View style={styles.textContainer}>
              <Text
                style={[styles.chapterNumber, { color: colors.textPrimary }]}>
                Chapter {chapterNumber}
              </Text>
              <Text
                style={[
                  styles.verseCount,
                  { color: colors.textPrimary + '80' },
                ]}
                numberOfLines={1}>
                {verseCount} verses
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              {/* Add to Queue Button */}
              <TouchableOpacity
                onPress={onAddToQueue}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}>
                <PlusIcon size={18} color={colors.background} />
              </TouchableOpacity>

              {/* Play Button */}
              <TouchableOpacity
                onPress={onPlay}
                style={[
                  styles.button,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}>
                <PlayIcon size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};

// Verse Item Component (styled like VerseView items but without shadows)
interface VerseItemProps {
  verseNumber: number;
  verseText: string;
  onPlay: () => void;
  onAddToQueue: () => void;
  testID?: string;
}

const VerseItem: React.FC<VerseItemProps> = ({
  verseNumber,
  verseText,
  onPlay,
  onAddToQueue,
  testID,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.primary + '20',
        },
      ]}
      testID={testID}
      onPress={onPlay}
      activeOpacity={0.98}>
      <View style={styles.cardContent}>
        <View style={styles.textContainer}>
          <Text style={[styles.verseNumber, { color: colors.textPrimary }]}>
            Verse {verseNumber}
          </Text>
          <Text
            style={[styles.verseText, { color: colors.textPrimary }]}
            numberOfLines={2}
            ellipsizeMode='tail'>
            {verseText}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {/* Add to Queue Button */}
          <TouchableOpacity
            onPress={onAddToQueue}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
              },
            ]}>
            <PlusIcon size={18} color={colors.background} />
          </TouchableOpacity>

          {/* Play Button */}
          <TouchableOpacity
            onPress={onPlay}
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
              },
            ]}>
            <PlayIcon size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Chapter List View Component
interface ChapterListViewProps {
  book: Book;
  onChapterSelect: (book: Book, chapter: number) => void;
  onSwipeToVerse: (book: Book, chapter: number) => void;
}

const ChapterListView: React.FC<ChapterListViewProps> = ({
  book,
  onChapterSelect: _onChapterSelect,
  onSwipeToVerse,
}) => {
  // Helper function to create chapter data compatible with queue system
  const createChapterData = (book: Book, chapterNumber: number) => {
    const bookId = book.name.toLowerCase().replace(/\s+/g, '-');
    const chapterId = `${bookId}-${chapterNumber}`;

    return {
      id: chapterId,
      book_name: book.name,
      chapter_number: chapterNumber,
      title: `${book.name} Chapter ${chapterNumber}`,
      audio_file_url: `https://example.com/${chapterId}.mp3`,
      duration_seconds: 600 + chapterNumber * 30,
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleChapterPress = async (chapterNumber: number) => {
    const queueStore = useQueueStore.getState();
    const playMode = queueStore.getPlayMode();

    const chapter = createChapterData(book, chapterNumber);

    if (playMode === 'queue') {
      const { userQueue } = queueStore;

      if (userQueue.items.length === 1) {
        queueStore.removeFromUserQueue(
          userQueue.currentIndex >= 0 ? userQueue.currentIndex : 0
        );
        queueStore.clearAutomaticQueue();

        const audioStore = useAudioStore.getState();
        await audioStore.playFromQueueItem(
          {
            type: 'chapter',
            data: chapter,
          },
          false
        );
        audioStore.play();
        return;
      }

      queueStore.addToUserQueueFront({
        type: 'chapter',
        data: chapter,
      });

      const currentItem = queueStore.getCurrentItem();
      if (currentItem) {
        const audioStore = useAudioStore.getState();
        await audioStore.playFromQueueItem(currentItem, true);
        audioStore.play();
      }
      return;
    }

    const audioStore = useAudioStore.getState();
    await audioStore.playFromQueueItem(
      {
        type: 'chapter',
        data: chapter,
      },
      false
    );
    audioStore.play();
  };

  const handleAddToQueue = (chapterNumber: number) => {
    const chapter = createChapterData(book, chapterNumber);
    const queueStore = useQueueStore.getState();
    queueStore.addToUserQueueBack({
      type: 'chapter',
      data: chapter,
    });
  };

  const handleSwipeToVerse = (chapterNumber: number) => {
    onSwipeToVerse(book, chapterNumber);
  };

  // Generate dummy verse count for a chapter
  const getDummyVerseCount = (chapterNumber: number): number => {
    const seed = chapterNumber * 7;
    return 15 + (seed % 35);
  };

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.chapterListContainer}>
          {chapters.map(chapterNumber => (
            <ChapterItem
              key={chapterNumber}
              chapterNumber={chapterNumber}
              verseCount={getDummyVerseCount(chapterNumber)}
              onPlay={() => handleChapterPress(chapterNumber)}
              onAddToQueue={() => handleAddToQueue(chapterNumber)}
              onSwipeToVerse={() => handleSwipeToVerse(chapterNumber)}
              testID={`chapter-tile-${chapterNumber}`}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Verse List View Component
interface VerseListViewProps {
  book: Book;
  chapter: number;
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
  onSwipeToChapters: () => void;
}

const VerseListView: React.FC<VerseListViewProps> = ({
  book,
  chapter,
  onVerseSelect,
  onSwipeToChapters: _onSwipeToChapters,
}) => {
  const handleVersePress = (verseNumber: number) => {
    onVerseSelect(book, chapter, verseNumber);
  };

  const handleAddToQueue = (verseNumber: number) => {
    // Add verse to queue functionality would go here
    void verseNumber;
  };

  // Generate dummy verse count and text
  const getDummyVerseCount = (chapterNumber: number): number => {
    const seed = chapterNumber * 7;
    return 15 + (seed % 35);
  };

  const getDummyVerseText = (verseNumber: number): string => {
    const verseTexts = [
      'In the beginning was the Word, and the Word was with God, and the Word was God.',
      'For God so loved the world that he gave his one and only Son.',
      'The Lord is my shepherd; I shall not want.',
      'And we know that in all things God works for the good of those who love him.',
      'Trust in the Lord with all your heart and lean not on your own understanding.',
      'Be strong and courageous. Do not be afraid; do not be discouraged.',
    ];

    const index = (verseNumber - 1) % verseTexts.length;
    return verseTexts[index] || 'Default verse text';
  };

  const verses = Array.from(
    { length: getDummyVerseCount(chapter) },
    (_, i) => i + 1
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.verseListContainer}>
          {verses.map(verseNumber => (
            <VerseItem
              key={verseNumber}
              verseNumber={verseNumber}
              verseText={getDummyVerseText(verseNumber)}
              onPlay={() => handleVersePress(verseNumber)}
              onAddToQueue={() => handleAddToQueue(verseNumber)}
              testID={`verse-tile-${verseNumber}`}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Content switcher with animation
interface ContentSwitcherProps {
  viewMode: 'chapters' | 'verses';
  book: Book;
  chapter: number | null;
  onChapterSelect: (book: Book, chapter: number) => void;
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
  onSwipeToVerse: (book: Book, chapter: number) => void;
  onSwipeToChapters: () => void;
  slideAnimation: Animated.SharedValue<number>;
}

const ContentSwitcher: React.FC<ContentSwitcherProps> = ({
  viewMode: _viewMode,
  book,
  chapter,
  onChapterSelect,
  onVerseSelect,
  onSwipeToVerse,
  onSwipeToChapters,
  slideAnimation,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${slideAnimation.value * -50}%` }],
  }));

  return (
    <View style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            width: '200%',
            height: '100%',
          },
          animatedStyle,
        ]}>
        <View style={{ width: '50%', height: '100%' }}>
          <ChapterListView
            book={book}
            onChapterSelect={onChapterSelect}
            onSwipeToVerse={onSwipeToVerse}
          />
        </View>
        <View style={{ width: '50%', height: '100%' }}>
          {chapter && (
            <VerseListView
              book={book}
              chapter={chapter}
              onVerseSelect={onVerseSelect}
              onSwipeToChapters={onSwipeToChapters}
            />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

export const ChapterCard: React.FC<ChapterCardProps> = ({
  onChapterSelect,
  onVerseSelect,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const {
    isOpen,
    selectedBook,
    selectedChapter,
    viewMode,
    setViewMode,
    openVerseView,
    closeChapterCard,
  } = useChapterCardStore();

  // Use the reusable horizontal slide animation hook
  const { slideAnimation, gestureHandler, updateAnimation } =
    useHorizontalSlideAnimation<ViewMode>({
      onModeChange: setViewMode,
      modes: ['chapters', 'verses'],
      currentMode: viewMode,
    });

  // Update animation when view mode changes externally
  useEffect(() => {
    updateAnimation(viewMode);
  }, [viewMode, updateAnimation]);

  // Handle switching to verse view from chapter swipe
  const handleSwipeToVerse = (book: Book, chapter: number) => {
    openVerseView(book, chapter);
  };

  // Handle switching back to chapters from verse swipe
  const handleSwipeToChapters = () => {
    setViewMode('chapters');
  };

  if (!isOpen || !selectedBook) {
    return null;
  }

  // Helper functions for responsive header text
  const getTitle = () => {
    if (viewMode === 'verses' && selectedChapter) {
      return `${selectedBook.name} ${selectedChapter}`;
    }
    return selectedBook.name;
  };

  const getSubtitle = () => {
    if (viewMode === 'verses' && selectedChapter) {
      // Generate dummy verse count and duration for this chapter
      const getDummyVerseCount = (chapterNumber: number): number => {
        const seed = chapterNumber * 7;
        return 15 + (seed % 35);
      };

      const getDummyPlaybackTime = (verses: number): string => {
        const avgSecondsPerVerse = 20;
        const totalSeconds = verses * avgSecondsPerVerse;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        if (minutes > 0) {
          return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
      };

      const verseCount = getDummyVerseCount(selectedChapter);
      const duration = getDummyPlaybackTime(verseCount);
      return `${verseCount} verses • ${duration}`;
    }

    return `${selectedBook.chapters} chapters • ${selectedBook.testament === 'old' ? 'Old' : 'New'} Testament`;
  };

  // Toggle button options
  const toggleOptions: Array<{
    key: ViewMode;
    label: string;
    disabled?: boolean;
  }> = [
    { key: 'chapters', label: t('bible.chapters', 'Chapters') },
    {
      key: 'verses',
      label: t('bible.verses', 'Verses'),
      disabled: !selectedChapter,
    },
  ];

  return (
    <View
      style={[
        styles.mainCard,
        {
          backgroundColor: colors.background,
          borderColor: colors.primary,
          borderWidth: 2,
          shadowColor: colors.textPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,
        },
      ]}>
      <View style={styles.cardContent}>
        {/* Header with close button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={closeChapterCard}
            style={[styles.closeButton, { borderColor: colors.primary }]}
            testID='close-button'>
            <View style={styles.closeButtonIcon}>
              <View
                style={[
                  styles.closeLine,
                  { backgroundColor: colors.textPrimary },
                ]}
              />
              <View
                style={[
                  styles.closeLine,
                  { backgroundColor: colors.textPrimary },
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Book info section */}
        <View style={styles.bookInfoSection}>
          <BookImage
            imagePath={selectedBook.imagePath}
            size={110}
            testID='book-image'
          />

          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {getTitle()}
            </Text>
          </View>

          <Text style={[styles.subtitle, { color: colors.secondary }]}>
            {getSubtitle()}
          </Text>
        </View>

        {/* Toggle Buttons */}
        <View
          style={{
            paddingHorizontal: Dimensions.spacing.md,
            marginBottom: Dimensions.spacing.sm,
          }}>
          <ToggleButtons<ViewMode>
            options={toggleOptions}
            selectedKey={viewMode}
            onSelect={setViewMode}
            testID='chapter-verse-toggle'
            height={24}
            fontSize={Fonts.size.sm}
          />
        </View>

        {/* Content Area */}
        <View style={{ flex: 1 }}>
          <PanGestureHandler
            onGestureEvent={gestureHandler}
            simultaneousHandlers={[]}
            shouldCancelWhenOutside={false}
            enableTrackpadTwoFingerGesture={false}
            activeOffsetX={[-20, 20]}
            failOffsetY={[-20, 20]}>
            <Animated.View style={{ flex: 1 }}>
              <ContentSwitcher
                viewMode={viewMode}
                book={selectedBook}
                chapter={selectedChapter}
                onChapterSelect={onChapterSelect}
                onVerseSelect={onVerseSelect}
                onSwipeToVerse={handleSwipeToVerse}
                onSwipeToChapters={handleSwipeToChapters}
                slideAnimation={slideAnimation}
              />
            </Animated.View>
          </PanGestureHandler>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainCard: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 24,
    overflow: 'hidden',
  },
  card: {
    marginVertical: 4,
    marginHorizontal: 8,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    flex: 1,
  },
  cardContent: {
    flex: 1,
    padding: Dimensions.spacing.md,
  },
  header: {
    position: 'absolute',
    top: Dimensions.spacing.sm,
    right: Dimensions.spacing.sm,
    zIndex: 10,
  },
  closeButton: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 0,
  },
  closeButtonIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  closeLine: {
    position: 'absolute',
    width: 10,
    height: 1,
    backgroundColor: 'transparent',
    transform: [{ rotate: '45deg' }],
  },
  bookInfoSection: {
    alignItems: 'center',
    marginTop: Dimensions.spacing.sm,
    width: '100%',
    paddingHorizontal: Dimensions.spacing.sm,
  },
  titleContainer: {
    marginTop: Dimensions.spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: Fonts.size.lg,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Dimensions.spacing.xs,
    textAlign: 'center',
  },
  chapterListContainer: {
    flex: 1,
  },
  verseListContainer: {
    flex: 1,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Dimensions.spacing.sm,
    width: '100%',
    paddingHorizontal: Dimensions.spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginBottom: Dimensions.spacing.xs,
  },
  chapterNumber: {
    fontSize: Fonts.size.base,
    fontWeight: '600',
  },
  verseCount: {
    fontSize: Fonts.size.sm,
    fontWeight: '400',
  },
  verseText: {
    fontSize: Fonts.size.sm,
    fontWeight: '400',
  },
  verseNumber: {
    fontSize: Fonts.size.base,
    fontWeight: '600',
  },
});
