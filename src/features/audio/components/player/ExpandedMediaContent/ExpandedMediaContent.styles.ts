import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createExpandedMediaContentStyles = (
  colors: any,
  isDark: boolean
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      margin: 0,
      paddingHorizontal: Dimensions.spacing.md,
      paddingTop: Dimensions.spacing.md,
      paddingBottom: Dimensions.spacing.xs,
      backgroundColor: isDark ? '#282827' : '#ECE6DA',
    },
    bookInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.md,
    },
    bookImageContainer: {
      width: 100,
      height: 100,
      borderRadius: Dimensions.radius.md,
    },
    bookImage: {
      width: 100,
      height: 100,
      borderRadius: Dimensions.radius.md,
      tintColor: colors.text,
    },
    fallbackImageContainer: {
      width: 100,
      height: 100,
      borderRadius: Dimensions.radius.md,
      backgroundColor: colors.secondary + '30',
      justifyContent: 'center',
      alignItems: 'center',
    },
    fallbackEmoji: {
      fontSize: 48,
      color: colors.text,
    },
    bookTextContainer: {
      marginLeft: Dimensions.spacing.sm,
      flex: 1,
    },
    bookTitle: {
      fontSize: 24,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
    },
    bookSubtitle: {
      fontSize: 24,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
      marginTop: 2,
    },
    versionContainer: {
      marginTop: Dimensions.spacing.xs,
    },
    versionText: {
      fontSize: Fonts.size.sm,
      color: colors.text + '60',
      textAlign: 'left',
    },
    toggleButtonsContainer: {
      marginHorizontal: 0,
    },
    contentArea: {
      flex: 1,
      marginTop: Dimensions.spacing.xs,
    },
  });
