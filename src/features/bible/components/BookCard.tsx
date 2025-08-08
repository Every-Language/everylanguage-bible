import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/shared/hooks';
import type { BookWithMetadata } from '../services/powerSyncBibleService';

type BookCardProps = {
  book: BookWithMetadata;
  onPress: () => void;
  showMetadata?: boolean; // Show chapter counts and media availability
};

/**
 * BookCard component using PowerSync BookWithMetadata
 */
export const BookCard: React.FC<BookCardProps> = ({
  book,
  onPress,
  showMetadata = false,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
        },
      ]}
      onPress={onPress}>
      <View style={styles.content}>
        {/* Book Number Badge */}
        <View
          style={[
            styles.numberBadge,
            { backgroundColor: theme.colors.primary },
          ]}>
          <Text style={[styles.numberText, { color: '#ffffff' }]}>
            {book.book_number}
          </Text>
        </View>

        {/* Book Info */}
        <View style={styles.bookInfo}>
          <Text
            style={[styles.bookName, { color: theme.colors.text }]}
            numberOfLines={2}>
            {book.name}
          </Text>

          <View style={styles.metaRow}>
            <Text
              style={[styles.testament, { color: theme.colors.textSecondary }]}>
              {book.testament === 'old' ? 'Old Testament' : 'New Testament'}
            </Text>

            {/* Enhanced metadata for PowerSync books */}
            {showMetadata && (
              <View style={styles.metadataContainer}>
                {/* Chapter count */}
                {book.chaptersCount !== undefined && (
                  <View
                    style={[
                      styles.metadataItem,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}>
                    <Text
                      style={[
                        styles.metadataText,
                        { color: theme.colors.textSecondary },
                      ]}>
                      {book.chaptersCount} ch
                    </Text>
                  </View>
                )}

                {/* Audio availability */}
                {book.hasAudio && (
                  <View style={[styles.metadataItem, styles.audioBadge]}>
                    <Text style={styles.audioBadgeText}>🎵</Text>
                  </View>
                )}

                {/* Text availability */}
                {book.hasText && (
                  <View style={[styles.metadataItem, styles.textBadge]}>
                    <Text style={styles.textBadgeText}>📖</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Arrow indicator */}
        <View style={styles.arrow}>
          <Text
            style={[styles.arrowText, { color: theme.colors.textSecondary }]}>
            ›
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  container: {
    marginVertical: 4,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
  },
  numberBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  bookInfo: {
    flex: 1,
  },
  bookName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  testament: {
    fontSize: 14,
  },
  metadataContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  metadataItem: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  metadataText: {
    fontSize: 12,
  },
  audioBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  audioBadgeText: {
    fontSize: 12,
  },
  textBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  textBadgeText: {
    fontSize: 12,
  },
  arrow: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: '300' as const,
  },
};
