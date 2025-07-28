import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  useChapterQueue,
  useAudioAvailabilityStats,
} from '../hooks/useChapterQueue';
import { ChapterAudioInfo } from '../services/ChapterQueueService';
import type {
  LocalMediaFile,
  LocalMediaFileVerse,
} from '@/shared/services/database/schema';
import { useBackgroundDownloads } from '@/features/downloads/hooks/useBackgroundDownloads';
import { useTheme } from '@/shared/context/ThemeContext';
import { useMediaPlayer } from '@/shared/context/MediaPlayerContext';
import { logger } from '@/shared/utils/logger';
import { isAudioFile } from '@/features/downloads/utils/fileUtils';

type ViewMode = 'summary' | 'details' | 'background';

interface ChapterQueueExampleProps {
  languageEntityId?: string;
}

export const ChapterQueueExample: React.FC<ChapterQueueExampleProps> = ({
  languageEntityId,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('summary');
  const [refreshing, setRefreshing] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  // Background downloads hooks - must be at top level
  const { theme } = useTheme();
  const { state: mediaState } = useMediaPlayer();
  const {
    downloads,
    stats: backgroundStats,
    isInitialized,
    isProcessing,
    cancelDownload,
    pauseDownload,
    resumeDownload,
    clearCompletedDownloads,
    clearFailedDownloads,
    continueDownloads,
    refreshDownloads,
  } = useBackgroundDownloads();

  // Memoize options to prevent infinite re-renders
  const queueOptions = useMemo(
    () => ({
      mediaType: 'audio' as const,
      sortBy: 'chapter' as const,
      sortDirection: 'asc' as const,
      ...(languageEntityId && { languageEntityId }),
    }),
    [languageEntityId]
  );

  const statsOptions = useMemo(
    () => ({
      mediaType: 'audio' as const,
      ...(languageEntityId && { languageEntityId }),
    }),
    [languageEntityId]
  );

  const { chapterAudioInfo, loading, error, refresh } =
    useChapterQueue(queueOptions);

  const { stats, loading: statsLoading } =
    useAudioAvailabilityStats(statsOptions);

  // Animation for refresh icon
  useEffect(() => {
    if (loading) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();
    } else {
      spinValue.setValue(0);
    }
  }, [loading, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const renderChapterItem = (chapterInfo: ChapterAudioInfo) => (
    <View key={chapterInfo.chapterId} style={styles.chapterItem}>
      <View style={styles.chapterHeader}>
        <Text style={styles.chapterId}>Chapter {chapterInfo.chapterId}</Text>
        <View style={styles.statusContainer}>
          {chapterInfo.hasAudioFiles && (
            <View style={[styles.statusBadge, styles.audioBadge]}>
              <Text style={styles.statusText}>Audio</Text>
            </View>
          )}
          {chapterInfo.hasVersesMarked && (
            <View style={[styles.statusBadge, styles.versesBadge]}>
              <Text style={styles.statusText}>Verses</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.chapterDetails}>
        <Text style={styles.detailText}>
          Files: {chapterInfo.audioFileCount} | Duration:{' '}
          {formatDuration(chapterInfo.totalDuration)} | Size:{' '}
          {formatFileSize(chapterInfo.totalFileSize)}
        </Text>
        {chapterInfo.hasVersesMarked && (
          <Text style={styles.detailText}>
            Verses: {chapterInfo.verseCount}
          </Text>
        )}
        {chapterInfo.localPaths.length > 0 && (
          <Text style={styles.detailText}>
            <Text style={styles.detailLabel}>Local Paths:</Text>{' '}
            {chapterInfo.localPaths.length} file(s)
          </Text>
        )}
      </View>
    </View>
  );

  const renderMediaFileDetails = (chapterInfo: ChapterAudioInfo) => (
    <View key={chapterInfo.chapterId} style={styles.chapterItem}>
      <View style={styles.chapterHeader}>
        <Text style={styles.chapterId}>Chapter {chapterInfo.chapterId}</Text>
        <View style={styles.statusContainer}>
          {chapterInfo.hasAudioFiles && (
            <View style={[styles.statusBadge, styles.audioBadge]}>
              <Text style={styles.statusText}>
                {chapterInfo.audioFileCount} Files
              </Text>
            </View>
          )}
        </View>
      </View>

      {chapterInfo.mediaFiles.map((mediaFile: LocalMediaFile) => (
        <View key={mediaFile.id} style={styles.mediaFileItem}>
          <View style={styles.mediaFileHeader}>
            <Text style={styles.mediaFileId}>ID: {mediaFile.id}</Text>
            <Text style={styles.mediaFileStatus}>
              {mediaFile.upload_status}
            </Text>
          </View>

          <View style={styles.mediaFileDetails}>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Type:</Text>{' '}
              {mediaFile.media_type}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Duration:</Text>{' '}
              {formatTime(mediaFile.duration_seconds)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Size:</Text>{' '}
              {formatFileSize(mediaFile.file_size)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Language:</Text>{' '}
              {mediaFile.language_entity_id}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Sequence:</Text>{' '}
              {mediaFile.sequence_id}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Version:</Text>{' '}
              {mediaFile.version}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Created:</Text>{' '}
              {formatDate(mediaFile.created_at)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Updated:</Text>{' '}
              {formatDate(mediaFile.updated_at)}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Local Path:</Text>{' '}
              {mediaFile.local_path}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Remote Path:</Text>{' '}
              {mediaFile.remote_path}
            </Text>
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Verses JSON:</Text>{' '}
              {mediaFile.verses}
            </Text>
          </View>

          {/* Media File Verses */}
          {chapterInfo.mediaFileVerses
            .filter(mfv => mfv.media_file_id === mediaFile.id)
            .map((mediaFileVerse: LocalMediaFileVerse) => (
              <View key={mediaFileVerse.id} style={styles.verseItem}>
                <Text style={styles.verseText}>
                  <Text style={styles.detailLabel}>
                    Verse {mediaFileVerse.verse_id}:
                  </Text>{' '}
                  {formatTime(mediaFileVerse.start_time_seconds)}
                </Text>
              </View>
            ))}
        </View>
      ))}
    </View>
  );

  const renderStats = () => {
    if (statsLoading || !stats) return null;

    return (
      <View style={styles.statsContainer}>
        <Text style={styles.statsTitle}>Audio Availability Summary</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalChapters}</Text>
            <Text style={styles.statLabel}>Total Chapters</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.chaptersWithAudio}</Text>
            <Text style={styles.statLabel}>With Audio</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.chaptersWithVerses}</Text>
            <Text style={styles.statLabel}>With Verses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalAudioFiles}</Text>
            <Text style={styles.statLabel}>Audio Files</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            Total Duration: {formatDuration(stats.totalDuration)}
          </Text>
          <Text style={styles.statText}>
            Total Size: {formatFileSize(stats.totalFileSize)}
          </Text>
        </View>
        <Text style={styles.statText}>Total Verses: {stats.totalVerses}</Text>
      </View>
    );
  };

  const renderBackground = () => {
    const onRefresh = async () => {
      setRefreshing(true);
      refreshDownloads();
      setTimeout(() => setRefreshing(false), 1000);
    };

    const handleCancelDownload = (downloadId: string, fileName: string) => {
      Alert.alert(
        'Cancel Download',
        `Are you sure you want to cancel "${fileName}"?`,
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              cancelDownload(downloadId).catch(error => {
                logger.error('Failed to cancel download:', error);
              });
            },
          },
        ]
      );
    };

    const handleClearCompleted = () => {
      Alert.alert(
        'Clear Completed Downloads',
        'Are you sure you want to clear all completed downloads?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              clearCompletedDownloads().catch(error => {
                logger.error('Failed to clear completed downloads:', error);
              });
            },
          },
        ]
      );
    };

    const handleClearFailed = () => {
      Alert.alert(
        'Clear Failed Downloads',
        'Are you sure you want to clear all failed downloads?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            style: 'destructive',
            onPress: () => {
              clearFailedDownloads().catch(error => {
                logger.error('Failed to clear failed downloads:', error);
              });
            },
          },
        ]
      );
    };

    const handleContinueDownloads = () => {
      continueDownloads().catch(error => {
        logger.error('Failed to continue downloads:', error);
      });
    };

    // Check if there are pending downloads to continue
    const pendingDownloads = downloads.filter(
      d => d.status === 'pending' || d.status === 'paused'
    );
    const failedDownloads = downloads.filter(d => d.status === 'failed');
    const hasPendingDownloads = pendingDownloads.length > 0;
    const hasFailedDownloads = failedDownloads.length > 0;
    const canContinueDownloads = hasPendingDownloads || hasFailedDownloads;

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed':
          return 'check-circle';
        case 'failed':
          return 'error';
        case 'downloading':
          return 'cloud-download';
        case 'paused':
          return 'pause-circle';
        case 'pending':
          return 'schedule';
        default:
          return 'help';
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed':
          return theme.colors.success;
        case 'failed':
          return theme.colors.error;
        case 'downloading':
          return theme.colors.primary;
        case 'paused':
          return theme.colors.warning;
        case 'pending':
          return theme.colors.textSecondary;
        default:
          return theme.colors.textSecondary;
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'completed':
          return 'Completed';
        case 'failed':
          return 'Failed';
        case 'downloading':
          return 'Downloading';
        case 'paused':
          return 'Paused';
        case 'pending':
          return 'Pending';
        default:
          return status;
      }
    };

    if (!isInitialized) {
      return (
        <View
          style={[
            styles.backgroundContainer,
            { backgroundColor: theme.colors.background },
          ]}>
          <View style={styles.loadingContainer}>
            <MaterialIcons
              name='cloud-download'
              size={48}
              color={theme.colors.textSecondary}
            />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.textSecondary },
              ]}>
              Initializing background downloads...
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.backgroundContainer}>
        {/* Header */}
        <View
          style={[
            styles.backgroundHeader,
            { backgroundColor: theme.colors.surface },
          ]}>
          <Text style={[styles.backgroundTitle, { color: theme.colors.text }]}>
            Background Downloads
          </Text>
          {isProcessing && (
            <View style={styles.processingIndicator}>
              <MaterialIcons
                name='sync'
                size={16}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.processingText,
                  { color: theme.colors.primary },
                ]}>
                Processing
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View
          style={[
            styles.backgroundStatsContainer,
            { backgroundColor: theme.colors.surface },
          ]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {backgroundStats.totalDownloads || 0}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {backgroundStats.completedDownloads || 0}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Completed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {backgroundStats.failedDownloads || 0}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Failed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {formatFileSize(backgroundStats.downloadedSize || 0)}
            </Text>
            <Text
              style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Downloaded
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View
          style={[
            styles.backgroundActionsContainer,
            { backgroundColor: theme.colors.surface },
          ]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: canContinueDownloads
                  ? theme.colors.success
                  : theme.colors.textSecondary,
                opacity: canContinueDownloads ? 1 : 0.5,
              },
            ]}
            onPress={handleContinueDownloads}
            disabled={!canContinueDownloads || isProcessing}>
            <MaterialIcons
              name={isProcessing ? 'sync' : 'play-arrow'}
              size={16}
              color={theme.colors.textInverse}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: theme.colors.textInverse },
              ]}>
              {isProcessing
                ? 'Processing...'
                : canContinueDownloads
                  ? `Continue (${pendingDownloads.length + failedDownloads.length})`
                  : 'Continue'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={onRefresh}>
            <MaterialIcons
              name='refresh'
              size={16}
              color={theme.colors.textInverse}
            />
            <Text
              style={[
                styles.actionButtonText,
                { color: theme.colors.textInverse },
              ]}>
              Refresh
            </Text>
          </TouchableOpacity>

          {backgroundStats.completedDownloads > 0 && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.warning },
              ]}
              onPress={handleClearCompleted}>
              <MaterialIcons
                name='clear-all'
                size={16}
                color={theme.colors.textInverse}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                Clear Completed
              </Text>
            </TouchableOpacity>
          )}

          {backgroundStats.failedDownloads > 0 && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={handleClearFailed}>
              <MaterialIcons
                name='clear-all'
                size={16}
                color={theme.colors.textInverse}
              />
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                Clear Failed
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Downloads List */}
        <ScrollView
          style={styles.backgroundDownloadsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {downloads.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name='cloud-off'
                size={48}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.backgroundEmptyText,
                  { color: theme.colors.textSecondary },
                ]}>
                No background downloads
              </Text>
              <Text
                style={[
                  styles.backgroundEmptySubtext,
                  { color: theme.colors.textSecondary },
                ]}>
                Start downloading files to see them here
              </Text>
            </View>
          ) : (
            downloads.map(download => (
              <View
                key={download.id}
                style={[
                  styles.downloadItem,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor:
                      mediaState.currentTrack?.id === download.id &&
                      mediaState.isPlaying
                        ? theme.colors.success
                        : 'rgba(0, 0, 0, 0.1)',
                    borderWidth:
                      mediaState.currentTrack?.id === download.id &&
                      mediaState.isPlaying
                        ? 2
                        : 1,
                  },
                ]}>
                <View style={styles.downloadHeader}>
                  <MaterialIcons
                    name={getStatusIcon(download.status)}
                    size={20}
                    color={getStatusColor(download.status)}
                  />
                  <View style={styles.downloadInfo}>
                    <View style={styles.downloadNameContainer}>
                      <Text
                        style={[
                          styles.downloadName,
                          { color: theme.colors.text },
                        ]}>
                        {download.fileName}
                      </Text>
                      {isAudioFile(download.fileName) && (
                        <MaterialIcons
                          name='audiotrack'
                          size={16}
                          color={theme.colors.textSecondary}
                          style={styles.audioIcon}
                        />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.downloadStatus,
                        { color: getStatusColor(download.status) },
                      ]}>
                      {getStatusText(download.status)}
                    </Text>
                  </View>
                  <View style={styles.downloadActions}>
                    {download.status === 'downloading' && (
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => pauseDownload(download.id)}>
                        <MaterialIcons
                          name='pause'
                          size={20}
                          color={theme.colors.warning}
                        />
                      </TouchableOpacity>
                    )}
                    {download.status === 'paused' && (
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => resumeDownload(download.id)}>
                        <MaterialIcons
                          name='play-arrow'
                          size={20}
                          color={theme.colors.success}
                        />
                      </TouchableOpacity>
                    )}
                    {download.status !== 'completed' && (
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() =>
                          handleCancelDownload(download.id, download.fileName)
                        }>
                        <MaterialIcons
                          name='close'
                          size={20}
                          color={theme.colors.error}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Progress Bar */}
                {download.status === 'downloading' && (
                  <View
                    style={[
                      styles.progressContainer,
                      { backgroundColor: theme.colors.border },
                    ]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          backgroundColor: theme.colors.primary,
                          width: `${download.progress * 100}%`,
                        },
                      ]}
                    />
                  </View>
                )}

                {/* File Size */}
                {download.fileSize && (
                  <Text
                    style={[
                      styles.fileSize,
                      { color: theme.colors.textSecondary },
                    ]}>
                    {formatFileSize(download.fileSize)}
                  </Text>
                )}

                {/* Error Message */}
                {download.error && (
                  <Text
                    style={[
                      styles.backgroundErrorText,
                      { color: theme.colors.error },
                    ]}>
                    {download.error}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          Loading chapter audio information...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Chapter Audio Queue</Text>
      </View>

      {/* View mode toggles and refresh button */}
      <View style={styles.controlsContainer}>
        <View style={styles.viewModeButtons}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'summary' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('summary')}>
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === 'summary' && styles.viewModeButtonTextActive,
              ]}>
              Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'details' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('details')}>
            <Text
              style={[
                styles.viewModeButtonText,
                viewMode === 'details' && styles.viewModeButtonTextActive,
              ]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              (viewMode as ViewMode) === 'background' &&
                styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('background')}>
            <Text
              style={[
                styles.viewModeButtonText,
                (viewMode as ViewMode) === 'background' &&
                  styles.viewModeButtonTextActive,
              ]}>
              Background
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, loading && styles.refreshButtonLoading]}
          onPress={() => {
            refresh();
            if (viewMode === 'background') {
              refreshDownloads();
            }
          }}
          disabled={loading}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name='refresh' size={16} color='white' />
          </Animated.View>
          <Text style={styles.refreshButtonText}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Section */}
      {viewMode === 'summary' && (
        <>
          {renderStats()}
          {chapterAudioInfo.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No audio files found</Text>
              <Text style={styles.emptySubtext}>
                Download audio files to see them appear here
              </Text>
            </View>
          ) : (
            <View style={styles.chapterList}>
              {chapterAudioInfo.map(renderChapterItem)}
            </View>
          )}
        </>
      )}

      {/* Details Section */}
      {viewMode === 'details' && (
        <>
          {chapterAudioInfo.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No audio files found</Text>
              <Text style={styles.emptySubtext}>
                Download audio files to see them appear here
              </Text>
            </View>
          ) : (
            <View style={styles.chapterList}>
              {chapterAudioInfo.map(renderMediaFileDetails)}
            </View>
          )}
        </>
      )}

      {/* Background Section */}
      {viewMode === 'background' && renderBackground()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#d32f2f',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  viewModeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
  },
  viewModeButtonActive: {
    backgroundColor: '#1976d2',
  },
  viewModeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  viewModeButtonTextActive: {
    color: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshButtonLoading: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  chapterList: {
    paddingHorizontal: 16,
  },
  chapterItem: {
    backgroundColor: 'white',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chapterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chapterId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  audioBadge: {
    backgroundColor: '#e3f2fd',
  },
  versesBadge: {
    backgroundColor: '#f3e5f5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  chapterDetails: {
    gap: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  detailLabel: {
    fontWeight: '600',
    color: '#333',
  },
  mediaFileItem: {
    backgroundColor: '#f8f9fa',
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1976d2',
  },
  mediaFileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mediaFileId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976d2',
  },
  mediaFileStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4caf50',
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mediaFileDetails: {
    gap: 2,
  },
  verseItem: {
    backgroundColor: '#fff',
    marginTop: 4,
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  verseText: {
    fontSize: 12,
    color: '#666',
  },
  backgroundContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backgroundTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },

  // Background Downloads Styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  backgroundHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  processingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  backgroundStatsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  backgroundActionsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  backgroundDownloadsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  backgroundEmptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  backgroundEmptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  downloadItem: {
    margin: 8,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  downloadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadInfo: {
    flex: 1,
    marginLeft: 12,
  },
  downloadNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  audioIcon: {
    marginLeft: 4,
  },
  downloadStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  fileSize: {
    fontSize: 12,
    marginTop: 4,
  },
  backgroundErrorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
