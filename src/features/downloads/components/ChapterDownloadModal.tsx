import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';
import { NetworkStatusDisplay } from './NetworkStatusDisplay';
import { SearchResultsDisplay } from './SearchResultsDisplay';
import { DownloadProgressDisplay } from './DownloadProgressDisplay';
import { useNetworkCapabilities } from '../hooks/useNetworkCapabilities';
import { useMediaSearch } from '../hooks/useMediaSearch';
import { useDownloadProgress } from '../hooks/useDownloadProgress';
import { useBackgroundDownloads } from '../hooks/useBackgroundDownloads';
import { logger } from '@/shared/utils/logger';
import { formatFileSize } from '../utils/fileUtils';
import { createDownloadCompletionCallback } from '../utils/downloadUtils';
import {
  useNetworkState,
  useNetworkForAction,
} from '@/shared/hooks/useNetworkState';
import { queryClient } from '@/shared/services/query/queryClient';
import { bibleQueryKeys } from '@/features/bible/hooks/useBibleQueries';
import { mediaFilesQueryKeys } from '@/features/media/hooks/useMediaFilesQueries';
import { chapterAudioQueryKeys } from '@/features/media/hooks/useChapterAudioInfo';
import { useCurrentVersions } from '@/features/languages/hooks';
import { audioVersionValidationService } from '@/features/languages/services/audioVersionValidationService';
import { useStreamingDownload } from '../hooks/useStreamingDownload';
import { MediaTrack } from '@/features/media/types';

// Query Keys for chapter audio info (for invalidation)
const chapterAudioInfoQueryKeys = {
  all: ['chapter-audio-info'] as const,
  byChapter: (chapterId: string) =>
    [...chapterAudioInfoQueryKeys.all, 'chapter', chapterId] as const,
} as const;

interface ChapterDownloadModalProps {
  visible: boolean;
  book: {
    id: string;
    name: string;
    testament?: string | null;
    book_number?: number;
  };
  chapterTitle: string;
  chapterId: string;
  versionId?: string; // Optional for now, will use constant version 1
  onClose: () => void;
}

// Type adapter to convert MediaFile to SearchResult
// interface SearchResult {
//   remote_path: string;
//   file_size: number;
// }

