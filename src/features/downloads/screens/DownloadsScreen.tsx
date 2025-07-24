import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import { useDownloads } from '../hooks';
import { DownloadItem, DownloadStats, UrlDownloadForm } from '../components';
import { DownloadStatus } from '../types';

export const DownloadsScreen: React.FC = () => {
  const { theme } = useTheme();
  const t = useTranslations();
  const {
    downloads,
    isLoading,
    error,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    deleteDownload,
    clearCompletedDownloads,
    getDownloadsByStatus,
    getDownloadStats,
    clearError,
    refresh,
  } = useDownloads();

  const [selectedFilter, setSelectedFilter] = useState<DownloadStatus | 'all'>(
    'all'
  );

  const filteredDownloads =
    selectedFilter === 'all' ? downloads : getDownloadsByStatus(selectedFilter);

  const stats = getDownloadStats();

  const handlePauseDownload = async (id: string) => {
    try {
      await pauseDownload(id);
    } catch {
      Alert.alert('Error', 'Failed to pause download');
    }
  };

  const handleResumeDownload = async (id: string) => {
    try {
      await resumeDownload(id);
    } catch {
      Alert.alert('Error', 'Failed to resume download');
    }
  };

  const handleCancelDownload = async (id: string) => {
    Alert.alert(
      'Cancel Download',
      'Are you sure you want to cancel this download?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelDownload(id);
            } catch {
              Alert.alert('Error', 'Failed to cancel download');
            }
          },
        },
      ]
    );
  };

  const handleDeleteDownload = async (id: string) => {
    Alert.alert(
      'Delete Download',
      'Are you sure you want to delete this download? This will also remove the file from your device.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDownload(id);
            } catch {
              Alert.alert('Error', 'Failed to delete download');
            }
          },
        },
      ]
    );
  };

  const handleClearCompleted = () => {
    Alert.alert(
      'Clear Completed Downloads',
      'Are you sure you want to clear all completed downloads? This will also remove the files from your device.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCompletedDownloads();
            } catch {
              Alert.alert('Error', 'Failed to clear completed downloads');
            }
          },
        },
      ]
    );
  };

  const renderFilterButton = (
    filter: DownloadStatus | 'all',
    label: string
  ) => {
    const isSelected = selectedFilter === filter;
    const count =
      filter === 'all'
        ? downloads.length
        : getDownloadsByStatus(filter as DownloadStatus).length;

    return (
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor: isSelected
              ? theme.colors.primary
              : theme.colors.surface,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={() => setSelectedFilter(filter)}>
        <Text
          style={[
            styles.filterButtonText,
            {
              color: isSelected ? theme.colors.textInverse : theme.colors.text,
            },
          ]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary },
            ]}>
            {t('downloads.loadingDownloads')}
          </Text>
        </View>
      );
    }

    if (downloads.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary },
            ]}>
            {t('downloads.noDownloadsYet')}
          </Text>
          <Text
            style={[
              styles.emptyStateSubtext,
              { color: theme.colors.textSecondary },
            ]}>
            {t('downloads.noDownloadsYetSubtext')}
          </Text>
        </View>
      );
    }

    if (filteredDownloads.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text
            style={[
              styles.emptyStateText,
              { color: theme.colors.textSecondary },
            ]}>
            {t('downloads.noFilteredDownloads', { filter: selectedFilter })}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('downloads.title')}
        </Text>
        {downloads.length > 0 && (
          <TouchableOpacity
            style={[
              styles.clearButton,
              { backgroundColor: theme.colors.error },
            ]}
            onPress={handleClearCompleted}>
            <Text
              style={[
                styles.clearButtonText,
                { color: theme.colors.textInverse },
              ]}>
              {t('downloads.clearCompleted')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }>
        {/* URL Download Form */}
        <UrlDownloadForm
          onDownloadStart={() => {
            // Refresh the downloads list when a new download starts
            refresh();
          }}
          onDownloadComplete={() => {
            // Refresh the downloads list when a download completes
            refresh();
          }}
        />

        {/* Statistics */}
        {downloads.length > 0 && <DownloadStats stats={stats} />}

        {/* Filter Buttons */}
        {downloads.length > 0 && (
          <View style={styles.filterContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[
                { filter: 'all' as const, label: 'All' },
                { filter: 'downloading' as const, label: 'Downloading' },
                { filter: 'completed' as const, label: 'Completed' },
                { filter: 'failed' as const, label: 'Failed' },
                { filter: 'paused' as const, label: 'Paused' },
              ]}
              keyExtractor={item => item.filter}
              renderItem={({ item }) =>
                renderFilterButton(item.filter, item.label)
              }
              contentContainerStyle={styles.filterList}
            />
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View
            style={[
              styles.errorContainer,
              { backgroundColor: theme.colors.error },
            ]}>
            <Text
              style={[styles.errorText, { color: theme.colors.textInverse }]}>
              {error}
            </Text>
            <TouchableOpacity onPress={clearError}>
              <Text
                style={[
                  styles.errorDismiss,
                  { color: theme.colors.textInverse },
                ]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Downloads List */}
        {filteredDownloads.length > 0
          ? filteredDownloads.map(item => (
              <DownloadItem
                key={item.id}
                item={item}
                onPause={handlePauseDownload}
                onResume={handleResumeDownload}
                onCancel={handleCancelDownload}
                onDelete={handleDeleteDownload}
              />
            ))
          : renderEmptyState()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  errorDismiss: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
