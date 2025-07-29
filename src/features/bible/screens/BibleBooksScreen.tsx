import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks';
import { useSync } from '@/shared/hooks';
import { BookGrid } from '../components/BookGrid';
import { useBooksQuery } from '../hooks/useBibleQueries';
import type { Book } from '../types';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';
import { logger } from '@/shared/utils/logger';

type BibleBooksScreenNavigationProp = NativeStackNavigationProp<
  BibleStackParamList,
  'BibleBooks'
>;

export const BibleBooksScreen: React.FC = () => {
  const { theme } = useTheme();
  const t = useTranslations();
  const navigation = useNavigation<BibleBooksScreenNavigationProp>();
  const { syncNow, isSyncing } = useSync();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery] = useState('');
  const [sortBy] = useState<'name' | 'book_number' | 'global_order'>(
    'global_order'
  );
  const [sortOrder] = useState<'asc' | 'desc'>('asc');

  // TanStack Query hooks
  const {
    data: books = [],
    isLoading: booksLoading,
    error: booksError,
    refetch: refetchBooks,
    isRefetching,
  } = useBooksQuery();

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let filtered = [...books];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'book_number':
          aValue = a.book_number;
          bValue = b.book_number;
          break;
        case 'global_order':
        default:
          aValue = a.global_order || 0;
          bValue = b.global_order || 0;
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [books, searchQuery, sortBy, sortOrder]);

  const handleBookSelect = (book: Book) => {
    setSelectedBook(book);
    // Navigate to chapters screen using React Navigation
    navigation.navigate('BibleChapters', { book });
  };

  const handleRefresh = async () => {
    try {
      await refetchBooks();
    } catch (error) {
      logger.error('Failed to refresh books:', error);
    }
  };

  const handleSyncData = async () => {
    try {
      await syncNow();
    } catch (error) {
      logger.error('Failed to sync data:', error);
    }
  };

  if (booksLoading && !isRefetching) {
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

  // Show sync button if no data after 3 retry attempts or if there's an error
  const shouldShowSyncButton =
    (booksError && filteredAndSortedBooks.length === 0) ||
    (!booksLoading && !isRefetching && filteredAndSortedBooks.length === 0);

  if (shouldShowSyncButton) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl
            refreshing={booksLoading || isSyncing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text}
          />
        }>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {booksError instanceof Error
              ? booksError.message
              : 'No Bible data available'}
          </Text>
          <Text
            style={[
              styles.syncDescription,
              { color: theme.colors.textSecondary },
            ]}>
            Download Bible content to start reading
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleRefresh}>
            <Text
              style={[
                styles.retryButtonText,
                { color: theme.colors.textInverse },
              ]}>
              Retry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.syncButton,
              { backgroundColor: theme.colors.secondary },
            ]}
            onPress={handleSyncData}
            disabled={isSyncing}>
            <Text
              style={[
                styles.syncButtonText,
                { color: theme.colors.textInverse },
              ]}>
              {isSyncing ? 'Syncing...' : 'Download Bible Data'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <BookGrid
        books={filteredAndSortedBooks}
        selectedBook={selectedBook}
        onBookSelect={handleBookSelect}
        loading={booksLoading || isSyncing}
        refreshControl={
          <RefreshControl
            refreshing={booksLoading || isSyncing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text}
          />
        }
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
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  syncDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  syncButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
