import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions as RNDimensions,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  OpacityDecorator,
} from 'react-native-draggable-flatlist';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  ScrollView as GestureScrollView,
} from 'react-native-gesture-handler';
import { Fonts, Dimensions } from '@/shared/constants';
import { useTheme } from '@/shared/store';
import { useTranslation } from '@/shared/hooks';
import { ProgressBar } from '@/shared/components/ui/ProgressBar';
import {
  PlayIcon,
  PauseIcon,
  PreviousChapterIcon,
  PreviousVerseIcon,
  NextVerseIcon,
  NextChapterIcon,
} from '@/shared/components/ui/icons/AudioIcons';
import { getBookImageSource } from '@/shared/services';
import { useAudioStore } from '@/shared/store/audioStore';
import { useQueueStore } from '@/shared/store/queueStore';
import { VerseDisplayData } from '@/types/audio';
import { QueueItemComponent } from './QueueItemComponent';

interface MiniPlayerProps {
  testID?: string;
  onExpand?: () => void;
  onClose?: () => void; // Close/hide the player
  // All other data now comes from the audio store
}

// Content mode types
type ContentMode = 'text' | 'queue';

// Track text view component - now uses data from audio store
interface TrackTextViewProps {
  verseDisplayData: VerseDisplayData[];
  currentTime: number;
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined;
}

const TrackTextView: React.FC<TrackTextViewProps> = ({
  verseDisplayData,
  currentTime: _currentTime,
  onVersePress,
  onSeek,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const versePositions = React.useRef<Map<number, number>>(new Map());
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  // Find current verse from display data
  const currentVerse = React.useMemo(() => {
    const activeVerse = verseDisplayData.find(verse => verse.isCurrentVerse);
    return activeVerse?.verseNumber || 1;
  }, [verseDisplayData]);

  // Handle verse layout to track positions
  const handleVerseLayout = (verseNumber: number, y: number) => {
    versePositions.current.set(verseNumber, y);
  };

  // Auto-scroll to current verse
  React.useEffect(() => {
    if (currentVerse && scrollViewRef.current && shouldAutoScroll) {
      const versePosition = versePositions.current.get(currentVerse);
      if (versePosition !== undefined) {
        // Add a small delay to ensure the ScrollView is ready
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, versePosition - 100), // Offset to show verse with some padding
            animated: true,
          });
        }, 100);
      }
    }
  }, [currentVerse, shouldAutoScroll]);

  // Disable auto-scroll when user manually scrolls
  const handleScrollBegin = () => {
    setShouldAutoScroll(false);
  };

  // Re-enable auto-scroll after user stops scrolling for a while
  const handleScrollEnd = () => {
    // Re-enable auto-scroll after 3 seconds of no scrolling
    setTimeout(() => {
      setShouldAutoScroll(true);
    }, 3000);
  };

  if (verseDisplayData.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text
          style={{
            fontSize: Fonts.size.lg,
            color: colors.text,
            textAlign: 'center',
            marginBottom: Dimensions.spacing.md,
          }}>
          {t('audio.textMode', 'Text Mode')}
        </Text>
        <Text
          style={{
            fontSize: Fonts.size.base,
            color: colors.text + '80',
            textAlign: 'center',
          }}>
          {t('audio.noVerseText', 'No verse text available')}
        </Text>
      </View>
    );
  }

  const handleVersePress = (verseNumber: number) => {
    console.log(`Verse ${verseNumber} tapped`);

    // Find the verse and seek to its start time
    const verse = verseDisplayData.find(v => v.verseNumber === verseNumber);
    if (verse && onSeek) {
      console.log(
        `Seeking to verse ${verseNumber} at time ${verse.startTime}s`
      );
      onSeek(verse.startTime);
    }

    // Also call the verse press callback
    onVersePress?.(verseNumber);
  };

  return (
    <View style={{ flex: 1 }}>
      <GestureScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Dimensions.spacing.md }}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps='handled'
        nestedScrollEnabled={false}
        scrollEventThrottle={16}
        bounces={true}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}>
        {verseDisplayData.map(verse => {
          return (
            <TouchableOpacity
              key={verse.verseNumber}
              style={{
                marginBottom: Dimensions.spacing.md,
                padding: Dimensions.spacing.sm,
                backgroundColor: verse.isCurrentVerse
                  ? colors.primary + '20'
                  : 'transparent',
                borderRadius: Dimensions.radius.md,
                borderWidth: verse.isCurrentVerse ? 2 : 0,
                borderColor: verse.isCurrentVerse
                  ? colors.primary
                  : 'transparent',
              }}
              onPress={() => handleVersePress(verse.verseNumber)}
              activeOpacity={0.7}
              onLayout={event => {
                const { y } = event.nativeEvent.layout;
                handleVerseLayout(verse.verseNumber, y);
              }}>
              <View style={{ marginBottom: Dimensions.spacing.xs }}>
                <Text
                  style={{
                    fontSize: Fonts.size.sm,
                    fontWeight: Fonts.weight.bold,
                    color: verse.isCurrentVerse
                      ? colors.primary
                      : colors.text + '80',
                  }}>
                  Verse {verse.verseNumber}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: Fonts.size.base,
                  lineHeight: 24,
                  color: verse.isCurrentVerse
                    ? colors.text
                    : colors.text + '90',
                  fontWeight: verse.isCurrentVerse
                    ? Fonts.weight.medium
                    : Fonts.weight.normal,
                }}>
                {verse.text}
              </Text>
            </TouchableOpacity>
          );
        })}
      </GestureScrollView>
    </View>
  );
};

