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
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  onPress,
  onQueue,
  onPlay,
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
