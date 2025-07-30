import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { PlayButton } from '@/shared/components';
import type { Verse } from '../types';

import type { LocalVerseText } from '../../../shared/services/database/schema';
import type { TextVersion } from '../../languages/types';

interface VerseCardProps {
  verse: Verse;
  verseText?: LocalVerseText | null;
  currentTextVersion?: TextVersion | null;
  onPlay?: (verse: Verse) => void;
  onShare?: (verse: Verse) => void;
  bookId?: string;
  chapterId?: string;
}

export const VerseCard: React.FC<VerseCardProps> = ({
  verse,
  verseText,
  currentTextVersion,
  onPlay,
  onShare,
  bookId,
  chapterId,
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    verseCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    verseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    verseNumber: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    versionName: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    verseActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    verseActionButton: {
      padding: 4,
    },

    verseContent: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.text,
    },
    placeholderText: {
      fontStyle: 'italic',
      color: theme.colors.textSecondary,
    },
  });

  const handlePlayPress = () => {
    if (onPlay) {
      onPlay(verse);
    }
  };

  return (
    <View style={styles.verseCard}>
      <View style={styles.verseHeader}>
        <View>
          <Text style={styles.verseNumber}>VERSE {verse.verse_number}</Text>
          {currentTextVersion && (
            <Text style={styles.versionName}>{currentTextVersion.name}</Text>
          )}
        </View>
        <View style={styles.verseActions}>
          {onShare && (
            <TouchableOpacity
              style={styles.verseActionButton}
              onPress={() => onShare(verse)}>
              <MaterialIcons
                name='more-horiz'
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          {onPlay && (
            <PlayButton
              type='verse'
              id={`${bookId}-${chapterId}-${verse.id}`}
              size='small'
              onPress={handlePlayPress}
            />
          )}
        </View>
      </View>

      {verseText ? (
        <Text style={styles.verseContent}>{verseText.verse_text}</Text>
      ) : (
        <Text style={[styles.verseContent, styles.placeholderText]}>
          {currentTextVersion
            ? `Text not available for ${currentTextVersion.name}`
            : 'No text version selected'}
        </Text>
      )}
    </View>
  );
};
