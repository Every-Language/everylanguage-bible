import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { BookGrid } from '../components/BookGrid';
import { useBibleBooks } from '../hooks/useBibleBooks';
import type { Book } from '../types';

export const BibleBooksScreen: React.FC = () => {
  const { theme } = useTheme();
  const t = useTranslations();
  const { books, loading, selectedBook, selectBook } = useBibleBooks();
  const { actions } = useMediaPlayer();

  const handleLoadDemoTrack = () => {
    // Load a sample track for demonstration
    const demoTrack = {
      id: 'demo-john-1',
      title: 'John Chapter 1',
      subtitle: 'ENGLISH - BSB',
      duration: 180, // 3 minutes
      currentTime: 0,
      url: 'demo-url',
      book: 'John',
      chapter: '1',
      verse: '1',
    };

    actions.setCurrentTrack(demoTrack);
  };

  const handleBookSelect = (book: Book) => {
    selectBook(book);
    // You can add more logic here, like navigating to chapters
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
      <View
        style={[styles.header, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('bible.books')}
        </Text>

        {/* Demo Button */}
        <TouchableOpacity
          style={[styles.demoButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleLoadDemoTrack}>
          <Text
            style={[styles.demoButtonText, { color: theme.colors.background }]}>
            Play Demo Track
          </Text>
        </TouchableOpacity>
      </View>

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
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  demoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
