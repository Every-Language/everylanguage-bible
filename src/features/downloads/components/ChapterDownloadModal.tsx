import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { useDownloads } from '../hooks/useDownloads';
import { NetworkStatusDisplay } from './NetworkStatusDisplay';
import { SearchResultsDisplay } from './SearchResultsDisplay';
import { DownloadProgressDisplay } from './DownloadProgressDisplay';
import { useNetworkCapabilities } from '../hooks/useNetworkCapabilities';
import { useMediaSearch } from '../hooks/useMediaSearch';
import { useDownloadProgress } from '../hooks/useDownloadProgress';
import { formatFileSize } from '../utils/fileUtils';
import { logger } from '@/shared/utils/logger';

interface ChapterDownloadModalProps {
  visible: boolean;
  bookName: string;
  chapterTitle: string;
  chapterId: string;
  versionId?: string; // Optional for now, will use constant version 1
  onClose: () => void;
}

export const ChapterDownloadModal: React.FC<ChapterDownloadModalProps> = ({
  visible,
  bookName,
  chapterTitle,
  chapterId,
  versionId,
  onClose,
}) => {
  const { theme } = useTheme();
  const { downloadFile } = useDownloads();

  // Custom hooks for state management
  const {
    isOnline,
    isCheckingOnline,
    hasCheckedOnline,
    searchError: networkError,
    isConnected,
    connectionType,
    isInternetReachable,
    checkOnlineCapabilities,
    retryInternetCheck,
  } = useNetworkCapabilities();

  const {
    isSearching,
    searchResults,
    searchError: mediaSearchError,
    searchMediaFiles,
  } = useMediaSearch();

  const {
    downloadProgress,
    overallProgress,
    completedFiles,
    failedFiles,
    downloadError,
    initializeDownloadProgress,
    updateFileProgress,
    setDownloadError,
  } = useDownloadProgress();

  const [isDownloading, setIsDownloading] = useState(false);

  // Memoized values
  const searchError = useMemo(
    () => networkError || mediaSearchError,
    [networkError, mediaSearchError]
  );
  const canDownload = useMemo(
    () =>
      searchResults.length > 0 && !isSearching && !isDownloading && isOnline,
    [searchResults.length, isSearching, isDownloading, isOnline]
  );

  // Check online capabilities and search for media files
  const handleOnlineCapabilitiesCheck = useCallback(async () => {
    const isOnlineCapable = await checkOnlineCapabilities();
    if (isOnlineCapable) {
      await searchMediaFiles(chapterId, versionId);
    }
  }, [checkOnlineCapabilities, searchMediaFiles, chapterId, versionId]);

  // Initialize download progress for all files
  const handleInitializeDownloadProgress = useCallback(() => {
    initializeDownloadProgress(searchResults, chapterId);
  }, [initializeDownloadProgress, searchResults, chapterId]);

  // Download all files
  const handleDownload = useCallback(async () => {
    if (searchResults.length === 0) return;

    setIsDownloading(true);
    setDownloadError(null);
    handleInitializeDownloadProgress();

    try {
      // Download files sequentially to avoid overwhelming the system
      for (let i = 0; i < searchResults.length; i++) {
        const file = searchResults[i];
        const progressItem = downloadProgress[i];

        if (!progressItem) continue;

        try {
          // Update status to downloading
          updateFileProgress(
            file.file_path,
            { bytesWritten: 0, contentLength: 0, progress: 0 },
            'downloading'
          );

          await downloadFile(file.file_path, progressItem.fileName, {
            onProgress: (progress: {
              bytesWritten: number;
              contentLength: number;
              progress: number;
            }) => {
              updateFileProgress(file.file_path, progress, 'downloading');
            },
            onComplete: (item: { fileSize?: number }) => {
              updateFileProgress(
                file.file_path,
                {
                  bytesWritten: item.fileSize || 0,
                  contentLength: item.fileSize || 0,
                  progress: 1,
                },
                'completed'
              );
            },
            onError: (error: string) => {
              updateFileProgress(
                file.file_path,
                { bytesWritten: 0, contentLength: 0, progress: 0 },
                'failed',
                error
              );
            },
          });
        } catch (error) {
          const errorMsg = (error as Error).message;
          updateFileProgress(
            file.file_path,
            { bytesWritten: 0, contentLength: 0, progress: 0 },
            'failed',
            errorMsg
          );
        }
      }
    } catch (error) {
      const errorMsg = (error as Error).message;
      setDownloadError(errorMsg);
    } finally {
      setIsDownloading(false);
    }
  }, [
    searchResults,
    downloadProgress,
    downloadFile,
    updateFileProgress,
    setDownloadError,
    handleInitializeDownloadProgress,
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
  }, [visible, handleOnlineCapabilitiesCheck]);

  // Handle retry internet check
  const handleRetryInternetCheck = useCallback(async () => {
    const isOnlineCapable = await retryInternetCheck();
    if (isOnlineCapable) {
      await searchMediaFiles(chapterId, versionId);
    }
  }, [retryInternetCheck, searchMediaFiles, chapterId, versionId]);

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
          <View style={styles.iconContainer}>
            <MaterialIcons
              name='cloud-download'
              size={64}
              color={theme.colors.textSecondary}
            />
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            Download Chapter
          </Text>

          <Text
            style={[styles.bookName, { color: theme.colors.textSecondary }]}>
            {bookName}
          </Text>

          <Text
            style={[
              styles.chapterTitle,
              { color: theme.colors.textSecondary },
            ]}>
            {chapterTitle}
          </Text>

          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            Download to listen offline at your convenience.
          </Text>

          {/* Search Results Display */}
          <SearchResultsDisplay
            isOnline={isOnline}
            isCheckingOnline={isCheckingOnline}
            isSearching={isSearching}
            searchResults={searchResults}
            searchError={searchError}
            onFormatFileSize={formatFileSize}
          />

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

          {/* Network Status Display */}
          <NetworkStatusDisplay
            isOnline={isOnline}
            isCheckingOnline={isCheckingOnline}
            hasCheckedOnline={hasCheckedOnline}
            isConnected={isConnected}
            connectionType={connectionType}
            isInternetReachable={isInternetReachable}
            onRetry={handleRetryInternetCheck}
            disabled={isDownloading}
          />

          <View style={styles.buttonContainer}>
            {/* Download button - only show when files are found */}
            {canDownload && (
              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  { backgroundColor: theme.colors.success },
                ]}
                onPress={handleDownload}
                disabled={isDownloading}>
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

            <TouchableOpacity
              style={[
                styles.cancelButton,
                { borderColor: theme.colors.border },
              ]}
              onPress={onClose}
              disabled={isDownloading}>
              <Text
                style={[
                  styles.cancelButtonText,
                  { color: theme.colors.textSecondary },
                ]}>
                Close
              </Text>
            </TouchableOpacity>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
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
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
