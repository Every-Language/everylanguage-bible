import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useVerses } from '../hooks/useVerses';
import type { Chapter, Verse } from '../types';

interface VersesScreenProps {
  chapter: Chapter;
  onBack: () => void;
  onPlayVerse?: ((verse: Verse) => void) | undefined;
  _onQueueVerse?: ((verse: Verse) => void) | undefined;
  onPlayChapter?: ((chapter: Chapter) => void) | undefined;
  onQueueChapter?: ((chapter: Chapter) => void) | undefined;
  onShareChapter?: ((chapter: Chapter) => void) | undefined;
  onShareVerse?: ((verse: Verse) => void) | undefined;
}

export const VersesScreen: React.FC<VersesScreenProps> = ({
  chapter,
  onBack,
  onPlayVerse = () => {},
  _onQueueVerse = () => {},
  onPlayChapter = () => {},
  onQueueChapter = () => {},
  onShareChapter = () => {},
  onShareVerse = () => {},
}) => {
  const { theme } = useTheme();
  const { verses, loading, error } = useVerses(chapter.id);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      marginRight: 16,
    },
    headerContent: {
      flex: 1,
    },
    testament: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chapterTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 2,
    },
    duration: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    actionButton: {
      padding: 8,
    },
    playButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      padding: 8,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 12,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
    versesList: {
      padding: 16,
    },
    verseCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });

  const formatChapterTitle = (chapter: Chapter) => {
    // We'll need to get the book name - for now using placeholder
    return `Chapter ${chapter.chapter_number}`;
  };

  const formatDuration = (totalVerses: number) => {
    // Placeholder duration calculation - you can implement actual duration logic later
    const estimatedMinutes = Math.ceil(totalVerses * 0.3); // Rough estimate
    const minutes = Math.floor(estimatedMinutes);
    const seconds = Math.round((estimatedMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderVerseCard = (verse: Verse) => (
    <View key={verse.id} style={styles.verseCard}>
      <View style={styles.verseHeader}>
        <Text style={styles.verseNumber}>VERSE {verse.verse_number}</Text>
        <View style={styles.verseActions}>
          <TouchableOpacity
            style={styles.verseActionButton}
            onPress={() => onShareVerse(verse)}>
            <MaterialIcons
              name='more-horiz'
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.verseActionButton}
            onPress={() => onPlayVerse(verse)}>
            <MaterialIcons
              name='play-arrow'
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.verseContent, styles.placeholderText]}>
        Verse content will be available when text versions are implemented
      </Text>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <MaterialIcons
            name='hourglass-empty'
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.loadingText}>Loading verses...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name='error-outline'
            size={48}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (verses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name='library-books'
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>No verses found for this chapter</Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.versesList}
        showsVerticalScrollIndicator={false}>
        {verses.map(renderVerseCard)}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <MaterialIcons name='close' size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.testament}>OLD TESTAMENT</Text>
            <Text style={styles.chapterTitle}>
              {formatChapterTitle(chapter)}
            </Text>
            <Text style={styles.duration}>
              {formatDuration(chapter.total_verses)}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onShareChapter(chapter)}>
            <MaterialIcons name='share' size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onQueueChapter(chapter)}>
            <MaterialIcons
              name='playlist-add'
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.playButton]}
            onPress={() => onPlayChapter(chapter)}>
            <MaterialIcons name='play-arrow' size={24} color='white' />
          </TouchableOpacity>
        </View>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};
