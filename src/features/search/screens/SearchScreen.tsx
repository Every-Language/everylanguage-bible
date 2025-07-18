import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  Image,
} from 'react-native';
import { useHeader } from '@/shared';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { usePlayerOverlayHeight } from '@/shared/hooks';
import { useAudioStore } from '@/shared/store';
import type { AudioRecording } from '@/types';

// Import the search icon
import searchIcon from '../../../../assets/images/utility_icons/search.png';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SearchScreenProps {
  // No props needed - options menu handled by MainNavigator
}

interface SearchResultItemProps {
  recording: AudioRecording;
  onPress: (recording: AudioRecording) => void;
  testID?: string;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  recording,
  onPress,
  testID,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.chapterTileBackground || colors.background,
      borderRadius: 16,
      padding: Dimensions.spacing.md,
      marginHorizontal: Dimensions.spacing.lg,
      marginBottom: Dimensions.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.semibold,
      color: colors.text,
      marginBottom: Dimensions.spacing.xs,
    },
    description: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      lineHeight: 20,
    },
    duration: {
      fontSize: Fonts.size.xs,
      color: colors.secondary,
      marginTop: Dimensions.spacing.xs,
    },
    audioIcon: {
      marginLeft: Dimensions.spacing.md,
      padding: Dimensions.spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
    },
    audioIconText: {
      fontSize: Fonts.size.lg,
    },
  });

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(recording)}
      accessibilityRole='button'
      accessibilityLabel={`${recording.title} audio recording`}
      testID={testID}>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {recording.title}
        </Text>
        {recording.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recording.description}
          </Text>
        )}
        <Text style={styles.duration}>
          {formatDuration(recording.duration_seconds ?? 0)}
        </Text>
      </View>
      <View style={styles.audioIcon}>
        <Text style={styles.audioIconText}>🎵</Text>
      </View>
    </TouchableOpacity>
  );
};

