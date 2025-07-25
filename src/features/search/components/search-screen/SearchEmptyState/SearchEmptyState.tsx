import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '@/shared/store';
import { usePlayerOverlayHeight } from '@/shared/hooks';
import { createSearchEmptyStateStyles } from './SearchEmptyState.styles';

export interface SearchEmptyStateProps {
  isSearching: boolean;
  hasSearched: boolean;
  hasResults: boolean;
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({
  isSearching,
  hasSearched,
  hasResults,
}) => {
  const { colors } = useTheme();
  const { collapsedHeight } = usePlayerOverlayHeight();
  const styles = createSearchEmptyStateStyles(collapsedHeight);

  if (hasResults) {
    return null; // Don't show empty state when there are results
  }

  if (isSearching) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size='large' color={colors.primary} />
        <Text style={[styles.text, { color: colors.secondary }]}>
          Searching...
        </Text>
      </View>
    );
  }

  if (hasSearched) {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          No results found
        </Text>
        <Text style={[styles.text, { color: colors.secondary }]}>
          Try searching for a different book or chapter
        </Text>
      </View>
    );
  }

  return null; // Don't show empty state initially
};
