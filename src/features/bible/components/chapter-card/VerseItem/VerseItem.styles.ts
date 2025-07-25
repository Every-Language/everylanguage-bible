import { StyleSheet } from 'react-native';

export const createVerseItemStyles = (colors: any) =>
  StyleSheet.create({
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.navigationSelected,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
