import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, Text } from '@tamagui/core';
import { Card } from '@tamagui/card';
import { Button } from '@tamagui/button';
import { Image } from '@tamagui/image';
import {
  useChapterViewStore,
  useQueueStore,
  useAudioStore,
} from '@/shared/store';
import { getBookImageSource } from '@/shared/services';
import { type Book } from '@/shared/utils';
import { useTheme } from '@/shared/store';
import { PlayIcon, PlusIcon } from '@/shared/components/ui/icons/AudioIcons';
import { TouchableOpacity } from 'react-native';
import { useMiniPlayerHeight } from '@/shared/hooks';

interface ChapterViewProps {
  onChapterSelect: (book: Book, chapter: number) => void;
  onVerseViewOpen: (book: Book, chapter: number) => void;
}

interface ChapterItemProps {
  chapterNumber: number;
  verseCount: number;
  onPlay: () => void;
  onCardPress: () => void;
  onAddToQueue: () => void;
  testID?: string;
}

const ChapterItem: React.FC<ChapterItemProps> = ({
  chapterNumber,
  verseCount,
  onPlay,
  onCardPress,
  onAddToQueue,
  testID,
}) => {
  const { colors } = useTheme();

  return (
    <Card
      elevate
      size='$4'
      marginVertical='$1'
      marginHorizontal='$2'
      padding='$2'
      backgroundColor='$background'
      borderColor='$color4'
      borderWidth={1}
      testID={testID}
      onPress={onCardPress}>
      <Stack
        flexDirection='row'
        items='center'
        justifyContent='space-between'
        flex={1}>
        <Stack flexDirection='row' items='center' gap='$2'>
          <Text fontSize='$4' fontWeight='600' color='$color'>
            Chapter {chapterNumber}
          </Text>
          <Text fontSize='$2' fontWeight='400' color='$secondary'>
            {verseCount} verses
          </Text>
        </Stack>

        <Stack flexDirection='row' items='center' gap='$2'>
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
            testID='play-button'
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

export const ChapterView: React.FC<ChapterViewProps> = ({
  onChapterSelect,
  onVerseViewOpen,
}) => {
  const { isOpen, selectedBook, closeChapterView } = useChapterViewStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { collapsedHeight } = useMiniPlayerHeight();

  if (!isOpen || !selectedBook) {
    return null;
  }

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
      duration_seconds: 600 + chapterNumber * 30, // Vary duration based on chapter
      language: 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  };

  const handleChapterPress = async (chapterNumber: number) => {
    const queueStore = useQueueStore.getState();
    const playMode = queueStore.getPlayMode();

    // Create chapter data
    const chapter = createChapterData(selectedBook, chapterNumber);

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
        const audioStore = useAudioStore.getState();
        await audioStore.playFromQueueItem(
          {
            type: 'chapter',
            data: chapter,
          },
          false
        ); // false = not from queue, playing directly
        audioStore.play();
        console.log(
          `Playing chapter ${chapterNumber} of ${selectedBook.name} (not added to queue)`
        );
        return;
      }

      // Multiple items in queue, add to front as before
      queueStore.addToUserQueueFront({
        type: 'chapter',
        data: chapter,
      });

      console.log(
        `Added ${selectedBook.name} Chapter ${chapterNumber} to front of queue (queue mode)`
      );

      // Play the newly added item (now at front of queue)
      const currentItem = queueStore.getCurrentItem();
      if (currentItem) {
        const audioStore = useAudioStore.getState();
        await audioStore.playFromQueueItem(currentItem, true);
        audioStore.play();
      }
      return;
    }

    // Flow mode: Start playing immediately WITHOUT adding to queue
    const audioStore = useAudioStore.getState();
    await audioStore.playFromQueueItem(
      {
        type: 'chapter',
        data: chapter,
      },
      false
    ); // false = not from queue, playing directly

    audioStore.play();
    console.log(
      `Playing chapter ${chapterNumber} of ${selectedBook.name} (not added to queue)`
    );
  };

  const handleChapterCardPress = (chapterNumber: number) => {
    onVerseViewOpen(selectedBook, chapterNumber);
  };

  const handleAddToQueue = (chapterNumber: number) => {
    // Create chapter data
    const chapter = createChapterData(selectedBook, chapterNumber);

    // Add to back of queue
    const queueStore = useQueueStore.getState();
    queueStore.addToUserQueueBack({
      type: 'chapter',
      data: chapter,
    });

    console.log(
      `Added chapter ${chapterNumber} of ${selectedBook.name} to queue`
    );
  };

  const handlePlayBook = () => {
    // Play all chapters starting from chapter 1
    onChapterSelect(selectedBook, 1);
    console.log(
      `Playing all chapters of ${selectedBook.name} starting from chapter 1`
    );
  };

  const handleAddBookToQueue = () => {
    // Add all chapters to queue
    const allChapters = Array.from(
      { length: selectedBook.chapters },
      (_, i) => i + 1
    );
    console.log(
      `Adding all ${allChapters.length} chapters of ${selectedBook.name} to queue:`,
      allChapters
    );
    // TODO: Implement actual add all chapters to queue functionality
  };

  // Generate dummy playback time based on chapter count
  // TODO: Replace with actual audio duration data
  const getDummyPlaybackTime = (chapters: number): string => {
    // Assume average of 8-12 minutes per chapter
    const avgMinutesPerChapter = 10;
    const totalMinutes = chapters * avgMinutesPerChapter;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Generate dummy verse count for a chapter
  // TODO: Replace with actual verse count data
  const getDummyVerseCount = (chapterNumber: number): number => {
    // Generate somewhat realistic verse counts (10-50 verses per chapter)
    // Use chapter number as seed for consistency
    const seed = chapterNumber * 7; // Simple pseudo-random
    return 15 + (seed % 35); // Results in 15-49 verses
  };

  const renderChapterItem = (chapterNumber: number) => (
    <ChapterItem
      key={chapterNumber}
      chapterNumber={chapterNumber}
      verseCount={getDummyVerseCount(chapterNumber)}
      onPlay={() => handleChapterPress(chapterNumber)}
      onCardPress={() => handleChapterCardPress(chapterNumber)}
      onAddToQueue={() => handleAddToQueue(chapterNumber)}
      testID={`chapter-tile-${chapterNumber}`}
    />
  );

  const chapters = Array.from(
    { length: selectedBook.chapters },
    (_, i) => i + 1
  );

  return (
    <Card
      position='absolute'
      top={insets.top + 10}
      left={10}
      right={10}
      bottom={collapsedHeight + 10} // Mini player height + 10px margin
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
            onPress={closeChapterView}
            pressStyle={{ scale: 0.9 }}
            testID='close-button'>
            <Stack
              width='100%'
              height='100%'
              alignItems='center'
              justifyContent='center'
              position='relative'>
              {/* Geometric X using two diagonal lines */}
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

        {/* Book icon section */}
        <Stack
          alignItems='center'
          padding='$2'
          paddingTop='$2'
          paddingBottom='$1'
          justifyContent='center'>
          {selectedBook.imagePath ? (
            <Image
              source={getBookImageSource(selectedBook.imagePath)}
              width={156}
              height={156}
              borderRadius='$4'
              tintColor={colors.text}
              resizeMode='contain'
            />
          ) : (
            <Card
              width={156}
              height={156}
              backgroundColor={colors.secondary + '30'}
              borderRadius='$4'
              alignItems='center'
              justifyContent='center'>
              <Text fontSize={48} color={colors.text}>
                📖
              </Text>
            </Card>
          )}

          {/* Book title with action buttons */}
          <Stack
            flexDirection='row'
            alignItems='center'
            justifyContent='space-between'
            marginTop='$1'
            width='100%'
            paddingHorizontal='$2'>
            <Stack flex={1}>
              <Text
                fontSize='$4'
                fontWeight='bold'
                color={colors.text}
                textAlign='left'>
                {selectedBook.name}
              </Text>
            </Stack>

            <Stack flexDirection='row' alignItems='center' gap='$2'>
              {/* Add Book to Queue Button */}
              <TouchableOpacity
                onPress={handleAddBookToQueue}
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

              {/* Play Book Button */}
              <TouchableOpacity
                onPress={handlePlayBook}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                testID='play-book-button'>
                <PlayIcon size={20} color={colors.background} />
              </TouchableOpacity>
            </Stack>
          </Stack>

          <Text
            fontSize='$3'
            color={colors.secondary}
            marginTop='$1'
            textAlign='center'>
            {selectedBook.chapters} chapters •{' '}
            {selectedBook.testament === 'old' ? 'Old' : 'New'} Testament •{' '}
            {getDummyPlaybackTime(selectedBook.chapters)}
          </Text>
        </Stack>

        {/* Chapters section */}
        <Stack flex={1}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Stack paddingBottom='$4'>{chapters.map(renderChapterItem)}</Stack>
          </ScrollView>
        </Stack>
      </Stack>
    </Card>
  );
};
