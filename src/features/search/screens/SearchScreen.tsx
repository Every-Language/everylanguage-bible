import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Image,
} from 'react-native';
import { useHeader } from '@/shared';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { usePlayerOverlayHeight } from '@/shared/hooks';

import type { AudioRecording } from '@/types';
import {
  SearchResultItem,
  InstructionalText,
  SearchEmptyState,
} from '../components/search-screen';

// Import the search icon
import searchIcon from '../../../../assets/images/utility_icons/search.png';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SearchScreenProps {
  // No props needed - options menu handled by MainNavigator
}

export const SearchScreen: React.FC<SearchScreenProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AudioRecording[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchInputRef = useRef<TextInput>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { colors } = useTheme();
  const { collapsedHeight } = usePlayerOverlayHeight();
  const { setCurrentScreen, setBottomContent } = useHeader();

  // Set up header
  useEffect(() => {
    setCurrentScreen('search');
  }, [setCurrentScreen]);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      // Mock search logic - replace with actual search API
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

      const mockResults: AudioRecording[] = [
        {
          id: 'luke-1-1-10',
          title: 'Luke Chapter 1 (verses 1-10)',
          description: 'The birth of John the Baptist foretold',
          duration_seconds: 120,
          audio_file_url: '',
          created_at: null,
          original_language: 'en',
          status: 'active',
          target_language: 'en',
          updated_at: null,
          user_id: null,
        },
        {
          id: 'john-3-16',
          title: 'John Chapter 3 (verse 16)',
          description: 'For God so loved the world...',
          duration_seconds: 30,
          audio_file_url: '',
          created_at: null,
          original_language: 'en',
          status: 'active',
          target_language: 'en',
          updated_at: null,
          user_id: null,
        },
      ];

      // Filter based on query (simple mock filtering)
      const filtered = mockResults.filter(
        result =>
          result.title.toLowerCase().includes(query.toLowerCase()) ||
          result.description?.toLowerCase().includes(query.toLowerCase())
      );

      setSearchResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleResultPress = (_recording: AudioRecording) => {
    // TODO: Implement playback when audio store is properly set up
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    performSearch(searchQuery);
  };

  // Auto-focus search input when screen loads
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Create search bar for header
  const searchBarStyles = StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: Dimensions.radius.md,
      paddingHorizontal: Dimensions.spacing.md,
      height: 32,
      borderWidth: 1,
      borderColor: colors.navigationSelected,
      backgroundColor: colors.navigationUnselected,
      flex: 1,
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
      paddingVertical: 0,
      minHeight: 20,
      color: colors.navigationUnselectedText,
    },
    clearButton: {
      padding: Dimensions.spacing.xs,
      marginLeft: Dimensions.spacing.xs,
    },
    clearButtonText: {
      fontSize: Fonts.size.sm,
      color: colors.navigationUnselectedText,
    },
  });

  const searchBar = (
    <View style={searchBarStyles.inputContainer}>
      <Image
        source={searchIcon}
        style={searchBarStyles.searchIcon}
        resizeMode='contain'
      />
      <TextInput
        ref={searchInputRef}
        style={searchBarStyles.input}
        value={searchQuery}
        onChangeText={handleSearchChange}
        placeholder='Search Bible content...'
        placeholderTextColor={colors.navigationUnselectedText + '70'}
        returnKeyType='search'
        onSubmitEditing={handleSearchSubmit}
        autoCorrect={false}
        autoCapitalize='none'
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          style={searchBarStyles.clearButton}
          onPress={clearSearch}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
          <Text style={searchBarStyles.clearButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Update header content with search bar
  useEffect(() => {
    setBottomContent(searchBar);
  }, [setBottomContent, searchQuery, colors]);

  // Render search result item
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

  const renderEmptyState = () => {
    if (isSearching) {
      return (
        <SearchEmptyState
          isSearching={true}
          hasSearched={hasSearched}
          hasResults={false}
        />
      );
    }

    if (hasSearched && searchResults.length === 0) {
      return (
        <SearchEmptyState
          isSearching={false}
          hasSearched={true}
          hasResults={false}
        />
      );
    }

    return null;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    resultsContainer: {
      flex: 1,
    },
    resultsList: {
      paddingTop: Dimensions.spacing.md,
      paddingBottom: collapsedHeight + Dimensions.spacing.md,
    },
  });

  return (
    <View style={styles.container}>
      {/* Instructions or Results */}
      <View style={styles.resultsContainer}>
        {!hasSearched && <InstructionalText />}

        {hasSearched && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
            testID='search-results-list'
          />
        )}

        {renderEmptyState()}
      </View>
    </View>
  );
};
