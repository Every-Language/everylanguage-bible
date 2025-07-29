import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useTheme } from '@/shared/hooks';
import {
  useBooksQuery,
  useChaptersQuery,
  useVersesWithTextsQuery,
  useRefreshBibleDataMutation,
} from '../hooks/useBibleQueries';

/**
 * Example component demonstrating TanStack Query usage for Bible data
 *
 * This component shows how to:
 * - Use query hooks for data fetching
 * - Handle loading and error states
 * - Implement pull-to-refresh
 * - Use mutations for data updates
 */
export const TanStackQueryExample: React.FC = () => {
  const { theme } = useTheme();
  const [selectedBookId, setSelectedBookId] = React.useState<string | null>(
    null
  );
  const [selectedChapterId, setSelectedChapterId] = React.useState<
    string | null
  >(null);

  // Query hooks
  const {
    data: books = [],
    isLoading: booksLoading,
    error: booksError,
    refetch: refetchBooks,
  } = useBooksQuery();

  const {
    data: chapters = [],
    isLoading: chaptersLoading,
    error: chaptersError,
    refetch: refetchChapters,
  } = useChaptersQuery(selectedBookId || '');

  const {
    data: versesWithTexts = [],
    isLoading: versesLoading,
    error: versesError,
    refetch: refetchVerses,
  } = useVersesWithTextsQuery(selectedChapterId || '');

  // Mutation hook
  const refreshBibleDataMutation = useRefreshBibleDataMutation();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 20,
    },
    section: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 10,
    },
    item: {
      padding: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 8,
    },
    itemText: {
      fontSize: 14,
      color: theme.colors.text,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.error,
    },
    button: {
      padding: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
    },
    secondaryButton: {
      marginTop: 8,
      backgroundColor: theme.colors.secondary,
    },
    buttonText: {
      color: theme.colors.textInverse,
      fontSize: 14,
      fontWeight: '600',
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    stat: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  });

  const handleRefreshAll = () => {
    refetchBooks();
    if (selectedBookId) {
      refetchChapters();
    }
    if (selectedChapterId) {
      refetchVerses();
    }
  };

  const handleRefreshBibleData = () => {
    refreshBibleDataMutation.mutate();
  };

  const renderBook = ({
    item,
  }: {
    item: {
      id: string;
      name: string;
      testament: string | null;
      book_number: number;
      global_order: number | null;
    };
  }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => setSelectedBookId(item.id)}>
      <Text style={styles.itemText}>{item.name}</Text>
      <Text style={styles.stat}>
        {item.testament} • Book {item.book_number}
      </Text>
    </TouchableOpacity>
  );

  const renderChapter = ({
    item,
  }: {
    item: { id: string; chapter_number: number; total_verses: number };
  }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => setSelectedChapterId(item.id)}>
      <Text style={styles.itemText}>Chapter {item.chapter_number}</Text>
      <Text style={styles.stat}>{item.total_verses} verses</Text>
    </TouchableOpacity>
  );

  const renderVerse = ({
    item,
  }: {
    item: {
      verse: { verse_number: number; id: string };
      verseText: { verse_text: string } | null;
    };
  }) => (
    <View style={styles.item}>
      <Text style={styles.itemText}>Verse {item.verse.verse_number}</Text>
      {item.verseText && (
        <Text style={styles.stat} numberOfLines={2}>
          {item.verseText.verse_text}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TanStack Query Bible Example</Text>
        <Text style={styles.subtitle}>
          Demonstrating optimized data fetching with caching
        </Text>

        <View style={styles.stats}>
          <Text style={styles.stat}>
            Books: {books.length} | Chapters: {chapters.length} | Verses:{' '}
            {versesWithTexts.length}
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRefreshAll}>
          <Text style={styles.buttonText}>Refresh All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleRefreshBibleData}>
          <Text style={styles.buttonText}>
            {refreshBibleDataMutation.isPending
              ? 'Refreshing...'
              : 'Refresh Bible Data'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Books Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Books</Text>
        {booksLoading ? (
          <Text style={styles.loadingText}>Loading books...</Text>
        ) : booksError ? (
          <Text style={styles.errorText}>
            Error loading books: {booksError.message}
          </Text>
        ) : (
          <FlatList
            data={books.slice(0, 5)} // Show first 5 books
            renderItem={renderBook}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Chapters Section */}
      {selectedBookId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chapters</Text>
          {chaptersLoading ? (
            <Text style={styles.loadingText}>Loading chapters...</Text>
          ) : chaptersError ? (
            <Text style={styles.errorText}>
              Error loading chapters: {chaptersError.message}
            </Text>
          ) : (
            <FlatList
              data={chapters.slice(0, 5)} // Show first 5 chapters
              renderItem={renderChapter}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* Verses Section */}
      {selectedChapterId && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verses</Text>
          {versesLoading ? (
            <Text style={styles.loadingText}>Loading verses...</Text>
          ) : versesError ? (
            <Text style={styles.errorText}>
              Error loading verses: {versesError.message}
            </Text>
          ) : (
            <FlatList
              data={versesWithTexts.slice(0, 3)} // Show first 3 verses
              renderItem={renderVerse}
              keyExtractor={item => item.verse.id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}
    </View>
  );
};