// Queue view component
interface QueueViewProps {
  title?: string | undefined;
  subtitle?: string | undefined;
}

const QueueView: React.FC<QueueViewProps> = ({
  title: _title,
  subtitle: _subtitle,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

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

  // Don't auto-initialize queue - let app start in flow mode with empty queue

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
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: Dimensions.spacing.sm,
                marginTop: getIndex() > 0 ? Dimensions.spacing.lg : 0,
                paddingHorizontal: Dimensions.spacing.sm,
              }}>
              <Text
                style={{
                  fontSize: Fonts.size.base,
                  fontWeight: Fonts.weight.bold,
                  color: colors.text,
                }}>
                {data.title}
              </Text>
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
              style={{
                backgroundColor: data.isDashed
                  ? colors.text + '05'
                  : colors.background,
                borderRadius: Dimensions.radius.md,
                padding: Dimensions.spacing.md,
                marginHorizontal: Dimensions.spacing.sm,
                borderWidth: 1,
                borderColor: data.isDashed
                  ? colors.text + '10'
                  : colors.text + '20',
                borderStyle: data.isDashed ? 'dashed' : 'solid',
              }}>
              <Text
                style={{
                  fontSize: Fonts.size.sm,
                  color: colors.text + '60',
                  textAlign: 'center',
                  fontStyle: 'italic',
                }}>
                {data.message}
              </Text>
            </View>
          );

        default:
          return null;
      }
    },
    [
      colors,
      currentItem,
      handleItemPress,
      handleRemoveFromUserQueue,
      handleMoveToUserQueue,
    ]
  );

  return (
    <View style={{ flex: 1, padding: Dimensions.spacing.md }}>
      <DraggableFlatList
        data={combinedItems}
        onDragEnd={handleCombinedDragEnd}
        keyExtractor={item => item.id}
        scrollEnabled={true}
        activationDistance={15}
        renderItem={renderCombinedItem}
        contentContainerStyle={{ paddingBottom: Dimensions.spacing.md }}
        showsVerticalScrollIndicator={true}
      />
    </View>
  );
};

// Content switcher with animation
interface ContentSwitcherProps {
  mode: ContentMode;
  verseDisplayData: VerseDisplayData[];
  currentTime: number;
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined;
  title?: string;
  subtitle?: string;
  slideAnimation?: Animated.SharedValue<number> | undefined;
}

