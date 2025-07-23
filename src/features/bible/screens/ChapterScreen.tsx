import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useMediaPlayer } from '../../../shared/context/MediaPlayerContext';
import { useChapters } from '../hooks/useChapters';
import { ChapterCard } from '../components/ChapterCard';
import type { Book, ChapterWithMetadata } from '../types';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';

type ChapterScreenProps = NativeStackScreenProps<
  BibleStackParamList,
  'BibleChapters'
>;

export const ChapterScreen: React.FC = () => {
  const { theme } = useTheme();
  const { actions: mediaActions } = useMediaPlayer();
  const navigation =
    useNavigation<NativeStackNavigationProp<BibleStackParamList>>();
  const route = useRoute<ChapterScreenProps['route']>();

  const { book } = route.params;
  const { chapters, loading, error } = useChapters(book.id);

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
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    playButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
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

  const createMockTrackForChapter = (
    chapter: ChapterWithMetadata
  ): import('../../../shared/context/MediaPlayerContext').MediaTrack => {
    // Estimate duration based on verse count (rough calculation)
    const estimatedDuration = chapter.total_verses * 20; // ~20 seconds per verse

    return {
      id: `${book.id}-${chapter.id}`,
      title: `${book.name} - Chapter ${chapter.chapter_number}`,
      subtitle: `${chapter.total_verses} verses • ${Math.floor(estimatedDuration / 60)}:${(estimatedDuration % 60).toString().padStart(2, '0')}`,
      duration: estimatedDuration,
      currentTime: 0,
      book: book.name,
      chapter: `Chapter ${chapter.chapter_number}`,
      url: `mock://audio/${book.id}/${chapter.id}`, // Mock URL for testing
    };
  };

  // formatVerseCount moved to ChapterCard component

  const handleChapterPress = (chapter: ChapterWithMetadata) => {
    // Navigate to verses screen using React Navigation
    navigation.navigate('BibleVerses', { book, chapter });
  };

  // handleBackFromVerses no longer needed with React Navigation

  const handlePlayFromFirstChapter = () => {
    // Play from the first chapter
    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      if (firstChapter) {
        const mockTrack = createMockTrackForChapter(firstChapter);

        console.log('Playing from first chapter:', firstChapter);
        mediaActions.setCurrentTrack(mockTrack);
        mediaActions.play();
      }
    }
  };

  const handlePlayChapter = (chapter: ChapterWithMetadata) => {
    // Create mock track data and load it into the media player
    const mockTrack = createMockTrackForChapter(chapter);

    console.log('Playing chapter:', chapter);
    console.log('Mock track data:', mockTrack);

    // Set the track and start playback
    mediaActions.setCurrentTrack(mockTrack);
    mediaActions.play();
  };

  const handleQueueChapter = (chapter: ChapterWithMetadata) => {
    // TODO: Implement queue chapter functionality
    console.log('Queue chapter:', chapter);
  };

  const renderChapterCard = ({
    item: chapter,
  }: {
    item: ChapterWithMetadata;
  }) => (
    <ChapterCard
      chapter={chapter}
      onPress={handleChapterPress}
      onQueue={handleQueueChapter}
      onPlay={handlePlayChapter}
      isAvailable={chapter.isAvailable} // Use the isAvailable field from metadata
      isCloudAvailable={true} // Always available in cloud since it's in our database
    />
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

  // Note: VersesScreen is now handled by React Navigation, no longer needed here

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
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
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.playButton}
            onPress={handlePlayFromFirstChapter}>
            <MaterialIcons
              name='play-arrow'
              size={24}
              color={theme.colors.textInverse}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};
