import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { useMediaPlayer } from '@/shared/hooks';
import { COLOR_VARIATIONS } from '../../../shared/constants/theme';
import { useCurrentVersions } from '../../languages/hooks';
import { useVersesWithTextsQuery } from '../../bible/hooks/useBibleQueries';
import type { LocalVerseText } from '../../../shared/services/database/schema';

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

  const extractChapterId = (
    trackId: string | undefined
  ): string | undefined => {
    if (!trackId) return undefined;
    // Extract chapter ID from track ID format: "chapter_123"
    const match = trackId.match(/chapter_(\d+)/);
    return match ? match[1] : undefined;
  };

  const chapterId = extractChapterId(state.currentTrack?.id);

  // TanStack Query for verses with texts
  const {
    data: versesWithTexts = [],
    isLoading: loading,
    error: versesError,
  } = useVersesWithTextsQuery(chapterId || '', currentTextVersion?.id);

  // Extract verses and verse texts from the query result
  const verses = versesWithTexts.map(item => item.verse);
  const verseTexts = new Map<string, LocalVerseText>();
  versesWithTexts.forEach(item => {
    if (item.verseText) {
      verseTexts.set(item.verse.id, item.verseText);
    }
  });

  const error = versesError?.message || null;

  const renderTextContent = () => {
    if (loading) {
      return (
        <View style={styles.contentScrollView}>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading verses...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.contentScrollView}>
          <Text
            style={[styles.noDataText, { color: theme.colors.textSecondary }]}>
            Error: {error}
          </Text>
        </View>
      );
    }

    if (!currentTextVersion) {
      return (
        <ScrollView
          style={styles.contentScrollView}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}>
          <View
            style={[
              styles.textVersionBadge,
              { backgroundColor: theme.colors.surface },
            ]}>
            <MaterialIcons name='book' size={16} color={theme.colors.primary} />
            <View style={styles.textVersionInfo}>
              <Text
                style={[styles.textVersionName, { color: theme.colors.text }]}>
                No Text Version Selected
              </Text>
              <Text
                style={[
                  styles.textVersionLanguage,
                  { color: theme.colors.textSecondary },
                ]}>
                Please select a text version to view verse texts
              </Text>
            </View>
          </View>
        </ScrollView>
      );
    }

    const showNoDataWarning = verses.length > 0 && verseTexts.size === 0;

    if (showNoDataWarning) {
      return (
        <ScrollView
          style={styles.contentScrollView}
          contentContainerStyle={styles.scrollContentContainer}
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
                      style={[
                        styles.versionBadge,
                        { color: theme.colors.primary },
                      ]}>
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
    const queue = state.queue || [];
    const currentIndex = state.currentTrack
      ? queue.findIndex(track => track.id === state.currentTrack?.id)
      : -1;

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
            Current Queue ({queue.length} tracks)
          </Text>

          {/* Current Track */}
          {state.currentTrack && (
            <View
              key={`current-${state.currentTrack.id}`}
              style={styles.queueItem}>
              <MaterialIcons
                name='play-circle-filled'
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.queueItemText}>
                <Text
                  style={[styles.queueItemTitle, { color: theme.colors.text }]}>
                  {state.currentTrack.title}
                </Text>
                <Text
                  style={[
                    styles.queueItemSubtitle,
                    { color: theme.colors.textSecondary },
                  ]}>
                  Now Playing
                </Text>
              </View>
            </View>
          )}

          {/* Next Tracks */}
          {queue.slice(currentIndex + 1).map((item, _index) => (
            <View key={`next-${item.id}`} style={styles.queueItem}>
              <MaterialIcons
                name='queue-music'
                size={24}
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
                  Up Next
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
      {/* Tab Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'text' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('text')}>
          <Text
            style={[
              styles.toggleButtonText,
              {
                color:
                  activeTab === 'text'
                    ? theme.colors.textInverse
                    : theme.colors.text,
              },
            ]}>
            Text
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            activeTab === 'queue' && { backgroundColor: theme.colors.primary },
          ]}
          onPress={() => setActiveTab('queue')}>
          <Text
            style={[
              styles.toggleButtonText,
              {
                color:
                  activeTab === 'queue'
                    ? theme.colors.textInverse
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
            theme.mode === 'dark'
              ? styles.darkBackground
              : styles.lightBackground,
          ]}>
          {/* Text Content */}
          <View
            style={[
              styles.tabContent,
              activeTab === 'text' ? styles.tabVisible : styles.tabHidden,
            ]}>
            {renderTextContent()}
          </View>

          {/* Queue Content */}
          <View
            style={[
              styles.tabContent,
              activeTab === 'queue' ? styles.tabVisible : styles.tabHidden,
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
    backgroundColor: COLOR_VARIATIONS.WHITE_10,
    alignItems: 'center',
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
  scrollContentContainer: {
    padding: 16,
  },
  textVersionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  textVersionInfo: {
    flex: 1,
  },
  textVersionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  textVersionLanguage: {
    fontSize: 14,
    marginTop: 2,
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataMessage: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 32,
  },
  versesContainer: {
    paddingBottom: 20,
  },
  verseContainer: {
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: COLOR_VARIATIONS.WHITE_08,
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
  versionBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  verseText: {
    fontSize: 16,
    lineHeight: 24,
  },
  queueContainer: {
    paddingBottom: 20,
  },
  queueSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: COLOR_VARIATIONS.WHITE_08,
    gap: 12,
  },
  queueItemText: {
    flex: 1,
  },
  queueItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  queueItemSubtitle: {
    fontSize: 14,
  },
  darkBackground: {
    backgroundColor: COLOR_VARIATIONS.WHITE_08,
  },
  lightBackground: {
    backgroundColor: COLOR_VARIATIONS.BLACK_05,
  },
  tabVisible: {
    display: 'flex',
  },
  tabHidden: {
    display: 'none',
  },
});
