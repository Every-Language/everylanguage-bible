import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
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
  ChevronDownIcon,
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
  imagePath,
  isPlaying = false,
  currentTime = 0,
  totalTime = 0,
  onPlayPause,
  onPreviousChapter,
  onNextChapter,
  onPreviousVerse,
  onNextVerse,
  onSeek,
  onExpand,
  onClose,
  testID,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: Dimensions.layout.miniPlayerHeight + insets.bottom,
      backgroundColor: colors.background,
      paddingHorizontal: Dimensions.spacing.md,
      paddingVertical: Dimensions.spacing.md,
      paddingBottom: Dimensions.spacing.md + insets.bottom,
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderTopColor: colors.primary,
      borderLeftColor: colors.primary,
      borderRightColor: colors.primary,
      borderTopLeftRadius: Dimensions.radius.xl,
      borderTopRightRadius: Dimensions.radius.xl,
      ...Dimensions.shadow.lg,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.sm,
    },
    albumArt: {
      width: Dimensions.component.miniPlayerImage.width,
      height: Dimensions.component.miniPlayerImage.height,
      borderRadius: Dimensions.radius.md,
      marginRight: Dimensions.spacing.md,
    },
    fallbackArt: {
      width: Dimensions.component.miniPlayerImage.width,
      height: Dimensions.component.miniPlayerImage.height,
      borderRadius: Dimensions.radius.md,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: Dimensions.spacing.md,
    },
    fallbackText: {
      fontSize: 32,
      color: colors.primary,
    },
    textContainer: {
      flex: 1,
      marginRight: Dimensions.spacing.md,
    },
    title: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.medium,
      color: colors.text,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
    },
    subtitleButton: {
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    expandButton: {
      width: Dimensions.component.controlButton.width,
      height: Dimensions.component.controlButton.height,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: Dimensions.radius.full,
      backgroundColor: colors.background,
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
    <TouchableOpacity
      style={styles.container}
      onPress={onExpand}
      testID={testID}
      accessibilityLabel={t('audio.audioPlayerControls')}
      activeOpacity={0.9}>
      {/* Top Row: Album Art, Text, Expand Button */}
      <View style={styles.topRow}>
        {imagePath ? (
          <Image source={{ uri: imagePath }} style={styles.albumArt} />
        ) : (
          <View style={styles.fallbackArt}>
            <Text style={styles.fallbackText}>📖</Text>
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title || t('audio.noAudioSelected')}
          </Text>
          {subtitle && (
            <TouchableOpacity
              style={styles.subtitleButton}
              onPress={onClose}
              accessibilityLabel={t('audio.closePlayer')}
              testID='mini-player-close-subtitle'>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.expandButton}
          onPress={onExpand}
          accessibilityLabel={t('audio.expandPlayer')}>
          <ChevronDownIcon size={20} color={colors.text} />
        </TouchableOpacity>
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
    </TouchableOpacity>
  );
};
