import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@/shared/store';
import { QueueItem } from '@/types/queue';
import { queueItemService } from '../services/domain/queueItemService';
import { searchService } from '@/features/search/services/domain/searchService';
import { createQueueItemStyles } from './QueueItemComponent.styles';

interface QueueItemComponentProps {
  item: QueueItem;
  isFromUserQueue: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  onAdd?: () => void; // New prop for adding to user queue
  drag?: () => void;
  isActive?: boolean;
}

export const QueueItemComponent: React.FC<QueueItemComponentProps> = ({
  item,
  isFromUserQueue,
  onPress,
  onRemove,
  onAdd, // New prop
  drag,
  isActive = false,
}) => {
  const { colors, isDark } = useTheme();

  // Use services for business logic
  const details = queueItemService.getItemDetails(item);

  const styles = createQueueItemStyles(
    colors,
    isDark,
    isActive,
    isFromUserQueue
  );

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
          style={[styles.queueTypeIndicator, styles.queueTypeIndicatorStyle]}
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

      {/* Right Section - Duration and Action Button */}
      {isFromUserQueue ? (
        // User queue: timestamp to the left of X button
        <View style={styles.userQueueRightSection}>
          {details.duration > 0 && (
            <Text style={styles.duration}>
              {searchService.formatDuration(details.duration)}
            </Text>
          )}

          {onRemove && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={onRemove}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Non-user queue: duration and add button
        <View style={styles.rightSection}>
          {details.duration > 0 && (
            <Text style={styles.duration}>
              {searchService.formatDuration(details.duration)}
            </Text>
          )}

          {onAdd && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={onAdd}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};
