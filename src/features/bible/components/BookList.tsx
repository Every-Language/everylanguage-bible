import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/hooks';
import { BookCard } from './BookCard';
import type { Book } from '../types';

interface BookListProps {
  books: Book[];
  selectedBook: Book | null;
  onBookSelect: (book: Book) => void;
  loading?: boolean;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  selectedBook,
  onBookSelect,
  loading = false,
}) => {
  const { theme } = useTheme();

  if (loading) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text
          style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
          Loading books...
        </Text>
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View
        style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No books found
        </Text>
      </View>
    );
  }

  const renderBook = ({ item }: { item: Book }) => (
    <BookCard
      book={item}
      onPress={onBookSelect}
      selected={selectedBook?.id === item.id}
    />
  );

  return (
    <FlatList
      data={books}
      renderItem={renderBook}
      keyExtractor={item => item.id}
      style={[styles.list, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
