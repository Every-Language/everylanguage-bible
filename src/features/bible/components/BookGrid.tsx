import React from 'react';
import { View, FlatList, StyleSheet, RefreshControlProps } from 'react-native';
import { useTheme } from '@/shared/hooks';
import { BookCard } from './BookCard';
import type { Book } from '../types';

interface BookGridProps {
  books: Book[];
  selectedBook: Book | null;
  onBookSelect: (book: Book) => void;
  loading?: boolean;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  selectedBook,
  onBookSelect,
  loading: _loading = false,
  refreshControl,
}) => {
  const { theme } = useTheme();

  const renderBook = ({ item }: { item: Book }) => (
    <View style={styles.bookWrapper}>
      <BookCard
        book={item}
        onPress={onBookSelect}
        selected={selectedBook?.id === item.id}
      />
    </View>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={books}
        renderItem={renderBook}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for audio player
  },
  row: {
    justifyContent: 'space-between',
  },
  bookWrapper: {
    width: '48%',
    marginBottom: 16,
  },
});
