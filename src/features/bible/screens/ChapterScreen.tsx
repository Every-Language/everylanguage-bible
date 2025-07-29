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
import { useTheme } from '@/shared/hooks';
import { PlayButton } from '@/shared/components';
import { useChaptersWithMetadata } from '../hooks/useChaptersWithMetadata';
import { ChapterCard } from '../components/ChapterCard';

import { useUnifiedMediaPlayer } from '@/features/media/hooks/useUnifiedMediaPlayer';
import type { MediaTrack } from '@/shared/store/mediaPlayerStore';
import type { ChapterWithMetadata } from '../types';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';

import { logger } from '@/shared/utils/logger';
import { MediaAvailabilityStatus } from '@/shared/services/database/LocalDataService';
import {
  useChapterMediaFiles,
  chapterAudioQueryKeys,
} from '../../media/hooks/useChapterAudioInfo';
import { queryClient } from '@/shared/services/query/queryClient';

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
  const { chapters, loading, error, isRefetching, fetchChapters } =
    useChaptersWithMetadata(book.id);
  const { state: mediaState, actions: mediaActions } = useUnifiedMediaPlayer({
    autoPlay: true,
    onError: (error: string) => {
      logger.error('Media player error:', error);
    },
  });

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
    syncDescription: {
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 20,
      lineHeight: 20,
    },
    syncButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    syncButtonText: {
      fontSize: 16,
      fontWeight: '600',
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

  // Hook to get media files for the first chapter with verses marked
  const firstChapterWithVersesMarked = chapters.find(
    chapter =>
      chapter.versesMarked &&
      (chapter.mediaAvailability === MediaAvailabilityStatus.COMPLETE ||
        chapter.mediaAvailability === MediaAvailabilityStatus.PARTIAL)
  );

  const { data: firstChapterMediaFiles } = useChapterMediaFiles(
    firstChapterWithVersesMarked?.id || ''
  );

  const createTrackFromChapter = (
    chapter: ChapterWithMetadata,
    mediaFiles?: {
      mediaFiles: Array<{ local_path: string }>;
      totalDuration: number;
      hasAudioFiles: boolean;
    }
  ): MediaTrack | null => {
    try {
      if (!mediaFiles || !mediaFiles.hasAudioFiles) {
        logger.warn('No media files found for chapter:', chapter.id);
        return null;
      }

      const { mediaFiles: files, totalDuration } = mediaFiles;

      // Use the first media file for now (could be enhanced to handle multiple files)
      const mediaFile = files[0];

      if (!mediaFile) {
        logger.warn('No valid media file found for chapter:', chapter.id);
        return null;
      }

      return {
        id: `${chapter.book_id}-${chapter.id}`, // Use consistent ID format with ChapterCard
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
    if (!firstChapterWithVersesMarked) return;

    // Create track and start playback
    const track = createTrackFromChapter(
      firstChapterWithVersesMarked,
      firstChapterMediaFiles
    );
    if (track) {
      // Set the current track first to trigger MediaPlayerSheet appearance
      await mediaActions.setCurrentTrack(track);
      // Then start playing
      await mediaActions.play();
      // Keep the media player in collapsed state - user can expand manually if needed
    } else {
      logger.warn('Could not create track for first chapter');
    }
  };

  const handlePlayChapter = async (chapter: ChapterWithMetadata) => {
    logger.info('Playing chapter:', chapter);
    logger.warn('Chapter media availability:', chapter);

    // Check if this chapter is currently playing
    const currentTrackId = `${chapter.book_id}-${chapter.id}`; // Use consistent ID format
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

    // Get media files for this specific chapter using TanStack Query
    try {
      // Use TanStack Query cache to get media files
      const mediaFilesData = await queryClient.fetchQuery({
        queryKey: chapterAudioQueryKeys.audioAvailability(chapter.id),
        queryFn: async () => {
          const { mediaFilesService } = await import(
            '@/shared/services/database/MediaFilesService'
          );
          const mediaFiles = await mediaFilesService.getMediaFilesByChapterId(
            chapter.id
          );

          const totalDuration = mediaFiles.reduce(
            (sum, mf) => sum + (mf.duration_seconds || 0),
            0
          );
          const totalFileSize = mediaFiles.reduce(
            (sum, mf) => sum + (mf.file_size || 0),
            0
          );

          return {
            mediaFiles,
            totalDuration,
            totalFileSize,
            hasAudioFiles: mediaFiles.length > 0,
          };
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
      });

      if (!mediaFilesData.hasAudioFiles) {
        logger.warn('No media files found for chapter:', chapter.id);
        return;
      }

      // Create track and start playback
      const track = createTrackFromChapter(chapter, mediaFilesData);
      if (track) {
        // Set the current track first to trigger MediaPlayerSheet appearance
        await mediaActions.setCurrentTrack(track);
        // Then start playing
        await mediaActions.play();
        // Keep the media player in collapsed state - user can expand manually if needed
      } else {
        logger.warn('Could not create track for chapter:', chapter.id);
      }
    } catch (error) {
      logger.error('Error getting media files for chapter:', error);
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

    // Show sync button if no data after 3 retry attempts or if there's an error
    const shouldShowSyncButton =
      (error && chapters.length === 0) ||
      (!loading && !isRefetching && chapters.length === 0);

    if (shouldShowSyncButton) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name='cloud-download'
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.errorText}>
            {error || 'No chapters available for this book'}
          </Text>
          <Text
            style={[
              styles.syncDescription,
              { color: theme.colors.textSecondary },
            ]}>
            Download Bible content to view chapters
          </Text>
          <TouchableOpacity
            style={[
              styles.syncButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={fetchChapters}>
            <Text
              style={[
                styles.syncButtonText,
                { color: theme.colors.textInverse },
              ]}>
              Retry
            </Text>
          </TouchableOpacity>
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
            <PlayButton
              type='book'
              id={book.id}
              size='large'
              onPress={handlePlayFromFirstChapter}
            />
          )}
        </View>
      </View>
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
};
