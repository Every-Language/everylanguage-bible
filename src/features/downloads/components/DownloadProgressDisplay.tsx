import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';

interface FileDownloadProgress {
  filePath: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  error?: string;
  fileSize?: number;
}

interface DownloadProgressDisplayProps {
  isDownloading: boolean;
  downloadProgress: FileDownloadProgress[];
  searchResults: unknown[];
  overallProgress: number;
  completedFiles: number;
  failedFiles: number;
  downloadError: string | null;
}

export const DownloadProgressDisplay: React.FC<
  DownloadProgressDisplayProps
> = ({
  isDownloading,
  downloadProgress,
  searchResults,
  overallProgress,
  completedFiles,
  failedFiles,
  downloadError,
}) => {
  const { theme } = useTheme();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'failed':
        return 'error';
      case 'downloading':
        return 'cloud-download';
      default:
        return 'schedule';
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
      default:
        return theme.colors.textSecondary;
    }
  };

  if (!isDownloading || downloadProgress.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.downloadProgressContainer,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}>
      <View style={styles.overallProgressHeader}>
        <Text style={[styles.progressTitle, { color: theme.colors.text }]}>
          Download Progress
        </Text>
        <Text
          style={[styles.progressStats, { color: theme.colors.textSecondary }]}>
          {completedFiles}/{searchResults.length} completed
          {failedFiles > 0 && ` • ${failedFiles} failed`}
        </Text>
      </View>

      <View
        style={[
          styles.progressBarContainer,
          { backgroundColor: theme.colors.border },
        ]}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: theme.colors.primary,
              width: `${overallProgress * 100}%`,
            },
          ]}
        />
      </View>

      <Text
        style={[
          styles.progressPercentage,
          { color: theme.colors.textSecondary },
        ]}>
        {Math.round(overallProgress * 100)}%
      </Text>

      <ScrollView
        style={styles.fileProgressList}
        showsVerticalScrollIndicator={false}>
        {downloadProgress.map((file, index) => (
          <View key={index} style={styles.fileProgressItem}>
            <View style={styles.fileProgressHeader}>
              <MaterialIcons
                name={
                  getStatusIcon(
                    file.status
                  ) as keyof typeof MaterialIcons.glyphMap
                }
                size={16}
                color={getStatusColor(file.status)}
              />
              <Text style={[styles.fileName, { color: theme.colors.text }]}>
                {file.fileName}
              </Text>
              <Text
                style={[
                  styles.fileProgressText,
                  { color: theme.colors.textSecondary },
                ]}>
                {Math.round(file.progress * 100)}%
              </Text>
            </View>

            {file.status === 'downloading' && (
              <View
                style={[
                  styles.fileProgressBarContainer,
                  { backgroundColor: theme.colors.border },
                ]}>
                <View
                  style={[
                    styles.fileProgressBar,
                    {
                      backgroundColor: theme.colors.primary,
                      width: `${file.progress * 100}%`,
                    },
                  ]}
                />
              </View>
            )}

            {file.error && (
              <Text style={[styles.fileError, { color: theme.colors.error }]}>
                {file.error}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>

      {downloadError && (
        <View style={styles.errorContainer}>
          <MaterialIcons name='error' size={16} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {downloadError}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  downloadProgressContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  overallProgressHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressStats: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden' as const,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%' as const,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 12,
    fontWeight: '500' as const,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  fileProgressList: {
    maxHeight: 120,
  },
  fileProgressItem: {
    marginBottom: 8,
  },
  fileProgressHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginBottom: 4,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '500' as const,
    flex: 1,
  },
  fileProgressText: {
    fontSize: 10,
    fontWeight: '400' as const,
  },
  fileProgressBarContainer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  fileProgressBar: {
    height: '100%' as const,
    borderRadius: 2,
  },
  fileError: {
    fontSize: 10,
    fontWeight: '400' as const,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '400' as const,
    flex: 1,
  },
};
