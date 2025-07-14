import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import type { Book } from '../types';

interface BookCardProps {
  book: Book;
  onPress: (book: Book) => void;
  selected?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, onPress, selected = false }) => {
  const { theme } = useTheme();

  const handlePress = () => {
    onPress(book);
  };

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { 
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          borderColor: theme.colors.border,
        }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text 
        style={[
          styles.bookName,
          { color: selected ? theme.colors.textInverse : theme.colors.text }
        ]}
        numberOfLines={3}
      >
        {book.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 