import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { useCurrentVersions } from '../../languages/hooks';
import { localDataService } from '../../../shared/services/database/LocalDataService';
import type { LocalVerseText } from '../../../shared/services/database/schema';
import type { Verse } from '../../bible/types';

interface TextAndQueueTabsProps {
  // Optional prop to control the tab from parent if needed
  initialTab?: 'text' | 'queue';
}

export const TextAndQueueTabs: React.FC<TextAndQueueTabsProps> = ({
  initialTab = 'text',
}) => {
  const { theme } = useTheme();
  const { state } = useMediaPlayer();
  const { currentTextVersion } = useCurrentVersions();
  const [activeTab, setActiveTab] = useState<'text' | 'queue'>(initialTab);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [verseTexts, setVerseTexts] = useState<Map<string, LocalVerseText>>(
    new Map()
  );
  const [loadingVerses, setLoadingVerses] = useState(false);

  // Extract chapter ID from current track
  // Track ID format is "book-book-chapter" (e.g., "gen-gen-1")
  // We need to get the last two parts and join them: "gen-1"
  const extractChapterId = (
    trackId: string | undefined
  ): string | undefined => {
    if (!trackId) return undefined;
    const parts = trackId.split('-');
    if (parts.length >= 3) {
      // Take the last two parts and join them
      return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
    }
    return undefined;
  };

  const chapterId = extractChapterId(state.currentTrack?.id);

  // Load verses when chapter changes
  useEffect(() => {
    const loadVerses = async () => {
      console.log('🎵 Media Player - Loading verses for chapterId:', chapterId);
      console.log('🎵 Media Player - Current track:', state.currentTrack);

      if (!chapterId) {
        console.log('🎵 Media Player - No chapterId, setting verses to empty');
        setVerses([]);
        return;
      }

      try {
        setLoadingVerses(true);
        const versesData = await localDataService.getVersesForUI(chapterId);
        console.log(
          '🎵 Media Player - Loaded verses:',
          versesData.length,
          'verses'
        );
        setVerses(versesData);
      } catch (error) {
        console.error('🎵 Media Player - Error loading verses:', error);
        setVerses([]);
      } finally {
        setLoadingVerses(false);
      }
    };

    loadVerses();
  }, [chapterId]);

  // Load verse texts when text version changes
  useEffect(() => {
    const loadVerseTexts = async () => {
      console.log(
        '🎵 Media Player - Loading verse texts for chapterId:',
        chapterId
      );
      console.log(
        '🎵 Media Player - Current text version:',
        currentTextVersion
      );

      if (!chapterId || !currentTextVersion) {
        console.log(
          '🎵 Media Player - No chapterId or textVersion, setting verse texts to empty'
        );
        setVerseTexts(new Map());
        return;
      }

      try {
        const textsMap = await localDataService.getVerseTextsForChapter(
          chapterId,
          currentTextVersion.id
        );
        console.log(
          '🎵 Media Player - Loaded verse texts:',
          textsMap.size,
          'texts for version:',
          currentTextVersion.name
        );
        console.log(
          '🎵 Media Player - First few verse text IDs:',
          Array.from(textsMap.keys()).slice(0, 3)
        );
        setVerseTexts(textsMap);
      } catch (error) {
        console.error('🎵 Media Player - Error loading verse texts:', error);
        setVerseTexts(new Map());
      }
    };

    loadVerseTexts();
  }, [chapterId, currentTextVersion?.id]);

  const renderTextContent = () => {
    if (loadingVerses) {
      return (
        <View style={styles.contentScrollView}>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading verses...
          </Text>
        </View>
      );
    }

    const hasVerses = verses.length > 0;

    if (!hasVerses) {
      return (
        <View style={styles.contentScrollView}>
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            {currentTextVersion
              ? `No verses available for this chapter`
              : 'Select a text version to view verse text'}
          </Text>
        </View>
      );
    }

    // Check if current text version has no data
    const showNoDataWarning =
      currentTextVersion &&
      'verseCount' in currentTextVersion &&
      currentTextVersion.verseCount === 0;

    if (showNoDataWarning) {
      return (
        <ScrollView
          style={styles.contentScrollView}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}>
          {/* Text Version Badge */}
          <View
            style={[
              styles.textVersionBadge,
              { backgroundColor: theme.colors.surface },
            ]}>
            <MaterialIcons name='book' size={16} color={theme.colors.primary} />
            <View style={styles.textVersionInfo}>
              <Text
                style={[styles.textVersionName, { color: theme.colors.text }]}>
                {currentTextVersion.name}
              </Text>
              <Text
                style={[
                  styles.textVersionLanguage,
                  { color: theme.colors.textSecondary },
                ]}>
                {currentTextVersion.languageName}
              </Text>
            </View>
          </View>

          {/* No Data Warning */}
          <View style={styles.noDataContainer}>
            <MaterialIcons
              name='warning'
              size={48}
              color={theme.colors.error || '#ff4444'}
            />
            <Text
              style={[
                styles.noDataTitle,
                { color: theme.colors.error || '#ff4444' },
              ]}>
              No Text Data Available
            </Text>
            <Text
              style={[
                styles.noDataMessage,
                { color: theme.colors.textSecondary },
              ]}>
              The selected text version &ldquo;{currentTextVersion.name}&rdquo;
              doesn&apos;t have any verse texts available yet. Try selecting a
              different text version or contact support.
            </Text>
          </View>
        </ScrollView>
      );
    }

    return (
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
        contentInsetAdjustmentBehavior='never'>
        <View style={styles.versesContainer}>
          {verses.map(verse => {
            const verseText = verseTexts.get(verse.id);
            return (
              <View key={verse.id} style={styles.verseContainer}>
                <View style={styles.verseHeader}>
                  <Text
                    style={[
                      styles.verseNumber,
                      { color: theme.colors.textSecondary },
                    ]}>
                    VERSE {verse.verse_number}
                  </Text>
                  {currentTextVersion && (
                    <Text
                      style={{
                        color: theme.colors.primary,
                        fontSize: 12,
                        fontWeight: '600',
                      }}>
                      {currentTextVersion.name}
                    </Text>
                  )}
                  <TouchableOpacity>
                    <MaterialIcons
                      name='info-outline'
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.verseText, { color: theme.colors.text }]}>
                  {verseText?.verse_text ||
                    (currentTextVersion
                      ? `Text not available for ${currentTextVersion.name}`
                      : 'No text version selected')}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderQueueContent = () => {
    const mockQueue = [
      {
        id: 1,
        title: 'John Chapter 2',
        subtitle: 'ENGLISH - BSB',
        current: false,
      },
      {
        id: 2,
        title: 'John Chapter 3',
        subtitle: 'ENGLISH - BSB',
        current: false,
      },
      {
        id: 3,
        title: 'John Chapter 4',
        subtitle: 'ENGLISH - BSB',
        current: false,
      },
    ];

    return (
      <ScrollView
        style={styles.contentScrollView}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
        contentInsetAdjustmentBehavior='never'>
        <View style={styles.queueContainer}>
          <Text
            style={[styles.queueSectionTitle, { color: theme.colors.text }]}>
            User queue
          </Text>

          {mockQueue.map(item => (
            <View key={item.id} style={styles.queueItem}>
              <MaterialIcons
                name='drag-handle'
                size={20}
                color={theme.colors.textSecondary}
              />
              <View style={styles.queueItemText}>
                <Text
                  style={[styles.queueItemTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.queueItemSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          ))}

          <Text
            style={[
              styles.queueSectionTitle,
              { color: theme.colors.text, marginTop: 24 },
            ]}>
            Up next
          </Text>

          {mockQueue.map(item => (
            <View key={`next-${item.id}`} style={styles.queueItem}>
              <MaterialIcons
                name='play-arrow'
                size={20}
                color={theme.colors.textSecondary}
              />
              <View style={styles.queueItemText}>
                <Text
                  style={[styles.queueItemTitle, { color: theme.colors.text }]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.queueItemSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}>
                  {item.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'text' && [
              styles.activeToggle,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('text')}>
          <Text
            style={[
              styles.toggleButtonText,
              {
                color:
                  activeTab === 'text'
                    ? theme.colors.background
                    : theme.colors.text,
              },
            ]}>
            Text
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'queue' && [
              styles.activeToggle,
              { backgroundColor: theme.colors.primary },
            ],
          ]}
          onPress={() => setActiveTab('queue')}>
          <Text
            style={[
              styles.toggleButtonText,
              {
                color:
                  activeTab === 'queue'
                    ? theme.colors.background
                    : theme.colors.text,
              },
            ]}>
            Queue
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area - Both views are always rendered but only one is visible */}
      <View style={styles.contentContainer}>
        {/* Scrollable Background Container */}
        <View
          style={[
            styles.scrollableBackground,
            {
              backgroundColor:
                theme.mode === 'dark'
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
            },
          ]}>
          {/* Text Content */}
          <View
            style={[
              styles.tabContent,
              { display: activeTab === 'text' ? 'flex' : 'none' },
            ]}>
            {renderTextContent()}
          </View>

          {/* Queue Content */}
          <View
            style={[
              styles.tabContent,
              { display: activeTab === 'queue' ? 'flex' : 'none' },
            ]}>
            {renderQueueContent()}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  activeToggle: {
    // backgroundColor will be set dynamically from theme
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  scrollableBackground: {
    flex: 1,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tabContent: {
    flex: 1,
  },
  contentScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  versesContainer: {
    paddingBottom: 20,
  },
  verseContainer: {
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  verseText: {
    fontSize: 18,
    lineHeight: 28,
  },
  queueContainer: {
    paddingBottom: 20,
  },
  queueSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  queueItemText: {
    flex: 1,
    marginLeft: 12,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  queueItemSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    paddingTop: 40,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    paddingTop: 40,
  },
  textVersionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  textVersionInfo: {
    marginLeft: 8,
  },
  textVersionName: {
    fontWeight: '600',
  },
  textVersionLanguage: {
    fontSize: 12,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  noDataMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
