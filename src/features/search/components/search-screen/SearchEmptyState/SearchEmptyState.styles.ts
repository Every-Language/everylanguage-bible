import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createSearchEmptyStateStyles = (collapsedHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingHorizontal: Dimensions.spacing.xl,
      paddingTop: Dimensions.spacing.xl,
      paddingBottom: (collapsedHeight || 0) + Dimensions.spacing.xl,
    },
    title: {
      fontSize: Fonts.size.xl,
      fontWeight: Fonts.weight.bold,
      textAlign: 'center',
      marginBottom: Dimensions.spacing.sm,
    },
    text: {
      fontSize: Fonts.size.base,
      textAlign: 'center',
      lineHeight: 22,
    },
  });
