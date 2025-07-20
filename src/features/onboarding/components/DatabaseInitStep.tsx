import React from 'react';
import {
  View,
  Text,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { Button } from '@/shared/components/ui/Button';
import { DatabaseInitProgress } from '@/shared/services/database/DatabaseManager';

const { width: screenWidth } = Dimensions.get('window');

interface DatabaseInitStepProps {
  isActive: boolean;
  onNext: () => void;
  onSkip: () => void;
  databaseProgress: DatabaseInitProgress | null;
  isDatabaseInitializing: boolean;
  onInitializeDatabase: () => void;
  onRetryDatabase: () => void;
}

// Sub-component for the icon section
const IconSection: React.FC<{
  databaseProgress: DatabaseInitProgress | null;
  theme: any;
  getStageColor: (stage: string) => string;
  getStageIcon: (stage: string) => string;
}> = ({ databaseProgress, theme, getStageColor, getStageIcon }) => (
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
    <Text
      style={{
        fontSize: 48,
        color: databaseProgress
          ? getStageColor(databaseProgress.stage)
          : theme.colors.primary,
      }}>
      {databaseProgress ? getStageIcon(databaseProgress.stage) : '📖'}
    </Text>
  </View>
);

// Sub-component for the content section
const ContentSection: React.FC<{ theme: any }> = ({ theme }) => (
  <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
    <Text
      style={{
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: 'bold',
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        lineHeight: theme.typography.lineHeight.xxl,
      }}>
      Welcome to Bible App
    </Text>
    <Text
      style={{
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.accent,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
        fontWeight: '600',
        lineHeight: theme.typography.lineHeight.lg,
      }}>
      Setting up your personal scripture companion
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

// Sub-component for the progress section
const ProgressSection: React.FC<{
  databaseProgress: DatabaseInitProgress;
  theme: any;
  getStageColor: (stage: string) => string;
  getStageText: (stage: string) => string;
}> = ({ databaseProgress, theme, getStageColor, getStageText }) => {
  const hasError = databaseProgress.stage === 'error';

  return (
    <View style={{ width: '100%', marginBottom: theme.spacing.xl }}>
      <Text
        style={{
          fontSize: theme.typography.fontSize.md,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: theme.spacing.md,
        }}>
        {databaseProgress.message}
      </Text>

      {/* Progress Bar */}
      <View style={{ width: '100%', marginBottom: theme.spacing.sm }}>
        <View
          style={{
            width: '100%',
            height: 8,
            backgroundColor: theme.colors.border,
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: theme.spacing.xs,
          }}>
          <View
            style={{
              height: '100%',
              borderRadius: 4,
              width: `${databaseProgress.progress}%`,
              backgroundColor: getStageColor(databaseProgress.stage),
            }}
          />
        </View>
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}>
          {Math.round(databaseProgress.progress)}%
        </Text>
      </View>

      {/* Stage indicator */}
      <Text
        style={{
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.textSecondary,
          textAlign: 'center',
          marginBottom: theme.spacing.xs,
        }}>
        {getStageText(databaseProgress.stage)}
      </Text>

      {/* Error message */}
      {hasError && databaseProgress.error && (
        <Text
          style={{
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.error,
            textAlign: 'center',
            marginTop: theme.spacing.sm,
          }}>
          {databaseProgress.error}
        </Text>
      )}
    </View>
  );
};

// Sub-component for the actions section
const ActionsSection: React.FC<{
  isComplete: boolean;
  hasError: boolean;
  isDatabaseInitializing: boolean;
  onNext: () => void;
  onSkip: () => void;
  onRetryDatabase: () => void;
  theme: any;
}> = ({
  isComplete,
  hasError,
  isDatabaseInitializing,
  onNext,
  onSkip,
  onRetryDatabase,
  theme,
}) => (
  <View style={{ width: '100%', alignItems: 'center' }}>
    {isComplete ? (
      <Button
        title='Get Started'
        onPress={onNext}
        variant='primary'
        fullWidth
      />
    ) : hasError ? (
      <>
        <Button
          title='Try Again'
          onPress={onRetryDatabase}
          variant='primary'
          fullWidth
          disabled={isDatabaseInitializing}
          loading={isDatabaseInitializing}
        />
        <TouchableOpacity
          style={{
            marginTop: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
          }}
          onPress={onSkip}>
          <Text
            style={{
              fontSize: theme.typography.fontSize.md,
              color: theme.colors.textSecondary,
              fontWeight: '500',
            }}>
            Skip for now
          </Text>
        </TouchableOpacity>
      </>
    ) : (
      <View
        style={{
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
        }}>
        <Text
          style={{
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
          }}>
          Initializing...
        </Text>
      </View>
    )}
  </View>
);

export const DatabaseInitStep: React.FC<DatabaseInitStepProps> = ({
  isActive,
  onNext,
  onSkip,
  databaseProgress,
  isDatabaseInitializing,
  onInitializeDatabase,
  onRetryDatabase,
}) => {
  const { theme } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    if (isActive) {
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

      // Start database initialization when step becomes active
      if (!databaseProgress && !isDatabaseInitializing) {
        onInitializeDatabase();
      }
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [
    isActive,
    fadeAnim,
    slideAnim,
    databaseProgress,
    isDatabaseInitializing,
    onInitializeDatabase,
  ]);

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'opening':
        return '🔧';
      case 'migrating':
        return '🔄';
      case 'creating_tables':
        return '📋';
      case 'verifying':
        return '✅';
      case 'complete':
        return '🎉';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'complete':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      default:
        return theme.colors.primary;
    }
  };

  const getStageText = (stage: string) => {
    switch (stage) {
      case 'opening':
        return 'Opening Database';
      case 'migrating':
        return 'Checking Updates';
      case 'creating_tables':
        return 'Creating Tables';
      case 'verifying':
        return 'Verifying Setup';
      case 'complete':
        return 'Ready!';
      case 'error':
        return 'Error';
      default:
        return 'Initializing...';
    }
  };

  const isComplete = databaseProgress?.stage === 'complete';
  const hasError = databaseProgress?.stage === 'error';

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
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}>
      <IconSection
        databaseProgress={databaseProgress}
        theme={theme}
        getStageColor={getStageColor}
        getStageIcon={getStageIcon}
      />
      <ContentSection theme={theme} />

      {databaseProgress && (
        <ProgressSection
          databaseProgress={databaseProgress}
          theme={theme}
          getStageColor={getStageColor}
          getStageText={getStageText}
        />
      )}

      <ActionsSection
        isComplete={isComplete}
        hasError={hasError}
        isDatabaseInitializing={isDatabaseInitializing}
        onNext={onNext}
        onSkip={onSkip}
        onRetryDatabase={onRetryDatabase}
        theme={theme}
      />
    </Animated.View>
  );
};
