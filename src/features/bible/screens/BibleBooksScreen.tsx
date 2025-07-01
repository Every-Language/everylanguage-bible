import React, { useState, useEffect, useRef } from 'react';
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
import { Colors, Fonts, Dimensions } from '@/shared/constants';

interface BibleBooksScreenProps {
  onChapterSelect: (book: Book, chapter: number) => void;
}

const BOOKS_PER_ROW = Dimensions.layout.booksPerRow;

export const BibleBooksScreen: React.FC<BibleBooksScreenProps> = ({
  onChapterSelect,
}) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const lastExpandedBookRef = useRef<string | null>(null);

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
      lastExpandedBookRef.current = book.id; // Keep track for animation
      setExpandedBookId(null);
    } else {
      // Open the expansion for this book
      lastExpandedBookRef.current = null; // Clear previous tracking
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
    // Check if any book in this row was previously expanded (for animation)
    const shouldShowChapterGrid =
      expandedBookInRow ||
      row.some(book => lastExpandedBookRef.current === book.id);
    const bookToShow =
      expandedBookInRow ||
      (lastExpandedBookRef.current
        ? row.find(book => book.id === lastExpandedBookRef.current)
        : null);

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

        {/* Chapter Grid (render if currently expanded or was recently expanded for animation) */}
        {shouldShowChapterGrid && bookToShow && (
          <ChapterGrid
            chapterCount={bookToShow.chapters}
            onChapterPress={handleChapterPress}
            isVisible={!!expandedBookInRow}
            testID={`chapter-grid-${bookToShow.id}`}
            onAnimationComplete={() => {
              if (!expandedBookInRow) {
                lastExpandedBookRef.current = null;
              }
            }}
          />
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={Colors.feedback.loading} />
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
    backgroundColor: Colors.background.secondary,
  },
  header: {
    padding: Dimensions.spacing.xl,
    paddingBottom: Dimensions.spacing.md,
  },
  title: {
    fontSize: Fonts.size['3xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.text.primary,
    marginBottom: Dimensions.spacing.xs,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Extra space for mini-player
  },
  testamentSection: {
    marginBottom: Dimensions.spacing['2xl'],
  },
  testamentTitle: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.testament.oldTestament,
    marginBottom: Dimensions.spacing.lg,
    marginTop: Dimensions.spacing.sm,
    textAlign: 'center',
  },
  booksContainer: {
    paddingHorizontal: Dimensions.spacing.md,
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 0,
  },
  bookContainer: {
    flex: 1,
    maxWidth: '33.33%',
  },
  bookTouchable: {
    borderRadius: Dimensions.radius.xl,
    overflow: 'hidden',
  },
  selectedBook: {
    opacity: 0.7,
    backgroundColor: Colors.interactive.pressed,
    borderRadius: Dimensions.radius.xl,
    borderWidth: 2,
    borderColor: Colors.interactive.active,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
  },
  loadingText: {
    marginTop: Dimensions.spacing.md,
    fontSize: Fonts.size.base,
    color: Colors.text.secondary,
  },
});
