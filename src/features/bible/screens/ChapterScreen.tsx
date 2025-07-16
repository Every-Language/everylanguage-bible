import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useChapters } from '../hooks/useChapters';
import { VersesScreen } from './VersesScreen';
import type { Book, Chapter, Verse } from '../types';

interface ChapterScreenProps {
  book: Book;
  onBack: () => void;
  onPlayChapter?: (chapter: Chapter) => void;
  onQueueChapter?: (chapter: Chapter) => void;
  onPlayVerse?: (verse: Verse) => void;
  onQueueVerse?: (verse: Verse) => void;
  onShareChapter?: (chapter: Chapter) => void;
  onShareVerse?: (verse: Verse) => void;
}

export const ChapterScreen: React.FC<ChapterScreenProps> = ({
  book,
  onBack,
  onPlayChapter,
  onQueueChapter,
  onPlayVerse,
  onQueueVerse,
  onShareChapter,
  onShareVerse,
}) => {
  const { theme } = useTheme();
  const { chapters, loading, error } = useChapters(book.id);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
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
    bookTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 2,
    },
    chapterCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 4,
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
    chaptersList: {
      padding: 16,
    },
    chapterCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: theme.colors.border,
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

  const formatTestament = (_book: Book) => {
    // You can implement proper testament detection based on book data
    return 'OLD TESTAMENT'; // Placeholder
  };

  const formatChapterCount = (count: number) => {
    return count === 1 ? '1 chapter' : `${count} chapters`;
  };

  const formatVerseCount = (count: number) => {
    return count === 1 ? '1 verse' : `${count} verses`;
  };

  const handleChapterPress = (chapter: Chapter) => {
    setSelectedChapter(chapter);
  };

  const handleBackFromVerses = () => {
    setSelectedChapter(null);
  };

  const renderChapterCard = ({ item: chapter }: { item: Chapter }) => (
    <TouchableOpacity
      style={styles.chapterCard}
      onPress={() => handleChapterPress(chapter)}>
      <View style={styles.chapterInfo}>
        <Text style={styles.chapterTitle}>
          Chapter {chapter.chapter_number}
        </Text>
        <Text style={styles.verseCount}>
          {formatVerseCount(chapter.total_verses)}
        </Text>
      </View>
      <View style={styles.chapterActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onQueueChapter && onQueueChapter(chapter)}>
          <MaterialIcons
            name='playlist-add'
            size={20}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onPlayChapter && onPlayChapter(chapter)}>
          <MaterialIcons
            name='play-arrow'
            size={20}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
          <Text style={styles.loadingText}>Loading chapters...</Text>
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

    if (chapters.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name='library-books'
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.emptyText}>No chapters found for this book</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={chapters}
        renderItem={renderChapterCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chaptersList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // If a chapter is selected, show the VersesScreen
  if (selectedChapter) {
    return (
      <VersesScreen
        chapter={selectedChapter}
        onBack={handleBackFromVerses}
        onPlayVerse={onPlayVerse}
        _onQueueVerse={onQueueVerse}
        onPlayChapter={onPlayChapter}
        onQueueChapter={onQueueChapter}
        onShareChapter={onShareChapter}
        onShareVerse={onShareVerse}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <MaterialIcons
            name='arrow-back'
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.testament}>{formatTestament(book)}</Text>
          <Text style={styles.bookTitle}>{book.name}</Text>
          <Text style={styles.chapterCount}>
            {formatChapterCount(chapters.length)}
          </Text>
        </View>
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};
