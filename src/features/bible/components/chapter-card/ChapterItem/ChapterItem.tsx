import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/shared/store';
import { PlayIcon, PlusIcon } from '@/shared/components/ui/icons/AudioIcons';
import { createChapterItemStyles } from './ChapterItem.styles';

export interface ChapterItemProps {
  chapterNumber: number;
  verseCount: number;
  onPlay: () => void;
  onAddToQueue: () => void;
  onSwipeToVerse: () => void;
  testID?: string;
}

export const ChapterItem: React.FC<ChapterItemProps> = ({
  chapterNumber,
  verseCount,
  onPlay,
  onAddToQueue,
  onSwipeToVerse,
  testID,
}) => {
  const { colors } = useTheme();
  const styles = createChapterItemStyles(colors);

  // Gesture handler for swipe left detection
  const gestureHandler =
    useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
      onStart: (_, context) => {
        context['shouldHandle'] = false;
      },
      onActive: (event, context) => {
        const deltaX = Math.abs(event.translationX);
        const deltaY = Math.abs(event.translationY);

        // Only handle if this is clearly a horizontal gesture and moving left
        if (deltaX > 20 && deltaX > deltaY * 2 && event.translationX < -20) {
          context['shouldHandle'] = true;
        }
      },
      onEnd: (event, context) => {
        if (context['shouldHandle'] && event.translationX < -50) {
          // Swipe left detected - trigger verse view
          runOnJS(onSwipeToVerse)();
        }
      },
    });

  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      activeOffsetX={[-10, 10]}
      failOffsetY={[-20, 20]}>
      <Animated.View>
        <TouchableOpacity
          style={styles.container}
          onPress={onSwipeToVerse}
          testID={testID}
          activeOpacity={0.98}>
          <View style={styles.content}>
            <View style={styles.textContainer}>
              <Text style={styles.chapterTitle}>Chapter {chapterNumber}</Text>
              <Text style={styles.verseCount} numberOfLines={1}>
                {verseCount} verses
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              {/* Add to Queue Button */}
              <TouchableOpacity
                onPress={onAddToQueue}
                style={styles.actionButton}>
                <PlusIcon size={18} color={colors.background} />
              </TouchableOpacity>

              {/* Play Button */}
              <TouchableOpacity onPress={onPlay} style={styles.actionButton}>
                <PlayIcon size={20} color={colors.background} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
};
