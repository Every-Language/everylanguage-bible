import React from 'react';
import { View, ScrollView } from 'react-native';
import { Stack } from '@tamagui/core';
import { type Book } from '@/shared/utils';
import { chapterDataService } from '@/features/bible/services/domain/chapterDataService';
import { VerseItem } from '../VerseItem';
import { createVerseListViewStyles } from './VerseListView.styles';

export interface VerseListViewProps {
  book: Book;
  chapter: number;
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
  onSwipeToChapters: () => void;
}

export const VerseListView: React.FC<VerseListViewProps> = ({
  book,
  chapter,
  onVerseSelect,
  onSwipeToChapters: _onSwipeToChapters,
}) => {
  const styles = createVerseListViewStyles();

  const handleVersePress = (verseNumber: number) => {
    onVerseSelect(book, chapter, verseNumber);
  };

  const handleAddToQueue = (verseNumber: number) => {
    // Add verse to queue functionality would go here
    // This would need to be implemented with proper verse data
    void verseNumber;
  };

  const verses = Array.from(
    { length: chapterDataService.getDummyVerseCount(chapter) },
    (_, i) => i + 1
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <Stack style={styles.stackContainer}>
          {verses.map(verseNumber => (
            <VerseItem
              key={verseNumber}
              verseNumber={verseNumber}
              verseText={chapterDataService.getDummyVerseText(verseNumber)}
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
