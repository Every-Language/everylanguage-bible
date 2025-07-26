import React from 'react';
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
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import { useSync } from '@/shared/context/SyncContext';
import { BookGrid } from '../components/BookGrid';
import { useBibleBooks } from '../hooks/useBibleBooks';
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
  const { books, loading, error, selectedBook, selectBook, refreshBooks } =
    useBibleBooks();

  const handleBookSelect = (book: Book) => {
    selectBook(book);
    // Navigate to chapters screen using React Navigation
    navigation.navigate('BibleChapters', { book });
  };

  const handleRefresh = async () => {
    try {
      await refreshBooks();
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

  if (loading && !isSyncing) {
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

  if (error && books.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.centered}
        refreshControl={
          <RefreshControl
            refreshing={loading || isSyncing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text}
          />
        }>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
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
                { color: theme.colors.background },
              ]}>
              Refresh
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
                { color: theme.colors.background },
              ]}>
              {isSyncing ? 'Syncing...' : 'Sync Data'}
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
        books={books}
        selectedBook={selectedBook}
        onBookSelect={handleBookSelect}
        loading={loading || isSyncing}
        refreshControl={
          <RefreshControl
            refreshing={loading || isSyncing}
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
