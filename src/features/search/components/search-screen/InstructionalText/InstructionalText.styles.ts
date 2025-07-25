import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createInstructionalTextStyles = () =>
  StyleSheet.create({
    container: {
      paddingHorizontal: Dimensions.spacing.lg,
      paddingTop: Dimensions.spacing.md,
      paddingBottom: Dimensions.spacing.lg,
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
