import React, { useState, useEffect } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/Button';
import DatabaseManager from '../services/database/DatabaseManager';
import type { DatabaseInitProgress } from '../services/database/DatabaseManager';
import type { Theme } from '../types/theme';
import { logger } from '../utils/logger';

const { width: screenWidth } = Dimensions.get('window');

interface DatabaseOnboardingProps {
  onComplete: () => void;
  onError?: (error: string) => void;
}

// Sub-component for the icon section
const IconSection: React.FC<{ theme: Theme }> = ({ theme }) => (
  <View
    style={[
      styles.iconContainer,
      {
        backgroundColor: theme.colors.surface,
        shadowColor: theme.colors.shadow,
      },
    ]}>
    <Text style={styles.iconText}>🗄️</Text>
  </View>
);

// Sub-component for the content section
const ContentSection: React.FC<{ theme: Theme }> = ({ theme }) => (
  <View style={styles.contentSection}>
    <Text style={[styles.contentTitle, { color: theme.colors.text }]}>
      Setting Up Your Bible App
    </Text>
    <Text
      style={[styles.contentSubtitle, { color: theme.colors.textSecondary }]}>
      We&apos;re preparing your Bible app with all the features you need to
      read, listen, and study scripture.
    </Text>
  </View>
);

// Sub-component for the error section
const ErrorSection: React.FC<{
  theme: Theme;
  error: string;
  onRetry: () => void;
}> = ({ theme, error, onRetry }) => (
  <View style={styles.errorSection}>
    <Text style={[styles.errorTitle, { color: theme.colors.error }]}>
      Setup Failed
    </Text>
    <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
      {error}
    </Text>
    <Button title='Retry' onPress={onRetry} variant='secondary' />
  </View>
);

// Sub-component for the progress section
const ProgressSection: React.FC<{
  theme: Theme;
  progress: DatabaseInitProgress;
}> = ({ theme, progress }) => (
  <View style={styles.progressSection}>
    <View
      style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
      <View
        style={[
          styles.progressFill,
          {
            width: `${progress.progress}%`,
            backgroundColor: theme.colors.primary,
          },
        ]}
      />
    </View>
    <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
      {progress.message}
    </Text>
    <View style={styles.progressStageContainer}>
      <Text style={[styles.progressStage, { color: theme.colors.accent }]}>
        {progress.stage}
      </Text>
    </View>
  </View>
);

// Sub-component for the actions section
const ActionsSection: React.FC<{
  _theme: Theme;
  isComplete: boolean;
  onComplete: () => void;
}> = ({ _theme, isComplete, onComplete }) => (
  <View style={styles.actionsSection}>
    {isComplete && (
      <Button
        title='Continue'
        onPress={onComplete}
        variant='primary'
        fullWidth
      />
    )}
  </View>
);

export const DatabaseOnboarding: React.FC<DatabaseOnboardingProps> = ({
  onComplete,
  onError,
}) => {
  const { theme } = useTheme();
  const [progress, setProgress] = useState<DatabaseInitProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    initializeDatabase();
  }, [fadeAnim, slideAnim]);

  const initializeDatabase = async () => {
    try {
      logger.info('DatabaseOnboarding: Starting database initialization');
      const databaseManager = DatabaseManager.getInstance();

      databaseManager.setProgressCallback(progress => {
        logger.info('DatabaseOnboarding: Progress update:', progress);
        setProgress(progress);

        if (progress.stage === 'complete') {
          setIsComplete(true);
        }
      });

      await databaseManager.initialize();
      logger.info('DatabaseOnboarding: Database initialization completed');
    } catch (err) {
      logger.error('DatabaseOnboarding: Database initialization failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const handleRetry = () => {
    setError(null);
    setProgress(null);
    setIsComplete(false);
    initializeDatabase();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
      <IconSection theme={theme} />

      <ContentSection theme={theme} />

      {error ? (
        <ErrorSection theme={theme} error={error} onRetry={handleRetry} />
      ) : progress ? (
        <ProgressSection theme={theme} progress={progress} />
      ) : null}

      <ActionsSection
        _theme={theme}
        isComplete={isComplete}
        onComplete={onComplete}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: screenWidth,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: {
    fontSize: 48,
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 36,
  },
  contentSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  errorSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressSection: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    width: '100%',
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
    marginBottom: 4,
  },
  progressStageContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  progressStage: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsSection: {
    width: '100%',
    alignItems: 'center',
  },
});
