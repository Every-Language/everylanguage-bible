import { StyleSheet } from 'react-native';
import { Dimensions, Fonts } from '@/shared/constants';

export const createQueueItemStyles = (
  colors: any,
  isDark: boolean,
  isActive: boolean,
  isFromUserQueue: boolean
) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: isActive
        ? colors.navigationSelected + '20'
        : isFromUserQueue
          ? colors.navigationSelected + '20'
          : colors.primary + '10',
      borderRadius: Dimensions.radius.md,
      padding: Dimensions.spacing.sm,
      marginVertical: Dimensions.spacing.xs,
      marginHorizontal: Dimensions.spacing.sm,
      borderWidth: isActive ? 2 : 0,
      borderColor: isActive ? colors.navigationSelected : colors.text + '15',
      alignItems: 'center',
    },
    queueTypeIndicator: {
      marginRight: Dimensions.spacing.sm,
      backgroundColor: isFromUserQueue
        ? colors.primary + '20'
        : colors.secondary + '20',
      borderRadius: Dimensions.radius.sm,
      width: 4,
      height: '80%',
    },
    contentContainer: {
      flex: 1,
      marginLeft: Dimensions.spacing.sm,
    },
    title: {
      fontSize: Fonts.size.base,
      fontWeight: Fonts.weight.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: Fonts.size.sm,
      fontWeight: Fonts.weight.medium,
      color: colors.text + '80',
    },
    description: {
      fontSize: Fonts.size.sm,
      color: colors.text + '60',
      marginTop: 2,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: Dimensions.spacing.sm,
    },
    userQueueRightSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: Dimensions.spacing.sm,
    },
    duration: {
      fontSize: Fonts.size.sm,
      color: colors.text + '60',
      marginRight: Dimensions.spacing.sm,
    },
    dragHandle: {
      padding: Dimensions.spacing.xs,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: colors.text + '10',
      marginRight: Dimensions.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      width: 24,
      height: 40,
    },
    sixDotPattern: {
      justifyContent: 'space-between',
      alignItems: 'center',
      height: 18,
    },
    dotRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: 12,
      marginVertical: 1,
    },
    dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: colors.text + '60',
    },
    removeButton: {
      padding: Dimensions.spacing.sm,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: isDark ? '#070707' : '#D8D2C6',
      minWidth: 32,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    removeButtonText: {
      fontSize: Fonts.size.sm,
      color: colors.secondary,
      fontWeight: Fonts.weight.bold,
    },
    addButton: {
      padding: Dimensions.spacing.sm,
      borderRadius: Dimensions.radius.sm,
      backgroundColor: colors.primary + '20',
      minWidth: 32,
      minHeight: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addButtonText: {
      fontSize: Fonts.size.sm,
      color: colors.primary,
      fontWeight: Fonts.weight.bold,
    },
  });
