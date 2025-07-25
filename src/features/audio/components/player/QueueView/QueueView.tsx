import React from 'react';
import { View, Text } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  OpacityDecorator,
} from 'react-native-draggable-flatlist';
import { useTheme, useQueueStore, useAudioStore } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import { QueueItemComponent } from '../../QueueItemComponent';
import { createQueueViewStyles } from './QueueView.styles';

export interface QueueViewProps {
  title?: string | undefined;
  subtitle?: string | undefined;
}

export const QueueView: React.FC<QueueViewProps> = ({
  title: _title,
  subtitle: _subtitle,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = createQueueViewStyles(colors);

  // Get queue data from store
  const {
    userQueue,
    automaticQueue,
    reorderUserQueue,
    removeFromUserQueue,
    addToUserQueueBack,
    getCurrentItem,
  } = useQueueStore();

  // Get audio store for playback integration
  const { playFromQueueItem } = useAudioStore();

  // Handle item press (play item)
  const handleItemPress = React.useCallback(
    async (item: any) => {
      try {
        await playFromQueueItem(item, true); // true = from queue

        // If playing from user queue and automatic queue is empty, populate it
        if (automaticQueue.items.length === 0 && item.type === 'chapter') {
          const chapter = item.data;
          const chapterId = `${chapter.book_name.toLowerCase().replace(/\s+/g, '-')}-${chapter.chapter_number}`;
          useQueueStore.getState().populateAutomaticQueue(chapterId);
        }

        console.log('Playing queue item:', item);
      } catch (error) {
        console.error('Error playing queue item:', error);
      }
    },
    [playFromQueueItem, automaticQueue.items.length]
  );

  // Handle removing item from user queue
  const handleRemoveFromUserQueue = React.useCallback(
    (index: number) => {
      removeFromUserQueue(index);
    },
    [removeFromUserQueue]
  );

  // Handle dragging item from auto queue to user queue
  const handleMoveToUserQueue = React.useCallback(
    (item: any) => {
      addToUserQueueBack({
        type: item.type,
        data: item.data,
      });
    },
    [addToUserQueueBack]
  );

  // Combine all items into a single list for unified scrolling
  const combinedItems = React.useMemo(() => {
    const items: Array<{
      id: string;
      type:
        | 'section-header'
        | 'user-queue-item'
        | 'auto-queue-item'
        | 'empty-state';
      data?: any;
      item?: any;
      userQueueIndex?: number;
    }> = [];

    // User Queue Section Header
    items.push({
      id: 'user-queue-header',
      type: 'section-header',
      data: { title: t('audio.userQueue', 'Your Queue') },
    });

    // User Queue Items or Empty State
    if (userQueue.items.length > 0) {
      userQueue.items.forEach((item, index) => {
        items.push({
          id: `user-${item.id}`,
          type: 'user-queue-item',
          item,
          userQueueIndex: index,
        });
      });
    } else {
      items.push({
        id: 'user-queue-empty',
        type: 'empty-state',
        data: {
          message: t(
            'audio.dragItemsHere',
            'Drag items here to create your custom queue'
          ),
          isDashed: true,
        },
      });
    }

    // Auto Queue Section Header
    items.push({
      id: 'auto-queue-header',
      type: 'section-header',
      data: { title: t('audio.autoQueue', 'Up Next') },
    });

    // Auto Queue Items or Empty State
    if (automaticQueue.items.length > 0) {
      automaticQueue.items.forEach(item => {
        items.push({
          id: `auto-${item.id}`,
          type: 'auto-queue-item',
          item,
        });
      });
    } else {
      items.push({
        id: 'auto-queue-empty',
        type: 'empty-state',
        data: {
          message: t('audio.noAutoQueue', 'No upcoming items'),
          isDashed: false,
        },
      });
    }

    return items;
  }, [userQueue.items, automaticQueue.items, t]);

  // Handle drag and drop reordering for user queue
  const handleCombinedDragEnd = React.useCallback(
    ({ data: _data, from, to }: any) => {
      const draggedItem = combinedItems[from];
      const targetItem = combinedItems[to];

      // Only allow reordering within user queue items
      if (
        draggedItem?.type === 'user-queue-item' &&
        targetItem?.type === 'user-queue-item'
      ) {
        const fromIndex = draggedItem.userQueueIndex;
        const toIndex = targetItem.userQueueIndex;

        if (fromIndex !== undefined && toIndex !== undefined) {
          reorderUserQueue(fromIndex, toIndex);
        }
      }
      // If dragging non-user queue items, do nothing (effectively prevents the drag)
    },
    [combinedItems, reorderUserQueue]
  );

  const currentItem = getCurrentItem();

  const renderCombinedItem = React.useCallback(
    ({ item: listItem, drag, isActive, getIndex }: any) => {
      const { type, data, item, userQueueIndex } = listItem;

      switch (type) {
        case 'section-header':
          return (
            <View
              style={[
                styles.sectionHeader,
                getIndex() > 0 && styles.sectionHeaderWithMargin,
              ]}>
              <Text style={styles.sectionHeaderText}>{data.title}</Text>
            </View>
          );

        case 'user-queue-item':
          return (
            <ScaleDecorator>
              <OpacityDecorator>
                <QueueItemComponent
                  item={item}
                  isFromUserQueue={true}
                  onPress={() => handleItemPress(item)}
                  onRemove={() => {
                    if (userQueueIndex !== undefined) {
                      handleRemoveFromUserQueue(userQueueIndex);
                    }
                  }}
                  drag={drag}
                  isActive={isActive || currentItem?.id === item.id}
                />
              </OpacityDecorator>
            </ScaleDecorator>
          );

        case 'auto-queue-item':
          return (
            <QueueItemComponent
              item={item}
              isFromUserQueue={false}
              onPress={() => handleItemPress(item)}
              onAdd={() => handleMoveToUserQueue(item)}
              isActive={currentItem?.id === item.id}
            />
          );

        case 'empty-state':
          return (
            <View
              style={[
                styles.emptyStateContainer,
                data.isDashed
                  ? styles.emptyStateDashed
                  : styles.emptyStateSolid,
              ]}>
              <Text style={styles.emptyStateText}>{data.message}</Text>
            </View>
          );

        default:
          return null;
      }
    },
    [
      styles,
      currentItem,
      handleItemPress,
      handleRemoveFromUserQueue,
      handleMoveToUserQueue,
    ]
  );

  return (
    <View style={styles.container}>
      <DraggableFlatList
        data={combinedItems}
        onDragEnd={handleCombinedDragEnd}
        keyExtractor={item => item.id}
        scrollEnabled={true}
        activationDistance={15}
        renderItem={renderCombinedItem}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};
