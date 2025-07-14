import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions as RNDimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PanGestureHandler,
  ScrollView as GestureScrollView,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  OptionsMenu,
  ToggleButtons,
  SlideUpPanel,
  ProfileMenu,
  LanguageMenu,
  SettingsMenu,
  HelpMenu,
} from '@/shared/components/ui';
import { MoreIcon } from '@/shared/components/ui/icons/AudioIcons';
import searchIcon from '../../../../assets/images/utility_icons/search.png';
import { ChapterCard } from '../components';
import { loadBibleBooks, type Book } from '@/shared/utils';
import { Fonts, Dimensions } from '@/shared/constants';
import {
  useTheme,
  useChapterCardStore,
  useHelpPanelStore,
} from '@/shared/store';
import {
  useMiniPlayerHeight,
  useHorizontalSlideAnimation,
} from '@/shared/hooks';
import { getBookImageSource } from '@/shared/services';

interface BibleBooksScreenProps {
  onChapterSelect: (book: Book, chapter: number) => void;
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
}

type TestamentMode = 'old' | 'new';
type SubMenuType = 'profile' | 'language' | 'settings' | 'help' | null;

// Go to Testament Tile Component
interface GoToTestamentTileProps {
  targetTestament: 'old' | 'new';
  previewBooks: Book[];
  onPress: () => void;
  testID?: string;
}

const GoToTestamentTile: React.FC<GoToTestamentTileProps> = ({
  targetTestament,
  previewBooks,
  onPress,
  testID,
}) => {
  const { colors, isDark } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor:
        targetTestament === 'new'
          ? isDark
            ? '#AC8F57'
            : '#ECE6DA'
          : colors.chapterTileBackground || colors.background,
      borderRadius: 24,
      padding: Dimensions.spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-between',
      aspectRatio: 1, // Square tiles
    },
    miniIconsContainer: {
      flex: 1,
      width: '100%',
      justifyContent: 'space-between',
      padding: Dimensions.spacing.sm,
    },
    miniIconsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flex: 1,
      gap: Dimensions.spacing.xs,
    },
    miniBookImage: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: 4,
      tintColor: colors.text,
    },
    miniFallbackIcon: {
      width: '45%',
      aspectRatio: 1,
      borderRadius: 4,
      backgroundColor: colors.secondary + '50',
      justifyContent: 'center',
      alignItems: 'center',
    },
    miniFallbackEmoji: {
      fontSize: 16,
      color: colors.text,
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.semibold,
      textAlign: 'center',
      color: colors.text,
      lineHeight: 22,
      alignSelf: 'stretch',
    },
  });

  const renderMiniBookImage = (book: Book) => {
    const imageSource = getBookImageSource(book.imagePath);

    if (imageSource) {
      return (
        <Animated.Image
          key={book.id}
          source={imageSource}
          style={styles.miniBookImage}
          resizeMode='contain'
        />
      );
    }

    return (
      <View key={book.id} style={styles.miniFallbackIcon}>
        <Text style={styles.miniFallbackEmoji}>📖</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`Go to ${targetTestament === 'old' ? 'Old' : 'New'} Testament`}
      testID={testID}>
      <View style={styles.miniIconsContainer}>
        <View style={styles.miniIconsRow}>
          {previewBooks.slice(0, 2).map(book => renderMiniBookImage(book))}
        </View>
        <View style={styles.miniIconsRow}>
          {previewBooks.slice(2, 4).map(book => renderMiniBookImage(book))}
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        Go to {targetTestament === 'old' ? 'Old' : 'New'} Testament
      </Text>
    </TouchableOpacity>
  );
};

// Square Book Tile Component
interface BookTileProps {
  book: Book;
  onPress: () => void;
  testID?: string;
}

