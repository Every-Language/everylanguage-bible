import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useTheme } from '@/shared/hooks';
import { PlayButton } from '@/shared/components';
import { VerseCard } from '@/features/bible/components/VerseCard';
import { useCurrentVersions } from '../../languages/hooks';
import { useUnifiedMediaPlayer } from '../../media/hooks/useUnifiedMediaPlayer';
import { useAudioVersionValidation } from '../../media/hooks/useAudioVersionValidation';
import type { MediaTrack } from '@/shared/store/mediaPlayerStore';
import type { Chapter, Verse } from '../types';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';
import { logger } from '../../../shared/utils/logger';
import { ChapterDownloadModal } from '../../downloads/components/ChapterDownloadModal';
import { useChapterAudioInfo } from '../../media/hooks/useChapterAudioInfo';
import type { LocalVerseText } from '../../../shared/services/database/schema';
import { useVersesWithTextsQuery } from '../hooks/useBibleQueries';

type VersesScreenProps = NativeStackScreenProps<
  BibleStackParamList,
  'BibleVerses'
>;

export const VersesScreenOptimized: React.FC = () => {
  const { theme } = useTheme();
  const { actions: mediaActions } = useUnifiedMediaPlayer();
  const navigation =
    useNavigation<NativeStackNavigationProp<BibleStackParamList>>();
  const route = useRoute<VersesScreenProps['route']>();

  const { book, chapter } = route.params;
  const { currentTextVersion } = useCurrentVersions();

  // Audio version validation
  const { validateForDownload } = useAudioVersionValidation();

  // Download modal state
  const [showDownloadModal, setShowDownloadModal] = React.useState(false);

  // Check media availability for this chapter
  const { data: audioInfo, isLoading: audioLoading } = useChapterAudioInfo(
    chapter.id
  );

  // TanStack Query hooks
  const {
    data: versesWithTexts = [],
    isLoading: versesLoading,
    error: versesError,
    refetch: refetchVerses,
    isRefetching,
  } = useVersesWithTextsQuery(chapter.id, currentTextVersion?.id);

  // Check if media is available and show download modal if not
  React.useEffect(() => {
    const checkAudioAvailability = async () => {
      if (!audioLoading && audioInfo && !audioInfo.hasAudioFiles) {
        // Validate audio version before showing download modal
        const isValidVersion = await validateForDownload(chapter.id);
        if (isValidVersion) {
          setShowDownloadModal(true);
        } else {
          // If no valid audio version, don't show download modal
          // User needs to select an audio version first
          logger.warn(
            'No valid audio version selected for chapter:',
            chapter.id
          );
        }
      }
    };

    checkAudioAvailability();
  }, [audioInfo, audioLoading, validateForDownload, chapter.id]);

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
      gap: 12,
    },
    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: 16,
    },
    retryButton: {
      marginTop: 16,
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.colors.textInverse,
      fontSize: 16,
      fontWeight: '600',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    refreshControl: {
      backgroundColor: theme.colors.background,
    },
  });

  const formatChapterTitle = (chapter: Chapter) => {
    return `${book.name} ${chapter.chapter_number}`;
  };

  const formatDuration = (totalVerses: number) => {
    const estimatedMinutes = Math.ceil(totalVerses / 3); // Rough estimate: 3 verses per minute
    return `${totalVerses} verses • ~${estimatedMinutes} min read`;
  };

  const createMockTrackForChapter = (): MediaTrack => {
    return {
      id: `${book.id}-${chapter.id}`,
      title: formatChapterTitle(chapter),
      subtitle: book.name,
      duration: chapter.total_verses * 20, // Rough estimate: 20 seconds per verse
      currentTime: 0,
      book: book.name,
      chapter: chapter.chapter_number.toString(),
    };
  };

  const createMockTrackForVerse = (verse: Verse): MediaTrack => {
    return {
      id: `${book.id}-${chapter.id}-${verse.id}`,
      title: `${formatChapterTitle(chapter)}:${verse.verse_number}`,
      subtitle: book.name,
      duration: 20, // Rough estimate: 20 seconds per verse
      currentTime: 0,
      book: book.name,
      chapter: chapter.chapter_number.toString(),
      verse: verse.verse_number.toString(),
    };
  };

  const handlePlayChapter = async () => {
    // Audio version validation is handled in the unified media player
    const mockTrack = createMockTrackForChapter();
    logger.log('Playing chapter:', chapter);
    logger.log('Mock track data:', mockTrack);
    mediaActions.setCurrentTrack(mockTrack);
    mediaActions.play();
  };

  const handleQueueChapter = () => {
    logger.log('Queue chapter:', chapter);
  };

  const handleShareChapter = () => {
    logger.log('Share chapter:', chapter);
  };

  const handlePlayVerse = async (verse: Verse) => {
    // Audio version validation is handled in the unified media player
    const mockTrack = createMockTrackForVerse(verse);
    logger.log('Playing verse:', verse);
    logger.log('Mock track data:', mockTrack);
    mediaActions.setCurrentTrack(mockTrack);
    mediaActions.play();
  };

  const handleShareVerse = (verse: Verse) => {
    logger.log('Share verse:', verse);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  const handleRefresh = () => {
    refetchVerses();
  };

  const handleRetry = () => {
    if (versesError) {
      refetchVerses();
    }
  };

  const renderVerseCard = (verseWithText: {
    verse: Verse;
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
    if (versesLoading && !isRefetching) {
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

    if (versesError) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons
            name='error-outline'
            size={48}
            color={theme.colors.error}
          />
          <Text style={styles.errorText}>
            {versesError instanceof Error
              ? versesError.message
              : 'Failed to load verses'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (versesWithTexts.length === 0) {
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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
            style={styles.refreshControl}
          />
        }>
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
            <Text style={styles.testament}>
              {book.testament?.toUpperCase() || 'BIBLE'}
            </Text>
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
            <MaterialIcons
              name='share'
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleQueueChapter}>
            <MaterialIcons
              name='queue-music'
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
          <PlayButton
            type='chapter'
            id={`${book.id}-${chapter.id}`}
            size='medium'
            onPress={handlePlayChapter}
          />
        </View>
      </View>

      {renderContent()}

      <ChapterDownloadModal
        visible={showDownloadModal}
        book={book}
        chapterTitle={formatChapterTitle(chapter)}
        chapterId={chapter.id}
        onClose={handleCloseDownloadModal}
      />
    </SafeAreaView>
  );
};
