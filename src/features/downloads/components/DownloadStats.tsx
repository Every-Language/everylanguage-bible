import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { useTranslations } from '@/shared/context/LocalizationContext';
import { DownloadStats as DownloadStatsType } from '../types';
import { COLOR_VARIATIONS } from '@/shared/constants/theme';

interface DownloadStatsProps {
  stats: DownloadStatsType;
}

export const DownloadStats: React.FC<DownloadStatsProps> = ({ stats }) => {
  const { theme } = useTheme();
  const t = useTranslations();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getCompletionRate = (): number => {
    if (stats.totalDownloads === 0) return 0;
    return (stats.completedDownloads / stats.totalDownloads) * 100;
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
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {t('downloads.downloadStatistics')}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {stats.totalDownloads}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('downloads.totalDownloads')}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.success }]}>
            {stats.completedDownloads}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('downloads.completed')}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.error }]}>
            {stats.failedDownloads}
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('downloads.failed')}
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: theme.colors.warning }]}>
            {getCompletionRate().toFixed(1)}%
          </Text>
          <Text
            style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            {t('downloads.successRate')}
          </Text>
        </View>
      </View>

      <View style={[styles.sizeInfo, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.sizeLabel, { color: theme.colors.textSecondary }]}>
          {t('downloads.totalSizeDownloaded')}:
        </Text>
        <Text style={[styles.sizeValue, { color: theme.colors.text }]}>
          {formatFileSize(stats.downloadedSize)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLOR_VARIATIONS.SHADOW_BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sizeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLOR_VARIATIONS.BLACK_10,
  },
  sizeLabel: {
    fontSize: 14,
  },
  sizeValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});
