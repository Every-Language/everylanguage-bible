import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { BookCard, ChapterGrid } from '@/shared/components/ui';
import { ChapterViewScreen } from './ChapterViewScreen';
import { loadBibleBooks, type Book } from '@/shared/utils';
import { Fonts, Dimensions } from '@/shared/constants';
import { useAudioStore, useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';

interface BibleBooksScreenProps {
  onChapterSelect: (book: Book, chapter: number) => void;
}

const BOOKS_PER_ROW = Dimensions.layout.booksPerRow;

export const BibleBooksScreen: React.FC<BibleBooksScreenProps> = ({
  onChapterSelect,
}) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { currentBook, currentChapter } = useAudioStore();
  const { t } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'books' | 'chapter'>(
    'books'
  );
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const lastExpandedBookRef = useRef<string | null>(null);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        const bibleBooks = loadBibleBooks();
        setBooks(bibleBooks);
      } catch {
        // Error loading books - continue with default state
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  const handleBookPress = (book: Book) => {
    // If this book's chapter grid is currently open, close it
    if (expandedBookId === book.id) {
      lastExpandedBookRef.current = book.id;
      setExpandedBookId(null);
    } else {
      // Otherwise, navigate to chapter view
      setSelectedBook(book);
      setCurrentScreen('chapter');
    }
  };

  const handleBookLongPress = (book: Book) => {
    // Long press: Show/hide chapter grid
    if (expandedBookId === book.id) {
      // If same book is long-pressed, close the expansion
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
      // Keep the chapter grid open so user can see highlighting and select other chapters
    }
  };

  const handleBackToBooks = () => {
    setCurrentScreen('books');
    setSelectedBook(null);
  };

  // Determine which chapter should be highlighted for a given book
  const getSelectedChapterForBook = (book: Book) => {
    // If this book matches the currently playing book, highlight the current chapter
    if (currentBook && currentBook.id === book.id && currentChapter) {
      return currentChapter;
    }

    return null;
  };

  // Group books into rows
  const createBookRows = (booksList: Book[]) => {
    const rows: Book[][] = [];
    for (let i = 0; i < booksList.length; i += BOOKS_PER_ROW) {
      rows.push(booksList.slice(i, i + BOOKS_PER_ROW));
    }
    return rows;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: Dimensions.spacing.xl,
      paddingBottom: Dimensions.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Dimensions.spacing.xs,
    },
    title: {
      fontSize: Fonts.size['3xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    themeToggle: {
      backgroundColor: colors.primary,
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.sm,
      borderRadius: Dimensions.radius.lg,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
    },
    themeToggleText: {
      fontSize: Fonts.size.sm,
      color: colors.background,
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
      color: colors.primary, // Use theme primary for testament titles
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: Dimensions.spacing.md,
      fontSize: Fonts.size.base,
      color: colors.secondary, // Use theme secondary for loading text
    },
  });

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
              <View style={styles.bookTouchable}>
                <BookCard
                  title={book.name}
                  imagePath={book.imagePath}
                  onPress={() => handleBookPress(book)}
                  onLongPress={() => handleBookLongPress(book)}
                  testID={`book-card-${book.id}`}
                  isSelected={expandedBookId === book.id}
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
            selectedChapter={getSelectedChapterForBook(bookToShow)}
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

  // Show chapter view screen
  if (currentScreen === 'chapter' && selectedBook) {
    return <ChapterViewScreen book={selectedBook} onBack={handleBackToBooks} />;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size='large' color={colors.primary} />
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
        <View style={styles.headerRow}>
          <Text style={styles.title}>Bible</Text>
          <TouchableOpacity
            style={styles.themeToggle}
            onPress={toggleTheme}
            accessibilityLabel={
              isDark ? t('theme.switchToLight') : t('theme.switchToDark')
            }
            accessibilityRole='button'
            testID='theme-toggle-button'>
            <Text style={styles.themeToggleText}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
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
