import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions as RNDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookCard, ChapterGrid, OptionsPanel } from '@/shared/components/ui';
import { MoreIcon } from '@/shared/components/ui/icons/AudioIcons';
import { ChapterView, VerseView } from '../components';
import { loadBibleBooks, type Book } from '@/shared/utils';
import { Fonts, Dimensions } from '@/shared/constants';
import {
  useAudioStore,
  useTheme,
  useChapterViewStore,
  useVerseViewStore,
} from '@/shared/store';

interface BibleBooksScreenProps {
  onChapterSelect: (book: Book, chapter: number) => void;
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
}

const BOOKS_PER_ROW = Dimensions.layout.booksPerRow;

export const BibleBooksScreen: React.FC<BibleBooksScreenProps> = ({
  onChapterSelect,
  onVerseSelect,
}) => {
  const { colors, toggleTheme } = useTheme();
  const { currentBook, currentChapter } = useAudioStore();
  const { openChapterView, closeChapterView, isOpen, selectedBook } =
    useChapterViewStore();
  const { openVerseView } = useVerseViewStore();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [optionsButtonPosition, setOptionsButtonPosition] = useState({
    top: 0,
    right: 0,
  });
  const lastExpandedBookRef = useRef<string | null>(null);
  const optionsButtonRef = useRef<View>(null);

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
    // If this book's chapter grid is currently open, close it
    if (expandedBookId === book.id) {
      lastExpandedBookRef.current = book.id;
      setExpandedBookId(null);
    } else if (isOpen && selectedBook?.id === book.id) {
      // If chapter view is open for this book, close it
      closeChapterView();
    } else {
      // Otherwise, open chapter view overlay
      openChapterView(book);
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

  const handleChapterViewChapterSelect = (book: Book, chapter: number) => {
    // Play the chapter when play button is pressed
    onChapterSelect(book, chapter);
  };

  const handleChapterViewVerseViewOpen = (book: Book, chapter: number) => {
    // Open verse view when chapter card is pressed
    openVerseView(book, chapter);
  };

  const handleOptionsPress = () => {
    if (optionsButtonRef.current) {
      optionsButtonRef.current.measure(
        (_x, _y, width, height, pageX, pageY) => {
          const screenWidth = RNDimensions.get('window').width;
          setOptionsButtonPosition({
            top: pageY + height,
            right: screenWidth - pageX - width,
          });
          setShowOptionsPanel(true);
        }
      );
    }
  };

  const handleCloseOptions = () => {
    setShowOptionsPanel(false);
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
      paddingTop: insets.top + Dimensions.spacing.md,
      paddingHorizontal: Dimensions.spacing.xl,
      paddingBottom: Dimensions.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center', // Center the content
      marginBottom: Dimensions.spacing.xs,
      position: 'relative', // For absolute positioning of options button
    },
    title: {
      fontSize: Fonts.size['3xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      textAlign: 'center',
    },
    optionsButton: {
      position: 'absolute',
      right: 0,
      backgroundColor: colors.primary,
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.sm,
      borderRadius: Dimensions.radius.lg,
      minWidth: 44,
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'center',
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
                  bookName={book.name}
                  bookId={book.id}
                  bookImage={book.imagePath}
                  onPress={() => handleBookPress(book)}
                  onLongPress={() => handleBookLongPress(book)}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Bible</Text>
          <TouchableOpacity
            ref={optionsButtonRef}
            style={styles.optionsButton}
            onPress={handleOptionsPress}
            accessibilityLabel='Options menu'
            accessibilityRole='button'
            testID='options-button'>
            <MoreIcon size={18} color={colors.background} />
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

      {/* Chapter View Overlay */}
      <ChapterView
        onChapterSelect={handleChapterViewChapterSelect}
        onVerseViewOpen={handleChapterViewVerseViewOpen}
      />

      {/* Verse View Overlay - positioned in front of ChapterView but behind media player */}
      <VerseView
        onVerseSelect={onVerseSelect}
        onChapterSelect={onChapterSelect}
      />

      {/* Options Panel */}
      <OptionsPanel
        isVisible={showOptionsPanel}
        onClose={handleCloseOptions}
        onThemeToggle={toggleTheme}
        position={optionsButtonPosition}
      />
    </View>
  );
};
