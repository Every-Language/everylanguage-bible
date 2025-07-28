import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import type { ChapterWithMetadata } from '../types';
import { MediaAvailabilityStatus } from '@/shared/services/database/LocalDataService';

interface ChapterCardProps {
  chapter: ChapterWithMetadata;
  onPress: (chapter: ChapterWithMetadata) => void;
  onQueue?: (chapter: ChapterWithMetadata) => void;
  onPlay?: (chapter: ChapterWithMetadata) => void;
  /** Whether the chapter content is available in the cloud for download */
  isCloudAvailable?: boolean;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  onPress,
  onQueue,
  onPlay,
  isCloudAvailable = true,
}) => {
  const { theme } = useTheme();
  const { state: mediaState } = useMediaPlayer();

  const formatVerseCount = (count: number) => {
    return count === 1 ? '1 verse' : `${count} verses`;
  };

  // Check if this chapter is currently playing
  const isCurrentlyPlaying =
    mediaState.currentTrack?.id === `${chapter.book_id}-${chapter.id}` &&
    mediaState.isPlaying;

  const styles = StyleSheet.create({
    chapterCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      // Add border when playing
      borderWidth: isCurrentlyPlaying ? 2 : 0,
      borderColor: isCurrentlyPlaying ? theme.colors.primary : 'transparent',
    },
    chapterInfo: {
      flex: 1,
    },
    chapterTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 4,
    },
    verseCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    availabilityIcons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginRight: 8,
    },
    availabilityIcon: {
      padding: 2,
    },
    chapterActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    actionButton: {
      padding: 8,
    },
    playButton: {
      backgroundColor: isCurrentlyPlaying
        ? theme.colors.success
        : theme.colors.primary,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  const handlePlayPress = () => {
    if (onPlay) {
      onPlay(chapter);
    }
  };

  return (
    <TouchableOpacity
      style={styles.chapterCard}
      onPress={() => onPress(chapter)}>
      <View style={styles.chapterInfo}>
        <Text style={styles.chapterTitle}>
          Chapter {chapter.chapter_number}
        </Text>
        <Text style={styles.verseCount}>
          {formatVerseCount(chapter.total_verses)}
        </Text>
      </View>
      <View style={styles.availabilityIcons}>
        {/* Cloud icon - shows if content is available in cloud */}
        {isCloudAvailable && (
          <View style={styles.availabilityIcon}>
            <MaterialIcons
              name='cloud'
              size={16}
              color={theme.colors.textSecondary}
            />
          </View>
        )}
        {/* Media availability icons */}
        {chapter.mediaAvailability === MediaAvailabilityStatus.COMPLETE && (
          <View style={styles.availabilityIcon}>
            <MaterialIcons
              name='check-circle'
              size={16}
              color={theme.colors.primary}
            />
          </View>
        )}
        {chapter.mediaAvailability === MediaAvailabilityStatus.PARTIAL && (
          <View style={styles.availabilityIcon}>
            <MaterialIcons
              name='warning'
              size={16}
              color={theme.colors.warning || '#ff9800'}
            />
          </View>
        )}
        {/* Verses marked indicator */}
        {chapter.mediaAvailability !== MediaAvailabilityStatus.NONE &&
          !chapter.versesMarked && (
            <View style={styles.availabilityIcon}>
              <MaterialIcons
                name='schedule'
                size={16}
                color={theme.colors.textSecondary}
              />
            </View>
          )}
      </View>
      <View style={styles.chapterActions}>
        {onQueue && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onQueue(chapter)}>
            <MaterialIcons
              name='more-horiz'
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {onPlay &&
          (chapter.mediaAvailability === MediaAvailabilityStatus.COMPLETE ||
            chapter.mediaAvailability === MediaAvailabilityStatus.PARTIAL) &&
          chapter.versesMarked && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayPress}>
              <MaterialIcons
                name={isCurrentlyPlaying ? 'pause' : 'play-arrow'}
                size={20}
                color={theme.colors.textInverse}
              />
            </TouchableOpacity>
          )}
      </View>
    </TouchableOpacity>
  );
};
