import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '@/shared/types/theme';

const { width: screenWidth } = Dimensions.get('window');

export const createOnboardingStyles = (theme: Theme) =>
  StyleSheet.create({
    // Container styles
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    stepContainer: {
      flex: 1,
      width: screenWidth,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    flatListContainer: {
      flex: 1,
    },
    flatListItem: {
      width: screenWidth,
    },

    // Icon section styles
    iconContainer: {
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
    },
    iconText: {
      fontSize: 48,
    },
    iconTextWithColor: (color: string) => ({
      fontSize: 48,
      color,
    }),

    // Content section styles
    contentContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    contentContainerLarge: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
    },
    title: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: 'bold',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      lineHeight: theme.typography.lineHeight.xxl,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.accent,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      fontWeight: '600',
      lineHeight: theme.typography.lineHeight.lg,
    },
    description: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.md,
      paddingHorizontal: theme.spacing.md,
    },

    // Actions section styles
    actionsContainer: {
      width: '100%',
      alignItems: 'center',
    },
    skipButton: {
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    skipButtonText: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    secondaryButton: {
      marginTop: theme.spacing.sm,
    },

    // Progress section styles
    progressContainer: {
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    progressMessage: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    progressBarContainer: {
      width: '100%',
      marginBottom: theme.spacing.sm,
    },
    progressBar: {
      width: '100%',
      height: 8,
      backgroundColor: theme.colors.border,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: theme.spacing.xs,
    },
    progressBarFill: (progress: number, color: string) => ({
      height: '100%',
      borderRadius: 4,
      width: `${progress}%`,
      backgroundColor: color,
    }),
    progressPercentage: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    stageText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    errorMessage: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.error,
      textAlign: 'center',
      marginTop: theme.spacing.sm,
    },

    // Database info section styles
    databaseInfoContainer: {
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    databaseInfoCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    databaseInfoTitle: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    databaseInfoText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: theme.typography.lineHeight.sm,
    },

    // Pagination styles
    paginationContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    paginationDot: (isActive: boolean, theme: Theme) => ({
      width: isActive ? 24 : 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isActive
        ? theme.colors.primary
        : theme.colors.textSecondary,
      marginHorizontal: 4,
      opacity: isActive ? 1 : 0.5,
    }),

    // Animation styles
    animatedContainer: {
      flex: 1,
      width: screenWidth,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

// Utility functions for dynamic styles
export const getStageColor = (stage: string, theme: Theme) => {
  switch (stage) {
    case 'complete':
      return theme.colors.success;
    case 'error':
      return theme.colors.error;
    default:
      return theme.colors.primary;
  }
};

export const getStageIcon = (stage: string) => {
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

export const getStageText = (stage: string) => {
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
