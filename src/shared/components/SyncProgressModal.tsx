import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/shared/context/ThemeContext';

import { bibleSync } from '@/shared/services/sync/bible/BibleSyncService';
import { languageSync } from '@/shared/services/sync/language/LanguageSyncService';
import { localDataService } from '@/shared/services/database/LocalDataService';
import DatabaseManager from '@/shared/services/database/DatabaseManager';
import { logger } from '@/shared/utils/logger';

const databaseManager = DatabaseManager.getInstance();

interface SyncProgressModalProps {
  visible: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

interface SyncProgress {
  current: number;
  total: number;
  message: string;
  isComplete: boolean;
}

export const SyncProgressModal: React.FC<SyncProgressModalProps> = ({
  visible,
  onClose,
  onGetStarted,
}) => {
  const { theme } = useTheme();
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState<SyncProgress>({
    current: 0,
    total: 100,
    message: 'Initializing sync...',
    isComplete: false,
  });

  // Start rotation animation when sync is in progress
  useEffect(() => {
    if (visible && !progress.isComplete) {
      startRotationAnimation();
    } else {
      stopRotationAnimation();
    }
  }, [visible, progress.isComplete]);

  // Perform real sync operations
  useEffect(() => {
    if (visible && !progress.isComplete) {
      performRealSync();
    }
  }, [visible, progress.isComplete]);

  const startRotationAnimation = () => {
    rotationAnim.setValue(0);
    Animated.loop(
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopRotationAnimation = () => {
    rotationAnim.stopAnimation();
  };

  const performRealSync = async () => {
    try {
      // Step 1: Check current data availability
      setProgress({
        current: 10,
        total: 100,
        message: 'Checking current data...',
        isComplete: false,
      });

      const hasData = await localDataService.isDataAvailable();

      // Step 2: Check for updates
      setProgress({
        current: 20,
        total: 100,
        message: 'Checking for updates...',
        isComplete: false,
      });

      const [bibleUpdateCheck, languageUpdateCheck] = await Promise.all([
        bibleSync.needsUpdate(),
        languageSync.needsUpdate(),
      ]);

      // Step 3: Sync Bible content if needed
      if (bibleUpdateCheck.needsUpdate || !hasData) {
        setProgress({
          current: 30,
          total: 100,
          message: 'Syncing Bible content...',
          isComplete: false,
        });

        // Use forceCompleteSync to ensure all data is downloaded
        const bibleResults = await bibleSync.forceCompleteSync();
        logger.info('Bible sync results:', bibleResults);
      }

      // Step 4: Sync Language content if needed
      if (languageUpdateCheck.needsUpdate || !hasData) {
        setProgress({
          current: 60,
          total: 100,
          message: 'Syncing language data...',
          isComplete: false,
        });

        const languageResults = await languageSync.syncAll({
          forceFullSync: !hasData,
        });
        logger.info('Language sync results:', languageResults);
      }

      // Step 5: Verify all tables have data
      setProgress({
        current: 80,
        total: 100,
        message: 'Verifying data integrity...',
        isComplete: false,
      });

      const verificationResult = await verifyAllTablesHaveData();

      if (verificationResult.success) {
        setProgress({
          current: 100,
          total: 100,
          message: 'Setup complete! All data verified.',
          isComplete: true,
        });
      } else {
        setProgress({
          current: 100,
          total: 100,
          message: `Setup complete with warnings: ${verificationResult.missingTables.join(', ')}`,
          isComplete: true,
        });
      }
    } catch (error) {
      logger.error('Sync failed:', error);
      setProgress({
        current: 100,
        total: 100,
        message: 'Setup completed with some issues. You can continue.',
        isComplete: true,
      });
    }
  };

  const verifyAllTablesHaveData = async () => {
    try {
      const requiredTables = [
        // Bible content tables
        { name: 'books', checkFn: () => localDataService.getBooksCount() },
        {
          name: 'chapters',
          checkFn: () => localDataService.getChaptersCount(),
        },
        { name: 'verses', checkFn: () => localDataService.getVersesCount() },

        // Language tables - check if they exist and have data
        {
          name: 'language_entities_cache',
          checkFn: async () => {
            const result = await databaseManager.executeQuery<{
              count: number;
            }>('SELECT COUNT(*) as count FROM language_entities_cache');
            return result[0]?.count || 0;
          },
        },
        {
          name: 'available_versions_cache',
          checkFn: async () => {
            const result = await databaseManager.executeQuery<{
              count: number;
            }>('SELECT COUNT(*) as count FROM available_versions_cache');
            return result[0]?.count || 0;
          },
        },
        {
          name: 'user_saved_versions',
          checkFn: async () => {
            const result = await databaseManager.executeQuery<{
              count: number;
            }>('SELECT COUNT(*) as count FROM user_saved_versions');
            return result[0]?.count || 0;
          },
        },
      ];

      const results = await Promise.all(
        requiredTables.map(async table => {
          try {
            const count = await table.checkFn();
            return { table: table.name, hasData: count > 0, count };
          } catch (error) {
            logger.error(`Error checking ${table.name}:`, error);
            return { table: table.name, hasData: false, count: 0 };
          }
        })
      );

      const missingTables = results
        .filter(result => !result.hasData)
        .map(result => result.table);

      return {
        success: missingTables.length === 0,
        missingTables,
        results,
      };
    } catch (error) {
      logger.error('Error verifying tables:', error);
      return {
        success: false,
        missingTables: ['unknown'],
        results: [],
      };
    }
  };

  const progressPercentage = (progress.current / progress.total) * 100;

  const handleGetStarted = () => {
    onGetStarted();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType='fade'
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.colors.background },
          ]}>
          <View style={styles.iconContainer}>
            {progress.isComplete ? (
              <MaterialIcons
                name='check-circle'
                size={64}
                color={theme.colors.success}
              />
            ) : (
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: rotationAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}>
                <MaterialIcons
                  name='sync'
                  size={64}
                  color={theme.colors.primary}
                />
              </Animated.View>
            )}
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]}>
            {progress.isComplete ? 'Setup Complete!' : 'Setting Up Your App'}
          </Text>

          <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
            {progress.message}
          </Text>

          {!progress.isComplete && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: theme.colors.border },
                ]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${progressPercentage}%`,
                      backgroundColor: theme.colors.primary,
                    },
                  ]}
                />
              </View>
              <Text
                style={[
                  styles.progressText,
                  { color: theme.colors.textSecondary },
                ]}>
                {progress.current}%
              </Text>
            </View>
          )}

          {progress.isComplete ? (
            <TouchableOpacity
              style={[
                styles.getStartedButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={handleGetStarted}>
              <MaterialIcons
                name='home'
                size={20}
                color={theme.colors.textInverse}
              />
              <Text
                style={[
                  styles.getStartedButtonText,
                  { color: theme.colors.textInverse },
                ]}>
                Get Started
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.loadingContainer}>
              <Text
                style={[
                  styles.loadingText,
                  { color: theme.colors.textSecondary },
                ]}>
                Please wait while we set up your app...
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
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
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  getStartedButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
