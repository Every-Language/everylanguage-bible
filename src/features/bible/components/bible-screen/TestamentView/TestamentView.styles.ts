import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createTestamentViewStyles = (
  colors: any,
  collapsedHeight: number,
  tileWidth: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: Dimensions.spacing.lg,
    },
    title: {
      fontSize: Fonts.size['2xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.chapterTileBackground || colors.background,
      textAlign: 'center',
      marginBottom: Dimensions.spacing.lg,
      marginTop: Dimensions.spacing.md,
    },
    tilesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    tilesContainerCentered: {
      justifyContent: 'center',
    },
    tileWrapper: {
      width: tileWidth,
      marginBottom: Dimensions.spacing.md,
    },
    scrollContent: {
      paddingBottom: collapsedHeight + Dimensions.spacing.md,
    },
  });
