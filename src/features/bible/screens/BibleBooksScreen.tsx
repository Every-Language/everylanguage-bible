import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@/shared/hooks';
import { useSync } from '@/shared/hooks';
import { BookCard } from '../components/BookCard';
import { usePowerSyncBooksWithMetadata } from '../hooks/usePowerSyncBible';
import type { BookWithMetadata } from '../services/powerSyncBibleService';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';
import { logger } from '@/shared/utils/logger';

type BibleBooksScreenNavigationProp = NativeStackNavigationProp<
  BibleStackParamList,
  'BibleBooks'
>;

export const BibleBooksScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<BibleBooksScreenNavigationProp>();
  const { isSyncing } = useSync();

  // PowerSync TanStack Query hooks
  const {
    data: books = [],
    isLoading: booksLoading,
    error: booksError,
    refetch: refetchBooks,
    isRefetching,
  } = usePowerSyncBooksWithMetadata();

  const handleBookSelect = (book: BookWithMetadata) => {
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

  const renderBookItem = ({ item }: { item: BookWithMetadata }) => (
    <BookCard
      book={item}
      onPress={() => handleBookSelect(item)}
      showMetadata={true}
    />
  );

  if (booksError) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Error loading books:{' '}
            {booksError instanceof Error ? booksError.message : 'Unknown error'}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={handleRefresh}>
            <Text style={[styles.retryText, { color: '#ffffff' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={books}
        renderItem={renderBookItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || isSyncing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {booksLoading ? 'Loading books...' : 'No books available'}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
