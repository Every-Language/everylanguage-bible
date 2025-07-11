import React, { useEffect } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { Stack, Text as TamaguiText } from '@tamagui/core';
import { Card } from '@tamagui/card';
import { Button } from '@tamagui/button';
import { type Book } from '@/shared/utils';
import { Fonts, Dimensions } from '@/shared/constants';
import {
  useTheme,
  useChapterCardStore,
  useQueueStore,
  useAudioStore,
} from '@/shared/store';
import {
  useTranslation,
  useHorizontalSlideAnimation,
  useMiniPlayerHeight,
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
        <Card
          size='$4'
          marginVertical='$1'
          marginHorizontal='$2'
          padding='$2'
          backgroundColor={colors.background}
          borderColor={colors.primary + '20'}
          borderWidth={1}
          testID={testID}
          onPress={onSwipeToVerse}
          pressStyle={{ scale: 0.98 }}>
          <Stack
            flexDirection='row'
            alignItems='center'
            justifyContent='space-between'
            flex={1}>
            <Stack flexDirection='column' flex={1} gap='$1'>
              <TamaguiText fontSize='$4' fontWeight='600' color={colors.text}>
                Chapter {chapterNumber}
              </TamaguiText>
              <TamaguiText
                fontSize='$3'
                fontWeight='400'
                color={colors.text + '80'}
                numberOfLines={1}>
                {verseCount} verses
              </TamaguiText>
            </Stack>

            <Stack flexDirection='row' alignItems='center' gap='$2'>
              {/* Add to Queue Button */}
              <TouchableOpacity
                onPress={onAddToQueue}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <PlusIcon size={18} color={colors.background} />
              </TouchableOpacity>

              {/* Play Button */}
              <TouchableOpacity
                onPress={onPlay}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <PlayIcon size={20} color={colors.background} />
              </TouchableOpacity>
            </Stack>
          </Stack>
        </Card>
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
    <Card
      size='$4'
      marginVertical='$1'
      marginHorizontal='$2'
      padding='$2'
      backgroundColor={colors.background}
      borderColor={colors.primary + '20'}
      borderWidth={1}
      testID={testID}
      onPress={onPlay}
      pressStyle={{ scale: 0.98 }}>
      <Stack
        flexDirection='row'
        alignItems='center'
        justifyContent='space-between'
        flex={1}>
        <Stack flexDirection='column' flex={1} gap='$1'>
          <TamaguiText fontSize='$4' fontWeight='600' color={colors.text}>
            Verse {verseNumber}
          </TamaguiText>
          <TamaguiText
            fontSize='$3'
            fontWeight='400'
            color={colors.text}
            numberOfLines={2}
            ellipsizeMode='tail'>
            {verseText}
          </TamaguiText>
        </Stack>

        <Stack flexDirection='row' alignItems='center' gap='$2'>
          {/* Add to Queue Button */}
          <TouchableOpacity
            onPress={onAddToQueue}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <PlusIcon size={18} color={colors.background} />
          </TouchableOpacity>

          {/* Play Button */}
          <TouchableOpacity
            onPress={onPlay}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <PlayIcon size={20} color={colors.background} />
          </TouchableOpacity>
        </Stack>
      </Stack>
    </Card>
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
        <Stack paddingBottom='$4'>
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
        </Stack>
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
        <Stack paddingBottom='$4'>
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
        </Stack>
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
  const insets = useSafeAreaInsets();
  const { collapsedHeight } = useMiniPlayerHeight();

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
    useHorizontalSlideAnimation({
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
  const toggleOptions = [
    { key: 'chapters', label: t('bible.chapters', 'Chapters') },
    {
      key: 'verses',
      label: t('bible.verses', 'Verses'),
      disabled: !selectedChapter,
    },
  ];

  return (
    <Card
      position='absolute'
      top={insets.top + 10}
      left={10}
      right={10}
      bottom={collapsedHeight + 10}
      backgroundColor={colors.background}
      borderRadius='$4'
      borderWidth={2}
      borderColor={colors.primary}
      shadowColor={colors.text}
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={3.84}
      elevation={5}>
      <Stack flex={1}>
        {/* Header with close button */}
        <Stack position='absolute' top='$2' right='$2' zIndex={10}>
          <Button
            width={25}
            height={25}
            borderRadius={12.5}
            backgroundColor={colors.background}
            borderWidth={1}
            borderColor={colors.primary}
            padding={0}
            onPress={closeChapterCard}
            pressStyle={{ scale: 0.9 }}
            testID='close-button'>
            <Stack
              width='100%'
              height='100%'
              alignItems='center'
              justifyContent='center'
              position='relative'>
              <Stack
                position='absolute'
                width={10}
                height={1}
                backgroundColor={colors.text}
                transform={[{ rotate: '45deg' }]}
              />
              <Stack
                position='absolute'
                width={10}
                height={1}
                backgroundColor={colors.text}
                transform={[{ rotate: '-45deg' }]}
              />
            </Stack>
          </Button>
        </Stack>

        {/* Book info section */}
        <Stack
          paddingHorizontal='$3'
          paddingTop='$3'
          paddingBottom='$2'
          alignItems='center'>
          <BookImage
            imagePath={selectedBook.imagePath}
            size={60}
            testID='book-image'
          />

          <Stack
            flexDirection='row'
            alignItems='center'
            justifyContent='space-between'
            marginTop='$2'
            width='100%'
            paddingHorizontal='$2'>
            <Stack flex={1}>
              <TamaguiText
                fontSize='$5'
                fontWeight='bold'
                color={colors.text}
                textAlign='center'>
                {getTitle()}
              </TamaguiText>
            </Stack>
          </Stack>

          <TamaguiText
            fontSize='$3'
            color={colors.secondary}
            marginTop='$1'
            textAlign='center'>
            {getSubtitle()}
          </TamaguiText>
        </Stack>

        {/* Toggle Buttons */}
        <View
          style={{
            paddingHorizontal: Dimensions.spacing.md,
            marginBottom: Dimensions.spacing.sm,
          }}>
          <ToggleButtons
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
      </Stack>
    </Card>
  );
};
