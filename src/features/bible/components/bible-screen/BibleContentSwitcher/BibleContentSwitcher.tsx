import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { type Book } from '@/shared/utils';
import { TestamentView } from '../TestamentView';
import { createBibleContentSwitcherStyles } from './BibleContentSwitcher.styles';

export interface BibleContentSwitcherProps {
  oldTestamentBooks: Book[];
  newTestamentBooks: Book[];
  onBookPress: (book: Book) => void;
  onGoToNewTestament: () => void;
  slideAnimation: Animated.SharedValue<number>;
}

export const BibleContentSwitcher: React.FC<BibleContentSwitcherProps> = ({
  oldTestamentBooks,
  newTestamentBooks,
  onBookPress,
  onGoToNewTestament,
  slideAnimation,
}) => {
  const styles = createBibleContentSwitcherStyles();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${slideAnimation.value * -50}%` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <View style={styles.viewContainer}>
          <TestamentView
            books={oldTestamentBooks}
            title='Old Testament'
            onBookPress={onBookPress}
            isOldTestament={true}
            newTestamentBooks={newTestamentBooks}
            onGoToNewTestament={onGoToNewTestament}
          />
        </View>
        <View style={styles.viewContainer}>
          <TestamentView
            books={newTestamentBooks}
            title='New Testament'
            onBookPress={onBookPress}
          />
        </View>
      </Animated.View>
    </View>
  );
};
