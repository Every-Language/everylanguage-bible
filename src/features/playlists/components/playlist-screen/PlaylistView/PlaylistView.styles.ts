import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createPlaylistViewStyles = (
  colors: any,
  collapsedHeight: number
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    title: {
      fontSize: Fonts.size['2xl'],
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: Dimensions.spacing.lg,
      marginTop: Dimensions.spacing.md,
      paddingHorizontal: Dimensions.spacing.lg,
    },
    scrollContent: {
      paddingBottom: collapsedHeight + Dimensions.spacing.md,
    },
  });
