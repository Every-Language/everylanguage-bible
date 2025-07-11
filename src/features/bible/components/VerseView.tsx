import React from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, Text } from '@tamagui/core';
import { Card } from '@tamagui/card';
import { Button } from '@tamagui/button';
import { Image } from '@tamagui/image';
import {
  useVerseViewStore,
  useQueueStore,
  useAudioStore,
} from '@/shared/store';
import { getBookImageSource } from '@/shared/services';
import { type Book } from '@/shared/utils';
import { useTheme } from '@/shared/store';
import { PlayIcon, PlusIcon } from '@/shared/components/ui/icons/AudioIcons';
import { TouchableOpacity } from 'react-native';

interface VerseViewProps {
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
  onChapterSelect: (book: Book, chapter: number) => void;
}

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
      elevate
      size='$4'
      marginVertical='$1'
      marginHorizontal='$2'
      padding='$2'
      backgroundColor={colors.background}
      borderColor={colors.primary + '20'}
      borderWidth={1}
      testID={testID}
      onPress={onPlay}>
      <Stack
        flexDirection='row'
        alignItems='center'
        justifyContent='space-between'
        flex={1}>
        <Stack flexDirection='column' flex={1} gap='$1'>
          <Text fontSize='$4' fontWeight='600' color={colors.text}>
            Verse {verseNumber}
          </Text>
          <Text
            fontSize='$3'
            fontWeight='400'
            color={colors.text}
            numberOfLines={2}
            ellipsizeMode='tail'>
            {verseText}
          </Text>
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

export const VerseView: React.FC<VerseViewProps> = ({
  onVerseSelect,
  onChapterSelect: _onChapterSelect,
}) => {
  const { isOpen, selectedBook, selectedChapter, closeVerseView } =
    useVerseViewStore();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!isOpen || !selectedBook || !selectedChapter) {
    return null;
  }

  const handleVersePress = (verseNumber: number) => {
    onVerseSelect(selectedBook, selectedChapter, verseNumber);
  };

  const handleAddToQueue = (verseNumber: number) => {
    // TODO: Implement add to queue functionality
    console.log(`Add verse ${verseNumber} to queue`);
  };

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

  const handlePlayChapter = async () => {
    const queueStore = useQueueStore.getState();
    const playMode = queueStore.getPlayMode();

    // Create chapter data
    const chapter = createChapterData(selectedBook, selectedChapter);

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
          `Playing chapter ${selectedChapter} of ${selectedBook.name} (not added to queue)`
        );
        return;
      }

      // Multiple items in queue, add to front as before
      queueStore.addToUserQueueFront({
        type: 'chapter',
        data: chapter,
      });

      console.log(
        `Added ${selectedBook.name} Chapter ${selectedChapter} to front of queue (queue mode)`
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
      `Playing chapter ${selectedChapter} of ${selectedBook.name} (not added to queue)`
    );
  };

  const handleAddChapterToQueue = () => {
    // Create chapter data
    const chapter = createChapterData(selectedBook, selectedChapter);

    // Add to back of queue
    const queueStore = useQueueStore.getState();
    queueStore.addToUserQueueBack({
      type: 'chapter',
      data: chapter,
    });

    console.log(
      `Added chapter ${selectedChapter} of ${selectedBook.name} to queue`
    );
  };

  // Generate dummy playback time based on verse count
  // TODO: Replace with actual audio duration data
  const getDummyPlaybackTime = (verses: number): string => {
    // Assume average of 15-25 seconds per verse
    const avgSecondsPerVerse = 20;
    const totalSeconds = verses * avgSecondsPerVerse;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Generate dummy verse count for a chapter
  // TODO: Replace with actual verse count data
  const getDummyVerseCount = (chapterNumber: number): number => {
    // Generate somewhat realistic verse counts (10-50 verses per chapter)
    // Use chapter number as seed for consistency
    const seed = chapterNumber * 7; // Simple pseudo-random
    return 15 + (seed % 35); // Results in 15-49 verses
  };

  // Generate dummy verse text
  // TODO: Replace with actual verse text data
  const getDummyVerseText = (verseNumber: number): string => {
    const verseTexts = [
      'In the beginning God created the heaven and the earth.',
      'And the earth was without form, and void; and darkness was upon the face of the deep.',
      'And the Spirit of God moved upon the face of the waters.',
      'And God said, Let there be light: and there was light.',
      'And God saw the light, that it was good: and God divided the light from the darkness.',
      'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.',
      'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.',
      'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.',
      'And God called the firmament Heaven. And the evening and the morning were the second day.',
      'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.',
      'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.',
      'And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.',
      'And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.',
      'And the evening and the morning were the third day.',
      'And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years.',
    ];

    // Use verse number as index, cycling through the array with safe access
    const index = (verseNumber - 1) % verseTexts.length;
    return verseTexts[index] || 'Default verse text';
  };

  const renderVerseItem = (verseNumber: number) => (
    <VerseItem
      key={verseNumber}
      verseNumber={verseNumber}
      verseText={getDummyVerseText(verseNumber)}
      onPlay={() => handleVersePress(verseNumber)}
      onAddToQueue={() => handleAddToQueue(verseNumber)}
      testID={`verse-tile-${verseNumber}`}
    />
  );

  const verses = Array.from(
    { length: getDummyVerseCount(selectedChapter) },
    (_, i) => i + 1
  );

  return (
    <Card
      position='absolute'
      top={insets.top + 10}
      left={10}
      right={10}
      bottom={110} // Leave space for media player + 10px margin
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
            onPress={closeVerseView}
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
          {selectedBook.imagePath &&
          getBookImageSource(selectedBook.imagePath) ? (
            <Image
              source={getBookImageSource(selectedBook.imagePath) as any}
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
                {selectedBook.name} - Chapter {selectedChapter}
              </Text>
            </Stack>

            <Stack flexDirection='row' alignItems='center' gap='$2'>
              {/* Add Chapter to Queue Button */}
              <TouchableOpacity
                onPress={handleAddChapterToQueue}
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

              {/* Play Chapter Button */}
              <TouchableOpacity
                onPress={handlePlayChapter}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                testID='play-chapter-button'>
                <PlayIcon size={20} color={colors.background} />
              </TouchableOpacity>
            </Stack>
          </Stack>

          <Text
            fontSize='$3'
            color={colors.secondary}
            marginTop='$1'
            textAlign='center'>
            {verses.length} verses • {getDummyPlaybackTime(verses.length)}
          </Text>
        </Stack>

        {/* Verses section */}
        <Stack flex={1}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Stack paddingBottom='$4'>{verses.map(renderVerseItem)}</Stack>
          </ScrollView>
        </Stack>
      </Stack>
    </Card>
  );
};
