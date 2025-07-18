import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Dimensions as RNDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadBibleBooks, type Book } from '@/shared/utils';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { useMiniPlayerHeight } from '@/shared/hooks';
import { getBookImageSource } from '@/shared/services';
import searchIcon from '../../../../assets/images/utility_icons/search.png';

interface SearchScreenProps {
  isVisible: boolean;
  onClose: () => void;
  onChapterSelect: (book: Book, chapter: number) => void;
  onVerseSelect: (book: Book, chapter: number, verse: number) => void;
}

interface SearchResult {
  type: 'book' | 'chapter' | 'verse';
  book: Book;
  chapter?: number;
  verse?: number;
  title: string;
  subtitle?: string;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({
  isVisible,
  onClose,
  onChapterSelect,
  onVerseSelect,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { collapsedHeight } = useMiniPlayerHeight();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Animation refs
  const slideAnim = useRef(
    new Animated.Value(RNDimensions.get('window').height)
  ).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Load books data
  useEffect(() => {
    const bibleBooks = loadBibleBooks();
    setBooks(bibleBooks);
  }, []);

  // Animation effects
  useEffect(() => {
    if (isVisible) {
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: RNDimensions.get('window').height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, slideAnim, opacityAnim]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery.trim());
      setIsLoading(false);
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, books]);

  const performSearch = (query: string) => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search books
    books.forEach(book => {
      if (book.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'book',
          book,
          title: book.name,
          subtitle: `${book.chapters} chapters • ${book.testament === 'old' ? 'Old' : 'New'} Testament`,
        });
      }

      // Search chapters (if query includes numbers)
      const numberMatch = query.match(/\d+/);
      if (numberMatch) {
        const chapterNum = parseInt(numberMatch[0]);
        if (chapterNum <= book.chapters) {
          if (
            book.name
              .toLowerCase()
              .includes(lowerQuery.replace(/\d+/g, '').trim()) ||
            lowerQuery.includes(book.name.toLowerCase())
          ) {
            results.push({
              type: 'chapter',
              book,
              chapter: chapterNum,
              title: `${book.name} Chapter ${chapterNum}`,
              subtitle: `${book.testament === 'old' ? 'Old' : 'New'} Testament`,
            });
          }
        }
      }
    });

    // Limit results and sort by relevance
    const limitedResults = results.slice(0, 20);
    setSearchResults(limitedResults);
  };

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'book') {
      // For book results, select the first chapter
      onChapterSelect(result.book, 1);
    } else if (result.type === 'chapter' && result.chapter) {
      onChapterSelect(result.book, result.chapter);
    } else if (result.type === 'verse' && result.chapter && result.verse) {
      onVerseSelect(result.book, result.chapter, result.verse);
    }
    onClose();
  };

  const styles = StyleSheet.create({
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1500, // Higher than mini player (1000)
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
      marginTop: insets.top,
      borderTopLeftRadius: Dimensions.radius.lg,
      borderTopRightRadius: Dimensions.radius.lg,
    },
    header: {
      padding: Dimensions.spacing.lg,
      paddingBottom: Dimensions.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary + '20',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Dimensions.spacing.md,
    },
    title: {
      fontSize: Fonts.size.xl,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
    },
    closeButton: {
      padding: Dimensions.spacing.xs,
      backgroundColor: colors.secondary + '20',
      borderRadius: Dimensions.radius.sm,
    },
    closeButtonText: {
      fontSize: Fonts.size.sm,
      color: colors.text,
      fontWeight: Fonts.weight.medium,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondary + '10',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.sm,
    },
    searchIcon: {
      width: 16,
      height: 16,
      tintColor: colors.secondary,
      marginRight: Dimensions.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: Fonts.size.base,
      color: colors.text,
      padding: 0,
    },
    content: {
      flex: 1,
      paddingBottom: collapsedHeight + Dimensions.spacing.md,
    },
    resultsList: {
      padding: Dimensions.spacing.lg,
    },
    resultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Dimensions.spacing.md,
      backgroundColor: colors.secondary + '08',
      borderRadius: Dimensions.radius.md,
      marginBottom: Dimensions.spacing.sm,
    },
    resultImageContainer: {
      width: 40,
      height: 40,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: colors.secondary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Dimensions.spacing.md,
    },
    resultImage: {
      width: 32,
      height: 32,
      borderRadius: Dimensions.radius.sm,
      tintColor: colors.text,
    },
    resultTextContainer: {
      flex: 1,
    },
    resultTitle: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.medium,
      color: colors.text,
      marginBottom: 2,
    },
    resultSubtitle: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: Dimensions.spacing.xl,
    },
    emptyText: {
      fontSize: Fonts.size.base,
      color: colors.secondary,
      textAlign: 'center',
      marginTop: Dimensions.spacing.md,
    },
    loadingContainer: {
      padding: Dimensions.spacing.lg,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
    },
  });

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Search Bible</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel='Close search'
              accessibilityRole='button'
              testID='search-close-button'>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Image source={searchIcon} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder='Search books, chapters, or verses...'
              placeholderTextColor={colors.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
              testID='search-input'
            />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : searchQuery.trim() === '' ? (
            <View style={styles.emptyContainer}>
              <Image
                source={searchIcon}
                style={[
                  styles.searchIcon,
                  { width: 48, height: 48, tintColor: colors.secondary + '40' },
                ]}
              />
              <Text style={styles.emptyText}>
                Start typing to search through books, chapters, and verses
              </Text>
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No results found for &ldquo;{searchQuery}&rdquo;
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'>
              {searchResults.map((result, index) => {
                const imageSource = getBookImageSource(result.book.imagePath);

                return (
                  <TouchableOpacity
                    key={`${result.type}-${result.book.id}-${result.chapter || 0}-${index}`}
                    style={styles.resultItem}
                    onPress={() => handleResultPress(result)}
                    accessibilityRole='button'
                    testID={`search-result-${index}`}>
                    <View style={styles.resultImageContainer}>
                      {imageSource ? (
                        <Image
                          source={imageSource}
                          style={styles.resultImage}
                          resizeMode='contain'
                        />
                      ) : (
                        <Text style={{ fontSize: 16 }}>📖</Text>
                      )}
                    </View>

                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultTitle}>{result.title}</Text>
                      {result.subtitle && (
                        <Text style={styles.resultSubtitle}>
                          {result.subtitle}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Animated.View>
    </Animated.View>
  );
};