const BookTile: React.FC<BookTileProps> = ({ book, onPress, testID }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.chapterTileBackground || colors.background,
      borderRadius: 24,
      padding: Dimensions.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: 1, // Square tiles
    },
    imageContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Dimensions.spacing.xs,
    },
    bookImage: {
      //width: 64,
      //height: 64,
      flex: 1,
      maxWidth: '100%',
      borderRadius: Dimensions.radius.sm,
      tintColor: colors.text,
    },
    fallbackIcon: {
      width: 64,
      height: 64,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: colors.secondary + '30',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackEmoji: {
      fontSize: 28,
      color: colors.text,
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.semibold,
      textAlign: 'center',
      color: colors.text,
      lineHeight: 22,
    },
  });

  const renderBookImage = () => {
    const imageSource = getBookImageSource(book.imagePath);

    if (imageSource) {
      return (
        <Animated.Image
          source={imageSource}
          style={styles.bookImage}
          resizeMode='contain'
        />
      );
    }

    return (
      <View style={styles.fallbackIcon}>
        <Text style={styles.fallbackEmoji}>📖</Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole='button'
      accessibilityLabel={`${book.name} book`}
      testID={testID}>
      <View style={styles.imageContainer}>{renderBookImage()}</View>
      <Text style={styles.title} numberOfLines={2}>
        {book.name}
      </Text>
    </TouchableOpacity>
  );
};

// Testament View Component
interface TestamentViewProps {
  books: Book[];
  title: string;
  onBookPress: (book: Book) => void;
  isOldTestament?: boolean;
  newTestamentBooks?: Book[];
  onGoToNewTestament?: () => void;
}

const TestamentView: React.FC<TestamentViewProps> = ({
  books,
  title,
  onBookPress,
  isOldTestament = false,
  newTestamentBooks = [],
  onGoToNewTestament,
}) => {
  const { colors } = useTheme();
  const { collapsedHeight } = useMiniPlayerHeight();

  // Calculate screen width for equal spacing
  const screenWidth = RNDimensions.get('window').width;
  const TILES_PER_ROW = 2;

  // Calculate equal spacing: left edge, between tiles, right edge
  const totalHorizontalPadding = Dimensions.spacing.lg * 2; // Left and right padding
  const availableWidth = screenWidth - totalHorizontalPadding;
  const spaceBetweenTiles = Dimensions.spacing.md;
  const tileWidth = (availableWidth - spaceBetweenTiles) / TILES_PER_ROW;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Dimensions.spacing.lg,
    },
    title: {
      fontSize: Fonts.size['2xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.chapterTileBackground || colors.background,
      textAlign: 'center',
      marginBottom: Dimensions.spacing.lg,
      marginTop: Dimensions.spacing.md,
    },
    tilesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    tileWrapper: {
      width: tileWidth,
      marginBottom: Dimensions.spacing.md,
    },
    scrollContent: {
      paddingBottom: collapsedHeight + Dimensions.spacing.md,
    },
  });

  // Group books into rows for proper spacing
  const createBookRows = (
    booksList: Book[],
    includeSpecialTile: boolean = false
  ) => {
    const rows: Book[][] = [];
    const booksToProcess = includeSpecialTile
      ? [
          ...booksList,
          { id: 'go-to-new-testament', isSpecialTile: true } as any,
        ]
      : booksList;

    for (let i = 0; i < booksToProcess.length; i += TILES_PER_ROW) {
      rows.push(booksToProcess.slice(i, i + TILES_PER_ROW));
    }
    return rows;
  };

  const bookRows = createBookRows(books, isOldTestament);

  return (
    <GestureScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps='handled'
      bounces={true}>
      <Text style={styles.title}>{title}</Text>

      {bookRows.map((row, rowIndex) => (
        <View
          key={`row-${rowIndex}`}
          style={[
            styles.tilesContainer,
            row.length === 1 && { justifyContent: 'center' },
          ]}>
          {row.map((book, _bookIndex) => (
            <View key={book.id} style={styles.tileWrapper}>
              {(book as any).isSpecialTile ? (
                <GoToTestamentTile
                  targetTestament='new'
                  previewBooks={newTestamentBooks}
                  onPress={onGoToNewTestament || (() => {})}
                  testID='go-to-new-testament-tile'
                />
              ) : (
                <BookTile
                  book={book}
                  onPress={() => onBookPress(book)}
                  testID={`book-tile-${book.id}`}
                />
              )}
            </View>
          ))}
          {/* Add empty space if row is incomplete and there are 2+ items */}
          {row.length < TILES_PER_ROW && row.length > 1 && (
            <View style={styles.tileWrapper} />
          )}
        </View>
      ))}
    </GestureScrollView>
  );
};

// Content Switcher with 200% width animation
interface ContentSwitcherProps {
  oldTestamentBooks: Book[];
  newTestamentBooks: Book[];
  onBookPress: (book: Book) => void;
  onGoToNewTestament: () => void;
  slideAnimation: Animated.SharedValue<number>;
}