const ContentSwitcher: React.FC<ContentSwitcherProps> = ({
  mode,
  verseDisplayData,
  currentTime,
  onVersePress,
  onSeek,
  title,
  subtitle,
  slideAnimation: externalSlideAnimation,
}) => {
  const internalSlideAnimation = useSharedValue(0);
  const slideAnimation = externalSlideAnimation || internalSlideAnimation;

  // Update animation when mode changes (only if using internal animation)
  React.useEffect(() => {
    if (!externalSlideAnimation) {
      slideAnimation.value = withTiming(mode === 'text' ? 0 : 1, {
        duration: 300,
      });
    }
  }, [mode, slideAnimation, externalSlideAnimation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${slideAnimation.value * -50}%` }],
  }));

  return (
    <View style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      {/* Content */}
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            width: '200%',
            height: '100%',
          },
          animatedStyle,
        ]}>
        <View style={{ width: '50%', height: '100%' }}>
          <TrackTextView
            verseDisplayData={verseDisplayData}
            currentTime={currentTime}
            onVersePress={onVersePress}
            onSeek={onSeek}
          />
        </View>
        <View style={{ width: '50%', height: '100%' }}>
          <QueueView title={title} subtitle={subtitle} />
        </View>
      </Animated.View>
    </View>
  );
};

// Expanded media content component
interface ExpandedMediaContentProps {
  onTextPress?: () => void;
  onQueuePress?: () => void;
  onVersionPress?: () => void;
  onVersePress?: (verseNumber: number) => void;
  onSeek?: (time: number) => void;
  currentMode?: ContentMode;
  slideAnimation?: Animated.SharedValue<number> | undefined;
}

const ExpandedMediaContent: React.FC<ExpandedMediaContentProps> = ({
  onTextPress,
  onQueuePress,
  onVersionPress,
  onVersePress,
  onSeek,
  currentMode = 'text',
  slideAnimation,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Get data from audio store
  const {
    currentRecording,
    currentChapter,
    currentTime,
    currentVerseDisplayData,
    bibleBooks,
    initializeBibleBooks,
  } = useAudioStore();

  // Get chapter info
  const title =
    currentChapter?.bookName ||
    currentRecording?.title ||
    t('audio.unknownBook', 'Unknown Book');
  const subtitle = currentChapter
    ? `Chapter ${currentChapter.chapterNumber}`
    : t('audio.unknownChapter', 'Unknown Chapter');

  // Ensure Bible books are initialized
  React.useEffect(() => {
    if (bibleBooks.length === 0) {
      initializeBibleBooks();
    }
  }, [bibleBooks.length, initializeBibleBooks]);

  // Get book data with proper image path
  const getBookWithImagePath = (
    bookName: string
  ): { imagePath?: string } | null => {
    if (!bookName || bibleBooks.length === 0) return null;

    const book = bibleBooks.find(b => b.name === bookName);
    return book || null;
  };

  // Render book image
  const renderBookImage = () => {
    const bookName = currentChapter?.bookName || title;
    const bookData = getBookWithImagePath(bookName);
    const imagePath = bookData?.imagePath;

    if (imagePath) {
      const imageSource = getBookImageSource(imagePath);
      if (imageSource) {
        return (
          <Image
            source={imageSource}
            style={{
              width: 100,
              height: 100,
              borderRadius: Dimensions.radius.md,
              tintColor: colors.text,
            }}
            resizeMode='contain'
          />
        );
      }
    }

    // Fallback to book emoji
    return (
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: Dimensions.radius.md,
          backgroundColor: colors.secondary + '30',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: 48, color: colors.text }}>📖</Text>
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        margin: 0,
        paddingHorizontal: Dimensions.spacing.md,
        paddingTop: Dimensions.spacing.md,
        paddingBottom: Dimensions.spacing.xs,
        backgroundColor: colors.background,
      }}
      testID='expanded-media-content'
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={() => {
        // Prevent scroll events from falling through by capturing them
      }}>
      {/* Book Info Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: Dimensions.spacing.md,
        }}>
        {/* Book Icon */}
        {renderBookImage()}

        {/* Book Name and Chapter */}
        <View style={{ marginLeft: Dimensions.spacing.sm, flex: 1 }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: Fonts.weight.bold,
              color: colors.text,
            }}
            numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={{
              fontSize: 24,
              fontWeight: Fonts.weight.bold,
              color: colors.text,
              marginTop: 2,
            }}>
            {subtitle}
          </Text>

          {/* Version Text */}
          <TouchableOpacity
            onPress={onVersionPress}
            style={{ marginTop: Dimensions.spacing.xs }}>
            <Text
              style={{
                fontSize: Fonts.size.sm,
                color: colors.text + '60', // Fainter text
                textAlign: 'left',
              }}>
              {t('audio.versionText', 'Midwest English - CLB')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Text and Queue Buttons Row */}
      <View
        style={{
          flexDirection: 'row',
          gap: Dimensions.spacing.md,
        }}>
        {/* Text Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            height: 28,
            backgroundColor:
              currentMode === 'text' ? colors.primary : colors.primary + '20',
            borderRadius: Dimensions.radius.md,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary,
          }}
          onPress={() => {
            onTextPress?.();
          }}
          testID='expanded-text-button'>
          <Text
            style={{
              fontSize: Fonts.size.base,
              fontWeight: Fonts.weight.medium,
              color:
                currentMode === 'text' ? colors.background : colors.primary,
            }}>
            {t('audio.text', 'Text')}
          </Text>
        </TouchableOpacity>

        {/* Queue Button */}
        <TouchableOpacity
          style={{
            flex: 1,
            height: 28,
            backgroundColor:
              currentMode === 'queue' ? colors.primary : colors.primary + '20',
            borderRadius: Dimensions.radius.md,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.primary,
          }}
          onPress={() => {
            onQueuePress?.();
          }}
          testID='expanded-queue-button'>
          <Text
            style={{
              fontSize: Fonts.size.base,
              fontWeight: Fonts.weight.medium,
              color:
                currentMode === 'queue' ? colors.background : colors.primary,
            }}>
            {t('audio.queue', 'Queue')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={{ flex: 1, marginTop: Dimensions.spacing.xs }}>
        <ContentSwitcher
          mode={currentMode}
          verseDisplayData={currentVerseDisplayData}
          currentTime={currentTime}
          onVersePress={onVersePress}
          onSeek={onSeek}
          title={title}
          subtitle={subtitle}
          slideAnimation={slideAnimation}
        />
      </View>
    </View>
  );
};

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  testID,
  onExpand: _onExpand,
  onClose: _onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Get all data from audio store
  const {
    currentRecording,
    currentChapter,
    currentTime,
    totalTime,
    isPlaying,
    playbackSpeed,
    currentVerseDisplayData,
    currentUIHelper,
    // Actions
    seek,
    previousVerse,
    nextVerse,
    playPrevious,
    togglePlayPause,
    onItemFinished,
  } = useAudioStore();

  // Expansion state management
  const [isExpanded, setIsExpanded] = useState(false);
  const screenHeight = RNDimensions.get('window').height;

  // Version popup state
  const [showVersionPopup, setShowVersionPopup] = useState(false);

  // Speed menu state
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const expansionValue = useSharedValue(0);

  // Drag gesture handling
  const startY = useSharedValue(0);

  // Handle expand/contract functionality
  const handleExpandContractPress = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    if (newExpanded) {
      // Expand
      expansionValue.value = withSpring(1, {
        damping: 20,
        stiffness: 300,
      });
    } else {
      // Contract
      expansionValue.value = withSpring(0, {
        damping: 20,
        stiffness: 300,
      });
    }
  };

  // Update isExpanded state when animation completes
  const updateExpansionState = (targetValue: number) => {
    setIsExpanded(targetValue === 1);
  };

  // Drag gesture handler - only responds to primarily vertical gestures
  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: (event, context) => {
        startY.value = expansionValue.value;
        context['startY'] = startY.value;
        context['initialX'] = event.translationX;
        context['initialY'] = event.translationY;
        context['shouldHandle'] = false; // Will be determined in onActive
      },
      onActive: (event, context) => {
        // Determine gesture direction early in the gesture
        const deltaX = Math.abs(
          event.translationX - (context['initialX'] as number)
        );
        const deltaY = Math.abs(
          event.translationY - (context['initialY'] as number)
        );

        // Only handle if this is primarily a vertical gesture
        // Allow some horizontal movement but prioritize vertical
        if (deltaY > 10 || deltaX < deltaY * 0.5) {
          context['shouldHandle'] = true;
        } else if (deltaX > 20 && deltaX > deltaY * 2) {
          // This is clearly a horizontal gesture - don't handle it
          context['shouldHandle'] = false;
          return;
        }

        // Only process vertical expansion if we should handle this gesture
        if (context['shouldHandle']) {
          // Calculate drag progress
          // Negative translationY means dragging up (expanding)
          // Positive translationY means dragging down (collapsing)
          const dragDistance = -event.translationY;
          const maxDragDistance = screenHeight * 0.3; // Allow dragging up to 30% of screen height

          // Calculate new expansion value based on drag distance
          const dragProgress = dragDistance / maxDragDistance;
          const newValue = Math.max(
            0,
            Math.min(1, (context['startY'] as number) + dragProgress)
          );

          expansionValue.value = newValue;
        }
      },
      onEnd: (event, context) => {
        // Only handle end if we were handling the gesture
        if (!context['shouldHandle']) {
          return;
        }

        // Determine final state based on velocity and position
        const velocity = -event.velocityY; // Negative velocityY means upward velocity
        const currentValue = expansionValue.value;

        // Velocity threshold for quick swipes (pixels per second)
        const velocityThreshold = 500;

        // Position threshold for slow drags
        const positionThreshold = 0.3;

        let targetValue: number;

        if (Math.abs(velocity) > velocityThreshold) {
          // Fast swipe - follow velocity direction
          targetValue = velocity > 0 ? 1 : 0;
        } else {
          // Slow drag - use position threshold
          targetValue = currentValue > positionThreshold ? 1 : 0;
        }

        // Animate to final position
        expansionValue.value = withSpring(targetValue, {
          damping: 20,
          stiffness: 300,
          velocity: velocity / 1000, // Pass velocity for natural feel
        });

        // Update React state
        runOnJS(updateExpansionState)(targetValue);
      },
    });

  // Horizontal swipe gesture handler for mode switching in expanded view
  const [expandedMode, setExpandedMode] = useState<ContentMode>('text');
  const horizontalSlideAnimation = useSharedValue(0); // 0 = text, 1 = queue

  // Update animation when mode changes (from button presses)
  React.useEffect(() => {
    horizontalSlideAnimation.value = withTiming(
      expandedMode === 'text' ? 0 : 1,
      {
        duration: 300,
      }
    );
  }, [expandedMode, horizontalSlideAnimation]);

  // Initialize queue when switching to queue mode if queue is empty
  React.useEffect(() => {
    const queueStore = useQueueStore.getState();

    if (expandedMode === 'queue') {
      // Set queue view as visible
      queueStore.setQueueViewVisible(true);

      const playMode = queueStore.getPlayMode();

      // Only initialize if we're in flow mode (queue is empty)
      if (playMode === 'flow' && currentRecording && currentChapter) {
        const currentSegment = currentUIHelper?.getCurrentSegment(currentTime);
        const trackInfo = {
          recordingId: currentRecording.id,
          bookName: currentChapter.bookName,
          chapterNumber: currentChapter.chapterNumber,
          currentTime: currentTime,
          totalDuration: currentChapter.totalDuration || 600,
          totalVerses: currentChapter.totalSegments,
          ...(currentSegment?.segmentNumber && {
            currentVerse: currentSegment.segmentNumber,
          }),
        };

        queueStore.initializeQueueWithTrack(trackInfo);
        console.log('Queue view opened: initialized queue with current track');
      }
    } else {
      // Set queue view as not visible
      queueStore.setQueueViewVisible(false);
    }
  }, [
    expandedMode,
    currentRecording,
    currentChapter,
    currentTime,
    currentUIHelper,
  ]);

  const horizontalGestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: (_, context) => {
        context['shouldHandle'] = false;
        context['startValue'] = horizontalSlideAnimation.value;
      },
      onActive: (event, context) => {
        const deltaX = Math.abs(event.translationX);
        const deltaY = Math.abs(event.translationY);

        // Only handle if this is clearly a horizontal gesture
        if (deltaX > 20 && deltaX > deltaY * 2) {
          context['shouldHandle'] = true;

          // Add visual feedback during drag - follow the user's finger
          const dragProgress = event.translationX / 200; // Adjust sensitivity
          const startValue = context['startValue'] as number;
          const newValue = Math.max(0, Math.min(1, startValue - dragProgress));
          horizontalSlideAnimation.value = newValue;
        }
      },
      onEnd: (event, context) => {
        if (!context['shouldHandle']) {
          // Reset animation to current mode if gesture wasn't handled
          horizontalSlideAnimation.value = withSpring(
            expandedMode === 'text' ? 0 : 1,
            {
              damping: 20,
              stiffness: 300,
            }
          );
          return;
        }

        // Determine final state based on velocity and position (same logic as expand/contract)
        const velocity = event.velocityX;
        const currentValue = horizontalSlideAnimation.value;

        // Velocity threshold for quick swipes (same as expand/contract)
        const velocityThreshold = 500;

        // Position threshold for slow drags (same as expand/contract)
        const positionThreshold = 0.3;

        let targetValue: number;

        if (Math.abs(velocity) > velocityThreshold) {
          // Fast swipe - follow velocity direction
          // Positive velocity = swipe right = go to text (0)
          // Negative velocity = swipe left = go to queue (1)
          targetValue = velocity > 0 ? 0 : 1;
        } else {
          // Slow drag - use position threshold
          targetValue = currentValue > positionThreshold ? 1 : 0;
        }

        // Always use spring animation (same as expand/contract)
        horizontalSlideAnimation.value = withSpring(targetValue, {
          damping: 20,
          stiffness: 300,
          velocity: velocity / 1000, // Pass velocity for natural feel
        });

        // Update mode state
        const newMode: ContentMode = targetValue === 0 ? 'text' : 'queue';
        if (newMode !== expandedMode) {
          runOnJS(setExpandedMode)(newMode);
        }
      },
    });

  // Get display text from audio store data
  const displayText = () => {
    const title = currentChapter?.bookName || currentRecording?.title;
    const subtitle = currentChapter
      ? `Chapter ${currentChapter.chapterNumber}`
      : '';

    if (title && subtitle) {
      return `${title} ${subtitle}`;
    }
    return title || t('audio.noAudioSelected');
  };

  // Version text component
  const VersionText: React.FC<{ style?: any }> = ({ style }) => (
    <TouchableOpacity onPress={() => setShowVersionPopup(true)}>
      <Text
        style={[
          {
            fontSize: Fonts.size.sm,
            color: colors.text + '60', // Fainter text
            textAlign: 'right',
          },
          style,
        ]}>
        {t('audio.versionText', 'Midwest English - CLB')}
      </Text>
    </TouchableOpacity>
  );

  // Speed control component
  const SpeedControl: React.FC<{ style?: any }> = ({ style }) => {
    return (
      <TouchableOpacity onPress={() => setShowSpeedMenu(true)} style={style}>
        <Text
          style={{
            fontSize: Fonts.size.lg,
            fontWeight: Fonts.weight.bold,
            color: colors.text,
            textAlign: 'right',
          }}>
          {playbackSpeed}x
        </Text>
      </TouchableOpacity>
    );
  };

  // Handle verse press - navigation handled by audio store
  const handleVersePress = (verseNumber: number) => {
    console.log(
      `Verse ${verseNumber} tapped - seeking handled by TrackTextView`
    );
  };

  // Calculate the height of the bottom controls section
  const bottomControlsHeight = 190; // Increased height for all controls: expand bar + title + progress + buttons + padding

  // Animated style for the expand/contract bar - provides visual feedback during drag
  const animatedBarStyle = useAnimatedStyle(() => {
    const expansion = expansionValue.value;
    return {
      backgroundColor: expansion > 0.1 ? '#888888' : '#666666', // Lighter when being dragged
      width: 100 + expansion * 20, // Slightly wider when expanded
    };
  });

  // Container animation - expands from bottom to fill most of screen
  const animatedContainerStyle = useAnimatedStyle(() => {
    const expansion = expansionValue.value;
    const expandedHeight = screenHeight - insets.top;
    const currentHeight =
      bottomControlsHeight +
      insets.bottom +
      (expandedHeight - (bottomControlsHeight + insets.bottom)) * expansion;

    return {
      position: 'absolute',
      bottom: 0, // Always extend to bottom of screen
      left: 0,
      right: 0,
      height: currentHeight,
    };
  });

  // Animation for middle area - grows upward while bottom stays fixed
  const animatedMiddleAreaStyle = useAnimatedStyle(() => {
    const expansion = expansionValue.value;
    const expandedHeight = screenHeight - insets.top;
    const maxMiddleHeight =
      expandedHeight - bottomControlsHeight - insets.bottom;
    const currentMiddleHeight = maxMiddleHeight * expansion;

    return {
      height: currentMiddleHeight,
      opacity: expansion > 0.1 ? 1 : 0, // Fade in when expanding
    };
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderRightWidth: 2,
      borderTopColor: colors.primary,
      borderLeftColor: colors.primary,
      borderRightColor: colors.primary,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      ...Dimensions.shadow.lg,
      zIndex: 1000,
      elevation: 1000, // Android-specific elevation
      opacity: 1, // Always 100% opaque
      flexDirection: 'column',
    },
    expandContractTouchArea: {
      paddingTop: Dimensions.spacing.xs, // Keep top thin as before
      paddingBottom: Dimensions.spacing.xs, // Keep bottom thin too
      paddingHorizontal: 0, // Full width touch area
      width: '100%', // Full width
      alignItems: 'center', // Center content
    },
    expandContractBar: {
      height: 5,
      borderRadius: 2.5,
      alignSelf: 'center',
      // Width and backgroundColor are handled by animatedBarStyle for drag feedback
    },
    middleArea: {
      flex: 1,
      backgroundColor: colors.background,
      // This area can be used for additional content when expanded
    },
    bottomControlsContainer: {
      paddingHorizontal: Dimensions.spacing.md,
      paddingTop: 2, // Minimal spacing for very tight layout
      paddingBottom: Dimensions.spacing.md + insets.bottom, // Add safe area padding back
      backgroundColor: colors.background,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.sm,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.medium,
      color: colors.text,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: Dimensions.spacing.lg,
    },
    circularButton: {
      width: Dimensions.component.controlButton.width,
      height: Dimensions.component.controlButton.height,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: Dimensions.radius.full,
    },
    primaryButton: {
      width: Dimensions.component.primaryControlButton.width,
      height: Dimensions.component.primaryControlButton.height,
    },
  });

  return (
    <Animated.View
      style={[styles.container, animatedContainerStyle]}
      testID={testID}
      accessibilityLabel={t('audio.audioPlayerControls')}>
      {/* Expand/Contract Bar - Always visible at the top of the container */}
      <PanGestureHandler
        onGestureEvent={gestureHandler}
        simultaneousHandlers={[]}
        shouldCancelWhenOutside={false}
        enableTrackpadTwoFingerGesture={false}>
        <Animated.View style={styles.expandContractTouchArea}>
          <TouchableOpacity
            onPress={handleExpandContractPress}
            testID='mini-player-expand-contract-bar'
            accessibilityLabel={
              isExpanded ? t('audio.contractPlayer') : t('audio.expandPlayer')
            }
            accessibilityRole='button'
            style={{
              paddingVertical: 8, // Back to original size
              paddingHorizontal: 0, // Remove horizontal padding since we want full width
              width: '100%', // Full width
              alignItems: 'center', // Center the visual bar
            }}>
            <Animated.View
              style={[styles.expandContractBar, animatedBarStyle]}
            />
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>

      {/* Middle Area - Animates height while bottom controls stay fixed */}
      <Animated.View style={[styles.middleArea, animatedMiddleAreaStyle]}>
        {/* When expanded, wrap the content with gesture handler for expand/contract */}
        {isExpanded ? (
          <PanGestureHandler
            onGestureEvent={gestureHandler}
            simultaneousHandlers={[]}
            shouldCancelWhenOutside={false}
            enableTrackpadTwoFingerGesture={false}
            activeOffsetY={[-20, 20]}
            failOffsetX={[-20, 20]}>
            <Animated.View style={{ flex: 1 }}>
              {/* Horizontal gesture handler for mode switching in expanded view */}
              <PanGestureHandler
                onGestureEvent={horizontalGestureHandler}
                simultaneousHandlers={[]}
                shouldCancelWhenOutside={false}
                enableTrackpadTwoFingerGesture={false}
                activeOffsetX={[-20, 20]}
                failOffsetY={[-20, 20]}>
                <Animated.View style={{ flex: 1 }}>
                  <ExpandedMediaContent
                    onTextPress={() => setExpandedMode('text')}
                    onQueuePress={() => setExpandedMode('queue')}
                    onVersionPress={() => setShowVersionPopup(true)}
                    onVersePress={handleVersePress}
                    onSeek={seek}
                    currentMode={expandedMode}
                    slideAnimation={horizontalSlideAnimation}
                  />
                </Animated.View>
              </PanGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        ) : (
          /* When collapsed, just show the content without gesture handling */
          <ExpandedMediaContent
            onTextPress={() => setExpandedMode('text')}
            onQueuePress={() => setExpandedMode('queue')}
            onVersionPress={() => setShowVersionPopup(true)}
            onVersePress={handleVersePress}
            onSeek={seek}
            currentMode={expandedMode}
            slideAnimation={horizontalSlideAnimation}
          />
        )}
      </Animated.View>

      {/* Bottom Controls - Fixed at bottom of container */}
      {!isExpanded ? (
        // When collapsed, wrap bottom controls with gesture handler for upward swipes
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          simultaneousHandlers={[]}
          shouldCancelWhenOutside={false}
          enableTrackpadTwoFingerGesture={false}>
          <Animated.View style={styles.bottomControlsContainer}>
            {/* Top Row: Text and Version/Speed */}
            <View style={styles.topRow}>
              <View style={styles.textContainer}>
                <Text style={styles.title} numberOfLines={1}>
                  {displayText()}
                </Text>
              </View>
              <VersionText style={{ marginLeft: Dimensions.spacing.sm }} />
            </View>

            {/* Progress Bar */}
            <ProgressBar
              currentTime={currentTime}
              totalTime={totalTime}
              onSeek={seek}
              seekable={totalTime > 0}
              testID='mini-player-progress'
              verseMarkers={currentVerseDisplayData.map(verse => ({
                verseNumber: verse.verseNumber,
                startTime: verse.startTime,
                endTime: verse.endTime,
              }))}
            />

            {/* Five Circular Control Buttons */}
            <View style={styles.controlsRow}>
              {/* Previous Chapter - « */}
              <TouchableOpacity
                onPress={playPrevious}
                style={[
                  styles.circularButton,
                  { backgroundColor: colors.primary + '20' },
                ]}
                testID='mini-player-previous-chapter'
                accessibilityLabel={t('audio.previousChapter')}>
                <PreviousChapterIcon size={20} color={colors.primary} />
              </TouchableOpacity>

              {/* Previous Verse - ‹ */}
              <TouchableOpacity
                onPress={previousVerse}
                style={[
                  styles.circularButton,
                  { backgroundColor: colors.primary + '20' },
                ]}
                testID='mini-player-previous-verse'
                accessibilityLabel={t('audio.previousVerse')}>
                <PreviousVerseIcon size={20} color={colors.primary} />
              </TouchableOpacity>

              {/* Play/Pause - Center button */}
              <TouchableOpacity
                onPress={togglePlayPause}
                style={[
                  styles.circularButton,
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ]}
                testID='mini-player-play-pause'
                accessibilityLabel={
                  isPlaying ? t('audio.pause') : t('audio.play')
                }>
                {isPlaying ? (
                  <PauseIcon size={28} color={colors.background} />
                ) : (
                  <PlayIcon size={28} color={colors.background} />
                )}
              </TouchableOpacity>

              {/* Next Verse - › */}
              <TouchableOpacity
                onPress={nextVerse}
                style={[
                  styles.circularButton,
                  { backgroundColor: colors.primary + '20' },
                ]}
                testID='mini-player-next-verse'
                accessibilityLabel={t('audio.nextVerse')}>
                <NextVerseIcon size={20} color={colors.primary} />
              </TouchableOpacity>

              {/* Next Chapter - » */}
              <TouchableOpacity
                onPress={onItemFinished}
                style={[
                  styles.circularButton,
                  { backgroundColor: colors.primary + '20' },
                ]}
                testID='mini-player-next-chapter'
                accessibilityLabel={t('audio.nextChapter')}>
                <NextChapterIcon size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </PanGestureHandler>
      ) : (
        <View style={styles.bottomControlsContainer}>
          {/* Top Row: Text and Version/Speed */}
          <View style={styles.topRow}>
            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>
                {displayText()}
              </Text>
            </View>
            <SpeedControl style={{ marginLeft: Dimensions.spacing.xs }} />
          </View>

          {/* Progress Bar */}
          <ProgressBar
            currentTime={currentTime}
            totalTime={totalTime}
            onSeek={seek}
            seekable={totalTime > 0}
            testID='mini-player-progress'
            verseMarkers={currentVerseDisplayData.map(
              (verse: VerseDisplayData) => ({
                verseNumber: verse.verseNumber,
                startTime: verse.startTime,
                endTime: verse.endTime,
              })
            )}
          />

          {/* Five Circular Control Buttons */}
          <View style={styles.controlsRow}>
            {/* Previous Chapter - « */}
            <TouchableOpacity
              onPress={playPrevious}
              style={[
                styles.circularButton,
                { backgroundColor: colors.primary + '20' },
              ]}
              testID='mini-player-previous-chapter'
              accessibilityLabel={t('audio.previousChapter')}>
              <PreviousChapterIcon size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Previous Verse - ‹ */}
            <TouchableOpacity
              onPress={previousVerse}
              style={[
                styles.circularButton,
                { backgroundColor: colors.primary + '20' },
              ]}
              testID='mini-player-previous-verse'
              accessibilityLabel={t('audio.previousVerse')}>
              <PreviousVerseIcon size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Play/Pause - Center button */}
            <TouchableOpacity
              onPress={togglePlayPause}
              style={[
                styles.circularButton,
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
              testID='mini-player-play-pause'
              accessibilityLabel={
                isPlaying ? t('audio.pause') : t('audio.play')
              }>
              {isPlaying ? (
                <PauseIcon size={28} color={colors.background} />
              ) : (
                <PlayIcon size={28} color={colors.background} />
              )}
            </TouchableOpacity>

            {/* Next Verse - › */}
            <TouchableOpacity
              onPress={nextVerse}
              style={[
                styles.circularButton,
                { backgroundColor: colors.primary + '20' },
              ]}
              testID='mini-player-next-verse'
              accessibilityLabel={t('audio.nextVerse')}>
              <NextVerseIcon size={20} color={colors.primary} />
            </TouchableOpacity>

            {/* Next Chapter - » */}
            <TouchableOpacity
              onPress={onItemFinished}
              style={[
                styles.circularButton,
                { backgroundColor: colors.primary + '20' },
              ]}
              testID='mini-player-next-chapter'
              accessibilityLabel={t('audio.nextChapter')}>
              <NextChapterIcon size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Version Change Popup */}
      <Modal
        visible={showVersionPopup}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowVersionPopup(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowVersionPopup(false)}>
          <View
            style={{
              backgroundColor: colors.background,
              padding: Dimensions.spacing.xl,
              borderRadius: Dimensions.radius.lg,
              margin: Dimensions.spacing.xl,
              maxWidth: '80%',
            }}>
            <Text
              style={{
                fontSize: Fonts.size.lg,
                fontWeight: Fonts.weight.bold,
                color: colors.text,
                textAlign: 'center',
                marginBottom: Dimensions.spacing.md,
              }}>
              {t('audio.versionChange', 'Version Change')}
            </Text>
            <Text
              style={{
                fontSize: Fonts.size.base,
                color: colors.text,
                textAlign: 'center',
                marginBottom: Dimensions.spacing.lg,
              }}>
              {t(
                'audio.versionChangePending',
                'Version change feature pending'
              )}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                padding: Dimensions.spacing.md,
                borderRadius: Dimensions.radius.md,
                alignItems: 'center',
              }}
              onPress={() => setShowVersionPopup(false)}>
              <Text
                style={{
                  color: colors.background,
                  fontSize: Fonts.size.base,
                  fontWeight: Fonts.weight.medium,
                }}>
                {t('common.ok', 'OK')}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Speed Change Menu */}
      <Modal
        visible={showSpeedMenu}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowSpeedMenu(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setShowSpeedMenu(false)}>
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: Dimensions.radius.lg,
              margin: Dimensions.spacing.xl,
              maxWidth: '60%',
              minWidth: '40%',
            }}>
            <Text
              style={{
                fontSize: Fonts.size.lg,
                fontWeight: Fonts.weight.bold,
                color: colors.text,
                textAlign: 'center',
                padding: Dimensions.spacing.lg,
                borderBottomWidth: 1,
                borderBottomColor: colors.text + '20',
              }}>
              {t('audio.playbackSpeed', 'Playback Speed')}
            </Text>

            {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(speed => (
              <TouchableOpacity
                key={speed}
                style={{
                  padding: Dimensions.spacing.md,
                  backgroundColor:
                    playbackSpeed === speed
                      ? colors.primary + '20'
                      : 'transparent',
                }}
                onPress={() => {
                  // TODO: Implement speed change in audio store
                  console.log(`Setting speed to ${speed}x`);
                  setShowSpeedMenu(false);
                }}>
                <Text
                  style={{
                    fontSize: Fonts.size.base,
                    color:
                      playbackSpeed === speed ? colors.primary : colors.text,
                    textAlign: 'center',
                    fontWeight:
                      playbackSpeed === speed
                        ? Fonts.weight.bold
                        : Fonts.weight.normal,
                  }}>
                  {speed}x
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
};
