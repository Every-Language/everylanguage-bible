import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createBookTileStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.chapterTileBackground || colors.background,
      borderRadius: 24,
      padding: Dimensions.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: 1, // Square tiles
    },
    imageContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Dimensions.spacing.xs,
    },
    bookImage: {
      flex: 1,
      maxWidth: '100%',
      borderRadius: Dimensions.radius.sm,
      tintColor: colors.text,
    },
    fallbackIcon: {
      width: 64,
      height: 64,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: colors.secondary + '30',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackEmoji: {
      fontSize: 28,
      color: colors.text,
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.semibold,
      textAlign: 'center',
      color: colors.text,
      lineHeight: 22,
    },
  });