export const SearchScreen: React.FC<SearchScreenProps> = () => {
  const { colors } = useTheme();
  const { setCurrentScreen, setBottomContent } = useHeader();
  const { collapsedHeight } = usePlayerOverlayHeight();
  const { searchRecordings } = useAudioStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AudioRecording[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchInputRef = useRef<TextInput>(null);

  // Define search bar styles to match toggle buttons exactly
  const searchBarStyles = StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Dimensions.radius.md, // Match toggle button radius
      paddingHorizontal: Dimensions.spacing.md,
      height: 32, // 32 pixels tall
      borderWidth: 1,
      borderColor: colors.navigationSelected, // Match toggle button border
      flex: 1, // Take up all available space
    },
    searchIcon: {
      width: 14,
      height: 14,
      marginRight: Dimensions.spacing.sm,
      tintColor: colors.navigationUnselectedText,
    },
    input: {
      flex: 1,
      fontSize: Fonts.size.base,
      paddingVertical: 0, // Remove default padding for better control
      minHeight: 20, // Ensure text is visible
    },
  });

  // Define callback functions before using them
  const handleSearch = useCallback(
    async (query?: string) => {
      const searchText = query || searchQuery;
      if (searchText.trim() === '') return;

      setIsSearching(true);
      try {
        const results = await searchRecordings(searchText.trim());
        setSearchResults(results);
        setHasSearched(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [searchQuery, searchRecordings]
  );

  const handleSearchSubmit = useCallback(() => {
    handleSearch();
  }, [handleSearch]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      // Clear results if search is empty
      if (text.trim() === '') {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      // Debounced search - search after user stops typing for 300ms
      const timeoutId = setTimeout(() => {
        handleSearch(text);
      }, 300);

      // Store timeout ID for cleanup if needed
      return () => clearTimeout(timeoutId);
    },
    [handleSearch]
  );

  const handleResultPress = useCallback((recording: AudioRecording) => {
    // TODO: Navigate to the recording or start playing it
    console.log('Selected recording:', recording.title);
    Keyboard.dismiss();
  }, []);

  // Set up header content
  useEffect(() => {
    setCurrentScreen('search');
  }, [setCurrentScreen]);

  // Auto-focus search input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100); // Small delay to ensure the screen is fully rendered

    return () => clearTimeout(timer);
  }, []);

  // Create search bar component that fills the available width
  const searchBar = (
    <View
      style={[
        searchBarStyles.inputContainer,
        { backgroundColor: colors.navigationUnselected },
      ]}>
      <Image
        source={searchIcon}
        style={searchBarStyles.searchIcon}
        resizeMode='contain'
      />
      <TextInput
        ref={searchInputRef}
        style={[
          searchBarStyles.input,
          { color: colors.navigationUnselectedText },
        ]}
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder='Search Bible content...'
        placeholderTextColor={colors.navigationUnselectedText + '70'}
        returnKeyType='search'
        onSubmitEditing={handleSearchSubmit}
        autoCorrect={false}
        autoCapitalize='none'
        clearButtonMode='while-editing'
      />
    </View>
  );

  // Update header content with search bar
  useEffect(() => {
    setBottomContent(searchBar);
  }, [setBottomContent, searchQuery, colors]);

  const renderSearchResult = ({
    item,
    index,
  }: {
    item: AudioRecording;
    index: number;
  }) => (
    <SearchResultItem
      recording={item}
      onPress={handleResultPress}
      testID={`search-result-${index}`}
    />
  );

  // Instructional text component to show below search bar
  const InstructionalText: React.FC = () => (
    <View style={instructionalStyles.container}>
      <Text style={[instructionalStyles.title, { color: colors.text }]}>
        Search the Bible
      </Text>
      <Text style={[instructionalStyles.text, { color: colors.secondary }]}>
        Search for books, chapters, or specific content
      </Text>
    </View>
  );

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <View style={emptyStateStyles.container}>
          <ActivityIndicator size='large' color={colors.primary} />
          <Text style={[emptyStateStyles.text, { color: colors.secondary }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (hasSearched && searchResults.length === 0) {
      return (
        <View style={emptyStateStyles.container}>
          <Text style={[emptyStateStyles.title, { color: colors.text }]}>
            No results found
          </Text>
          <Text style={[emptyStateStyles.text, { color: colors.secondary }]}>
            Try searching for a different book or chapter
          </Text>
        </View>
      );
    }

    return null; // Don't show empty state initially - instructions are now above
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bibleBooksBackground || colors.background,
    },
    resultsContainer: {
      flex: 1,
    },
    resultsList: {
      paddingTop: Dimensions.spacing.md,
      paddingBottom: (collapsedHeight || 0) + Dimensions.spacing.md,
    },
  });

  const instructionalStyles = StyleSheet.create({
    container: {
      paddingHorizontal: Dimensions.spacing.lg,
      paddingTop: Dimensions.spacing.md,
      paddingBottom: Dimensions.spacing.lg,
    },
    title: {
      fontSize: Fonts.size.xl,
      fontWeight: Fonts.weight.bold,
      textAlign: 'center',
      marginBottom: Dimensions.spacing.sm,
    },
    text: {
      fontSize: Fonts.size.base,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  const emptyStateStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: Dimensions.spacing.xl,
      paddingTop: Dimensions.spacing.xl,
      paddingBottom: (collapsedHeight || 0) + Dimensions.spacing.xl,
    },
    title: {
      fontSize: Fonts.size.xl,
      fontWeight: Fonts.weight.bold,
      textAlign: 'center',
      marginBottom: Dimensions.spacing.sm,
    },
    text: {
      fontSize: Fonts.size.base,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  return (
    <View style={styles.container}>
      {/* Show instructional text when not searching and no results */}
      {!hasSearched && !isSearching && <InstructionalText />}

      <View style={styles.resultsContainer}>
        {searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.resultsList}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Options menu now handled by MainNavigator */}
    </View>
  );
};
