import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/store';
import { Dimensions, Fonts } from '@/shared/constants';
import { QueueItem } from '@/types/queue';

interface QueueItemComponentProps {
  item: QueueItem;
  isFromUserQueue: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  drag?: () => void;
  isActive?: boolean;
}

export const QueueItemComponent: React.FC<QueueItemComponentProps> = ({
  item,
  isFromUserQueue,
  onPress,
  onRemove,
  drag,
  isActive = false,
}) => {
  const { colors } = useTheme();

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Helper function to get actual verse count for a chapter
  const getChapterVerseCount = (bookName: string, chapter: number): number => {
    // Common chapters with known verse counts (this could be expanded or moved to a data file)
    const verseCountMap: Record<string, Record<number, number>> = {
      John: { 1: 51, 2: 25, 3: 36, 4: 54, 5: 47, 6: 71 },
      Luke: { 1: 80, 2: 52, 3: 38, 4: 44, 5: 39 },
      Matthew: { 1: 25, 2: 23, 3: 17, 4: 25, 5: 48 },
      Mark: { 1: 45, 2: 28, 3: 35, 4: 41, 5: 43 },
    };

    return verseCountMap[bookName]?.[chapter] || 35; // Default to 35 if not found
  };

  // Get display information based on item type
  const getItemDetails = () => {
    switch (item.type) {
      case 'chapter': {
        const chapter = item.data as any;
        const verseCount = getChapterVerseCount(
          chapter.book_name,
          chapter.chapter_number
        );
        return {
          title: `${chapter.book_name} ${chapter.chapter_number}`,
          subtitle: '',
          description: `All ${verseCount} verses`,
          duration: chapter.duration_seconds,
        };
      }
      case 'passage': {
        const passage = item.data as any;
        // Extract book and chapter from the passage title or chapter_id
        // passage.title format is like "Luke Chapter 1 (verses 15-55)"
        // We want to show "Luke 1:15-55"
        const chapterIdMatch = passage.chapter_id?.match(/^(.+)-(\d+)$/);
        if (chapterIdMatch) {
          const bookName = chapterIdMatch[1]
            .split('-')
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          const chapterNumber = chapterIdMatch[2];
          return {
            title: `${bookName} ${chapterNumber}:${passage.start_verse}-${passage.end_verse}`,
            subtitle: '',
            description: `${passage.end_verse - passage.start_verse + 1} verses`,
            duration: passage.end_time_seconds - passage.start_time_seconds,
          };
        } else {
          // Fallback to the original title if parsing fails
          return {
            title: passage.title,
            subtitle: '',
            description: `Verses ${passage.start_verse}-${passage.end_verse}`,
            duration: passage.end_time_seconds - passage.start_time_seconds,
          };
        }
      }
      case 'playlist': {
        const playlist = item.data as any;
        return {
          title: playlist.title,
          subtitle: 'Playlist',
          description: playlist.description || 'Custom playlist',
          duration: 0,
        };
      }
      default:
        return {
          title: 'Unknown Item',
          subtitle: '',
          description: '',
          duration: 0,
        };
    }
  };

  const details = getItemDetails();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: isFromUserQueue
        ? colors.primary + '10'
        : colors.background,
      borderRadius: Dimensions.radius.md,
      padding: Dimensions.spacing.sm,
      marginVertical: Dimensions.spacing.xs,
      marginHorizontal: Dimensions.spacing.sm,
      borderWidth: isActive ? 2 : 1,
      borderColor: isActive ? colors.primary : colors.text + '20',
      alignItems: 'center',
      ...Dimensions.shadow.sm,
    },
    queueTypeIndicator: {
      marginRight: Dimensions.spacing.sm,
    },
    contentContainer: {
      flex: 1,
      marginLeft: Dimensions.spacing.sm,
    },
    title: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: Fonts.size.sm,
      fontWeight: Fonts.weight.medium,
      color: colors.text + '80',
    },
    description: {
      fontSize: Fonts.size.sm,
      color: colors.text + '60',
      marginTop: 2,
    },
    rightSection: {
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Dimensions.spacing.sm,
    },
    duration: {
      fontSize: Fonts.size.sm,
      color: colors.text + '60',
      marginBottom: Dimensions.spacing.xs,
    },
    dragHandle: {
      padding: Dimensions.spacing.xs,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: colors.text + '10',
      marginRight: Dimensions.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      width: 24,
      height: 40,
    },
    sixDotPattern: {
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 18,
    },
    dotRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 12,
      marginVertical: 1,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
    },
    removeButton: {
      padding: Dimensions.spacing.xs,
      marginTop: Dimensions.spacing.xs,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: colors.secondary + '20',
    },
    removeButtonText: {
      fontSize: 12,
      color: colors.secondary,
      fontWeight: Fonts.weight.medium,
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}>
      {/* Left Section - Drag Handle or Queue Type Indicator */}
      {drag ? (
        // Drag Handle (6-dot pattern) for draggable items
        <TouchableOpacity
          style={styles.dragHandle}
          onLongPress={drag}
          delayLongPress={100}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <View style={styles.sixDotPattern}>
            <View style={styles.dotRow}>
              <View
                style={[styles.dot, { backgroundColor: colors.text + '60' }]}
              />
              <View
                style={[styles.dot, { backgroundColor: colors.text + '60' }]}
              />
            </View>
            <View style={styles.dotRow}>
              <View
                style={[styles.dot, { backgroundColor: colors.text + '60' }]}
              />
              <View
                style={[styles.dot, { backgroundColor: colors.text + '60' }]}
              />
            </View>
            <View style={styles.dotRow}>
              <View
                style={[styles.dot, { backgroundColor: colors.text + '60' }]}
              />
              <View
                style={[styles.dot, { backgroundColor: colors.text + '60' }]}
              />
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        // Queue Type Indicator for non-draggable items
        <View
          style={[
            styles.queueTypeIndicator,
            {
              backgroundColor: isFromUserQueue
                ? colors.primary + '20'
                : colors.secondary + '20',
              borderRadius: Dimensions.radius.sm,
              width: 4,
              height: '80%',
            },
          ]}
        />
      )}

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {details.title}
        </Text>

        {details.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {details.subtitle}
          </Text>
        ) : null}

        <Text style={styles.description} numberOfLines={1}>
          {details.description}
        </Text>
      </View>

      {/* Right Section - Duration and Remove Button */}
      <View style={styles.rightSection}>
        {details.duration > 0 && (
          <Text style={styles.duration}>
            {formatDuration(details.duration)}
          </Text>
        )}

        {/* Remove Button (only for user queue items) */}
        {isFromUserQueue && onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
            <Text style={styles.removeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};
