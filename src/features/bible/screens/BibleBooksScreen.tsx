import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { BookCard, ChapterGrid } from '@/shared/components/ui';
import { loadBibleBooks, type Book } from '@/shared/utils';

interface BibleBooksScreenProps {
  onChapterSelect: (book: Book, chapter: number) => void;
}

const BOOKS_PER_ROW = 3;

export const BibleBooksScreen: React.FC<BibleBooksScreenProps> = ({
  onChapterSelect,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        const bibleBooks = loadBibleBooks();
        setBooks(bibleBooks);
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  const handleBookPress = (book: Book) => {
    if (expandedBookId === book.id) {
      // If same book is pressed, close the expansion
      setExpandedBookId(null);
    } else {
      // Open the expansion for this book
      setExpandedBookId(book.id);
    }
  };

  const handleChapterPress = (chapterNumber: number) => {
    const expandedBook = books.find(book => book.id === expandedBookId);
    if (expandedBook) {
      onChapterSelect(expandedBook, chapterNumber);
    }
  };

  // Group books into rows
  const createBookRows = (booksList: Book[]) => {
    const rows: Book[][] = [];
    for (let i = 0; i < booksList.length; i += BOOKS_PER_ROW) {
      rows.push(booksList.slice(i, i + BOOKS_PER_ROW));
    }
    return rows;
  };

  const renderBookRow = (
    row: Book[],
    rowIndex: number,
    sectionTitle: string
  ) => {
    // Check if any book in this row is expanded
    const expandedBookInRow = row.find(book => book.id === expandedBookId);

    return (
      <View key={`${sectionTitle}-row-${rowIndex}`}>
        {/* Book Row */}
        <View style={styles.bookRow}>
          {row.map(book => (
            <View key={book.id} style={styles.bookContainer}>
              <View
                style={[
                  styles.bookTouchable,
                  expandedBookId === book.id && styles.selectedBook,
                ]}>
                <BookCard
                  title={book.name}
                  imagePath={book.imagePath}
                  onPress={() => handleBookPress(book)}
                  testID={`book-card-${book.id}`}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Chapter Grid (if a book in this row is expanded) */}
        {expandedBookInRow && (
          <ChapterGrid
            chapterCount={expandedBookInRow.chapters}
            onChapterPress={handleChapterPress}
            isVisible={true}
            testID={`chapter-grid-${expandedBookInRow.id}`}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color='#007AFF' />
        <Text style={styles.loadingText}>Loading Bible books...</Text>
      </View>
    );
  }

  // Separate books by testament
  const oldTestamentBooks = books.filter(book => book.testament === 'old');
  const newTestamentBooks = books.filter(book => book.testament === 'new');

  const oldTestamentRows = createBookRows(oldTestamentBooks);
  const newTestamentRows = createBookRows(newTestamentBooks);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bible</Text>
        <Text style={styles.subtitle}>Choose a book to start listening</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Old Testament Section */}
        <View style={styles.testamentSection}>
          <Text style={styles.testamentTitle}>Old Testament</Text>
          <View style={styles.booksContainer}>
            {oldTestamentRows.map((row, index) =>
              renderBookRow(row, index, 'old-testament')
            )}
          </View>
        </View>

        {/* New Testament Section */}
        <View style={styles.testamentSection}>
          <Text style={styles.testamentTitle}>New Testament</Text>
          <View style={styles.booksContainer}>
            {newTestamentRows.map((row, index) =>
              renderBookRow(row, index, 'new-testament')
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for mini-player
  },
  testamentSection: {
    marginBottom: 24,
  },
  testamentTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  booksContainer: {
    paddingHorizontal: 12,
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 0, // Remove extra margin, let BookCard margins handle spacing
  },
  bookContainer: {
    flex: 1,
    maxWidth: '33.33%',
  },
  bookTouchable: {
    borderRadius: 12, // Match BookCard border radius
    overflow: 'hidden',
  },
  selectedBook: {
    opacity: 0.7,
    backgroundColor: 'rgba(0, 122, 255, 0.1)', // Better visual feedback
    borderRadius: 12, // Match BookCard border radius for consistent look
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
});
