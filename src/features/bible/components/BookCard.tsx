import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/hooks';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  onPress: (book: Book) => void;
  selected?: boolean; // Keep for backward compatibility but don't use
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  selected: _selected = false,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    onPress(book);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          // Remove border and selected state
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}>
      <Text
        style={[styles.bookName, { color: theme.colors.text }]}
        numberOfLines={3}>
        {book.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    borderRadius: 16,
    // Remove borderWidth and borderColor
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
});
