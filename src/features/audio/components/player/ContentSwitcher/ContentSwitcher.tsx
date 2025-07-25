import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { VerseDisplayData } from '@/types/audio';
import { TrackTextView } from '../TrackTextView';
import { QueueView } from '../QueueView';
import { createContentSwitcherStyles } from './ContentSwitcher.styles';

// Content mode types
type ContentMode = 'text' | 'queue';

export interface ContentSwitcherProps {
  mode: ContentMode;
  verseDisplayData: VerseDisplayData[];
  currentTime: number;
  onVersePress?: ((verseNumber: number) => void) | undefined;
  onSeek?: ((time: number) => void) | undefined;
  title?: string;
  subtitle?: string;
  slideAnimation?: Animated.SharedValue<number> | undefined;
}

export const ContentSwitcher: React.FC<ContentSwitcherProps> = ({
  mode,
  verseDisplayData,
  currentTime,
  onVersePress,
  onSeek,
  title,
  subtitle,
  slideAnimation: externalSlideAnimation,
}) => {
  const styles = createContentSwitcherStyles();
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
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <View style={styles.viewContainer}>
          <TrackTextView
            verseDisplayData={verseDisplayData}
            currentTime={currentTime}
            onVersePress={onVersePress}
            onSeek={onSeek}
          />
        </View>
        <View style={styles.viewContainer}>
          <QueueView title={title} subtitle={subtitle} />
        </View>
      </Animated.View>
    </View>
  );
};
