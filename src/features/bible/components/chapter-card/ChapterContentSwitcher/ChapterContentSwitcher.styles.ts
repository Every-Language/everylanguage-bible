import { StyleSheet } from 'react-native';

export const createChapterContentSwitcherStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
      position: 'relative',
    },
    animatedContainer: {
      flexDirection: 'row',
      width: '200%',
      height: '100%',
    },
    viewContainer: {
      width: '50%',
      height: '100%',
    },
  });
