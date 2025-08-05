import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';

interface SearchResultsDisplayProps {
  isOnline: boolean;
  isCheckingOnline: boolean;
  isSearching: boolean;
  searchResults: Array<{ file_size?: number }>;
  searchError: string | null;
  onFormatFileSize: (bytes: number) => string;
  localValidationResult?: {
    hasLocalFiles: boolean;
    isValid: boolean;
  } | null;
}

export const SearchResultsDisplay: React.FC<SearchResultsDisplayProps> = ({
  isOnline,
  isCheckingOnline,
  isSearching,
  searchResults,
  searchError,
  onFormatFileSize,
  localValidationResult,
}) => {
  const { theme } = useTheme();

  const getTotalFileSize = () => {
    if (!searchResults || searchResults.length === 0) return 0;
    return searchResults.reduce((total, file) => {
      return total + (file.file_size || 0);
    }, 0);
  };

  if (!isOnline || isCheckingOnline) {
    return null;
  }

  return (
    <View
      style={[
        styles.resultsContainer,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}>
      {isSearching ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size='small' color={theme.colors.primary} />
          <Text style={[styles.statusText, { color: theme.colors.text }]}>
            {localValidationResult && !localValidationResult.hasLocalFiles
              ? 'Checking online availability...'
              : 'Searching for media files...'}
          </Text>
        </View>
      ) : searchError ? (
        <View style={styles.statusRow}>
          <MaterialIcons name='error' size={16} color={theme.colors.error} />
          <Text style={[styles.statusText, { color: theme.colors.error }]}>
            {searchError}
          </Text>
        </View>
      ) : searchResults.length > 0 ? (
        <View style={styles.resultsDetails}>
          <View style={styles.statusRow}>
            <MaterialIcons
              name='cloud-download'
              size={16}
              color={theme.colors.success}
            />
            <Text style={[styles.statusText, { color: theme.colors.text }]}>
              Found {searchResults.length} media files
            </Text>
          </View>

          <View style={styles.fileDetails}>
            <Text
              style={[
                styles.fileDetailText,
                { color: theme.colors.textSecondary },
              ]}>
              Total size: {onFormatFileSize(getTotalFileSize())}
            </Text>
            <Text
              style={[
                styles.fileDetailText,
                { color: theme.colors.textSecondary },
              ]}>
              Files: {searchResults.length} audio files
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.statusRow}>
          <MaterialIcons
            name='cloud-off'
            size={16}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[styles.statusText, { color: theme.colors.textSecondary }]}>
            {localValidationResult && !localValidationResult.hasLocalFiles
              ? 'No audio files available for this chapter (not available locally or online)'
              : 'No audio files available online for this chapter'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  resultsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  resultsDetails: {
    width: '100%' as const,
  },
  fileDetails: {
    marginTop: 8,
    gap: 4,
  },
  fileDetailText: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
};
