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
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTheme } from '@/shared/hooks';
import { PlayButton } from '@/shared/components';
import { useVersesWithTextsQuery } from '../hooks/useBibleQueries';
import { VerseCard } from '@/features/bible/components/VerseCard';
import { useCurrentVersions } from '../../languages/hooks';

import type {
  LocalVerseText,
  LocalVerse,
} from '../../../shared/services/database/schema';
import { useUnifiedMediaPlayer } from '../../media/hooks/useUnifiedMediaPlayer';
import type { MediaTrack } from '@/shared/store/mediaPlayerStore';
import type { Chapter, Verse } from '../types';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';
import { logger } from '../../../shared/utils/logger';
import { ChapterDownloadModal } from '../../downloads/components/ChapterDownloadModal';
import { useChapterAudioInfo } from '../../media/hooks/useChapterAudioInfo';

type VersesScreenProps = NativeStackScreenProps<
  BibleStackParamList,
  'BibleVerses'
>;

export const VersesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { actions: mediaActions } = useUnifiedMediaPlayer();
  const navigation =
    useNavigation<NativeStackNavigationProp<BibleStackParamList>>();
  const route = useRoute<VersesScreenProps['route']>();

  const { book, chapter } = route.params;
  const { currentTextVersion } = useCurrentVersions();

  const {
    data: versesWithTexts = [],
    isLoading: loading,
    error: versesError,
    refetch: refetchVerses,
    isRefetching,
  } = useVersesWithTextsQuery(chapter.id, currentTextVersion?.id);

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);

  // Check media availability for this chapter
  const { data: audioInfo, isLoading: audioLoading } = useChapterAudioInfo(
    chapter.id
  );

  // Check if media is available and show download modal if not
  React.useEffect(() => {
    if (!audioLoading && audioInfo && !audioInfo.hasAudioFiles) {
      setShowDownloadModal(true);
    }
  }, [audioInfo, audioLoading]);

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

  const formatChapterTitle = (chapter: Chapter) => {
    return `Chapter ${chapter.chapter_number}`;
  };

  const formatDuration = (totalVerses: number) => {
    // Placeholder duration calculation - you can implement actual duration logic later
    const estimatedMinutes = Math.ceil(totalVerses * 0.3); // Rough estimate
    const minutes = Math.floor(estimatedMinutes);
    const seconds = Math.round((estimatedMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const createMockTrackForChapter = (): MediaTrack => {
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

  const createMockTrackForVerse = (verse: Verse): MediaTrack => {
    // Estimate duration for a single verse (rough calculation)
    const estimatedDuration = 20; // ~20 seconds per verse

    return {
      id: `${book.id}-${chapter.id}-${verse.id}`,
      title: `${book.name} ${chapter.chapter_number}:${verse.verse_number}`,
      subtitle: `Verse ${verse.verse_number}`,
      duration: estimatedDuration,
      currentTime: 0,
      book: book.name,
      chapter: `Chapter ${chapter.chapter_number}`,
      verse: `Verse ${verse.verse_number}`,
      url: `mock://audio/${book.id}/${chapter.id}/${verse.id}`, // Mock URL for testing
    };
  };

  const handlePlayChapter = () => {
    // Create mock track data and load it into the media player
    const mockTrack = createMockTrackForChapter();

    logger.log('Playing chapter:', chapter);
    logger.log('Mock track data:', mockTrack);

    // Set the track and start playback
    mediaActions.setCurrentTrack(mockTrack);
    mediaActions.play();
  };

  const handleQueueChapter = () => {
    // TODO: Implement queue chapter functionality
    logger.log('Queue chapter:', chapter);
  };

  const handleShareChapter = () => {
    // TODO: Implement share chapter functionality
    logger.log('Share chapter:', chapter);
  };

  const handlePlayVerse = (verse: Verse) => {
    // Create mock track data and load it into the media player
    const mockTrack = createMockTrackForVerse(verse);

    logger.log('Playing verse:', verse);
    logger.log('Mock track data:', mockTrack);

    // Set the track and start playback
    mediaActions.setCurrentTrack(mockTrack);
    mediaActions.play();
  };

  const handleShareVerse = (verse: Verse) => {
    // TODO: Implement share verse functionality
    logger.log('Share verse:', verse);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  const renderVerseCard = (verseWithText: {
    verse: LocalVerse;
    verseText: LocalVerseText | null;
  }) => {
    const { verse, verseText } = verseWithText;
    return (
      <VerseCard
        key={verse.id}
        verse={verse}
        verseText={verseText}
        currentTextVersion={currentTextVersion}
        onPlay={handlePlayVerse}
        onShare={handleShareVerse}
        bookId={book.id}
        chapterId={chapter.id}
      />
    );
  };

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

    // Show sync button if no data after 3 retry attempts or if there's an error
    const shouldShowSyncButton =
      (versesError && versesWithTexts.length === 0) ||
      (!loading && !isRefetching && versesWithTexts.length === 0);

    if (shouldShowSyncButton) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name='cloud-download'
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.errorText}>
            {versesError instanceof Error
              ? versesError.message
              : 'No verses available for this chapter'}
          </Text>
          <Text
            style={[
              styles.syncDescription,
              { color: theme.colors.textSecondary },
            ]}>
            Download Bible content to view verses
          </Text>
          <TouchableOpacity
            style={[
              styles.syncButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => refetchVerses()}>
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
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.versesList}
        showsVerticalScrollIndicator={false}>
        {versesWithTexts.map(renderVerseCard)}
      </ScrollView>
    );
  };

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
            <Text style={styles.testament}>{book.name.toUpperCase()}</Text>
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
            onPress={handleShareChapter}>
            <MaterialIcons name='share' size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleQueueChapter}>
            <MaterialIcons
              name='playlist-add'
              size={24}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          <PlayButton
            type='chapter'
            id={`${book.id}-${chapter.id}`}
            size='large'
            onPress={handlePlayChapter}
          />
        </View>
      </View>
      {renderContent()}

      <ChapterDownloadModal
        book={book}
        visible={showDownloadModal}
        chapterTitle={formatChapterTitle(chapter)}
        chapterId={chapter.id}
        onClose={handleCloseDownloadModal}
      />
    </SafeAreaView>
  );
};
