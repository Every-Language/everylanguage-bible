import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import type { LanguageEntity } from '../../types';

export interface LanguageSearchProps {
  searchQuery: string;
  searchResults: LanguageEntity[];
  isSearching: boolean;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  onSelectResult: (language: LanguageEntity) => void;
}

export const LanguageSearch: React.FC<LanguageSearchProps> = ({
  searchQuery,
  searchResults,
  isSearching,
  onSearchChange,
  onClearSearch,
  onSelectResult,
}) => {
  const { theme } = useTheme();

  const renderSearchResults = () => {
    if (!searchQuery || searchResults.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary },
            ]}>
            {searchQuery
              ? 'No languages found'
              : 'Start typing to search languages'}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.searchResults}>
        {searchResults.map(language => (
          <TouchableOpacity
            key={language.id}
            style={[
              styles.searchResultItem,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => onSelectResult(language)}>
            <View style={styles.searchResultContent}>
              <Text
                style={[styles.searchResultName, { color: theme.colors.text }]}>
                {language.name}
              </Text>
              <Text
                style={[
                  styles.searchResultLevel,
                  { color: theme.colors.textSecondary },
                ]}>
                {language.level}
              </Text>

              {/* Show availability counts in search results */}
              {language.availableVersionCounts && (
                <View style={styles.searchResultCounts}>
                  {language.availableVersionCounts.audio > 0 && (
                    <View style={styles.countBadge}>
                      <Ionicons
                        name='volume-high'
                        size={12}
                        color={theme.colors.success}
                      />
                      <Text
                        style={[
                          styles.countText,
                          { color: theme.colors.success },
                        ]}>
                        {language.availableVersionCounts.audio}
                      </Text>
                    </View>
                  )}

                  {language.availableVersionCounts.text > 0 && (
                    <View style={styles.countBadge}>
                      <Ionicons
                        name='document-text'
                        size={12}
                        color={theme.colors.info}
                      />
                      <Text
                        style={[
                          styles.countText,
                          { color: theme.colors.info },
                        ]}>
                        {language.availableVersionCounts.text}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <Ionicons
              name='chevron-forward'
              size={16}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.colors.surface },
        ]}>
        <Ionicons
          name='search'
          size={20}
          color={theme.colors.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              backgroundColor: theme.colors.surface,
            },
          ]}
          placeholder='Search languages...'
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCapitalize='none'
          autoCorrect={false}
        />
        {searchQuery ? (
          <TouchableOpacity style={styles.clearButton} onPress={onClearSearch}>
            <Ionicons
              name='close-circle'
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
        {isSearching && (
          <ActivityIndicator
            color={theme.colors.primary}
            size='small'
            style={styles.searchLoading}
          />
        )}
      </View>

      {/* Search Results */}
      {searchQuery && renderSearchResults()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  searchLoading: {
    marginLeft: 8,
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  searchResultLevel: {
    fontSize: 12,
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  searchResultCounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
