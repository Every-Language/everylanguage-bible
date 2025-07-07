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

  // Get display information based on item type
  const getItemDetails = () => {
    switch (item.type) {
      case 'chapter': {
        const chapter = item.data as any;
        return {
          title: chapter.book_name,
          subtitle: `Chapter ${chapter.chapter_number}`,
          description: `All verses`,
          duration: chapter.duration_seconds,
        };
      }
      case 'passage': {
        const passage = item.data as any;
        return {
          title: passage.title,
          subtitle: '',
          description: `Verses ${passage.start_verse}-${passage.end_verse}`,
          duration: passage.end_time_seconds - passage.start_time_seconds,
        };
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
