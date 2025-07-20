import React, { useEffect } from 'react';
import { View, Text, Dimensions, Animated } from 'react-native';
import { useTheme } from '@/shared/context/ThemeContext';
import { Button } from '@/shared/components/ui/Button';
import { DatabaseStepProps } from '../types';

const { width: screenWidth } = Dimensions.get('window');

export const DatabaseInitStep: React.FC<DatabaseStepProps> = ({
  step,
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

  useEffect(() => {
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
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [isActive, fadeAnim, slideAnim]);

  // Auto-start database initialization when step becomes active
  useEffect(() => {
    if (isActive && !databaseProgress && !isDatabaseInitializing) {
      onInitializeDatabase();
    }
  }, [
    isActive,
    databaseProgress,
    isDatabaseInitializing,
    onInitializeDatabase,
  ]);

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

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      case 'opening':
        return '📖';
      case 'migrating':
        return '🔄';
      case 'creating_tables':
        return '🗄️';
      case 'verifying':
        return '🔍';
      default:
        return '📖';
    }
  };

  const getStageText = (stage: string) => {
    switch (stage) {
      case 'complete':
        return 'Database ready!';
      case 'error':
        return 'Initialization failed';
      case 'opening':
        return 'Opening database...';
      case 'migrating':
        return 'Migrating data...';
      case 'creating_tables':
        return 'Creating tables...';
      case 'verifying':
        return 'Verifying data...';
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
      {/* Icon Section */}
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
          {databaseProgress ? getStageIcon(databaseProgress.stage) : step.icon}
        </Text>
      </View>

      {/* Content Section */}
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
          {step.title}
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
          {step.subtitle}
        </Text>
        <Text
          style={{
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: theme.typography.lineHeight.md,
            paddingHorizontal: theme.spacing.md,
          }}>
          {step.description}
        </Text>
      </View>

      {/* Progress Section */}
      {databaseProgress && (
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
      )}

      {/* Actions Section */}
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
            <Button
              title='Skip for Now'
              onPress={onSkip}
              variant='secondary'
              fullWidth
              style={{ marginTop: theme.spacing.sm }}
            />
          </>
        ) : (
          <Button
            title={
              isDatabaseInitializing ? 'Initializing...' : 'Initialize Database'
            }
            onPress={onInitializeDatabase}
            variant='primary'
            fullWidth
            disabled={isDatabaseInitializing}
            loading={isDatabaseInitializing}
          />
        )}
      </View>
    </Animated.View>
  );
};
