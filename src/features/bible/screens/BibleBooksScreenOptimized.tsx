import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  TextInput,
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

export const BibleBooksScreenOptimized: React.FC = () => {
  const { theme } = useTheme();
  const t = useTranslations();
  const navigation = useNavigation<BibleBooksScreenNavigationProp>();
  const { syncNow, isSyncing } = useSync();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'book_number' | 'global_order'>(
    'global_order'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    retryButtonText: {
      color: theme.colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    syncButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.secondary,
    },
    syncButtonText: {
      color: theme.colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    searchContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sortContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 8,
      gap: 12,
    },
    sortButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sortButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    sortButtonText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    sortButtonTextActive: {
      color: theme.colors.textInverse,
    },
  });

  // Loading state
  if (booksLoading && !isRefetching) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (booksError && filteredAndSortedBooks.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl
            refreshing={booksLoading || isSyncing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text}
          />
        }>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {booksError instanceof Error
              ? booksError.message
              : 'Failed to load books'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.syncButton} onPress={handleSyncData}>
            <Text style={styles.syncButtonText}>Sync Data</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Empty state
  if (filteredAndSortedBooks.length === 0 && !booksLoading) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl
            refreshing={booksLoading || isSyncing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text}
          />
        }>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {searchQuery
              ? 'No books found matching your search.'
              : 'No books available.'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleSyncData}>
              <Text style={styles.syncButtonText}>Sync Data</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bible Books</Text>
        <Text style={styles.subtitle}>
          {filteredAndSortedBooks.length} of {books.length} books
        </Text>
      </View>

      {/* Search and Sort Controls */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder='Search books...'
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'name' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('name')}>
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'name' && styles.sortButtonTextActive,
            ]}>
            Name
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'book_number' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('book_number')}>
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'book_number' && styles.sortButtonTextActive,
            ]}>
            Number
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'global_order' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('global_order')}>
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'global_order' && styles.sortButtonTextActive,
            ]}>
            Order
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
          <Text style={styles.sortButtonText}>
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Books Grid */}
      <View style={styles.content}>
        <BookGrid
          books={filteredAndSortedBooks}
          onBookSelect={handleBookSelect}
          selectedBook={selectedBook}
          refreshControl={
            <RefreshControl
              refreshing={booksLoading || isSyncing || isRefetching}
              onRefresh={handleRefresh}
              tintColor={theme.colors.text}
            />
          }
        />
      </View>
    </View>
  );
};
