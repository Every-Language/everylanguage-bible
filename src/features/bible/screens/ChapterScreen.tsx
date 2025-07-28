import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
// import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  // NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTheme } from '../../../shared/context/ThemeContext';
import { useChapters } from '../hooks/useChapters';
import { ChapterCard } from '../components/ChapterCard';
import { useAudioService } from '../../media/hooks/useAudioService';
import { useMediaPlayer } from '../../../shared/context/MediaPlayerContext';
import type { MediaTrack } from '../../../shared/context/MediaPlayerContext';
import type { ChapterWithMetadata } from '../types';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';

import { logger } from '@/shared/utils/logger';
import { MediaAvailabilityStatus } from '@/shared/services/database/LocalDataService';
import { mediaFilesService } from '@/shared/services/database/MediaFilesService';

type ChapterScreenProps = NativeStackScreenProps<
  BibleStackParamList,
  'BibleChapters'
>;

export const ChapterScreen: React.FC<ChapterScreenProps> = ({
  route,
  navigation,
}) => {
  const { theme } = useTheme();
  const { book } = route.params;
  const { chapters, loading, error } = useChapters(book.id);
  const { actions: mediaActions } = useAudioService();
  const { state: mediaState } = useMediaPlayer();

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

  const formatTestament = useMemo(() => {
    // You can implement proper testament detection based on book data
    return 'OLD TESTAMENT'; // Placeholder
  }, []); // Empty dependency array since it's a static value for now

  const formatChapterCount = (count: number) => {
    return count === 1 ? '1 chapter' : `${count} chapters`;
  };

  const createTrackFromChapter = async (
    chapter: ChapterWithMetadata
  ): Promise<MediaTrack | null> => {
    try {
      // Get media files for this chapter
      const mediaFiles = await mediaFilesService.getMediaFilesByChapterId(
        chapter.id
      );

      if (!mediaFiles || mediaFiles.length === 0) {
        logger.warn('No media files found for chapter:', chapter.id);
        return null;
      }

      // Use the first media file for now (could be enhanced to handle multiple files)
      const mediaFile = mediaFiles[0];

      if (!mediaFile) {
        logger.warn('No valid media file found for chapter:', chapter.id);
        return null;
      }

      // Calculate total duration from all media files
      const totalDuration = mediaFiles.reduce(
        (sum, mf) => sum + (mf.duration_seconds || 0),
        0
      );

      return {
        id: `${book.id}-${chapter.id}`,
        title: `${book.name} - Chapter ${chapter.chapter_number}`,
        subtitle: `${chapter.total_verses} verses • ${Math.floor(totalDuration / 60)}:${(totalDuration % 60).toString().padStart(2, '0')}`,
        duration: totalDuration,
        currentTime: 0,
        book: book.name,
        chapter: `Chapter ${chapter.chapter_number}`,
        url: mediaFile.local_path, // Use the actual local path
      };
    } catch (error) {
      logger.error('Error creating track from chapter:', error);
      return null;
    }
  };

  // formatVerseCount moved to ChapterCard component

  const handleChapterPress = (chapter: ChapterWithMetadata) => {
    // Navigate to verses screen using React Navigation
    navigation.navigate('BibleVerses', { book: book, chapter });
  };

  // handleBackFromVerses no longer needed with React Navigation

  const handlePlayFromFirstChapter = async () => {
    // Play from the first chapter that has verses marked
    const firstChapterWithVersesMarked = chapters.find(
      chapter =>
        chapter.versesMarked &&
        (chapter.mediaAvailability === MediaAvailabilityStatus.COMPLETE ||
          chapter.mediaAvailability === MediaAvailabilityStatus.PARTIAL)
    );

    if (!firstChapterWithVersesMarked) return;

    // Create track and start playback
    const track = await createTrackFromChapter(firstChapterWithVersesMarked);
    if (track) {
      mediaActions.setCurrentTrack(track);
      mediaActions.play();
    } else {
      logger.warn('Could not create track for first chapter');
    }
  };

  const handlePlayChapter = async (chapter: ChapterWithMetadata) => {
    logger.info('Playing chapter:', chapter);
    logger.warn('Chapter media availability:', chapter);

    // Check if this chapter is currently playing
    const currentTrackId = `${book.id}-${chapter.id}`;
    const isCurrentlyPlaying =
      mediaState.currentTrack?.id === currentTrackId && mediaState.isPlaying;

    if (isCurrentlyPlaying) {
      // If currently playing, pause it
      await mediaActions.pause();
      return;
    }

    // Only play if verses are marked
    if (!chapter.versesMarked) {
      logger.warn('Cannot play chapter - verses not marked:', chapter.id);
      return;
    }

    // Create track and start playback
    const track = await createTrackFromChapter(chapter);
    if (track) {
      mediaActions.setCurrentTrack(track);
      mediaActions.play();
    } else {
      logger.warn('Could not create track for chapter:', chapter.id);
    }
  };

  const handleQueueChapter = (chapter: ChapterWithMetadata) => {
    // TODO: Implement queue chapter functionality
    logger.info('Queue chapter:', chapter);
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
            <Text style={styles.testament}>{formatTestament}</Text>
            <Text style={styles.bookTitle}>{book.name}</Text>
            <Text style={styles.chapterCount}>
              {formatChapterCount(chapters.length)}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {chapters.some(
            chapter =>
              (chapter.mediaAvailability === MediaAvailabilityStatus.COMPLETE ||
                chapter.mediaAvailability ===
                  MediaAvailabilityStatus.PARTIAL) &&
              chapter.versesMarked
          ) && (
            <TouchableOpacity
              style={styles.playButton}
              onPress={handlePlayFromFirstChapter}>
              <MaterialIcons
                name='play-arrow'
                size={24}
                color={theme.colors.textInverse}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};
