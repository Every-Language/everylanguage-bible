import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import { BookGrid } from '../components/BookGrid';
import { useBibleBooks } from '../hooks/useBibleBooks';
import type { Book } from '../types';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';

type BibleBooksScreenNavigationProp = NativeStackNavigationProp<
  BibleStackParamList,
  'BibleBooks'
>;

export const BibleBooksScreen: React.FC = () => {
  const { theme } = useTheme();
  const t = useTranslations();
  const navigation = useNavigation<BibleBooksScreenNavigationProp>();
  const { books, loading, selectedBook, selectBook } = useBibleBooks();

  const handleBookSelect = (book: Book) => {
    selectBook(book);
    // Navigate to chapters screen using React Navigation
    navigation.navigate('BibleChapters', { book });
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
