import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createGoToTestamentTileStyles = (
  colors: any,
  isDark: boolean,
  targetTestament: 'old' | 'new'
) =>
  StyleSheet.create({
    container: {
      backgroundColor:
        targetTestament === 'new'
          ? isDark
            ? '#AC8F57'
            : '#ECE6DA'
          : colors.chapterTileBackground || colors.background,
      borderRadius: 24,
      padding: Dimensions.spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-between',
      aspectRatio: 1, // Square tiles
    },
    miniIconsContainer: {
      flex: 1,
      width: '100%',
      justifyContent: 'space-between',
      padding: Dimensions.spacing.sm,
    },
    miniIconsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flex: 1,
      gap: Dimensions.spacing.xs,
    },
    miniBookImage: {
      width: '30%',
      aspectRatio: 1,
      borderRadius: 4,
      tintColor: colors.text,
    },
    miniFallbackIcon: {
      width: '45%',
      aspectRatio: 1,
      borderRadius: 4,
      backgroundColor: colors.secondary + '50',
      justifyContent: 'center',
      alignItems: 'center',
    },
    miniFallbackEmoji: {
      fontSize: 16,
      color: colors.text,
    },
    title: {
      fontSize: Fonts.size.lg,
      fontWeight: Fonts.weight.semibold,
      textAlign: 'center',
      color: colors.text,
      lineHeight: 22,
      alignSelf: 'stretch',
    },
  });
