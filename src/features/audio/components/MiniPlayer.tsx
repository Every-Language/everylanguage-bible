import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions as RNDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
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

interface MiniPlayerProps {
  title?: string;
  subtitle?: string;
  imagePath?: string;
  isPlaying?: boolean;
  currentTime?: number; // in seconds
  totalTime?: number; // in seconds
  onPlayPause?: () => void;
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
  onPreviousVerse?: () => void;
  onNextVerse?: () => void;
  onSeek?: (time: number) => void;
  onExpand?: () => void;
  onClose?: () => void; // Close/hide the player
  testID?: string;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  title,
  subtitle,
  isPlaying = false,
  currentTime = 0,
  totalTime = 0,
  onPlayPause,
  onPreviousChapter,
  onNextChapter,
  onPreviousVerse,
  onNextVerse,
  onSeek,
  testID,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Expansion state management
  const [isExpanded, setIsExpanded] = useState(false);
  const screenHeight = RNDimensions.get('window').height;

  const expansionValue = useSharedValue(0);

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

  // Combine title and subtitle into a single display text
  const displayText = () => {
    if (title && subtitle) {
      return `${title} ${subtitle}`;
    }
    return title || t('audio.noAudioSelected');
  };

  // Calculate the height of the bottom controls section
  const bottomControlsHeight = 190; // Increased height for all controls: expand bar + title + progress + buttons + padding

  // Container animation - expands from bottom to fill most of screen
  const animatedContainerStyle = useAnimatedStyle(() => {
    const expansion = expansionValue.value;

    if (expansion === 0) {
      // Collapsed state - container extends to bottom of screen, content above safe area
      return {
        position: 'absolute',
        bottom: 0, // Extend to bottom of screen
        left: 0,
        right: 0,
        height: bottomControlsHeight + insets.bottom, // Add safe area to height
      };
    } else {
      // Expanded state - fills from top safe area to bottom of screen
      const expandedHeight = screenHeight - insets.top;
      const currentHeight =
        bottomControlsHeight +
        insets.bottom +
        (expandedHeight - (bottomControlsHeight + insets.bottom)) * expansion;

      return {
        position: 'absolute',
        bottom: 0, // Extend to bottom of screen
        left: 0,
        right: 0,
        height: currentHeight,
      };
    }
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
      borderTopLeftRadius: Dimensions.radius.xl,
      borderTopRightRadius: Dimensions.radius.xl,
      ...Dimensions.shadow.lg,
      zIndex: 1000,
      opacity: 1, // Always 100% opaque
      flexDirection: 'column',
    },
    expandContractTouchArea: {
      paddingVertical: Dimensions.spacing.md,
      paddingHorizontal: Dimensions.spacing.xl,
      alignSelf: 'center',
    },
    expandContractBar: {
      width: 100,
      height: 5,
      backgroundColor: '#666666',
      borderRadius: 2.5,
      alignSelf: 'center',
    },
    middleArea: {
      flex: 1,
      backgroundColor: colors.background,
      // This area can be used for additional content when expanded
    },
    bottomControlsContainer: {
      paddingHorizontal: Dimensions.spacing.md,
      paddingTop: Dimensions.spacing.sm, // Reduced from md to sm for less space between expand bar and title
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
      {/* Expand/Contract Bar - Always at the top of the container */}
      <TouchableOpacity
        style={styles.expandContractTouchArea}
        onPress={handleExpandContractPress}
        testID='mini-player-expand-contract-bar'
        accessibilityLabel={
          isExpanded ? t('audio.contractPlayer') : t('audio.expandPlayer')
        }
        accessibilityRole='button'>
        <View style={styles.expandContractBar} />
      </TouchableOpacity>

      {/* Middle Area - Only visible when expanded */}
      {isExpanded && (
        <View style={styles.middleArea}>
          {/* This area can be used for additional content like album art, lyrics, etc. */}
        </View>
      )}

      {/* Bottom Controls - Fixed at bottom of container */}
      <View style={styles.bottomControlsContainer}>
        {/* Top Row: Text Only */}
        <View style={styles.topRow}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {displayText()}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <ProgressBar
          currentTime={currentTime}
          totalTime={totalTime}
          onSeek={onSeek}
          seekable={!!onSeek && totalTime > 0}
          testID='mini-player-progress'
        />

        {/* Five Circular Control Buttons */}
        <View style={styles.controlsRow}>
          {/* Previous Chapter - « */}
          <TouchableOpacity
            onPress={onPreviousChapter}
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
            onPress={onPreviousVerse}
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
            onPress={onPlayPause}
            style={[
              styles.circularButton,
              styles.primaryButton,
              { backgroundColor: colors.primary },
            ]}
            testID='mini-player-play-pause'
            accessibilityLabel={isPlaying ? t('audio.pause') : t('audio.play')}>
            {isPlaying ? (
              <PauseIcon size={28} color={colors.background} />
            ) : (
              <PlayIcon size={28} color={colors.background} />
            )}
          </TouchableOpacity>

          {/* Next Verse - › */}
          <TouchableOpacity
            onPress={onNextVerse}
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
            onPress={onNextChapter}
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
    </Animated.View>
  );
};
