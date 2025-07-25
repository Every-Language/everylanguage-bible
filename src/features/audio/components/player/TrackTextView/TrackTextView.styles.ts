import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createTrackTextViewStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: Dimensions.spacing.md,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStateTitle: {
      fontSize: Fonts.size.lg,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Dimensions.spacing.md,
    },
    emptyStateSubtitle: {
      fontSize: Fonts.size.base,
      color: colors.text + '80',
      textAlign: 'center',
    },
    verseContainer: {
      marginBottom: Dimensions.spacing.md,
      padding: Dimensions.spacing.sm,
      borderRadius: Dimensions.radius.md,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    currentVerseContainer: {
      backgroundColor: isDark ? '#3a3a3a' : '#d4cec3',
    },
    verseNumberContainer: {
      marginBottom: Dimensions.spacing.xs,
    },
    verseNumber: {
      fontSize: Fonts.size.sm,
      fontWeight: Fonts.weight.bold,
    },
    currentVerseNumber: {
      color: colors.text,
    },
    inactiveVerseNumber: {
      color: colors.text + '80',
    },
    verseText: {
      fontSize: Fonts.size.base,
      lineHeight: 24,
    },
    currentVerseText: {
      color: colors.text,
      fontWeight: Fonts.weight.medium,
    },
    inactiveVerseText: {
      color: colors.text + '90',
      fontWeight: Fonts.weight.normal,
    },
  });
