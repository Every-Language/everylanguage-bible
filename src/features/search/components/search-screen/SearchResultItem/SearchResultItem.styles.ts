import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createSearchResultItemStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.chapterTileBackground || colors.background,
      borderRadius: 16,
      padding: Dimensions.spacing.md,
      marginHorizontal: Dimensions.spacing.lg,
      marginBottom: Dimensions.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.semibold,
      color: colors.text,
      marginBottom: Dimensions.spacing.xs,
    },
    description: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      lineHeight: 20,
    },
    duration: {
      fontSize: Fonts.size.xs,
      color: colors.secondary,
      marginTop: Dimensions.spacing.xs,
    },
    audioIcon: {
      marginLeft: Dimensions.spacing.md,
      padding: Dimensions.spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
    },
    audioIconText: {
      fontSize: Fonts.size.lg,
    },
  });
