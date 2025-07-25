import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createPlaylistItemComponentStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.chapterTileBackground || colors.background,
      borderRadius: Dimensions.radius.lg,
      padding: Dimensions.spacing.md,
      marginBottom: Dimensions.spacing.sm,
      marginHorizontal: Dimensions.spacing.lg,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: Dimensions.radius.md,
      backgroundColor: colors.secondary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Dimensions.spacing.md,
    },
    icon: {
      width: 32,
      height: 32,
      tintColor: colors.primary,
    },
    fallbackIcon: {
      fontSize: 24,
      color: colors.primary,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginBottom: Dimensions.spacing.xs,
    },
    description: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      lineHeight: 18,
    },
  });
