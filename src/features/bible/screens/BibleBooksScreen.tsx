import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import { BookGrid } from '../components/BookGrid';
import { useBibleBooks } from '../hooks/useBibleBooks';
import { useBibleNavigation } from '../context/BibleNavigationContext';
import type { Book } from '../types';

export const BibleBooksScreen: React.FC = () => {
  const { theme } = useTheme();
  const t = useTranslations();
  const { books, loading, selectedBook, selectBook } = useBibleBooks();
  const { navigateToChapters } = useBibleNavigation();

  const handleBookSelect = (book: Book) => {
    selectBook(book);
    // Navigate to chapters screen for the selected book
    navigateToChapters(book);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}>
        <View
          style={[
            styles.centered,
            { backgroundColor: theme.colors.background },
          ]}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            {t('loading')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <BookGrid
        books={books}
        selectedBook={selectedBook}
        onBookSelect={handleBookSelect}
        loading={loading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
