import React, { useState, useEffect } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { Button } from './ui/Button';
import DatabaseManager, {
  DatabaseInitProgress,
} from '@/shared/services/database/DatabaseManager';

const { width: screenWidth } = Dimensions.get('window');

interface DatabaseOnboardingProps {
  onComplete: () => void;
  onError?: (error: string) => void;
}

// Sub-component for the icon section
const IconSection: React.FC<{ theme: any }> = ({ theme }) => (
  <View
    style={{
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    }}>
    <Text style={{ fontSize: 48 }}>🗄️</Text>
  </View>
);

// Sub-component for the content section
const ContentSection: React.FC<{ theme: any }> = ({ theme }) => (
  <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
    <Text
      style={{
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        lineHeight: theme.typography.lineHeight.xxl,
      }}>
      Setting Up Your Bible App
    </Text>
    <Text
      style={{
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: theme.typography.lineHeight.md,
        paddingHorizontal: theme.spacing.md,
      }}>
      We&apos;re preparing your Bible app with all the features you need to
      read, listen, and study scripture.
    </Text>
  </View>
);

// Sub-component for the error section
const ErrorSection: React.FC<{
  theme: any;
  error: string;
  onRetry: () => void;
}> = ({ theme, error, onRetry }) => (
  <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
    <Text
      style={{
        fontSize: theme.typography.fontSize.lg,
        fontWeight: '600',
        color: theme.colors.error,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
      }}>
      Setup Failed
    </Text>
    <Text
      style={{
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
      }}>
      {error}
    </Text>
    <Button title='Retry' onPress={onRetry} variant='secondary' />
  </View>
);

// Sub-component for the progress section
const ProgressSection: React.FC<{
  theme: any;
  progress: DatabaseInitProgress;
}> = ({ theme, progress }) => (
  <View style={{ width: '100%', marginBottom: theme.spacing.lg }}>
    <View
      style={{
        width: '100%',
        height: 8,
        backgroundColor: theme.colors.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
      }}>
      <View
        style={{
          width: `${progress.progress}%`,
          height: '100%',
          backgroundColor: theme.colors.primary,
          borderRadius: 4,
        }}
      />
    </View>
    <Text
      style={{
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
      }}>
      {progress.message}
    </Text>
    <View
      style={{
        alignItems: 'center',
        marginTop: theme.spacing.sm,
      }}>
      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.accent,
          fontWeight: '500',
        }}>
        {progress.stage}
      </Text>
    </View>
  </View>
);

// Sub-component for the actions section
const ActionsSection: React.FC<{
  _theme: any;
  isComplete: boolean;
  onComplete: () => void;
}> = ({ _theme, isComplete, onComplete }) => (
  <View style={{ width: '100%', alignItems: 'center' }}>
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
      console.log('DatabaseOnboarding: Starting database initialization');
      const databaseManager = DatabaseManager.getInstance();

      databaseManager.setProgressCallback(progress => {
        console.log('DatabaseOnboarding: Progress update:', progress);
        setProgress(progress);

        if (progress.stage === 'complete') {
          setIsComplete(true);
        }
      });

      await databaseManager.initialize();
      console.log('DatabaseOnboarding: Database initialization completed');
    } catch (err) {
      console.error('DatabaseOnboarding: Database initialization failed:', err);
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
      style={{
        flex: 1,
        width: screenWidth,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
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
