import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/hooks';
import { useTranslations } from '@/shared/hooks';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';
import { DownloadItem as DownloadItemType, DownloadStatus } from '../types';

interface DownloadItemProps {
  item: DownloadItemType;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const DownloadItem: React.FC<DownloadItemProps> = ({
  item,
  onPause,
  onResume,
  onCancel,
  onDelete,
}) => {
  const { theme } = useTheme();
  const t = useTranslations();

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return t('downloads.unknownSize');
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatProgress = (progress: number): string => {
    return `${Math.round(progress * 100)}%`;
  };

  const getStatusColor = (status: DownloadStatus) => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'downloading':
        return theme.colors.primary;
      case 'failed':
        return theme.colors.error;
      case 'paused':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.textSecondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: DownloadStatus) => {
    switch (status) {
      case 'completed':
        return t('downloads.completed');
      case 'downloading':
        return t('downloads.downloading');
      case 'failed':
        return t('downloads.failed');
      case 'paused':
        return t('downloads.paused');
      case 'cancelled':
        return t('downloads.cancelled');
      case 'pending':
        return t('downloads.queued');
      default:
        return status;
    }
  };

  const renderProgressBar = () => {
    if (item.status === 'completed') {
      return (
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.colors.success },
          ]}>
          <View
            style={[
              styles.progressFill,
              styles.progressFillFull,
              { backgroundColor: theme.colors.success },
            ]}
          />
        </View>
      );
    }

    if (item.status === 'failed' || item.status === 'cancelled') {
      return (
        <View
          style={[styles.progressBar, { backgroundColor: theme.colors.error }]}>
          <View
            style={[
              styles.progressFill,
              styles.progressFillEmpty,
              { backgroundColor: theme.colors.error },
            ]}
          />
        </View>
      );
    }

    return (
      <View
        style={[
          styles.progressBar,
          { backgroundColor: theme.colors.surfaceOverlay },
        ]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${item.progress * 100}%`,
              backgroundColor: theme.colors.primary,
            },
          ]}
        />
      </View>
    );
  };

  const renderActions = () => {
    switch (item.status) {
      case 'downloading':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.warning },
              ]}
              onPress={() => onPause?.(item.id)}>
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                {t('downloads.pause')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={() => onCancel?.(item.id)}>
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                {t('downloads.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      case 'paused':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => onResume?.(item.id)}>
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                {t('downloads.resume')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={() => onCancel?.(item.id)}>
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                {t('downloads.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      case 'completed':
        return (
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.colors.error },
            ]}
            onPress={() => onDelete?.(item.id)}>
            <Text
              style={[
                styles.actionButtonText,
                { color: theme.colors.textInverse },
              ]}>
              {t('downloads.delete')}
            </Text>
          </TouchableOpacity>
        );
      case 'failed':
        return (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => onResume?.(item.id)}>
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                {t('downloads.retry')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.error },
              ]}
              onPress={() => onDelete?.(item.id)}>
              <Text
                style={[
                  styles.actionButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                {t('downloads.delete')}
              </Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          shadowColor: theme.colors.shadow,
        },
      ]}>
      <View style={styles.header}>
        <Text
          style={[styles.fileName, { color: theme.colors.text }]}
          numberOfLines={1}>
          {item.fileName}
        </Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {getStatusText(item.status)}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={[styles.fileSize, { color: theme.colors.textSecondary }]}>
          {formatFileSize(item.fileSize)}
        </Text>
        {item.status === 'downloading' && (
          <Text
            style={[
              styles.progressText,
              { color: theme.colors.textSecondary },
            ]}>
            {formatProgress(item.progress)}
          </Text>
        )}
      </View>

      {renderProgressBar()}

      {item.error && (
        <Text
          style={[styles.errorText, { color: theme.colors.error }]}
          numberOfLines={2}>
          {item.error}
        </Text>
      )}

      {renderActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: COLOR_VARIATIONS.BLACK_50,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileSize: {
    fontSize: 14,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressFillFull: {
    width: '100%',
  },
  progressFillEmpty: {
    width: '0%',
  },
});
