import React from 'react';
import { View, ScrollView } from 'react-native';
import { Stack } from '@tamagui/core';
import { type Book } from '@/shared/utils';
import { useQueueStore, useAudioStore } from '@/shared/store';
import { chapterDataService } from '@/features/bible/services/domain/chapterDataService';
import { ChapterItem } from '../ChapterItem';
import { createChapterListViewStyles } from './ChapterListView.styles';

export interface ChapterListViewProps {
  book: Book;
  onChapterSelect: (book: Book, chapter: number) => void;
  onSwipeToVerse: (book: Book, chapter: number) => void;
}

export const ChapterListView: React.FC<ChapterListViewProps> = ({
  book,
  onChapterSelect: _onChapterSelect,
  onSwipeToVerse,
}) => {
  const styles = createChapterListViewStyles();

  const handleChapterPress = async (chapterNumber: number) => {
    const queueStore = useQueueStore.getState();
    const playMode = queueStore.getPlayMode();

    const chapter = chapterDataService.createChapterData(book, chapterNumber);

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
    const chapter = chapterDataService.createChapterData(book, chapterNumber);
    const queueStore = useQueueStore.getState();
    queueStore.addToUserQueueBack({
      type: 'chapter',
      data: chapter,
    });
  };

  const handleSwipeToVerse = (chapterNumber: number) => {
    onSwipeToVerse(book, chapterNumber);
  };

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <Stack style={styles.stackContainer}>
          {chapters.map(chapterNumber => (
            <ChapterItem
              key={chapterNumber}
              chapterNumber={chapterNumber}
              verseCount={chapterDataService.getDummyVerseCount(chapterNumber)}
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