export const ChapterDownloadModal: React.FC<ChapterDownloadModalProps> = ({
  visible,
  book,
  chapterTitle,
  chapterId,
  onClose,
}) => {
  const { theme } = useTheme();

  // Custom hooks for state management
  const {
    isOnline,
    isChecking,
    lastChecked,
    error: networkError,
  } = useNetworkCapabilities();

  const { isConnected, connectionType, isInternetReachable } =
    useNetworkState();

  // New network hook for actions
  const { ensureNetworkAvailable, retryAndExecute } = useNetworkForAction();

  const {
    isSearching,
    searchResults: mediaFiles,
    searchError: mediaSearchError,
    searchMediaFiles,
  } = useMediaSearch();

  const {
    downloadProgress,
    overallProgress,
    completedFiles,
    failedFiles,
    downloadError,
    setDownloadError,
    setDownloadCompletionCallback,
  } = useDownloadProgress();

  // Background downloads hook
  const { isProcessing: backgroundProcessing, addBatchToBackgroundQueue } =
    useBackgroundDownloads();

  // Streaming download hook
  const { state: streamingState, startStreamingDownload } =
    useStreamingDownload({
      enableStreaming: true,
      minBytesForPlayback: 1024 * 1024, // 1MB
      autoPlayWhenReady: true,
      onDownloadProgress: progress => {
        logger.info('Streaming download progress:', progress);
      },
      onPlaybackReady: () => {
        logger.info('Streaming playback ready!');
      },
      onDownloadComplete: () => {
        logger.info('Streaming download completed');
      },
      onError: error => {
        logger.error('Streaming download error:', error);
      },
    });

  // Audio version validation
  const { currentAudioVersion } = useCurrentVersions();
  const [audioVersionError, setAudioVersionError] = useState<string | null>(
    null
  );
  const [localValidationResult, setLocalValidationResult] = useState<{
    hasLocalFiles: boolean;
    isValid: boolean;
  } | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  // Filter MediaFiles, excluding null values
  const validMediaFiles = useMemo(() => {
    return mediaFiles.filter(
      file => file.remote_path !== null && file.file_size !== null
    );
  }, [mediaFiles]);

  // Convert MediaFiles to SearchResult format for download progress
  const searchResults = useMemo(() => {
    return validMediaFiles.map(file => ({
      remote_path: file.remote_path!,
      file_size: file.file_size!,
    }));
  }, [validMediaFiles]);

  // Download completion callback using utility function - stabilize dependencies
  const handleDownloadCompletion = useMemo(
    () =>
      createDownloadCompletionCallback({
        showSuccessNotification: true,
        showErrorNotification: true,
        autoCloseModal: true, // Close modal automatically to show refreshed chapter
        refreshDownloads: true,
        // Media file integration
        addToMediaFiles: true,
        originalSearchResults: validMediaFiles,
        mediaFileOptions: {
          chapterId: chapterId,
          mediaType: 'audio',
          uploadStatus: 'completed',
          publishStatus: 'published',
          checkStatus: 'checked',
          version: 1,
        },
        onSuccess: async () => {
          logger.info('All downloads completed successfully');

          // Invalidate TanStack Query caches to update chapter data
          try {
            // Invalidate chapter-specific queries
            queryClient.invalidateQueries({
              queryKey: bibleQueryKeys.chapter(chapterId),
            });

            // Invalidate verses queries for this chapter
            queryClient.invalidateQueries({
              queryKey: bibleQueryKeys.verses(chapterId),
            });

            // Invalidate verses with texts queries for this chapter
            queryClient.invalidateQueries({
              queryKey: bibleQueryKeys.versesWithTexts(chapterId),
            });

            // Invalidate verse texts queries for this chapter
            queryClient.invalidateQueries({
              queryKey: bibleQueryKeys.verseTexts(chapterId),
            });

            // Invalidate media files queries for this chapter
            queryClient.invalidateQueries({
              queryKey: mediaFilesQueryKeys.byChapter(chapterId),
            });

            // Invalidate audio availability queries for this chapter
            queryClient.invalidateQueries({
              queryKey: mediaFilesQueryKeys.audioAvailability(chapterId),
            });

            // Invalidate all media files list queries to refresh any filtered views
            queryClient.invalidateQueries({
              queryKey: mediaFilesQueryKeys.all,
            });

            // Invalidate chapter audio info queries for this chapter
            queryClient.invalidateQueries({
              queryKey: chapterAudioInfoQueryKeys.byChapter(chapterId),
            });

            // Invalidate all chapter audio info queries to refresh any related views
            queryClient.invalidateQueries({
              queryKey: chapterAudioInfoQueryKeys.all,
            });

            // Invalidate media availability queries that determine play button visibility
            queryClient.invalidateQueries({
              queryKey: ['media-availability'],
            });

            // Invalidate chapters with metadata queries to refresh the chapter list
            queryClient.invalidateQueries({
              queryKey: ['chapters-with-metadata'],
            });

            // Invalidate all books queries to ensure data consistency
            queryClient.invalidateQueries({
              queryKey: bibleQueryKeys.books(),
            });

            // Invalidate specific book query for the current book
            queryClient.invalidateQueries({
              queryKey: bibleQueryKeys.book(book.id),
            });

            // Invalidate main chapters query for the book (used by ChapterScreen)
            queryClient.invalidateQueries({
              queryKey: bibleQueryKeys.chapters(book.id),
            });

            // Invalidate specific media availability query for this chapter
            queryClient.invalidateQueries({
              queryKey: ['media-availability', 'chapters', [chapterId]],
            });

            // Invalidate chapter audio availability query (used by useChapterMediaFiles)
            queryClient.invalidateQueries({
              queryKey: chapterAudioQueryKeys.audioAvailability(chapterId),
            });

            // Force refetch specific queries for immediate UI update
            try {
              // Refetch media availability for this specific chapter
              await queryClient.refetchQueries({
                queryKey: ['media-availability', 'chapters', [chapterId]],
              });

              // Refetch chapter audio availability
              await queryClient.refetchQueries({
                queryKey: chapterAudioQueryKeys.audioAvailability(chapterId),
              });

              // Refetch main chapters query for the book
              await queryClient.refetchQueries({
                queryKey: bibleQueryKeys.chapters(book.id),
              });

              // Refetch books queries for data consistency
              await queryClient.refetchQueries({
                queryKey: bibleQueryKeys.books(),
              });

              await queryClient.refetchQueries({
                queryKey: bibleQueryKeys.book(book.id),
              });

              logger.info(
                'Forced refetch of chapter-specific queries for immediate UI update'
              );
            } catch (refetchError) {
              logger.warn(
                'Failed to force refetch chapter queries:',
                refetchError
              );
            }

            logger.info(
              'TanStack Query caches invalidated for chapter:',
              chapterId
            );

            // Show success message to user
            logger.info(
              'Chapter refreshed successfully - play button should now be visible (audio availability only)'
            );

            // Small delay to ensure cache invalidation completes before modal closes
            setTimeout(() => {
              logger.info(
                'Closing modal after successful download and cache refresh'
              );
            }, 1000);
          } catch (error) {
            logger.error('Failed to invalidate TanStack Query caches:', error);
          }
        },
        onError: failedFiles => {
          logger.warn('Some downloads failed', {
            failedCount: failedFiles.length,
            failedFiles: failedFiles.map(f => ({
              fileName: f.fileName,
              error: f.error,
            })),
          });
          // Add any error-specific logic here
        },
        onComplete: (completedFiles, failedFiles, totalFiles) => {
          logger.info('Download session completed', {
            completedCount: completedFiles.length,
            failedCount: failedFiles.length,
            totalCount: totalFiles,
          });
          // Reset download state when background downloads complete
          setIsDownloading(false);
        },
        onMediaFileAdded: (mediaFileId, fileName) => {
          logger.info('Media file added to local database:', {
            mediaFileId,
            fileName,
          });
          // Add any media file added logic here
        },
        onMediaFileError: (fileName, error) => {
          logger.error('Failed to add media file to local database:', {
            fileName,
            error,
          });
          // Add any media file error logic here
        },
      }),
    [validMediaFiles, chapterId, setIsDownloading, book.id]
  );

  // Set completion callback when component mounts - only run once
  useEffect(() => {
    setDownloadCompletionCallback(handleDownloadCompletion);

    // Cleanup callback when component unmounts
    return () => {
      setDownloadCompletionCallback(null);
    };
  }, [handleDownloadCompletion, setDownloadCompletionCallback]); // Add setDownloadCompletionCallback as dependency

  // Memoized values
  const searchError = useMemo(
    () => networkError || mediaSearchError,
    [networkError, mediaSearchError]
  );
  const canDownload = useMemo(
    () =>
      searchResults.length > 0 &&
      !isSearching &&
      isOnline &&
      !audioVersionError &&
      currentAudioVersion,
    [
      searchResults.length,
      isSearching,
      isOnline,
      audioVersionError,
      currentAudioVersion,
    ]
  );

  const isDownloadDisabled = useMemo(
    () => isDownloading || backgroundProcessing,
    [isDownloading, backgroundProcessing]
  );

  // Check online capabilities and search for media files
  const handleOnlineCapabilitiesCheck = useCallback(async () => {
    try {
      // Validate audio version before searching
      const validation =
        await audioVersionValidationService.validateVersionForChapter(
          currentAudioVersion,
          chapterId
        );

      if (!validation.isValid) {
        setAudioVersionError(
          validation.error || 'Audio version validation failed'
        );
        return;
      }

      setAudioVersionError(null);

      // Log the validation result for debugging
      logger.info('Audio version validation completed:', {
        isValid: validation.isValid,
        hasAudioForChapter: validation.hasAudioForChapter,
        versionId: currentAudioVersion?.id,
        versionName: currentAudioVersion?.name,
        chapterId,
      });

      // Store local validation result for UI feedback
      setLocalValidationResult({
        hasLocalFiles: validation.hasAudioForChapter,
        isValid: validation.isValid,
      });

      // Always proceed with online search, regardless of local file availability
      await ensureNetworkAvailable(async () => {
        // Use the selected audio version ID (project_id) for searching
        const targetAudioVersionId = currentAudioVersion?.id;

        if (!targetAudioVersionId) {
          logger.error('No audio version ID available for search');
          setAudioVersionError('No audio version selected');
          return;
        }

        logger.info('Searching for online media files:', {
          chapterId,
          targetAudioVersionId,
          audioVersionId: currentAudioVersion?.id,
          audioVersionName: currentAudioVersion?.name,
          hasLocalFiles: validation.hasAudioForChapter,
        });
        await searchMediaFiles(chapterId, targetAudioVersionId);
      });
    } catch (error) {
      logger.warn('Online capabilities check failed:', error);
    }
  }, [
    ensureNetworkAvailable,
    searchMediaFiles,
    chapterId,
    currentAudioVersion,
  ]);

  // Download all files with streaming
  const handleDownload = useCallback(async () => {
    if (searchResults.length === 0) return;

    // Validate audio version before downloading
    const validation =
      await audioVersionValidationService.validateForDownload(
        currentAudioVersion
      );
    if (!validation.isValid) {
      setAudioVersionError(
        validation.error || 'Audio version validation failed'
      );
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    setAudioVersionError(null);

    try {
      logger.info('Starting streaming download of files:', {
        count: searchResults.length,
        files: searchResults.map(f => ({
          remote_path: f.remote_path,
          file_size: f.file_size,
        })),
      });

      // Create files array with track information for streaming
      const files = searchResults.map((file, index) => {
        const track: MediaTrack = {
          id: `${chapterId}_${index + 1}`,
          title: `${chapterTitle} - Part ${index + 1}`,
          subtitle: `${book.name} ${chapterTitle}`,
          duration: 0, // Will be updated when file is loaded
          currentTime: 0,
          isPlaying: false,
        };

        return {
          filePath: file.remote_path,
          fileName: `${chapterId}_${index + 1}.mp3`,
          fileSize: file.file_size,
          ...(index === 0 && { track }), // Only include track for first file
        };
      });

      // Start streaming download
      logger.info('About to start streaming download with files:', files);

      try {
        await startStreamingDownload(files, {
          streamFirstFile: true,
          batchId: `chapter_${chapterId}_${Date.now()}`,
          metadata: {
            chapterId,
            bookName: book.name,
            chapterTitle,
            addToMediaFiles: true,
            originalSearchResults: validMediaFiles,
            mediaFileOptions: {
              chapterId: chapterId,
              mediaType: 'audio',
              uploadStatus: 'completed',
              publishStatus: 'published',
              checkStatus: 'checked',
              syncVersesData: true,
            },
            maxRetries: 3,
          },
        });

        logger.info('Streaming download started successfully');
      } catch (streamingError) {
        logger.warn(
          'Streaming download failed, falling back to regular download:',
          streamingError
        );

        // Fallback to regular download
        const regularFiles = searchResults.map((file, index) => ({
          filePath: file.remote_path,
          fileName: `${chapterId}_${index + 1}.mp3`,
          fileSize: file.file_size,
        }));

        const downloadIds = await addBatchToBackgroundQueue(regularFiles, {
          priority: 1,
          batchId: `chapter_${chapterId}_${Date.now()}`,
          metadata: {
            chapterId,
            bookName: book.name,
            chapterTitle,
            addToMediaFiles: true,
            originalSearchResults: validMediaFiles,
            mediaFileOptions: {
              chapterId: chapterId,
              mediaType: 'audio',
              uploadStatus: 'completed',
              publishStatus: 'published',
              checkStatus: 'checked',
              syncVersesData: true,
            },
            maxRetries: 3,
          },
        });

        logger.info('Fallback to regular download completed:', downloadIds);
      }

      setCurrentBatchId(`chapter_${chapterId}_${Date.now()}`);
      logger.info('Started streaming download for chapter:', chapterId);

      // Don't set isDownloading to false here since downloads are happening in background
      // The download completion callback will handle resetting the state

      // Show success message and close modal
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      const errorMsg = (error as Error).message;
      logger.error('Streaming download error:', errorMsg);
      setDownloadError(errorMsg);
      // Only reset isDownloading on error
      setIsDownloading(false);
    }
  }, [
    searchResults,
    startStreamingDownload,
    setDownloadError,
    chapterId,
    book.name,
    chapterTitle,
    onClose,
    validMediaFiles,
    currentAudioVersion,
    addBatchToBackgroundQueue,
  ]);

  // Check online capabilities when modal becomes visible
  useEffect(() => {
    if (visible) {
      logger.info('Modal opened - checking online capabilities');
      logger.info('Network state:', {
        isConnected,
        connectionType,
        isInternetReachable,
      });
      handleOnlineCapabilitiesCheck();
    }
  }, [
    visible,
    handleOnlineCapabilitiesCheck,
    isConnected,
    connectionType,
    isInternetReachable,
  ]);

  // Handle retry internet check
  const handleRetryInternetCheck = useCallback(async () => {
    try {
      await retryAndExecute(async () => {
        // Use the selected audio version ID (project_id) for searching
        const targetAudioVersionId = currentAudioVersion?.id;

        if (!targetAudioVersionId) {
          logger.error('No audio version ID available for retry search');
          throw new Error('No audio version selected');
        }

        await searchMediaFiles(chapterId, targetAudioVersionId);
      });
    } catch (error) {
      logger.warn('Retry internet check failed:', error);
    }
  }, [retryAndExecute, searchMediaFiles, chapterId, currentAudioVersion]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='fade'
      onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.colors.background,
              shadowColor: theme.colors.shadow,
            },
          ]}>
          {/* Header with close button */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isDownloadDisabled}>
              <MaterialIcons
                name='close'
                size={24}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.iconContainer}>
            <MaterialIcons
              name='cloud-download'
              size={64}
              color={theme.colors.textSecondary}
            />
          </View>
          <Text
            style={[
              styles.chapterTitle,
              { color: theme.colors.textSecondary },
            ]}>
            {`Download ${book.name} ${chapterTitle}`}
          </Text>

          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            Download to listen offline at your convenience.
          </Text>

          {/* Background Download Status */}
          {currentBatchId && (
            <View style={styles.backgroundStatusContainer}>
              <Text
                style={[
                  styles.backgroundStatusTitle,
                  { color: theme.colors.text },
                ]}>
                Background Downloads Active
              </Text>
              <Text
                style={[
                  styles.backgroundStatusText,
                  { color: theme.colors.textSecondary },
                ]}>
                Downloads will continue in the background even when you close
                this modal.
              </Text>
              {backgroundProcessing && (
                <View style={styles.processingIndicator}>
                  <ActivityIndicator
                    size='small'
                    color={theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.processingText,
                      { color: theme.colors.textSecondary },
                    ]}>
                    Processing downloads...
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Search Results Display */}
          <SearchResultsDisplay
            isOnline={isOnline}
            isCheckingOnline={isChecking}
            isSearching={isSearching}
            searchResults={searchResults}
            searchError={searchError}
            onFormatFileSize={formatFileSize}
            localValidationResult={localValidationResult}
          />

          {/* Audio Version Error Display */}
          {audioVersionError && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: theme.colors.surface },
              ]}>
              <MaterialIcons
                name='error-outline'
                size={20}
                color={theme.colors.error}
              />
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {audioVersionError}
              </Text>
            </View>
          )}

          {/* Download Progress Display */}
          <DownloadProgressDisplay
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            searchResults={searchResults}
            overallProgress={overallProgress}
            completedFiles={completedFiles}
            failedFiles={failedFiles}
            downloadError={downloadError}
          />

          {/* Streaming Status Display */}
          {streamingState.isStreaming && (
            <View style={styles.streamingStatusContainer}>
              <View style={styles.streamingStatusHeader}>
                <MaterialIcons
                  name='play-circle-outline'
                  size={20}
                  color={theme.colors.primary}
                />
                <Text
                  style={[
                    styles.streamingStatusText,
                    { color: theme.colors.primary },
                  ]}>
                  Streaming Audio
                </Text>
              </View>

              {streamingState.isPlaybackReady && (
                <Text
                  style={[
                    styles.streamingStatusSubtext,
                    { color: theme.colors.success },
                  ]}>
                  ✓ Ready for playback
                </Text>
              )}

              {!streamingState.isPlaybackReady &&
                streamingState.isDownloading && (
                  <View style={styles.streamingProgressContainer}>
                    <Text
                      style={[
                        styles.streamingProgressText,
                        { color: theme.colors.textSecondary },
                      ]}>
                      Buffering...{' '}
                      {Math.round(streamingState.streamingProgress * 100)}%
                    </Text>
                    <View style={styles.streamingProgressBar}>
                      <View
                        style={[
                          styles.streamingProgressFill,
                          {
                            width: `${streamingState.streamingProgress * 100}%`,
                            backgroundColor: theme.colors.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}

              {streamingState.error && (
                <Text
                  style={[
                    styles.streamingStatusSubtext,
                    { color: theme.colors.error },
                  ]}>
                  ✗ {streamingState.error}
                </Text>
              )}
            </View>
          )}

          {/* Network Status Display - only show when there is no internet */}
          {!isOnline && (
            <NetworkStatusDisplay
              isOnline={isOnline}
              isCheckingOnline={isChecking}
              hasCheckedOnline={lastChecked !== null}
              isConnected={isConnected}
              connectionType={connectionType}
              isInternetReachable={isInternetReachable}
              onRetry={handleRetryInternetCheck}
              disabled={isDownloadDisabled}
            />
          )}

          <View style={styles.buttonContainer}>
            {/* Download button - only show when files are found and not downloading */}
            {canDownload && !isDownloading && (
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  {
                    backgroundColor: theme.colors.success,
                  },
                  styles.downloadButtonEnabled,
                ]}
                onPress={handleDownload}
                disabled={false}>
                <MaterialIcons
                  name='cloud-download'
                  size={20}
                  color={theme.colors.textInverse}
                />
                <Text
                  style={[
                    styles.downloadButtonText,
                    { color: theme.colors.textInverse },
                  ]}>
                  Download Files
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 24,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerSpacer: {
    width: 24,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  downloadButtonEnabled: {
    opacity: 1,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backgroundStatusContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLOR_VARIATIONS.GREEN_10,
    marginBottom: 16,
  },
  backgroundStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  backgroundStatusText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  streamingStatusContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLOR_VARIATIONS.BLUE_10,
    marginBottom: 16,
  },
  streamingStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  streamingStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  streamingStatusSubtext: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  streamingProgressContainer: {
    marginTop: 8,
  },
  streamingProgressText: {
    fontSize: 12,
    marginBottom: 4,
  },
  streamingProgressBar: {
    height: 4,
    backgroundColor: COLOR_VARIATIONS.GRAY_200,
    borderRadius: 2,
    overflow: 'hidden',
  },
  streamingProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});
