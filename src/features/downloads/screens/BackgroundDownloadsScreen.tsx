import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';
import { useBackgroundDownloads } from '../hooks/useBackgroundDownloads';
import { logger } from '@/shared/utils/logger';
import { formatFileSize } from '../utils/fileUtils';

export const BackgroundDownloadsScreen: React.FC = () => {
  const { theme } = useTheme();
  const {
    downloads,
    stats,
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

  const [refreshing, setRefreshing] = useState(false);

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
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}>
        <View style={styles.loadingContainer}>
          <MaterialIcons
            name='cloud-download'
            size={48}
            color={theme.colors.textSecondary}
          />
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Initializing background downloads...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Background Downloads
        </Text>
        {isProcessing && (
          <View style={styles.processingIndicator}>
            <MaterialIcons name='sync' size={16} color={theme.colors.primary} />
            <Text
              style={[styles.processingText, { color: theme.colors.primary }]}>
              Processing
            </Text>
          </View>
        )}
      </View>

      {/* Stats */}
      <View
        style={[
          styles.statsContainer,
          { backgroundColor: theme.colors.surface },
        ]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.text }]}>
            {stats.totalDownloads || 0}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Total
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.success }]}>
            {stats.completedDownloads || 0}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Completed
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.error }]}>
            {stats.failedDownloads || 0}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Failed
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
            {formatFileSize(stats.downloadedSize || 0)}
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
          styles.actionsContainer,
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
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.success },
          ]}
          onPress={handleClearCompleted}>
          <MaterialIcons
            name='check-circle'
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
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={handleClearFailed}>
          <MaterialIcons
            name='error'
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
      </View>

      {/* Downloads List */}
      <ScrollView
        style={styles.downloadsList}
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
              style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No background downloads
            </Text>
            <Text
              style={[
                styles.emptySubtext,
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
                { backgroundColor: theme.colors.surface },
              ]}>
              <View style={styles.downloadHeader}>
                <MaterialIcons
                  name={getStatusIcon(download.status)}
                  size={20}
                  color={getStatusColor(download.status)}
                />
                <View style={styles.downloadInfo}>
                  <Text
                    style={[styles.downloadName, { color: theme.colors.text }]}>
                    {download.fileName}
                  </Text>
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
                        color={theme.colors.primary}
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
                        color={theme.colors.primary}
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
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {download.error}
                </Text>
              )}

              {/* Retry Count */}
              {download.retryCount > 0 && (
                <Text
                  style={[
                    styles.retryText,
                    { color: theme.colors.textSecondary },
                  ]}>
                  Retries: {download.retryCount}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
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

  downloadsList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
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
  downloadName: {
    fontSize: 14,
    fontWeight: '500',
  },
  downloadStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  downloadActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  fileSize: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  retryText: {
    fontSize: 12,
    marginTop: 4,
  },
});
