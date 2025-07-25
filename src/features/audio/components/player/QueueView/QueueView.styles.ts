import { StyleSheet } from 'react-native';
import { Fonts, Dimensions } from '@/shared/constants';

export const createQueueViewStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: Dimensions.spacing.md,
    },
    flatListContent: {
      paddingBottom: Dimensions.spacing.md,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Dimensions.spacing.sm,
      paddingHorizontal: Dimensions.spacing.sm,
    },
    sectionHeaderWithMargin: {
      marginTop: Dimensions.spacing.lg,
    },
    sectionHeaderText: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
    },
    emptyStateContainer: {
      borderRadius: Dimensions.radius.md,
      padding: Dimensions.spacing.md,
      marginHorizontal: Dimensions.spacing.sm,
      borderWidth: 1,
    },
    emptyStateDashed: {
      backgroundColor: colors.text + '05',
      borderColor: colors.text + '10',
      borderStyle: 'dashed',
    },
    emptyStateSolid: {
      backgroundColor: colors.background,
      borderColor: colors.text + '20',
      borderStyle: 'solid',
    },
    emptyStateText: {
      fontSize: Fonts.size.sm,
      color: colors.text + '60',
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
