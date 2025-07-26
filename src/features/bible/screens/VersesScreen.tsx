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
import { useTheme } from '../../../shared/context/ThemeContext';
import { useMediaPlayer } from '../../../shared/context/MediaPlayerContext';
import { useVerses } from '../hooks/useVerses';
import { VerseCard } from '@/features/bible/components/VerseCard';
import { useCurrentVersions } from '../../languages/hooks';
import { localDataService } from '../../../shared/services/database/LocalDataService';
import type { LocalVerseText } from '../../../shared/services/database/schema';
import type { Chapter, Verse } from '../types';
import type { BibleStackParamList } from '../navigation/BibleStackNavigator';
import { logger } from '../../../shared/utils/logger';

type VersesScreenProps = NativeStackScreenProps<
  BibleStackParamList,
  'BibleVerses'
>;

export const VersesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { actions: mediaActions } = useMediaPlayer();
  const navigation =
    useNavigation<NativeStackNavigationProp<BibleStackParamList>>();
  const route = useRoute<VersesScreenProps['route']>();

  const { book, chapter } = route.params;
  const { verses, loading, error } = useVerses(chapter.id);
  const { currentTextVersion } = useCurrentVersions();
  const [verseTexts, setVerseTexts] = React.useState<
    Map<string, LocalVerseText>
  >(new Map());
  const [loadingTexts, setLoadingTexts] = React.useState(false);

  // Load verse texts when currentTextVersion changes
  React.useEffect(() => {
    const loadVerseTexts = async () => {
      logger.log(
        '📖 VersesScreen - Loading verse texts for chapterId:',
        chapter.id
      );
      logger.log('📖 VersesScreen - Current text version:', currentTextVersion);

      if (!currentTextVersion) {
        logger.log(
          '📖 VersesScreen - No textVersion, setting verse texts to empty'
        );
        setVerseTexts(new Map());
        return;
      }

      try {
        setLoadingTexts(true);
        const textsMap = await localDataService.getVerseTextsForChapter(
          chapter.id,
          currentTextVersion.id
        );
        logger.log(
          '📖 VersesScreen - Loaded verse texts:',
          textsMap.size,
          'texts for version:',
          currentTextVersion.name
        );
        logger.log(
          '📖 VersesScreen - First few verse text IDs:',
          Array.from(textsMap.keys()).slice(0, 3)
        );
        setVerseTexts(textsMap);
      } catch (error) {
        logger.error('📖 VersesScreen - Error loading verse texts:', error);
        setVerseTexts(new Map());
      } finally {
        setLoadingTexts(false);
      }
    };

    loadVerseTexts();
  }, [chapter.id, currentTextVersion?.id]);

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
    return `Chapter ${chapter.chapter_number}`;
  };

  const formatDuration = (totalVerses: number) => {
    // Placeholder duration calculation - you can implement actual duration logic later
    const estimatedMinutes = Math.ceil(totalVerses * 0.3); // Rough estimate
    const minutes = Math.floor(estimatedMinutes);
    const seconds = Math.round((estimatedMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const createMockTrackForChapter =
    (): import('../../../shared/context/MediaPlayerContext').MediaTrack => {
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

  const createMockTrackForVerse = (
    verse: Verse
  ): import('../../../shared/context/MediaPlayerContext').MediaTrack => {
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

  const renderVerseCard = (verse: Verse) => {
    const verseText = verseTexts.get(verse.id) || null;
    return (
      <VerseCard
        key={verse.id}
        verse={verse}
        verseText={verseText}
        currentTextVersion={currentTextVersion}
        onPlay={handlePlayVerse}
        onShare={handleShareVerse}
      />
    );
  };

  const renderContent = () => {
    if (loading || loadingTexts) {
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
          <TouchableOpacity
            style={[styles.actionButton, styles.playButton]}
            onPress={handlePlayChapter}>
            <MaterialIcons
              name='play-arrow'
              size={24}
              color={theme.colors.textInverse}
            />
          </TouchableOpacity>
        </View>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};
