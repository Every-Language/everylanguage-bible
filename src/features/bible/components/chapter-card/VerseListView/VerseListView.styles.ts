import { StyleSheet } from 'react-native';

export const createVerseListViewStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    stackContainer: {
      paddingBottom: 16, // $4 in Tamagui spacing
    },
  });
