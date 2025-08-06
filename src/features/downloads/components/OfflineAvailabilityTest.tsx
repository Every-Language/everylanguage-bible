import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/hooks';
import {
  checkChapterOfflineAvailability,
  getOfflineAvailableChapters,
  cleanupOrphanedFiles,
  OfflineAvailabilityCheck,
} from '../utils/offlineAvailabilityUtils';
import { logger } from '@/shared/utils/logger';

export const OfflineAvailabilityTest: React.FC = () => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [offlineChapters, setOfflineChapters] = useState<string[]>([]);
  const [availabilityChecks, setAvailabilityChecks] = useState<
    OfflineAvailabilityCheck[]
  >([]);

  const loadOfflineChapters = async () => {
    setIsLoading(true);
    try {
      const chapters = await getOfflineAvailableChapters();
      setOfflineChapters(chapters);
      logger.info('Loaded offline chapters:', chapters);
    } catch (error) {
      logger.error('Error loading offline chapters:', error);
      Alert.alert('Error', 'Failed to load offline chapters');
    } finally {
      setIsLoading(false);
    }
  };

  const testChapterAvailability = async (chapterId: string) => {
    setIsLoading(true);
    try {
      const checks = await checkChapterOfflineAvailability(chapterId);
      setAvailabilityChecks(checks);
      logger.info('Chapter availability check completed:', {
        chapterId,
        checks,
      });
    } catch (error) {
      logger.error('Error checking chapter availability:', error);
      Alert.alert('Error', 'Failed to check chapter availability');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = async () => {
    setIsLoading(true);
    try {
      const result = await cleanupOrphanedFiles();
      Alert.alert(
        'Cleanup Complete',
        `Cleaned ${result.cleanedCount} orphaned files. ${result.errors.length} errors.`
      );
      logger.info('Cleanup completed:', result);
    } catch (error) {
      logger.error('Error during cleanup:', error);
      Alert.alert('Error', 'Failed to cleanup orphaned files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineChapters();
  }, []);

  const getStatusIcon = (check: OfflineAvailabilityCheck) => {
    if (check.isAvailable) {
      return (
        <MaterialIcons
          name='check-circle'
          size={20}
          color={theme.colors.success}
        />
      );
    } else if (check.fileExists) {
      return (
        <MaterialIcons name='warning' size={20} color={theme.colors.warning} />
      );
    } else {
      return (
        <MaterialIcons name='error' size={20} color={theme.colors.error} />
      );
    }
  };

  const getStatusText = (check: OfflineAvailabilityCheck) => {
    if (check.isAvailable) {
      return 'Available Offline';
    } else if (check.fileExists) {
      return 'File Exists (Not in DB)';
    } else {
      return 'Not Available';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Offline Availability Test
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Offline Available Chapters ({offlineChapters.length})
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={loadOfflineChapters}
          disabled={isLoading}>
          <MaterialIcons
            name='refresh'
            size={20}
            color={theme.colors.textInverse}
          />
          <Text
            style={[styles.buttonText, { color: theme.colors.textInverse }]}>
            Refresh
          </Text>
        </TouchableOpacity>

        {offlineChapters.map(chapterId => (
          <TouchableOpacity
            key={chapterId}
            style={[styles.chapterItem, { borderColor: theme.colors.border }]}
            onPress={() => testChapterAvailability(chapterId)}>
            <Text style={[styles.chapterText, { color: theme.colors.text }]}>
              {chapterId}
            </Text>
            <MaterialIcons
              name='chevron-right'
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

      {availabilityChecks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            File Availability Details
          </Text>

          {availabilityChecks.map((check, index) => (
            <View
              key={index}
              style={[styles.checkItem, { borderColor: theme.colors.border }]}>
              <View style={styles.checkHeader}>
                {getStatusIcon(check)}
                <Text
                  style={[styles.checkStatus, { color: theme.colors.text }]}>
                  {getStatusText(check)}
                </Text>
              </View>

              <Text
                style={[
                  styles.checkPath,
                  { color: theme.colors.textSecondary },
                ]}>
                {check.localPath}
              </Text>

              <Text
                style={[
                  styles.checkDetails,
                  { color: theme.colors.textSecondary },
                ]}>
                Size: {check.fileSize} bytes | In DB:{' '}
                {check.inDatabase ? 'Yes' : 'No'}
              </Text>

              {check.error && (
                <Text
                  style={[styles.checkError, { color: theme.colors.error }]}>
                  Error: {check.error}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Maintenance
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.warning }]}
          onPress={handleCleanup}
          disabled={isLoading}>
          <MaterialIcons
            name='cleaning-services'
            size={20}
            color={theme.colors.textInverse}
          />
          <Text
            style={[styles.buttonText, { color: theme.colors.textInverse }]}>
            Cleanup Orphaned Files
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text
            style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading...
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  chapterText: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkItem: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  checkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkStatus: {
    fontSize: 16,
    fontWeight: '600',
  },
  checkPath: {
    fontSize: 12,
    marginBottom: 4,
  },
  checkDetails: {
    fontSize: 12,
    marginBottom: 4,
  },
  checkError: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
  },
});
