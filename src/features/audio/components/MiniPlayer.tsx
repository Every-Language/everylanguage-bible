import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  // Combine title and subtitle into a single display text
  const displayText = () => {
    if (title && subtitle) {
      return `${title} ${subtitle}`;
    }
    return title || t('audio.noAudioSelected');
  };

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.md,
      paddingBottom: Dimensions.spacing.md + insets.bottom,
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
    expandContractBar: {
      width: 100,
      height: 5,
      backgroundColor: '#666666',
      borderRadius: 2.5,
      alignSelf: 'center',
      marginBottom: Dimensions.spacing.sm,
    },
  });

  return (
    <View
      style={styles.container}
      testID={testID}
      accessibilityLabel={t('audio.audioPlayerControls')}>
      {/* Decorative Bar - No functionality */}
      <View style={styles.expandContractBar} />

      {/* Content */}
      <View>
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
    </View>
  );
};
