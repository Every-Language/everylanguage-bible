import React from 'react';
import { View, Text } from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import { useTheme } from '@/shared/store';
import { usePlayerOverlayHeight } from '@/shared/hooks';
import { type Book } from '@/shared/utils';
import { testamentLayoutService } from '@/features/bible/services/domain/testamentLayoutService';
import { GoToTestamentTile } from '../GoToTestamentTile';
import { BookTile } from '../BookTile';
import { createTestamentViewStyles } from './TestamentView.styles';

export interface TestamentViewProps {
  books: Book[];
  title: string;
  onBookPress: (book: Book) => void;
  isOldTestament?: boolean;
  newTestamentBooks?: Book[];
  onGoToNewTestament?: () => void;
}

export const TestamentView: React.FC<TestamentViewProps> = ({
  books,
  title,
  onBookPress,
  isOldTestament = false,
  newTestamentBooks = [],
  onGoToNewTestament,
}) => {
  const { colors } = useTheme();
  const { collapsedHeight } = usePlayerOverlayHeight();

  const { tileWidth } = testamentLayoutService.calculateTileLayout();
  const styles = createTestamentViewStyles(colors, collapsedHeight, tileWidth);

  const bookRows = testamentLayoutService.createBookRows(books, isOldTestament);

  return (
    <GestureScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps='handled'
      bounces={true}>
      <Text style={styles.title}>{title}</Text>

      {bookRows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[
            styles.tilesContainer,
            row.length === 1 && styles.tilesContainerCentered,
          ]}>
          {row.map((book, _bookIndex) => (
            <View key={book.id} style={styles.tileWrapper}>
              {(book as any).isSpecialTile ? (
                <GoToTestamentTile
                  targetTestament='new'
                  previewBooks={newTestamentBooks}
                  onPress={onGoToNewTestament || (() => {})}
                  testID='go-to-new-testament-tile'
                />
              ) : (
                <BookTile
                  book={book}
                  onPress={() => onBookPress(book)}
                  testID={`book-tile-${book.id}`}
                />
              )}
            </View>
          ))}
          {/* Add empty space if row is incomplete and there are 2+ items */}
          {row.length <
            testamentLayoutService.calculateTileLayout().tilesPerRow &&
            row.length > 1 && <View style={styles.tileWrapper} />}
        </View>
      ))}
    </GestureScrollView>
  );
};
