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
import { useCurrentVersions } from '@/features/languages/hooks';
import { audioVersionValidationService } from '@/features/languages/services/audioVersionValidationService';

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
  versionId,
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

  // Audio version validation
  const { currentAudioVersion } = useCurrentVersions();
  const [audioVersionError, setAudioVersionError] = useState<string | null>(
    null
  );

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
        autoCloseModal: false, // Set to true if you want auto-close
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
        onSuccess: () => {
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

            logger.info(
              'TanStack Query caches invalidated for chapter:',
              chapterId
            );
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
    [validMediaFiles, chapterId, setIsDownloading]
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

      await ensureNetworkAvailable(async () => {
        // Use selected audio version instead of hardcoded version
        const targetVersionId = currentAudioVersion?.id || versionId;
        await searchMediaFiles(chapterId, targetVersionId);
      });
    } catch (error) {
      logger.warn('Online capabilities check failed:', error);
    }
  }, [
    ensureNetworkAvailable,
    searchMediaFiles,
    chapterId,
    versionId,
    currentAudioVersion,
  ]);

  // Download all files
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
      logger.info('Starting download of files:', {
        count: searchResults.length,
        useBackground: true,
        files: searchResults.map(f => ({
          remote_path: f.remote_path,
          file_size: f.file_size,
        })),
      });

      // Always use background downloads
      const files = searchResults.map((file, index) => ({
        filePath: file.remote_path,
        fileName: `${chapterId}_${index + 1}.mp3`,
        fileSize: file.file_size, // Pass the file size from search results
      }));

      const downloadIds = await addBatchToBackgroundQueue(files, {
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
            // Don't override version - let it come from the search results
            syncVersesData: true, // Automatically sync verses data after download
          },
          maxRetries: 3,
        },
      });

      setCurrentBatchId(`chapter_${chapterId}_${Date.now()}`);
      logger.info('Added files to background download queue:', downloadIds);

      // Don't set isDownloading to false here since downloads are happening in background
      // The download completion callback will handle resetting the state

      // Show success message and close modal
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      const errorMsg = (error as Error).message;
      logger.error('Download batch error:', errorMsg);
      setDownloadError(errorMsg);
      // Only reset isDownloading on error
      setIsDownloading(false);
    }
  }, [
    searchResults,
    addBatchToBackgroundQueue,
    setDownloadError,
    chapterId,
    book.name,
    chapterTitle,
    onClose,
    validMediaFiles,
    currentAudioVersion,
  ]); // Remove unnecessary dependencies: backgroundInitialized, downloadFile, handleInitializeDownloadProgress, updateFileProgress

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
        await searchMediaFiles(chapterId, versionId);
      });
    } catch (error) {
      logger.warn('Retry internet check failed:', error);
    }
  }, [retryAndExecute, searchMediaFiles, chapterId, versionId]);

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
});
