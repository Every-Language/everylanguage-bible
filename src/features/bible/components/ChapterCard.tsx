import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import type { Chapter } from '../types';

interface ChapterCardProps {
  chapter: Chapter;
  onPress: (chapter: Chapter) => void;
  onQueue?: (chapter: Chapter) => void;
  onPlay?: (chapter: Chapter) => void;
  /** Whether the chapter content is locally available for offline use */
  isAvailable?: boolean;
  /** Whether the chapter content is available in the cloud for download */
  isCloudAvailable?: boolean;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  onPress,
  onQueue,
  onPlay,
  isAvailable = false,
  isCloudAvailable = true,
}) => {
  const { theme } = useTheme();

  const formatVerseCount = (count: number) => {
    return count === 1 ? '1 verse' : `${count} verses`;
  };

  const styles = StyleSheet.create({
    chapterCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      // No border
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
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

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
        {/* Available icon - shows if content is locally available */}
        {isAvailable && (
          <View style={styles.availabilityIcon}>
            <MaterialIcons
              name='check-circle'
              size={16}
              color={theme.colors.primary}
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
        {onPlay && (
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => onPlay(chapter)}>
            <MaterialIcons
              name='play-arrow'
              size={20}
              color={theme.colors.textInverse}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};
