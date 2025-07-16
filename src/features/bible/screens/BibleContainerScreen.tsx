import React from 'react';
import {
  BibleNavigationProvider,
  useBibleNavigation,
} from '../context/BibleNavigationContext';
import { BibleBooksScreen } from './BibleBooksScreen';
import { ChapterScreen } from './ChapterScreen';

const BibleNavigationContent: React.FC = () => {
  const { navigationState, navigateToBooks } = useBibleNavigation();

  if (
    navigationState.currentScreen === 'chapters' &&
    navigationState.selectedBook
  ) {
    return (
      <ChapterScreen
        book={navigationState.selectedBook}
        onBack={navigateToBooks}
        onPlayChapter={chapter => {
          // TODO: Implement play chapter functionality
          console.log('Play chapter:', chapter);
        }}
        onQueueChapter={chapter => {
          // TODO: Implement queue chapter functionality
          console.log('Queue chapter:', chapter);
        }}
        onPlayVerse={verse => {
          // TODO: Implement play verse functionality
          console.log('Play verse:', verse);
        }}
        onQueueVerse={verse => {
          // TODO: Implement queue verse functionality
          console.log('Queue verse:', verse);
        }}
        onShareChapter={chapter => {
          // TODO: Implement share chapter functionality
          console.log('Share chapter:', chapter);
        }}
        onShareVerse={verse => {
          // TODO: Implement share verse functionality
          console.log('Share verse:', verse);
        }}
      />
    );
  }

  return <BibleBooksScreen />;
};

export const BibleContainerScreen: React.FC = () => {
  return (
    <BibleNavigationProvider>
      <BibleNavigationContent />
    </BibleNavigationProvider>
  );
};
