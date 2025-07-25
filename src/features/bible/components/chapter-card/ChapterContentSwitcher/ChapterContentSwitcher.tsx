import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { type Book } from '@/shared/utils';
import { ChapterListView } from '../ChapterListView';
import { VerseListView } from '../VerseListView';
import { createChapterContentSwitcherStyles } from './ChapterContentSwitcher.styles';

export interface ChapterContentSwitcherProps {
  viewMode: 'chapters' | 'verses';
  book: Book;
  chapter: number | null;
  onChapterSelect: (book: Book, chapter: number) => void;
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
  onSwipeToVerse: (book: Book, chapter: number) => void;
  onSwipeToChapters: () => void;
  slideAnimation: Animated.SharedValue<number>;
}

export const ChapterContentSwitcher: React.FC<ChapterContentSwitcherProps> = ({
  viewMode: _viewMode,
  book,
  chapter,
  onChapterSelect,
  onVerseSelect,
  onSwipeToVerse,
  onSwipeToChapters,
  slideAnimation,
}) => {
  const styles = createChapterContentSwitcherStyles();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${slideAnimation.value * -50}%` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <View style={styles.viewContainer}>
          <ChapterListView
            book={book}
            onChapterSelect={onChapterSelect}
            onSwipeToVerse={onSwipeToVerse}
          />
        </View>
        <View style={styles.viewContainer}>
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