const ContentSwitcher: React.FC<ContentSwitcherProps> = ({
  oldTestamentBooks,
  newTestamentBooks,
  onBookPress,
  onGoToNewTestament,
  slideAnimation,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${slideAnimation.value * -50}%` }],
  }));

  return (
    <View style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            width: '200%',
            height: '100%',
          },
          animatedStyle,
        ]}>
        <View style={{ width: '50%', height: '100%' }}>
          <TestamentView
            books={oldTestamentBooks}
            title='Old Testament'
            onBookPress={onBookPress}
            isOldTestament={true}
            newTestamentBooks={newTestamentBooks}
            onGoToNewTestament={onGoToNewTestament}
          />
        </View>
        <View style={{ width: '50%', height: '100%' }}>
          <TestamentView
            books={newTestamentBooks}
            title='New Testament'
            onBookPress={onBookPress}
          />
        </View>
      </Animated.View>
    </View>
  );
};

export const BibleBooksScreen: React.FC<BibleBooksScreenProps> = ({
  onChapterSelect,
  onVerseSelect,
}) => {
  const { colors, toggleTheme } = useTheme();
  const { openChapterCard } = useChapterCardStore();
  const { isOpen: isHelpPanelOpen, closeHelpPanel } = useHelpPanelStore();
  const insets = useSafeAreaInsets();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [testamentMode, setTestamentMode] = useState<TestamentMode>('old');
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [activeSubMenu, setActiveSubMenu] = useState<SubMenuType>(null);

  // Use the horizontal slide animation hook
  const { slideAnimation, gestureHandler, updateAnimation } =
    useHorizontalSlideAnimation({
      onModeChange: (newMode: string) =>
        setTestamentMode(newMode as TestamentMode),
      modes: ['old', 'new'],
      currentMode: testamentMode,
    });

  // Update animation when testament mode changes externally
  useEffect(() => {
    updateAnimation(testamentMode);
  }, [testamentMode, updateAnimation]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 500));
        const bibleBooks = loadBibleBooks();
        setBooks(bibleBooks);
      } catch (error) {
        // Error loading books - could implement error reporting here
        void error;
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, []);

  const handleBookPress = (book: Book) => {
    // Open chapter card overlay for the selected book
    openChapterCard(book);
  };

  const handleGoToNewTestament = () => {
    setTestamentMode('new');
  };

  const handleOptionsPress = () => {
    setShowOptionsPanel(true);
  };

  const handleCloseOptions = () => {
    setShowOptionsPanel(false);
  };

  const handleOpenSubMenu = (subMenuType: SubMenuType) => {
    setShowOptionsPanel(false);
    setActiveSubMenu(subMenuType);
  };

  const handleCloseSubMenu = () => {
    setActiveSubMenu(null);
  };

  const handleSearchPress = () => {
    console.log('Search pressed');
    // TODO: Implement search functionality
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bibleBooksBackground || colors.background,
    },
    header: {
      paddingTop: insets.top + Dimensions.spacing.md,
      paddingHorizontal: Dimensions.spacing.xl,
      //paddingBottom: Dimensions.spacing.xs,
      backgroundColor: colors.background + '00', // 50% opacity (80 = 128/255)
      //borderBottomWidth: 1,
      //borderBottomColor: colors.secondary + '20', // Very subtle border
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Dimensions.spacing.sm,
      position: 'relative',
    },
    headerToggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      //paddingHorizontal: Dimensions.spacing.xs,
      marginBottom: Dimensions.spacing.sm,
    },
    title: {
      fontSize: Fonts.size['3xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      textAlign: 'center',
    },
    titleButton: {
      // No background color - transparent button
      paddingHorizontal: Dimensions.spacing.sm,
      paddingVertical: Dimensions.spacing.xs,
      borderRadius: Dimensions.radius.sm,
    },
    optionsButton: {
      position: 'absolute',
      right: 0,
      backgroundColor: '#AC8F57',
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    searchButton: {
      position: 'absolute',
      right: 40,
      backgroundColor: '#AC8F57',
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.bibleBooksBackground || colors.background,
    },
    loadingText: {
      marginTop: Dimensions.spacing.md,
      fontSize: Fonts.size.base,
      color: colors.secondary,
    },
  });

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

  // Toggle button options
  const toggleOptions = [
    { key: 'old', label: 'Old Testament' },
    { key: 'new', label: 'New Testament' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.titleButton}
            onPress={() => {
              // Handle Bible title press - could be used for navigation or other actions
              console.log('Bible title pressed');
            }}
            accessibilityRole='button'
            accessibilityLabel='Bible title'
            testID='bible-title-button'
            activeOpacity={0.7}>
            <Text style={styles.title}>Bible</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearchPress}
            accessibilityLabel='Search'
            accessibilityRole='button'
            testID='search-button'>
            <Image
              source={searchIcon}
              style={{ width: 16, height: 16, tintColor: '#FFFFFF' }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={handleOptionsPress}
            accessibilityLabel='Options menu'
            accessibilityRole='button'
            testID='options-button'>
            <MoreIcon size={16} color='#FFFFFF' />
          </TouchableOpacity>
        </View>

        {/* Toggle Buttons in Header */}
        <View style={styles.headerToggleRow}>
          <ToggleButtons
            options={toggleOptions}
            selectedKey={testamentMode}
            onSelect={(key: string) => setTestamentMode(key as TestamentMode)}
            testID='testament-toggle'
            height={28}
            fontSize={Fonts.size.sm}
          />
        </View>
      </View>

      {/* Content Area with Swipe Support */}
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        enableTrackpadTwoFingerGesture={false}
        activeOffsetX={[-20, 20]}
        failOffsetY={[-20, 20]}>
        <Animated.View style={{ flex: 1 }}>
          <ContentSwitcher
            oldTestamentBooks={oldTestamentBooks}
            newTestamentBooks={newTestamentBooks}
            onBookPress={handleBookPress}
            onGoToNewTestament={handleGoToNewTestament}
            slideAnimation={slideAnimation}
          />
        </Animated.View>
      </PanGestureHandler>

      {/* Chapter Card - unified chapter/verse view */}
      <ChapterCard
        onChapterSelect={onChapterSelect}
        onVerseSelect={onVerseSelect}
      />

      {/* Options Menu */}
      <OptionsMenu
        isVisible={showOptionsPanel}
        onClose={handleCloseOptions}
        onThemeToggle={toggleTheme}
        onNavigateToSubMenu={handleOpenSubMenu}
      />

      {/* Profile Menu */}
      <ProfileMenu
        isVisible={activeSubMenu === 'profile'}
        onClose={handleCloseSubMenu}
      />

      {/* Language Menu */}
      <LanguageMenu
        isVisible={activeSubMenu === 'language'}
        onClose={handleCloseSubMenu}
      />

      {/* Settings Menu */}
      <SettingsMenu
        isVisible={activeSubMenu === 'settings'}
        onClose={handleCloseSubMenu}
        onThemeToggle={toggleTheme}
      />

      {/* Help Menu */}
      <HelpMenu
        isVisible={activeSubMenu === 'help'}
        onClose={handleCloseSubMenu}
      />

      {/* Help Panel - Test SlideUpPanel */}
      <SlideUpPanel
        isVisible={isHelpPanelOpen}
        onClose={closeHelpPanel}
        title='Help & Support'
        testID='help-panel'>
        <View style={{ paddingVertical: Dimensions.spacing.md }}>
          <Text
            style={{
              fontSize: Fonts.size.lg,
              color: colors.text,
              fontWeight: Fonts.weight.semibold,
              marginBottom: Dimensions.spacing.md,
            }}>
            Welcome to the Bible App!
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginBottom: Dimensions.spacing.md,
            }}>
            This is a test panel to demonstrate the SlideUpPanel component. You
            can:
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginBottom: Dimensions.spacing.xs,
            }}>
            • Drag the bar at the top to close
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginBottom: Dimensions.spacing.xs,
            }}>
            • Tap the X button to close
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginBottom: Dimensions.spacing.xs,
            }}>
            • Tap the backdrop to close
          </Text>
          <Text
            style={{
              fontSize: Fonts.size.base,
              color: colors.text,
              lineHeight: 24,
              marginTop: Dimensions.spacing.md,
            }}>
            This panel demonstrates the full-screen mode with drag-to-close
            functionality.
          </Text>
        </View>
      </SlideUpPanel>
    </View>
  );
};
